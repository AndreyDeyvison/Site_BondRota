'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/dashboard/Header';
import { Bus, Clock, User, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Navigation2, Radio } from 'lucide-react';

import { useEntityList } from '@/hooks/useEntityList';
import { useViagens, useViagem } from '@/hooks/useViagens';
import { useViagemLocalizacao } from '@/hooks/useViagemLocalizacao';
import { useMotoristasAtivos } from '@/hooks/useMotoristasAtivos';
import { listarMotoristas } from '@/services/motoristas';
import { listarVeiculos } from '@/services/veiculos';
import type { Viagem, ViagemStatus } from '@/types/viagem';
import type { Sentido } from '@/types/common';

// O Leaflet acessa `window`/`document` na inicialização — precisa ser carregado
// só no navegador, então o mapa real entra via import dinâmico sem SSR.
const LiveTrackingMap = dynamic(() => import('@/components/dashboard/LiveTrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl flex items-center justify-center" style={{ background: '#e8ede8' }}>
      <p className="text-sm text-gray-400">Carregando mapa…</p>
    </div>
  ),
});

// ── Labels para os enumerados da API ──────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  programada: 'Programada',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const SENTIDO_LABELS: Record<Sentido, string> = {
  ida: 'Ida',
  volta: 'Volta',
};

function statusStyle(status: ViagemStatus) {
  switch (status) {
    case 'em_andamento': return { bg: '#dbeafe', color: '#2563eb', dot: '#3b82f6' };
    case 'concluida': return { bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' };
    case 'programada': return { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' };
    default: return { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' };
  }
}

// ── Route panel item ──────────────────────────────────────────────────────

interface ViagemRowInfo {
  viagem: Viagem;
  motoristaNome: string;
  veiculoLabel: string;
}

function RouteItem({
  info,
  selected,
  onClick,
}: {
  info: ViagemRowInfo;
  selected: boolean;
  onClick: () => void;
}) {
  const { viagem, motoristaNome, veiculoLabel } = info;
  const s = statusStyle(viagem.status);

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-xl border transition-all"
      style={
        selected
          ? { background: '#EFF6FF', borderColor: '#4A6FA5' }
          : { background: '#FAFAFA', borderColor: '#E5E7EB' }
      }
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-800 truncate">
            Viagem #{viagem.id} · {SENTIDO_LABELS[viagem.sentido] ?? viagem.sentido}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
            <Bus size={10} />
            {veiculoLabel}
          </p>
        </div>
        <span
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: s.bg, color: s.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.dot }} />
          {STATUS_LABELS[viagem.status] ?? viagem.status}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-gray-500">
        <span className="flex items-center gap-1">
          <User size={10} />
          {motoristaNome}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {viagem.data_viagem} · {viagem.turno}
        </span>
      </div>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function MonitoramentoPage() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedOverride, setSelectedOverride] = useState<number | null>(null);

  const { viagens, loading, error } = useViagens();
  const { data: motoristas } = useEntityList(listarMotoristas, 'Não foi possível carregar os motoristas.');
  const { data: veiculos } = useEntityList(listarVeiculos, 'Não foi possível carregar os veículos.');

  // Seleciona a primeira viagem por padrão assim que a lista chega; o usuário pode trocar manualmente.
  const selectedId = selectedOverride ?? viagens[0]?.id ?? null;

  const rows = useMemo<ViagemRowInfo[]>(() => viagens.map((viagem) => {
    const motorista = motoristas.find((m) => m.id === viagem.motorista_id);
    const veiculo = veiculos.find((v) => v.id === viagem.veiculo_id);
    return {
      viagem,
      motoristaNome: motorista?.nome ?? `Motorista #${viagem.motorista_id}`,
      veiculoLabel: veiculo ? `${veiculo.placa} · ${veiculo.modelo}` : (viagem.veiculo_id ? `Veículo #${viagem.veiculo_id}` : 'Sem veículo definido'),
    };
  }), [viagens, motoristas, veiculos]);

  const selectedRow = rows.find((r) => r.viagem.id === selectedId) ?? null;
  const selectedVeiculo = veiculos.find((v) => v.id === selectedRow?.viagem.veiculo_id) ?? null;

  const { passageiros } = useViagem(selectedId);
  const trackingAtivo = selectedRow?.viagem.status === 'em_andamento';
  const { localizacao } = useViagemLocalizacao(trackingAtivo ? selectedId : null);

  // Posições em tempo real recebidas do app Android via Firebase Realtime Database (nó `rotas_ativas`).
  const { motoristasAtivos, error: erroMotoristasAtivos } = useMotoristasAtivos();

  const ativos = viagens.filter((v) => v.status === 'em_andamento').length;
  const programadas = viagens.filter((v) => v.status === 'programada').length;

  return (
    <div className="flex flex-col h-full">
      <Header title="Monitoramento em Tempo Real" subtitle={`${ativos} viagens em andamento · ${programadas} programadas`} />

      {/* Full height map area */}
      <div className="flex flex-1 overflow-hidden relative" style={{ height: 'calc(100vh - 64px)' }}>

        {/* MAP */}
        <div className="flex-1 p-4 relative">
          <LiveTrackingMap motoristasAtivos={motoristasAtivos} motoristas={motoristas} />

          {/* Status do monitoramento ao vivo (Firebase Realtime Database) */}
          <div
            className="absolute top-7 right-7 z-[1000] flex items-center gap-1.5 bg-white/90 px-2.5 py-1.5 rounded-xl text-[12px] font-semibold shadow-sm"
            style={{ color: motoristasAtivos.length > 0 ? '#dc2626' : '#9ca3af' }}
          >
            <Radio size={12} className={motoristasAtivos.length > 0 ? 'animate-pulse' : ''} />
            {motoristasAtivos.length > 0
              ? `${motoristasAtivos.length} motorista${motoristasAtivos.length > 1 ? 's' : ''} ao vivo`
              : 'Nenhum motorista transmitindo'}
          </div>

          {erroMotoristasAtivos && (
            <div className="absolute bottom-7 left-7 z-[1000] bg-white/90 px-3 py-2 rounded-xl text-[11px] text-red-500 shadow-sm">
              {erroMotoristasAtivos}
            </div>
          )}
        </div>

        {/* PANEL TOGGLE */}
        <button
          onClick={() => setPanelOpen((o) => !o)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-12 rounded-l-xl flex items-center justify-center shadow-md transition-all"
          style={{
            background: '#1E2B47',
            right: panelOpen ? '320px' : '0',
          }}
        >
          {panelOpen ? <ChevronRight size={14} className="text-white" /> : <ChevronLeft size={14} className="text-white" />}
        </button>

        {/* SIDE PANEL */}
        <div
          className="flex flex-col border-l border-gray-200 transition-all duration-300 overflow-hidden"
          style={{
            width: panelOpen ? '320px' : '0',
            background: '#ffffff',
            minWidth: panelOpen ? '320px' : '0',
          }}
        >
          {panelOpen && (
            <>
              {/* Panel header */}
              <div className="px-4 py-3.5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-semibold text-gray-800">Viagens</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">{viagens.length} viagens no total</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircle size={10} />
                      {ativos} ativas
                    </span>
                    {programadas > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={10} />
                        {programadas}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Routes list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? (
                  <p className="text-center text-sm text-gray-400 py-10">Carregando viagens...</p>
                ) : error ? (
                  <p className="text-center text-sm text-red-500 py-10">{error}</p>
                ) : rows.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-10">Nenhuma viagem encontrada</p>
                ) : (
                  rows.map((info) => (
                    <RouteItem
                      key={info.viagem.id}
                      info={info}
                      selected={selectedId === info.viagem.id}
                      onClick={() => setSelectedOverride(info.viagem.id)}
                    />
                  ))
                )}
              </div>

              {/* Selected route detail */}
              {selectedRow && (
                <div className="border-t border-gray-100 p-4" style={{ background: '#F9FAFB' }}>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                    Detalhe — Viagem #{selectedRow.viagem.id}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Turno', value: `${selectedRow.viagem.turno} · ${SENTIDO_LABELS[selectedRow.viagem.sentido] ?? selectedRow.viagem.sentido}` },
                      { label: 'Data', value: selectedRow.viagem.data_viagem },
                      {
                        label: 'Passageiros',
                        value: selectedVeiculo ? `${passageiros.length}/${selectedVeiculo.capacidade}` : `${passageiros.length}`,
                      },
                      { label: 'Status', value: STATUS_LABELS[selectedRow.viagem.status] ?? selectedRow.viagem.status },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white rounded-lg p-2.5 border border-gray-100">
                        <p className="text-[10px] text-gray-400">{label}</p>
                        <p className="text-[13px] font-semibold text-gray-800 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500 bg-white rounded-lg px-2.5 py-2 border border-gray-100">
                    <Navigation2 size={11} style={{ color: '#4A6FA5' }} />
                    {localizacao ? (
                      <span>Pos: {localizacao.latitude.toFixed(5)}, {localizacao.longitude.toFixed(5)}</span>
                    ) : (
                      <span>Sem dados de localização para esta viagem</span>
                    )}
                    <span
                      className="ml-auto text-[10px] font-semibold"
                      style={{ color: trackingAtivo && localizacao ? '#22c55e' : '#9ca3af' }}
                    >
                      {trackingAtivo && localizacao ? '● GPS OK' : '● Sem sinal'}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
