'use client';

import { useMemo } from 'react';
import Header from '@/components/dashboard/Header';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  Bus, AlertTriangle, TrendingUp, Clock, Activity,
  CheckCircle, Wind, MapPin, Star, Wrench,
} from 'lucide-react';

import { useEntityList } from '@/hooks/useEntityList';
import { listarViagens } from '@/services/viagens';
import { listarMotoristas } from '@/services/motoristas';
import { listarVeiculos } from '@/services/veiculos';
import { listarTodasReservas } from '@/services/reservas';
import { listarParadas } from '@/services/paradas';
import type { Turno } from '@/types/common';
import type { CategoriaVeiculo } from '@/types/veiculo';

// ── Constantes de exibição ────────────────────────────────────────────────

const SHIFT_COLORS: Record<Exclude<Turno, 'IN'>, string> = { MT: '#4A6FA5', VT: '#22c55e', NT: '#f59e0b' };
const SHIFT_LABELS: Record<Turno, string> = { MT: 'Matutino', VT: 'Vespertino', NT: 'Noturno', IN: 'Integral' };
const SHIFT_BAND_COLORS: Record<Turno, string> = { MT: '#4A6FA5', VT: '#22c55e', NT: '#f59e0b', IN: '#a855f7' };
const CATEGORIA_LABELS: Record<CategoriaVeiculo, string> = {
  executivo: 'Executivo',
  escolar: 'Escolar',
  carro_7_lugares: 'Carro 7 lugares',
};
const CATEGORIA_COLORS: Record<CategoriaVeiculo, string> = {
  executivo: '#4A6FA5',
  escolar: '#22c55e',
  carro_7_lugares: '#a855f7',
};
const COMODIDADES = [
  { key: 'ar_condicionado' as const, label: 'Ar-condicionado', icon: Wind, color: '#4A6FA5' },
  { key: 'banheiro' as const, label: 'Banheiro', icon: CheckCircle, color: '#22c55e' },
  { key: 'tomada' as const, label: 'Tomada', icon: Activity, color: '#a855f7' },
  { key: 'persiana' as const, label: 'Persiana', icon: Clock, color: '#f59e0b' },
];
const WEEKDAYS = [
  { index: 1, label: 'Seg' },
  { index: 2, label: 'Ter' },
  { index: 3, label: 'Qua' },
  { index: 4, label: 'Qui' },
  { index: 5, label: 'Sex' },
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function weekdayIndex(dataISO: string): number {
  return new Date(`${dataISO}T00:00:00`).getDay();
}

// ── Sub-components ─────────────────────────────────────────────────────────

function KPICard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm border border-gray-100">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: color + '18' }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-gray-800 font-semibold text-[15px]">{title}</h3>
      {sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: viagens } = useEntityList(listarViagens, 'Não foi possível carregar as viagens.');
  const { data: motoristas } = useEntityList(listarMotoristas, 'Não foi possível carregar os motoristas.');
  const { data: veiculos } = useEntityList(listarVeiculos, 'Não foi possível carregar os veículos.');
  const { data: reservas } = useEntityList(listarTodasReservas, 'Não foi possível carregar as reservas.');
  const { data: paradas } = useEntityList(listarParadas, 'Não foi possível carregar as paradas.');

  const today = useMemo(() => todayISO(), []);

  // ── KPIs derivados de listagens reais (sem agregados no backend) ──
  const reservasAtivas = useMemo(() => reservas.filter((r) => r.status !== 'cancelada' && r.status !== 'concluida').length, [reservas]);
  const viagensHoje = useMemo(() => viagens.filter((v) => v.data_viagem === today), [viagens, today]);
  const veiculosEmManutencao = useMemo(() => veiculos.filter((v) => v.status === 'manutencao').length, [veiculos]);
  const veiculosAtivos = useMemo(() => veiculos.filter((v) => v.status === 'ativo'), [veiculos]);

  // ── Desempenho de motoristas: viagens por motorista ──
  const driverData = useMemo(() => {
    const counts = new Map<number, number>();
    viagens.forEach((v) => counts.set(v.motorista_id, (counts.get(v.motorista_id) ?? 0) + 1));
    return [...counts.entries()]
      .map(([motoristaId, total]) => {
        const motorista = motoristas.find((m) => m.id === motoristaId);
        const nome = motorista?.nome ?? `Motorista #${motoristaId}`;
        const abreviado = nome.split(' ').length > 1
          ? `${nome.split(' ')[0]} ${nome.split(' ').slice(-1)[0][0]}.`
          : nome;
        return { name: abreviado, viagens: total };
      })
      .sort((a, b) => b.viagens - a.viagens)
      .slice(0, 6);
  }, [viagens, motoristas]);

  // ── Motoristas em rota agora, por turno ──
  const motoristasEmAndamentoIds = useMemo(
    () => new Set(viagens.filter((v) => v.status === 'em_andamento').map((v) => v.motorista_id)),
    [viagens],
  );
  const turnoBreakdown = useMemo(() => (['MT', 'VT', 'NT', 'IN'] as Turno[]).map((turno) => {
    const doTurno = motoristas.filter((m) => m.turno === turno);
    const ativos = doTurno.filter((m) => motoristasEmAndamentoIds.has(m.id)).length;
    return { turno, label: SHIFT_LABELS[turno], ativos, total: doTurno.length, color: SHIFT_BAND_COLORS[turno] };
  }), [motoristas, motoristasEmAndamentoIds]);

  // ── Veículos ativos sem viagem hoje ──
  const veiculosOciosos = useMemo(() => {
    const comViagemHoje = new Set(viagensHoje.map((v) => v.veiculo_id).filter((id): id is number => id !== undefined));
    return veiculosAtivos.filter((v) => !comViagemHoje.has(v.id));
  }, [veiculosAtivos, viagensHoje]);

  // ── Frota por categoria (substitui "Perfil dos Usuários", que dependeria de vínculos agregados) ──
  const frotaPorCategoria = useMemo(() => {
    const counts = new Map<CategoriaVeiculo, number>();
    veiculos.forEach((v) => counts.set(v.categoria, (counts.get(v.categoria) ?? 0) + 1));
    return [...counts.entries()].map(([categoria, value]) => ({ categoria, name: CATEGORIA_LABELS[categoria], value }));
  }, [veiculos]);

  // ── Demanda por turno: reservas agrupadas por dia da semana (Seg–Sex) ──
  const demandData = useMemo(() => WEEKDAYS.map(({ index, label }) => {
    const doDia = reservas.filter((r) => weekdayIndex(r.data_viagem) === index);
    const row: { dia: string; MT: number; VT: number; NT: number } = { dia: label, MT: 0, VT: 0, NT: 0 };
    doDia.forEach((r) => {
      if (r.turno === 'MT' || r.turno === 'VT' || r.turno === 'NT') row[r.turno] += 1;
    });
    return row;
  }), [reservas]);

  // ── Comodidades da frota ──
  const comodidadeStats = COMODIDADES.map(({ key, label, icon, color }) => ({
    label, icon, color,
    qtd: veiculos.filter((v) => v[key]).length,
    total: veiculos.length || 1,
  }));

  // ── Paradas por cidade ──
  const paradasPorCidade = useMemo(() => {
    const counts = new Map<string, number>();
    paradas.forEach((p) => counts.set(p.cidade, (counts.get(p.cidade) ?? 0) + 1));
    const max = Math.max(1, ...counts.values());
    return [...counts.entries()]
      .map(([cidade, qtd]) => ({ cidade, qtd, max }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5);
  }, [paradas]);

  const viagensEmAndamento = viagens.filter((v) => v.status === 'em_andamento').length;

  return (
    <div className="min-h-full">
      <Header title="Dashboard" subtitle={`Visão geral da operação — hoje, ${today}`} />

      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">

        {/* ── Operação Diária ── */}
        <section>
          <SectionTitle title="Operação Diária" sub="Dados consolidados" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard
              icon={Bus}
              label="Reservas Ativas"
              value={String(reservasAtivas)}
              sub={`${reservas.length} no total`}
              color="#4A6FA5"
            />
            <KPICard
              icon={TrendingUp}
              label="Viagens Hoje"
              value={String(viagensHoje.length)}
              sub={`${viagensEmAndamento} em andamento agora`}
              color="#22c55e"
            />
            <KPICard
              icon={Wrench}
              label="Veículos em Manutenção"
              value={String(veiculosEmManutencao)}
              sub={`de ${veiculos.length} veículos cadastrados`}
              color="#f59e0b"
            />
            <KPICard
              icon={CheckCircle}
              label="Frota Ativa"
              value={`${veiculosAtivos.length} / ${veiculos.length}`}
              sub={`${veiculosEmManutencao} em manutenção`}
              color="#a855f7"
            />
          </div>
        </section>

        {/* ── Gestão de Frota + Motoristas ── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Desempenho de Motoristas */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <SectionTitle title="Desempenho de Motoristas" sub="Viagens registradas por motorista" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={driverData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 }}
                    cursor={{ fill: '#F3F4F6' }}
                  />
                  <Bar dataKey="viagens" fill="#4A6FA5" radius={[6, 6, 0, 0]} name="Viagens" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monitoramento por Turno */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <SectionTitle title="Motoristas em Rota" sub="Em viagem agora, por turno cadastrado" />
              <div className="grid grid-cols-2 gap-3 mb-4">
                {turnoBreakdown.map(({ turno, label, ativos, total, color }) => (
                  <div key={turno} className="rounded-xl p-3 border border-gray-100" style={{ background: color + '08' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>
                        {turno}
                      </span>
                      <Activity size={14} style={{ color }} />
                    </div>
                    <p className="text-xl font-bold text-gray-800">{ativos}</p>
                    <p className="text-xs text-gray-400">{label} — {total} totais</p>
                    <div className="mt-2 rounded-full h-1.5 bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${total > 0 ? (ativos / total) * 100 : 0}%`, background: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Alerta veículos ociosos */}
              <div className="flex items-start gap-2.5 rounded-xl p-3" style={{ background: veiculosOciosos.length > 0 ? '#fff7ed' : '#f0fdf4' }}>
                <AlertTriangle size={15} className={veiculosOciosos.length > 0 ? 'text-amber-500 mt-0.5 shrink-0' : 'text-green-500 mt-0.5 shrink-0'} />
                <div>
                  <p className={`text-xs font-semibold ${veiculosOciosos.length > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                    {veiculosOciosos.length > 0
                      ? `${veiculosOciosos.length} veículo(s) ativo(s) sem viagem hoje`
                      : 'Nenhum veículo ocioso hoje'}
                  </p>
                  {veiculosOciosos.length > 0 && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      {veiculosOciosos.slice(0, 4).map((v) => v.placa).join(', ')}
                      {veiculosOciosos.length > 4 ? ` e mais ${veiculosOciosos.length - 4}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Frota e Demanda ── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Pie chart: Frota por categoria */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <SectionTitle title="Frota por Categoria" sub="Distribuição dos veículos cadastrados" />
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={frotaPorCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {frotaPorCategoria.map((entry) => (
                      <Cell key={entry.categoria} fill={CATEGORIA_COLORS[entry.categoria]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-around mt-1">
                {frotaPorCategoria.map((entry) => (
                  <div key={entry.categoria} className="text-center">
                    <p className="text-xl font-bold text-gray-800">{entry.value}</p>
                    <p className="text-xs text-gray-400">{entry.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Demanda por turno - Line chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <SectionTitle title="Demanda por Turno" sub="Reservas por dia da semana (Seg–Sex)" />
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={demandData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  {(Object.entries(SHIFT_COLORS) as [Exclude<Turno, 'IN'>, string][]).map(([key, color]) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: color }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ── Comodidades + Paradas + Mapa ── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Frota Comodidades */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <SectionTitle title="Mapa de Conforto" sub="Comodidades da frota cadastrada" />
              <div className="space-y-3">
                {comodidadeStats.map(({ label, qtd, total, icon: Icon, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + '18' }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{label}</span>
                        <span className="text-xs font-bold text-gray-800">{qtd}/{veiculos.length}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(qtd / total) * 100}%`, background: color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Paradas por cidade */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <SectionTitle title="Paradas por Cidade" sub="Pontos cadastrados, agrupados por cidade" />
              <div className="space-y-2.5">
                {paradasPorCidade.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Nenhuma parada cadastrada</p>
                ) : paradasPorCidade.map(({ cidade, qtd, max }, i) => (
                  <div key={cidade} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-white"
                      style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#9CA3AF' : i === 2 ? '#cd7c2f' : '#E5E7EB', color: i > 2 ? '#6B7280' : '#fff' }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <span className="text-xs font-medium text-gray-700 truncate">{cidade}</span>
                        <span className="text-xs font-bold text-gray-800 ml-2 shrink-0">{qtd}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-1">
                        <div className="h-full rounded-full" style={{ width: `${(qtd / max) * 100}%`, background: '#4A6FA5' }} />
                      </div>
                    </div>
                    {i === 0 && <Star size={12} className="text-amber-400 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Mapa Operacional */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
              <SectionTitle title="Mapa Operacional" sub="Visão ilustrativa da operação" />
              <div
                className="flex-1 rounded-xl overflow-hidden relative min-h-[180px]"
                style={{ background: '#e8f0e8' }}
              >
                {/* SVG map background (ilustrativo — sem projeção geográfica real) */}
                <svg width="100%" height="100%" viewBox="0 0 300 200" className="absolute inset-0">
                  <line x1="0" y1="100" x2="300" y2="100" stroke="#c8d5c8" strokeWidth="4" />
                  <line x1="150" y1="0" x2="150" y2="200" stroke="#c8d5c8" strokeWidth="4" />
                  <line x1="0" y1="40" x2="300" y2="160" stroke="#d5dcd5" strokeWidth="2" />
                  <line x1="300" y1="40" x2="0" y2="160" stroke="#d5dcd5" strokeWidth="2" />
                  <line x1="75" y1="0" x2="75" y2="200" stroke="#dde5dd" strokeWidth="2" />
                  <line x1="225" y1="0" x2="225" y2="200" stroke="#dde5dd" strokeWidth="2" />
                  {[
                    { cx: 150, cy: 100, r: 8, color: '#4A6FA5', label: 'Central' },
                    { cx: 75, cy: 60, r: 6, color: '#22c55e', label: 'Norte' },
                    { cx: 225, cy: 60, r: 6, color: '#22c55e', label: 'Leste' },
                    { cx: 75, cy: 145, r: 6, color: '#f59e0b', label: 'Oeste' },
                    { cx: 225, cy: 145, r: 6, color: '#f59e0b', label: 'Sul' },
                    { cx: 150, cy: 40, r: 5, color: '#a855f7', label: 'Campus' },
                  ].map(({ cx, cy, r, color, label }) => (
                    <g key={label}>
                      <circle cx={cx} cy={cy} r={r + 4} fill={color} fillOpacity={0.15} />
                      <circle cx={cx} cy={cy} r={r} fill={color} />
                      <circle cx={cx} cy={cy} r={r * 0.4} fill="white" />
                    </g>
                  ))}
                </svg>
                <div className="absolute bottom-2 left-2 flex gap-2">
                  {[{ color: '#4A6FA5', label: 'Hub' }, { color: '#22c55e', label: 'Ativo' }, { color: '#f59e0b', label: 'Alerta' }].map(({ color, label }) => (
                    <span key={label} className="flex items-center gap-1 text-[10px] font-medium bg-white/80 px-1.5 py-0.5 rounded-full" style={{ color: '#4B5563' }}>
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin size={12} />
                <span>{paradas.length} pontos cadastrados · {viagensEmAndamento} viagens em andamento</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
