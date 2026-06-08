'use client';

import { useCallback, useMemo, useRef, useState, type ReactNode, type SubmitEvent } from 'react';
import Header from '@/components/dashboard/Header';
import {
  Search, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, ChevronDown,
  X, AlertTriangle, Plus, Upload, Loader2, CheckCircle2,
} from 'lucide-react';

import { useEntityList } from '@/hooks/useEntityList';
import { useEntityMutation } from '@/hooks/useEntityMutation';
import { useArquivoUpload } from '@/hooks/useArquivoUpload';
import { ApiError } from '@/services/api';
import type { StorageBucket } from '@/services/storage';

import {
  listarClientes, listarVinculosDoCliente,
  atualizarCliente, removerCliente, atualizarVinculo, removerVinculo,
} from '@/services/clientes';
import { listarMotoristas, atualizarMotorista, removerMotorista } from '@/services/motoristas';
import { listarVeiculos, atualizarVeiculo, removerVeiculo } from '@/services/veiculos';
import { listarParadas, atualizarParada, removerParada } from '@/services/paradas';
import { listarDestinos, atualizarDestino, removerDestino } from '@/services/destinos';
import { listarRotasInternas, substituirParadasDaRota, removerRotaInterna } from '@/services/rotas-internas';
import { listarHorariosTurnoViagem, atualizarHorarioTurnoViagem, removerHorarioTurnoViagem } from '@/services/horarios-turno-viagem';
import { listarAdmins, atualizarAdmin, removerAdmin } from '@/services/admin';
import { listarViagens } from '@/services/viagens';
import { listarTodasReservas } from '@/services/reservas';

import type { Cliente, ClienteUpdatePayload, Reserva, Vinculo, VinculoUpdatePayload, TipoVinculo } from '@/types/cliente';
import type { Destino, DestinoUpdatePayload } from '@/types/destino';
import type { Parada, ParadaUpdatePayload } from '@/types/parada';
import type { RotaInterna, RotaInternaParadasUpdatePayload } from '@/types/rota-interna';
import type { HorarioTurnoViagem, HorarioTurnoViagemUpdatePayload, TurnoHorario } from '@/types/horario-turno-viagem';
import type { CategoriaVeiculo, StatusVeiculo, Veiculo, VeiculoUpdatePayload } from '@/types/veiculo';
import type { Motorista, MotoristaUpdatePayload } from '@/types/motorista';
import type { Admin, AdminUpdatePayload } from '@/types/admin';
import type { Viagem } from '@/types/viagem';
import type { DiaSemana, Sentido, Turno } from '@/types/common';

// ── Mapeamento entidade → linha de tabela ─────────────────────────────────
// Cada serviço retorna um shape próprio; aqui convertemos para um registro
// "achatado" com as colunas que a tabela exibe (mantendo a busca/filtro genéricos).

type Row = Record<string, unknown>;

/** A API só expõe vínculos por cliente (`/clientes/{id}/vinculos/`) — agregamos aqui para uma visão global. */
type VinculoComCliente = Vinculo & { clienteNome: string };

const COMODIDADE_LABELS: Record<string, string> = {
  ar_condicionado: 'Ar-cond.',
  banheiro: 'Banheiro',
  persiana: 'Persiana',
  luz_leitura: 'Luz leitura',
  tomada: 'Tomada',
};

const CATEGORIA_LABELS: Record<string, string> = {
  executivo: 'Executivo',
  escolar: 'Escolar',
  carro_7_lugares: 'Carro 7 lugares',
};

const STATUS_VEICULO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  manutencao: 'Manutenção',
};

const TIPO_VINCULO_LABELS: Record<string, string> = {
  estudante: 'Estudante',
  estagio: 'Estágio',
};

const SENTIDO_LABELS: Record<Sentido, string> = {
  ida: 'Ida',
  volta: 'Volta',
};

const STATUS_VIAGEM_LABELS: Record<string, string> = {
  programada: 'Programada',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const STATUS_RESERVA_LABELS: Record<string, string> = {
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  concluida: 'Concluída',
};

/** Abas só de consulta — viagens e reservas são geradas pelo planejamento, não editadas aqui. */
const READ_ONLY_ENTITIES = ['viagens', 'reservas'];

const DIA_SEMANA_LABELS: Record<number, string> = {
  1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex',
};

// ── Listas de opções para os formulários de edição (espelham a Central de Cadastros) ──

const CATEGORIAS_VEICULO: { value: CategoriaVeiculo; label: string; capacidade: number }[] = [
  { value: 'executivo', label: 'Executivo', capacidade: 46 },
  { value: 'escolar', label: 'Escolar', capacidade: 24 },
  { value: 'carro_7_lugares', label: 'Carro 7 lugares', capacidade: 7 },
];

const COMODIDADES = [
  { key: 'ar_condicionado', label: 'Ar-condicionado' },
  { key: 'banheiro', label: 'Banheiro' },
  { key: 'persiana', label: 'Persiana' },
  { key: 'luz_leitura', label: 'Luz de leitura' },
  { key: 'tomada', label: 'Tomada' },
] as const;

const STATUS_VEICULO: { value: StatusVeiculo; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'manutencao', label: 'Manutenção' },
];

const TURNOS_COMPLETOS: { value: Turno; label: string }[] = [
  { value: 'MT', label: 'Matutino (MT)' },
  { value: 'VT', label: 'Vespertino (VT)' },
  { value: 'NT', label: 'Noturno (NT)' },
  { value: 'IN', label: 'Integral (IN)' },
];

const TURNOS_SEM_INTEGRAL = TURNOS_COMPLETOS.filter(
  (t): t is { value: TurnoHorario; label: string } => t.value !== 'IN',
);

const TIPOS_VINCULO: { value: TipoVinculo; label: string }[] = [
  { value: 'estudante', label: 'Estudante' },
  { value: 'estagio', label: 'Estágio' },
];

const DIAS_SEMANA: { value: DiaSemana; label: string }[] = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
];

// ── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ value, label }: { value: string; label: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    ativo: { bg: '#dcfce7', color: '#16a34a' },
    inativo: { bg: '#fee2e2', color: '#dc2626' },
    manutencao: { bg: '#fef9c3', color: '#ca8a04' },
    programada: { bg: '#f3f4f6', color: '#6b7280' },
    em_andamento: { bg: '#dbeafe', color: '#2563eb' },
    confirmada: { bg: '#dcfce7', color: '#16a34a' },
    concluida: { bg: '#dcfce7', color: '#16a34a' },
    cancelada: { bg: '#fee2e2', color: '#dc2626' },
  };
  const style = map[value] ?? { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: style.bg, color: style.color }}>
      {label}
    </span>
  );
}

function TurnoBadge({ value }: { value: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
      style={{
        background:
          value === 'MT' ? '#4A6FA5' :
          value === 'VT' ? '#22c55e' :
          value === 'NT' ? '#f59e0b' : '#a855f7',
      }}
    >
      {value}
    </span>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17, 24, 39, 0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="text-gray-800 font-semibold text-[15px]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Modal de visualização (genérico — reaproveita as colunas da entidade) ──

function ViewModal({
  entity, row, onClose,
}: {
  entity: { label: string; columns: { key: string; label: string }[] };
  row: Row;
  onClose: () => void;
}) {
  return (
    <Modal title={`${entity.label} — Detalhes do registro #${String(row.id)}`} onClose={onClose}>
      <div className="p-6 space-y-4">
        {entity.columns.map((col) => (
          <div key={col.key}>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{col.label}</p>
            {col.key === 'status' ? (
              <StatusBadge value={String(row.status)} label={String(row.statusLabel ?? row.status)} />
            ) : col.key === 'turno' ? (
              <TurnoBadge value={String(row[col.key])} />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed">{String(row[col.key])}</p>
            )}
          </div>
        ))}
      </div>
      <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Fechar
        </button>
      </div>
    </Modal>
  );
}

// ── Modal de confirmação de exclusão (genérico) ────────────────────────────

function DeleteConfirmModal({
  entityLabel, id, onConfirm, onDeleted, onClose,
}: {
  entityLabel: string;
  id: number;
  onConfirm: () => Promise<void>;
  onDeleted: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível excluir o registro.');
      setLoading(false);
    }
  };

  return (
    <Modal title={`Excluir ${entityLabel}`} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#fee2e2' }}>
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-700 font-medium">Tem certeza que deseja excluir este registro?</p>
            <p className="text-xs text-gray-400 mt-1">{entityLabel} #{id} — esta ação não pode ser desfeita.</p>
          </div>
        </div>
        {error && (
          <p
            className="mt-4 text-xs font-medium rounded-xl px-3.5 py-2.5"
            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
          >
            {error}
          </p>
        )}
      </div>
      <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-60"
          style={{ background: '#dc2626' }}
        >
          {loading ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </Modal>
  );
}

// ── Form primitives compartilhados pelos formulários de edição ─────────────

function EditFormShell({
  children, onSubmit, submitting, error, success, onClose,
}: {
  children: ReactNode;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  submitting?: boolean;
  error?: string | null;
  success?: string | null;
  onClose: () => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="p-6">{children}</div>
      {(error || success) && (
        <div className="px-6 pb-2">
          <p
            className="text-xs font-medium rounded-xl px-3.5 py-2.5"
            style={
              error
                ? { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }
                : { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }
            }
          >
            {error || success}
          </p>
        </div>
      )}
      <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-60"
          style={{ background: '#4A6FA5' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#3A5A90')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#4A6FA5')}
        >
          {submitting ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}

function MField({
  label, name, type = 'text', defaultValue, placeholder, required, span, step,
}: {
  label: string;
  name?: string;
  type?: string;
  defaultValue?: string | number;
  placeholder?: string;
  required?: boolean;
  span?: number;
  step?: string;
}) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-gray-50 text-gray-800 placeholder-gray-400 transition-colors"
      />
    </div>
  );
}

function MSelect({
  label, name, options, required, value, onChange, span,
}: {
  label: string;
  name?: string;
  options: { value: string; label: string }[];
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  span?: number;
}) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          required={required}
          className="w-full appearance-none px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-gray-50 text-gray-700 transition-colors pr-9"
        >
          <option value="">Selecionar...</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function MWeekdayPicker({
  label, value, onChange,
}: {
  label: string;
  value: DiaSemana[];
  onChange: (next: DiaSemana[]) => void;
}) {
  const toggle = (d: DiaSemana) =>
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort((a, b) => a - b));

  return (
    <div className="sm:col-span-2">
      <label className="block text-xs font-semibold text-gray-600 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-2">
        {DIAS_SEMANA.map(({ value: dayValue, label: dayLabel }) => (
          <button
            key={dayValue}
            type="button"
            onClick={() => toggle(dayValue)}
            className="w-11 h-11 rounded-xl text-xs font-bold border transition-all"
            style={
              value.includes(dayValue)
                ? { background: '#4A6FA5', borderColor: '#4A6FA5', color: '#ffffff' }
                : { background: '#F9FAFB', borderColor: '#E5E7EB', color: '#6B7280' }
            }
          >
            {dayLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Gera um caminho único dentro do bucket — o admin tem acesso irrestrito, então não precisa seguir `{bucket}/{user_id}/...`. */
function buildStoragePath(folder: string, file: File): string {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-');
  return `${folder}/${Date.now()}-${safeName}`;
}

function MFileUpload({
  label, hint, bucket, folder, accept, value, onChange,
}: {
  label?: string;
  hint?: string;
  bucket: StorageBucket;
  folder: string;
  accept: string;
  /** Caminho relativo salvo no Storage (ex.: `clientes/123-foto.png`) — é isso que vai no payload, não a URL completa. */
  value: string | null;
  onChange: (path: string | null) => void;
}) {
  const { enviar, uploading, error } = useArquivoUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    onChange(null);
    try {
      onChange(await enviar(file, { bucket, path: buildStoragePath(folder, file) }));
    } catch {
      // erro já refletido em `error`
    }
  };

  const statusLabel = uploading
    ? 'Enviando para o Supabase Storage…'
    : error || (value ? `Arquivo enviado — caminho salvo: ${value}` : (hint ?? 'Clique para selecionar o arquivo'));
  const statusColor = error ? '#dc2626' : value ? '#16a34a' : '#9CA3AF';

  return (
    <div>
      {label && <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors disabled:cursor-wait"
        style={{ borderColor: error ? '#fecaca' : value ? '#bbf7d0' : '#E5E7EB' }}
      >
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          {uploading ? (
            <Loader2 size={18} className="text-gray-400 animate-spin" />
          ) : value ? (
            <CheckCircle2 size={18} className="text-green-500" />
          ) : (
            <Upload size={18} className="text-gray-400" />
          )}
        </div>
        <p className="text-xs font-medium" style={{ color: statusColor }}>{statusLabel}</p>
      </button>
    </div>
  );
}

function MOrderedParadaList({
  paradas, value, onChange,
}: {
  paradas: { id: number; nome: string; cidade: string }[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const add = () => onChange([...value, '']);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i: number, val: string) =>
    onChange(value.map((item, idx) => (idx === i ? val : item)));

  return (
    <div className="sm:col-span-2">
      <label className="block text-xs font-semibold text-gray-600 mb-2">
        Paradas da Rota (ordem de embarque) <span className="text-red-500">*</span>
      </label>
      <div className="space-y-2">
        {value.map((paradaId, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">
              {i + 1}
            </span>
            <div className="relative flex-1">
              <select
                value={paradaId}
                onChange={(e) => update(i, e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-gray-50 text-gray-700 transition-colors pr-9"
              >
                <option value="">Selecionar parada cadastrada...</option>
                {paradas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome} — {p.cidade}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {value.length > 1 && (
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 flex items-center gap-1.5 text-xs font-semibold transition-colors"
        style={{ color: '#4A6FA5' }}
      >
        <Plus size={14} />
        Adicionar parada à rota
      </button>
    </div>
  );
}

// ── Formulários de edição (um por entidade — cada PUT espera um shape próprio) ──

function EditDestino({ destino, onSaved, onClose }: { destino: Destino; onSaved: () => void; onClose: () => void }) {
  const atualizar = (payload: DestinoUpdatePayload) => atualizarDestino(destino.id, payload);
  const { mutate, loading, error } = useEntityMutation<DestinoUpdatePayload, unknown>(
    atualizar,
    'Não foi possível atualizar o destino.',
  );
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    try {
      await mutate({
        nome: String(data.get('nome') ?? ''),
        rua: String(data.get('rua') ?? ''),
        cidade: String(data.get('cidade') ?? ''),
        latitude: Number(data.get('latitude')),
        longitude: Number(data.get('longitude')),
      });
      setSuccess('Destino atualizado com sucesso.');
      onSaved();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <EditFormShell onSubmit={handleSubmit} submitting={loading} error={error} success={success} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MField label="Nome do Destino" name="nome" defaultValue={destino.nome} required span={2} />
        <MField label="Rua / Logradouro" name="rua" defaultValue={destino.rua} required span={2} />
        <MField label="Cidade" name="cidade" defaultValue={destino.cidade} required />
        <div />
        <MField label="Latitude" name="latitude" type="number" step="any" defaultValue={destino.latitude} required />
        <MField label="Longitude" name="longitude" type="number" step="any" defaultValue={destino.longitude} required />
      </div>
    </EditFormShell>
  );
}

function EditParada({ parada, onSaved, onClose }: { parada: Parada; onSaved: () => void; onClose: () => void }) {
  const atualizar = (payload: ParadaUpdatePayload) => atualizarParada(parada.id, payload);
  const { mutate, loading, error } = useEntityMutation<ParadaUpdatePayload, unknown>(
    atualizar,
    'Não foi possível atualizar a parada.',
  );
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    try {
      await mutate({
        nome: String(data.get('nome') ?? ''),
        cidade: String(data.get('cidade') ?? ''),
        latitude: Number(data.get('latitude')),
        longitude: Number(data.get('longitude')),
      });
      setSuccess('Parada atualizada com sucesso.');
      onSaved();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <EditFormShell onSubmit={handleSubmit} submitting={loading} error={error} success={success} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MField label="Nome / Apelido da Parada" name="nome" defaultValue={parada.nome} required span={2} />
        <MField label="Cidade" name="cidade" defaultValue={parada.cidade} required span={2} />
        <MField label="Latitude" name="latitude" type="number" step="any" defaultValue={parada.latitude} required />
        <MField label="Longitude" name="longitude" type="number" step="any" defaultValue={parada.longitude} required />
      </div>
    </EditFormShell>
  );
}

function EditRotaInterna({ rota, onSaved, onClose }: { rota: RotaInterna; onSaved: () => void; onClose: () => void }) {
  const { data: paradas } = useEntityList(listarParadas, 'Não foi possível carregar as paradas cadastradas.');
  const atualizar = (payload: RotaInternaParadasUpdatePayload) => substituirParadasDaRota(rota.id, payload);
  const { mutate, loading, error } = useEntityMutation<RotaInternaParadasUpdatePayload, unknown>(
    atualizar,
    'Não foi possível atualizar a sequência de paradas.',
  );
  const sortedIds = [...rota.paradas].sort((a, b) => a.ordem - b.ordem).map((p) => String(p.parada_id));
  const [paradaIds, setParadaIds] = useState<string[]>(sortedIds.length > 0 ? sortedIds : ['']);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const ids = paradaIds.filter((id) => id !== '');
    if (ids.length === 0) return;
    try {
      await mutate({ paradas: ids.map((id, index) => ({ parada_id: Number(id), ordem: index + 1 })) });
      setSuccess('Sequência de paradas atualizada com sucesso.');
      onSaved();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <EditFormShell onSubmit={handleSubmit} submitting={loading} error={error} success={success} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 text-gray-600">
          Cidade: <span className="font-semibold text-gray-700">{rota.cidade}</span>
          <p className="text-[11px] text-gray-400 mt-0.5">
            A API só permite substituir a sequência de paradas (PUT /rotas-internas/{'{id}'}/paradas) — a cidade não é editável aqui.
          </p>
        </div>
        <MOrderedParadaList paradas={paradas} value={paradaIds} onChange={setParadaIds} />
      </div>
    </EditFormShell>
  );
}

function EditHorario({ horario, onSaved, onClose }: { horario: HorarioTurnoViagem; onSaved: () => void; onClose: () => void }) {
  const atualizar = (payload: HorarioTurnoViagemUpdatePayload) => atualizarHorarioTurnoViagem(horario.id, payload);
  const { mutate, loading, error } = useEntityMutation<HorarioTurnoViagemUpdatePayload, unknown>(
    atualizar,
    'Não foi possível atualizar o horário.',
  );
  const [turno, setTurno] = useState<TurnoHorario | ''>(horario.turno);
  const [ida, setIda] = useState(horario.horario_ida);
  const [volta, setVolta] = useState(horario.horario_volta);
  const [success, setSuccess] = useState<string | null>(null);
  const invalido = ida !== '' && volta !== '' && volta <= ida;

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    if (!turno || invalido) return;
    const data = new FormData(event.currentTarget);
    try {
      await mutate({
        cidade: String(data.get('cidade') ?? ''),
        turno,
        horario_ida: ida,
        horario_volta: volta,
      });
      setSuccess('Horário atualizado com sucesso.');
      onSaved();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <EditFormShell onSubmit={handleSubmit} submitting={loading} error={error} success={success} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MField label="Cidade" name="cidade" defaultValue={horario.cidade} required span={2} />
        <MSelect
          label="Turno"
          required
          value={turno}
          onChange={(v) => setTurno(v as TurnoHorario)}
          options={TURNOS_SEM_INTEGRAL}
          span={2}
        />
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Horário de Ida <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={ida}
            onChange={(e) => setIda(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-gray-50 text-gray-800 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Horário de Volta <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={volta}
            onChange={(e) => setVolta(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 bg-gray-50 text-gray-800 transition-colors"
            style={invalido ? { borderColor: '#fca5a5', boxShadow: '0 0 0 2px rgba(220,38,38,0.10)' } : { borderColor: '#e5e7eb' }}
          />
        </div>
        {invalido && (
          <div className="sm:col-span-2 rounded-xl p-3 text-xs text-red-600" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            O horário de volta precisa ser maior que o horário de ida (horario_volta &gt; horario_ida).
          </div>
        )}
      </div>
    </EditFormShell>
  );
}

function EditVeiculo({ veiculo, onSaved, onClose }: { veiculo: Veiculo; onSaved: () => void; onClose: () => void }) {
  const atualizar = (payload: VeiculoUpdatePayload) => atualizarVeiculo(veiculo.id, payload);
  const { mutate, loading, error } = useEntityMutation<VeiculoUpdatePayload, unknown>(
    atualizar,
    'Não foi possível atualizar o veículo.',
  );
  const [categoria, setCategoria] = useState<CategoriaVeiculo | ''>(veiculo.categoria);
  const [status, setStatus] = useState<StatusVeiculo>(veiculo.status);
  const [comodidades, setComodidades] = useState<Record<string, boolean>>({
    ar_condicionado: veiculo.ar_condicionado,
    banheiro: veiculo.banheiro,
    persiana: veiculo.persiana,
    luz_leitura: veiculo.luz_leitura,
    tomada: veiculo.tomada,
  });
  const [fotoPath, setFotoPath] = useState<string | null>(veiculo.foto ?? null);
  const [success, setSuccess] = useState<string | null>(null);

  const capacidade = CATEGORIAS_VEICULO.find((c) => c.value === categoria)?.capacidade;
  const toggleComodidade = (key: string) => setComodidades((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    if (!categoria || capacidade === undefined) return;
    const data = new FormData(event.currentTarget);
    try {
      await mutate({
        placa: String(data.get('placa') ?? ''),
        modelo: String(data.get('modelo') ?? ''),
        categoria,
        capacidade,
        cidade_base: String(data.get('cidade_base') ?? ''),
        status,
        foto: fotoPath ?? undefined,
        ar_condicionado: comodidades.ar_condicionado,
        banheiro: comodidades.banheiro,
        persiana: comodidades.persiana,
        luz_leitura: comodidades.luz_leitura,
        tomada: comodidades.tomada,
      });
      setSuccess('Veículo atualizado com sucesso.');
      onSaved();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <EditFormShell onSubmit={handleSubmit} submitting={loading} error={error} success={success} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MField label="Placa" name="placa" defaultValue={veiculo.placa} required />
        <MField label="Modelo" name="modelo" defaultValue={veiculo.modelo} required />
        <MSelect
          label="Categoria"
          required
          value={categoria}
          onChange={(v) => setCategoria(v as CategoriaVeiculo)}
          options={CATEGORIAS_VEICULO.map(({ value, label }) => ({ value, label }))}
        />
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Capacidade (derivada da categoria)</label>
          <input
            readOnly
            value={capacidade ?? ''}
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        </div>
        <MField label="Cidade Base" name="cidade_base" defaultValue={veiculo.cidade_base} required span={2} />
        <MSelect
          label="Status do Veículo"
          required
          value={status}
          onChange={(v) => setStatus(v as StatusVeiculo)}
          options={STATUS_VEICULO}
          span={2}
        />
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Comodidades de Conforto</label>
          <div className="flex flex-wrap gap-2">
            {COMODIDADES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleComodidade(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                style={
                  comodidades[key]
                    ? { background: '#EFF6FF', borderColor: '#4A6FA5', color: '#4A6FA5' }
                    : { background: '#F9FAFB', borderColor: '#E5E7EB', color: '#6B7280' }
                }
              >
                <span
                  className="w-3.5 h-3.5 rounded border flex items-center justify-center"
                  style={comodidades[key] ? { background: '#4A6FA5', borderColor: '#4A6FA5' } : { borderColor: '#D1D5DB' }}
                >
                  {comodidades[key] && <span className="text-white text-[9px]">✓</span>}
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <MFileUpload
            label="Foto do Veículo"
            bucket="fotos"
            folder="veiculos"
            accept="image/jpeg,image/png,image/webp"
            value={fotoPath}
            onChange={setFotoPath}
          />
        </div>
      </div>
    </EditFormShell>
  );
}

function EditMotorista({ motorista, onSaved, onClose }: { motorista: Motorista; onSaved: () => void; onClose: () => void }) {
  const atualizar = (payload: MotoristaUpdatePayload) => atualizarMotorista(motorista.id, payload);
  const { mutate, loading, error } = useEntityMutation<MotoristaUpdatePayload, unknown>(
    atualizar,
    'Não foi possível atualizar o motorista.',
  );
  const [turno, setTurno] = useState<Turno | ''>(motorista.turno);
  const [fotoPath, setFotoPath] = useState<string | null>(motorista.foto ?? null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    if (!turno) return;
    const data = new FormData(event.currentTarget);
    try {
      await mutate({
        nome: String(data.get('nome') ?? ''),
        telefone: String(data.get('telefone') ?? '') || undefined,
        data_nasc: String(data.get('data_nasc') ?? ''),
        turno,
        cidade_trabalho: String(data.get('cidade_trabalho') ?? ''),
        residencia: String(data.get('residencia') ?? ''),
        foto: fotoPath ?? undefined,
      });
      setSuccess('Motorista atualizado com sucesso.');
      onSaved();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <EditFormShell onSubmit={handleSubmit} submitting={loading} error={error} success={success} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MField label="Nome Completo" name="nome" defaultValue={motorista.nome} required span={2} />
        <MField label="CPF" defaultValue={motorista.cpf} />
        <p className="text-[11px] text-gray-400 self-end pb-2.5 col-span-1">CPF não pode ser alterado.</p>
        <MField label="Telefone" name="telefone" type="tel" defaultValue={motorista.telefone ?? ''} />
        <MField label="Data de Nascimento" name="data_nasc" type="date" defaultValue={motorista.data_nasc} required />
        <MSelect label="Turno" required value={turno} onChange={(v) => setTurno(v as Turno)} options={TURNOS_COMPLETOS} />
        <MField label="Cidade de Trabalho" name="cidade_trabalho" defaultValue={motorista.cidade_trabalho} required />
        <MField label="Residência" name="residencia" defaultValue={motorista.residencia} required span={2} />
        <div className="sm:col-span-2">
          <MFileUpload
            label="Foto do Motorista"
            bucket="fotos"
            folder="motoristas"
            accept="image/jpeg,image/png,image/webp"
            value={fotoPath}
            onChange={setFotoPath}
          />
        </div>
      </div>
    </EditFormShell>
  );
}

function EditCliente({ cliente, onSaved, onClose }: { cliente: Cliente; onSaved: () => void; onClose: () => void }) {
  const atualizar = (payload: ClienteUpdatePayload) => atualizarCliente(cliente.id, payload);
  const { mutate, loading, error } = useEntityMutation<ClienteUpdatePayload, unknown>(
    atualizar,
    'Não foi possível atualizar o cliente.',
  );
  const [fotoPath, setFotoPath] = useState<string | null>(cliente.foto ?? null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    try {
      await mutate({
        nome: String(data.get('nome') ?? ''),
        telefone: String(data.get('telefone') ?? '') || undefined,
        data_nasc: String(data.get('data_nasc') ?? ''),
        foto: fotoPath ?? undefined,
      });
      setSuccess('Cliente atualizado com sucesso.');
      onSaved();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <EditFormShell onSubmit={handleSubmit} submitting={loading} error={error} success={success} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MField label="Nome Completo" name="nome" defaultValue={cliente.nome} required span={2} />
        <MField label="CPF" defaultValue={cliente.cpf} />
        <p className="text-[11px] text-gray-400 self-end pb-2.5">CPF não pode ser alterado.</p>
        <MField label="Telefone" name="telefone" type="tel" defaultValue={cliente.telefone ?? ''} />
        <MField label="Data de Nascimento" name="data_nasc" type="date" defaultValue={cliente.data_nasc} required />
        <div className="sm:col-span-2">
          <MFileUpload
            label="Foto do Cliente"
            bucket="fotos"
            folder="clientes"
            accept="image/jpeg,image/png,image/webp"
            value={fotoPath}
            onChange={setFotoPath}
          />
        </div>
      </div>
    </EditFormShell>
  );
}

function EditVinculo({ vinculo, onSaved, onClose }: { vinculo: Vinculo; onSaved: () => void; onClose: () => void }) {
  const { data: destinos } = useEntityList(listarDestinos, 'Não foi possível carregar os destinos cadastrados.');
  const { data: rotas } = useEntityList(listarRotasInternas, 'Não foi possível carregar as rotas internas cadastradas.');
  const atualizar = (payload: VinculoUpdatePayload) => atualizarVinculo(vinculo.cliente_id, vinculo.id, payload);
  const { mutate, loading, error } = useEntityMutation<VinculoUpdatePayload, unknown>(
    atualizar,
    'Não foi possível atualizar o vínculo.',
  );
  const [tipo, setTipo] = useState<TipoVinculo | ''>(vinculo.tipo);
  const [turno, setTurno] = useState<Turno | ''>(vinculo.turno);
  const [horariosFixos, setHorariosFixos] = useState<DiaSemana[]>(vinculo.horarios_fixos.map((h) => h.dia_semana));
  const [comprovantePath, setComprovantePath] = useState<string | null>(vinculo.comprovante ?? null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    const destinoId = Number(data.get('destino_id'));
    const rotaInternaId = Number(data.get('rota_interna_id'));

    if (!tipo || !turno || !destinoId || !rotaInternaId || horariosFixos.length === 0) return;

    try {
      await mutate({
        tipo,
        turno,
        destino_id: destinoId,
        rota_interna_id: rotaInternaId,
        curso: String(data.get('curso') ?? '') || undefined,
        comprovante: comprovantePath ?? undefined,
        validade: String(data.get('validade') ?? ''),
        horarios_fixos: horariosFixos,
      });
      setSuccess('Vínculo atualizado com sucesso.');
      onSaved();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <EditFormShell onSubmit={handleSubmit} submitting={loading} error={error} success={success} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MSelect label="Tipo" required value={tipo} onChange={(v) => setTipo(v as TipoVinculo)} options={TIPOS_VINCULO} />
        <MSelect label="Turno" required value={turno} onChange={(v) => setTurno(v as Turno)} options={TURNOS_COMPLETOS} />
        <MSelect
          label="Destino"
          name="destino_id"
          required
          value={String(vinculo.destino_id)}
          options={destinos.map((d) => ({ value: String(d.id), label: `${d.nome} — ${d.cidade}` }))}
        />
        <MSelect
          label="Rota Interna"
          name="rota_interna_id"
          required
          value={String(vinculo.rota_interna_id)}
          options={rotas.map((r) => ({ value: String(r.id), label: `Rota — ${r.cidade} (#${r.id})` }))}
        />
        <MField label="Curso" name="curso" defaultValue={vinculo.curso ?? ''} />
        <MField label="Validade do Vínculo" name="validade" type="date" defaultValue={vinculo.validade} required />
        <MWeekdayPicker label="Horários Fixos (dias com transporte)" value={horariosFixos} onChange={setHorariosFixos} />
        <div className="sm:col-span-2">
          <MFileUpload
            label="Comprovante (matrícula / estágio)"
            hint="PDF ou imagem do comprovante"
            bucket="documentos"
            folder="documentos"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            value={comprovantePath}
            onChange={setComprovantePath}
          />
        </div>
      </div>
    </EditFormShell>
  );
}

function EditAdmin({ admin, onSaved, onClose }: { admin: Admin; onSaved: () => void; onClose: () => void }) {
  const atualizar = (payload: AdminUpdatePayload) => atualizarAdmin(admin.id, payload);
  const { mutate, loading, error } = useEntityMutation<AdminUpdatePayload, unknown>(
    atualizar,
    'Não foi possível atualizar o administrador.',
  );
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    try {
      await mutate({ email: String(data.get('email') ?? '') });
      setSuccess('Administrador atualizado com sucesso.');
      onSaved();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <EditFormShell onSubmit={handleSubmit} submitting={loading} error={error} success={success} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MField label="E-mail" name="email" type="email" defaultValue={admin.email} required span={2} />
        <p className="sm:col-span-2 text-[11px] text-gray-400">
          Apenas o e-mail é atualizável por este formulário (PUT /admin/{'{adminID}'}).
        </p>
      </div>
    </EditFormShell>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

export default function DadosPage() {
  const clientes = useEntityList(listarClientes, 'Não foi possível carregar os clientes.');
  const motoristas = useEntityList(listarMotoristas, 'Não foi possível carregar os motoristas.');
  const veiculos = useEntityList(listarVeiculos, 'Não foi possível carregar os veículos.');
  const paradas = useEntityList(listarParadas, 'Não foi possível carregar as paradas.');
  const destinos = useEntityList(listarDestinos, 'Não foi possível carregar os destinos.');
  const rotas = useEntityList(listarRotasInternas, 'Não foi possível carregar as rotas internas.');
  const horarios = useEntityList(listarHorariosTurnoViagem, 'Não foi possível carregar os horários.');
  const admins = useEntityList(listarAdmins, 'Não foi possível carregar os administradores.');
  const viagens = useEntityList(listarViagens, 'Não foi possível carregar as viagens.');
  const reservas = useEntityList(listarTodasReservas, 'Não foi possível carregar as reservas.');

  // A API não tem listagem global de vínculos — agregamos buscando os vínculos de cada cliente.
  const listarTodosVinculos = useCallback(async (): Promise<VinculoComCliente[]> => {
    const lista = await listarClientes();
    const porCliente = await Promise.all(
      lista.map((c) =>
        listarVinculosDoCliente(c.id)
          .then((vs) => vs.map((v): VinculoComCliente => ({ ...v, clienteNome: c.nome })))
          .catch(() => [] as VinculoComCliente[]),
      ),
    );
    return porCliente.flat();
  }, []);
  const vinculos = useEntityList(listarTodosVinculos, 'Não foi possível carregar os vínculos.');

  const entities = useMemo(() => [
    {
      id: 'destinos',
      label: 'Destinos',
      loading: destinos.loading,
      error: destinos.error,
      data: destinos.data.map((d): Row => ({
        id: d.id,
        nome: d.nome,
        rua: d.rua,
        cidade: d.cidade,
        latitude: d.latitude,
        longitude: d.longitude,
      })),
      columns: [
        { key: 'nome', label: 'Nome' },
        { key: 'rua', label: 'Rua' },
        { key: 'cidade', label: 'Cidade' },
        { key: 'latitude', label: 'Latitude' },
        { key: 'longitude', label: 'Longitude' },
      ],
    },
    {
      id: 'paradas',
      label: 'Paradas',
      loading: paradas.loading,
      error: paradas.error,
      data: paradas.data.map((p): Row => ({
        id: p.id,
        nome: p.nome,
        cidade: p.cidade,
        latitude: p.latitude,
        longitude: p.longitude,
      })),
      columns: [
        { key: 'nome', label: 'Nome' },
        { key: 'cidade', label: 'Cidade' },
        { key: 'latitude', label: 'Latitude' },
        { key: 'longitude', label: 'Longitude' },
      ],
    },
    {
      id: 'rotas',
      label: 'Rotas Internas',
      loading: rotas.loading,
      error: rotas.error,
      data: rotas.data.map((r): Row => ({
        id: r.id,
        cidade: r.cidade,
        qtd_paradas: r.paradas.length,
        sequencia: [...r.paradas]
          .sort((a, b) => a.ordem - b.ordem)
          .map((item) => paradas.data.find((p) => p.id === item.parada_id)?.nome ?? `Parada #${item.parada_id}`)
          .join(' → ') || '—',
      })),
      columns: [
        { key: 'cidade', label: 'Cidade' },
        { key: 'qtd_paradas', label: 'Qtd. Paradas' },
        { key: 'sequencia', label: 'Sequência de Embarque' },
      ],
    },
    {
      id: 'horarios',
      label: 'Horários por Turno',
      loading: horarios.loading,
      error: horarios.error,
      data: horarios.data.map((h): Row => ({
        id: h.id,
        cidade: h.cidade,
        turno: h.turno,
        horario_ida: h.horario_ida,
        horario_volta: h.horario_volta,
      })),
      columns: [
        { key: 'cidade', label: 'Cidade' },
        { key: 'turno', label: 'Turno' },
        { key: 'horario_ida', label: 'Horário de Ida' },
        { key: 'horario_volta', label: 'Horário de Volta' },
      ],
    },
    {
      id: 'veiculos',
      label: 'Veículos',
      loading: veiculos.loading,
      error: veiculos.error,
      data: veiculos.data.map((v): Row => ({
        id: v.id,
        placa: v.placa,
        modelo: v.modelo,
        categoria: CATEGORIA_LABELS[v.categoria] ?? v.categoria,
        capacidade: v.capacidade,
        cidade_base: v.cidade_base,
        comodidades: Object.entries({
          ar_condicionado: v.ar_condicionado,
          banheiro: v.banheiro,
          persiana: v.persiana,
          luz_leitura: v.luz_leitura,
          tomada: v.tomada,
        }).filter(([, on]) => on).map(([key]) => COMODIDADE_LABELS[key]).join(', ') || '—',
        status: v.status,
        statusLabel: STATUS_VEICULO_LABELS[v.status] ?? v.status,
      })),
      columns: [
        { key: 'placa', label: 'Placa' },
        { key: 'modelo', label: 'Modelo' },
        { key: 'categoria', label: 'Categoria' },
        { key: 'capacidade', label: 'Capacidade' },
        { key: 'cidade_base', label: 'Cidade Base' },
        { key: 'comodidades', label: 'Comodidades' },
        { key: 'status', label: 'Status' },
      ],
    },
    {
      id: 'motoristas',
      label: 'Motoristas',
      loading: motoristas.loading,
      error: motoristas.error,
      data: motoristas.data.map((m): Row => ({
        id: m.id,
        nome: m.nome,
        cpf: m.cpf,
        telefone: m.telefone ?? '—',
        turno: m.turno,
        cidade_trabalho: m.cidade_trabalho,
        residencia: m.residencia,
      })),
      columns: [
        { key: 'nome', label: 'Nome' },
        { key: 'cpf', label: 'CPF' },
        { key: 'telefone', label: 'Telefone' },
        { key: 'turno', label: 'Turno' },
        { key: 'cidade_trabalho', label: 'Cidade de Trabalho' },
        { key: 'residencia', label: 'Residência' },
      ],
    },
    {
      id: 'clientes',
      label: 'Clientes',
      loading: clientes.loading,
      error: clientes.error,
      data: clientes.data.map((c): Row => ({
        id: c.id,
        nome: c.nome,
        cpf: c.cpf,
        telefone: c.telefone ?? '—',
        data_nasc: c.data_nasc,
        vinculos: c.vinculos?.length ?? '—',
      })),
      columns: [
        { key: 'nome', label: 'Nome' },
        { key: 'cpf', label: 'CPF' },
        { key: 'telefone', label: 'Telefone' },
        { key: 'data_nasc', label: 'Nascimento' },
        { key: 'vinculos', label: 'Vínculos' },
      ],
    },
    {
      id: 'vinculos',
      label: 'Vínculos',
      loading: vinculos.loading,
      error: vinculos.error,
      data: vinculos.data.map((v): Row => ({
        id: v.id,
        cliente: v.clienteNome,
        tipo: TIPO_VINCULO_LABELS[v.tipo] ?? v.tipo,
        turno: v.turno,
        destino: destinos.data.find((d) => d.id === v.destino_id)?.nome ?? `Destino #${v.destino_id}`,
        validade: v.validade,
        dias_fixos: v.horarios_fixos.map((h) => DIA_SEMANA_LABELS[h.dia_semana] ?? h.dia_semana).join(', ') || '—',
      })),
      columns: [
        { key: 'cliente', label: 'Cliente' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'turno', label: 'Turno' },
        { key: 'destino', label: 'Destino' },
        { key: 'validade', label: 'Validade' },
        { key: 'dias_fixos', label: 'Dias Fixos' },
      ],
    },
    {
      id: 'admins',
      label: 'Administradores',
      loading: admins.loading,
      error: admins.error,
      data: admins.data.map((a): Row => ({
        id: a.id,
        email: a.email,
        cidade: a.cidade ?? '—',
      })),
      columns: [
        { key: 'email', label: 'E-mail' },
        { key: 'cidade', label: 'Cidade' },
      ],
    },
    {
      id: 'viagens',
      label: 'Viagens',
      loading: viagens.loading,
      error: viagens.error,
      data: viagens.data.map((v): Row => ({
        id: v.id,
        data_viagem: v.data_viagem,
        turno: v.turno,
        sentido: SENTIDO_LABELS[v.sentido] ?? v.sentido,
        cidade: v.cidade,
        motorista: motoristas.data.find((m) => m.id === v.motorista_id)?.nome ?? `Motorista #${v.motorista_id}`,
        veiculo: veiculos.data.find((vc) => vc.id === v.veiculo_id)?.placa ?? (v.veiculo_id ? `Veículo #${v.veiculo_id}` : '—'),
        status: v.status,
        statusLabel: STATUS_VIAGEM_LABELS[v.status] ?? v.status,
      })),
      columns: [
        { key: 'data_viagem', label: 'Data' },
        { key: 'turno', label: 'Turno' },
        { key: 'sentido', label: 'Sentido' },
        { key: 'cidade', label: 'Cidade' },
        { key: 'motorista', label: 'Motorista' },
        { key: 'veiculo', label: 'Veículo' },
        { key: 'status', label: 'Status' },
      ],
    },
    {
      id: 'reservas',
      label: 'Reservas',
      loading: reservas.loading,
      error: reservas.error,
      data: reservas.data.map((r): Row => ({
        id: r.id,
        data_viagem: r.data_viagem,
        turno: r.turno,
        sentido: SENTIDO_LABELS[r.sentido] ?? r.sentido,
        cidade: r.cidade ?? '—',
        destino: r.destino_id ? (destinos.data.find((d) => d.id === r.destino_id)?.nome ?? `Destino #${r.destino_id}`) : '—',
        status: r.status ?? '—',
        statusLabel: r.status ? (STATUS_RESERVA_LABELS[r.status] ?? r.status) : '—',
      })),
      columns: [
        { key: 'data_viagem', label: 'Data' },
        { key: 'turno', label: 'Turno' },
        { key: 'sentido', label: 'Sentido' },
        { key: 'cidade', label: 'Cidade' },
        { key: 'destino', label: 'Destino' },
        { key: 'status', label: 'Status' },
      ],
    },
  ], [destinos, paradas, rotas, horarios, veiculos, motoristas, clientes, vinculos, admins, viagens, reservas]);

  const [activeEntity, setActiveEntity] = useState('clientes');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterCol, setFilterCol] = useState('');

  const entity = entities.find((e) => e.id === activeEntity)!;

  // ── Ações de visualizar / editar / excluir ───────────────────────────────
  const [modal, setModal] = useState<{ action: 'view' | 'edit' | 'delete'; entityId: string; id: number } | null>(null);
  const closeModal = () => setModal(null);

  const refetchByEntity: Record<string, () => Promise<void>> = {
    destinos: destinos.refetch,
    paradas: paradas.refetch,
    rotas: rotas.refetch,
    horarios: horarios.refetch,
    veiculos: veiculos.refetch,
    motoristas: motoristas.refetch,
    clientes: clientes.refetch,
    vinculos: vinculos.refetch,
    admins: admins.refetch,
    viagens: viagens.refetch,
    reservas: reservas.refetch,
  };

  const executeDelete = useCallback((entityId: string, id: number): Promise<void> => {
    switch (entityId) {
      case 'destinos': return removerDestino(id);
      case 'paradas': return removerParada(id);
      case 'rotas': return removerRotaInterna(id);
      case 'horarios': return removerHorarioTurnoViagem(id);
      case 'veiculos': return removerVeiculo(id);
      case 'motoristas': return removerMotorista(id);
      case 'clientes': return removerCliente(id);
      case 'admins': return removerAdmin(id);
      case 'vinculos': {
        const vinculo = vinculos.data.find((v) => v.id === id);
        if (!vinculo) return Promise.reject(new Error('Vínculo não encontrado.'));
        return removerVinculo(vinculo.cliente_id, vinculo.id);
      }
      default:
        return Promise.reject(new Error('Entidade desconhecida.'));
    }
  }, [vinculos.data]);

  const renderModal = () => {
    if (!modal) return null;
    const modalEntity = entities.find((e) => e.id === modal.entityId);
    if (!modalEntity) return null;

    if (modal.action === 'view') {
      const row = modalEntity.data.find((r) => r.id === modal.id);
      if (!row) return null;
      return <ViewModal entity={modalEntity} row={row} onClose={closeModal} />;
    }

    if (modal.action === 'delete') {
      return (
        <DeleteConfirmModal
          entityLabel={modalEntity.label}
          id={modal.id}
          onConfirm={() => executeDelete(modal.entityId, modal.id)}
          onDeleted={() => { refetchByEntity[modal.entityId]?.(); closeModal(); }}
          onClose={closeModal}
        />
      );
    }

    const onSaved = () => { refetchByEntity[modal.entityId]?.(); closeModal(); };
    switch (modal.entityId) {
      case 'destinos': {
        const item = destinos.data.find((d) => d.id === modal.id);
        return item && (
          <Modal title="Editar Destino" onClose={closeModal}>
            <EditDestino destino={item} onSaved={onSaved} onClose={closeModal} />
          </Modal>
        );
      }
      case 'paradas': {
        const item = paradas.data.find((p) => p.id === modal.id);
        return item && (
          <Modal title="Editar Parada" onClose={closeModal}>
            <EditParada parada={item} onSaved={onSaved} onClose={closeModal} />
          </Modal>
        );
      }
      case 'rotas': {
        const item = rotas.data.find((r) => r.id === modal.id);
        return item && (
          <Modal title="Editar Rota Interna" onClose={closeModal}>
            <EditRotaInterna rota={item} onSaved={onSaved} onClose={closeModal} />
          </Modal>
        );
      }
      case 'horarios': {
        const item = horarios.data.find((h) => h.id === modal.id);
        return item && (
          <Modal title="Editar Horário por Turno" onClose={closeModal}>
            <EditHorario horario={item} onSaved={onSaved} onClose={closeModal} />
          </Modal>
        );
      }
      case 'veiculos': {
        const item = veiculos.data.find((v) => v.id === modal.id);
        return item && (
          <Modal title="Editar Veículo" onClose={closeModal}>
            <EditVeiculo veiculo={item} onSaved={onSaved} onClose={closeModal} />
          </Modal>
        );
      }
      case 'motoristas': {
        const item = motoristas.data.find((m) => m.id === modal.id);
        return item && (
          <Modal title="Editar Motorista" onClose={closeModal}>
            <EditMotorista motorista={item} onSaved={onSaved} onClose={closeModal} />
          </Modal>
        );
      }
      case 'clientes': {
        const item = clientes.data.find((c) => c.id === modal.id);
        return item && (
          <Modal title="Editar Cliente" onClose={closeModal}>
            <EditCliente cliente={item} onSaved={onSaved} onClose={closeModal} />
          </Modal>
        );
      }
      case 'vinculos': {
        const item = vinculos.data.find((v) => v.id === modal.id);
        return item && (
          <Modal title="Editar Vínculo" onClose={closeModal}>
            <EditVinculo vinculo={item} onSaved={onSaved} onClose={closeModal} />
          </Modal>
        );
      }
      case 'admins': {
        const item = admins.data.find((a) => a.id === modal.id);
        return item && (
          <Modal title="Editar Administrador" onClose={closeModal}>
            <EditAdmin admin={item} onSaved={onSaved} onClose={closeModal} />
          </Modal>
        );
      }
      default:
        return null;
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entity.data.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [entity, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleEntityChange = (id: string) => {
    setActiveEntity(id);
    setSearch('');
    setPage(1);
    setFilterCol('');
  };

  const filterableKeys = ['status', 'turno', 'categoria', 'tipo'];
  const filterOptions = filterCol
    ? [...new Set(entity.data.map((r) => String(r[filterCol])))]
    : [];

  return (
    <div className="min-h-full">
      <Header title="Visualização de Dados" subtitle="Listagem completa de todas as entidades" />
      <div className="p-4 sm:p-6">

        {/* Entity selector tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-2xl shadow-sm border border-gray-100 mb-5 overflow-x-auto">
          {entities.map(({ id, label, data }) => (
            <button
              key={id}
              onClick={() => handleEntityChange(id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
              style={
                activeEntity === id
                  ? { background: '#4A6FA5', color: '#ffffff' }
                  : { background: 'transparent', color: '#6B7280' }
              }
            >
              {label}
              <span
                className="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
                style={
                  activeEntity === id
                    ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                    : { background: '#F3F4F6', color: '#9CA3AF' }
                }
              >
                {data.length}
              </span>
            </button>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 gap-3 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl w-full focus:outline-none focus:border-blue-400 bg-gray-50 placeholder-gray-400 text-gray-700"
                placeholder="Pesquisar em todos os campos..."
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Column filter */}
              <div className="relative">
                <select
                  value={filterCol}
                  onChange={(e) => { setFilterCol(e.target.value); setSearch(''); setPage(1); }}
                  className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none focus:border-blue-400"
                >
                  <option value="">Filtrar por coluna...</option>
                  {entity.columns
                    .filter((c) => filterableKeys.includes(c.key))
                    .map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {filterCol && filterOptions.length > 0 && (
                <div className="relative">
                  <select
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none focus:border-blue-400"
                  >
                    <option value="">Todos</option>
                    {filterOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}
              <span className="text-xs text-gray-400">{filtered.length} registros</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 w-8">#</th>
                  {entity.columns.map((col) => (
                    <th key={col.key} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                      {col.label}
                    </th>
                  ))}
                  <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entity.loading ? (
                  <tr>
                    <td colSpan={entity.columns.length + 2} className="text-center py-10 text-sm text-gray-400">
                      Carregando registros...
                    </td>
                  </tr>
                ) : entity.error ? (
                  <tr>
                    <td colSpan={entity.columns.length + 2} className="text-center py-10 text-sm text-red-500">
                      {entity.error}
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={entity.columns.length + 2} className="text-center py-10 text-sm text-gray-400">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, i) => (
                    <tr key={row.id as number} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-gray-400 font-medium">
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      {entity.columns.map((col) => (
                        <td key={col.key} className="px-4 py-3.5 text-sm text-gray-700">
                          {col.key === 'status' ? (
                            <StatusBadge value={String(row.status)} label={String(row.statusLabel ?? row.status)} />
                          ) : col.key === 'turno' ? (
                            <TurnoBadge value={String(row[col.key])} />
                          ) : (
                            <span className="leading-tight">{String(row[col.key])}</span>
                          )}
                        </td>
                      ))}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setModal({ action: 'view', entityId: entity.id, id: Number(row.id) })}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye size={14} />
                          </button>
                          {!READ_ONLY_ENTITIES.includes(entity.id) && (
                            <>
                              <button
                                onClick={() => setModal({ action: 'edit', entityId: entity.id, id: Number(row.id) })}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-500 transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setModal({ action: 'delete', entityId: entity.id, id: Number(row.id) })}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-t border-gray-100 gap-3 flex-wrap">
            <p className="text-xs text-gray-400">
              Exibindo {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={14} className="text-gray-500" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-lg text-xs font-semibold transition-all"
                  style={
                    p === page
                      ? { background: '#4A6FA5', color: '#fff' }
                      : { background: 'transparent', color: '#6B7280' }
                  }
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                <ChevronRight size={14} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {renderModal()}
    </div>
  );
}
