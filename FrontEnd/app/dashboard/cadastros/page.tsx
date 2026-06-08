'use client';

import { useRef, useState, type SubmitEvent } from 'react';
import Header from '@/components/dashboard/Header';
import { Upload, Plus, Trash2, ChevronDown, Loader2, CheckCircle2 } from 'lucide-react';

import { useEntityList } from '@/hooks/useEntityList';
import { useEntityMutation } from '@/hooks/useEntityMutation';
import { useCriarCliente } from '@/hooks/useCriarCliente';
import { useArquivoUpload } from '@/hooks/useArquivoUpload';
import type { StorageBucket } from '@/services/storage';

import { criarDestino, listarDestinos } from '@/services/destinos';
import { criarParada, listarParadas } from '@/services/paradas';
import { criarRotaInterna, listarRotasInternas } from '@/services/rotas-internas';
import { criarHorarioTurnoViagem } from '@/services/horarios-turno-viagem';
import { criarVeiculo } from '@/services/veiculos';
import { criarMotorista } from '@/services/motoristas';
import { criarVinculo, listarClientes } from '@/services/clientes';
import { criarAdmin } from '@/services/admin';

import type { DestinoCreatePayload } from '@/types/destino';
import type { ParadaCreatePayload } from '@/types/parada';
import type { ParadaNaRota, RotaInternaCreatePayload } from '@/types/rota-interna';
import type { HorarioTurnoViagemCreatePayload, TurnoHorario } from '@/types/horario-turno-viagem';
import type { CategoriaVeiculo, StatusVeiculo, VeiculoCreatePayload } from '@/types/veiculo';
import type { MotoristaCreatePayload } from '@/types/motorista';
import type { ClienteCreatePayload, TipoVinculo, VinculoCreatePayload } from '@/types/cliente';
import type { AdminCreatePayload } from '@/types/admin';
import type { DiaSemana, Turno } from '@/types/common';

// ── Static option lists (valores fixos esperados pelos payloads da API) ────

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

const DIAS_SEMANA: { value: DiaSemana; label: string }[] = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
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

const STATUS_VEICULO: { value: StatusVeiculo; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'manutencao', label: 'Manutenção' },
];

const TIPOS_VINCULO: { value: TipoVinculo; label: string }[] = [
  { value: 'estudante', label: 'Estudante' },
  { value: 'estagio', label: 'Estágio' },
];

// ── Shared form primitives ─────────────────────────────────────────────────

function Field({
  label, name, type = 'text', placeholder, required, span, step,
}: {
  label: string;
  name?: string;
  type?: string;
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
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-gray-50 text-gray-800 placeholder-gray-400 transition-colors"
      />
    </div>
  );
}

function SelectField({
  label, name, options, required, value, onChange, hint, span,
}: {
  label: string;
  name?: string;
  options: { value: string; label: string }[];
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  hint?: string;
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
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

/** Formata dígitos de CPF progressivamente como `123.456.789-01` — é esse o formato enviado à API. */
function formatCpf(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function CpfField({
  name = 'cpf', required, span, value, onChange,
}: {
  name?: string;
  required?: boolean;
  span?: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        CPF {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type="text"
        inputMode="numeric"
        placeholder="123.456.789-01"
        required={required}
        maxLength={14}
        value={value}
        onChange={(e) => onChange(formatCpf(e.target.value))}
        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-gray-50 text-gray-800 placeholder-gray-400 transition-colors"
      />
    </div>
  );
}

/** Gera um caminho único dentro do bucket — o admin tem acesso irrestrito, então não precisa seguir `{bucket}/{user_id}/...`. */
function buildStoragePath(folder: string, file: File): string {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-');
  return `${folder}/${Date.now()}-${safeName}`;
}

function FileUpload({
  label,
  hint,
  bucket,
  folder,
  accept,
  value,
  onChange,
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

function WeekdayPicker({
  label, required, name, value, onChange,
}: {
  label: string;
  required?: boolean;
  name?: string;
  value: DiaSemana[];
  onChange: (next: DiaSemana[]) => void;
}) {
  const toggle = (d: DiaSemana) =>
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort((a, b) => a - b));

  return (
    <div className="sm:col-span-2">
      <label className="block text-xs font-semibold text-gray-600 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
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
      <p className="text-[11px] text-gray-400 mt-1.5">
        Dias úteis (1=Seg … 5=Sex) em que o cliente utiliza o transporte fixo — enviado como{' '}
        {name ?? 'horarios_fixos'}: [{value.join(', ') || '—'}]
      </p>
    </div>
  );
}

function OrderedParadaList({
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
      <p className="text-[11px] text-gray-400 mt-1.5">
        Cada linha referencia uma parada já cadastrada (FK); a posição na lista define o atributo{' '}
        <span className="font-mono">ordem</span>, enviado como uma lista de objetos (parada_id, ordem).
      </p>
    </div>
  );
}

function FormCard({
  title, children, onSubmit, onReset, submitting, error, success,
}: {
  title: string;
  children: React.ReactNode;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onReset?: () => void;
  submitting?: boolean;
  error?: string | null;
  success?: string | null;
}) {
  return (
    <form onSubmit={onSubmit} onReset={onReset} className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
        <h3 className="text-gray-800 font-semibold text-[15px]">{title}</h3>
        <p className="text-gray-400 text-xs mt-0.5">Preencha os dados e clique em Salvar</p>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
      {(error || success) && (
        <div className="px-4 sm:px-6 pb-4">
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
      <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
        <button
          type="reset"
          className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Limpar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-60"
          style={{ background: '#4A6FA5' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#3A5A90')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#4A6FA5')}
        >
          {submitting ? 'Salvando...' : 'Salvar Cadastro'}
        </button>
      </div>
    </form>
  );
}

// ── Tab forms ──────────────────────────────────────────────────────────────

function FormDestinos() {
  const { mutate, loading, error } = useEntityMutation<DestinoCreatePayload, unknown>(
    criarDestino,
    'Não foi possível cadastrar o destino.',
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
      setSuccess('Destino cadastrado com sucesso.');
      event.currentTarget.reset();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <FormCard
      title="Cadastro de Destinos"
      onSubmit={handleSubmit}
      onReset={() => setSuccess(null)}
      submitting={loading}
      error={error}
      success={success}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nome do Destino" name="nome" placeholder="Ex: UNICAMP — Campus Central" required span={2} />
        <Field label="Rua / Logradouro" name="rua" placeholder="Ex: Rua Roxo Moreira, 1500" required span={2} />
        <Field label="Cidade" name="cidade" placeholder="Ex: Campinas" required />
        <div />
        <Field label="Latitude" name="latitude" type="number" step="any" placeholder="Ex: -22.8170" required />
        <Field label="Longitude" name="longitude" type="number" step="any" placeholder="Ex: -47.0700" required />
      </div>
    </FormCard>
  );
}

function FormParadas() {
  const { mutate, loading, error } = useEntityMutation<ParadaCreatePayload, unknown>(
    criarParada,
    'Não foi possível cadastrar a parada.',
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
      setSuccess('Parada cadastrada com sucesso.');
      event.currentTarget.reset();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <FormCard
      title="Cadastro de Paradas"
      onSubmit={handleSubmit}
      onReset={() => setSuccess(null)}
      submitting={loading}
      error={error}
      success={success}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nome / Apelido da Parada" name="nome" placeholder="Ex: Terminal Central" required span={2} />
        <Field label="Cidade" name="cidade" placeholder="Ex: Campinas" required span={2} />
        <Field label="Latitude" name="latitude" type="number" step="any" placeholder="Ex: -22.9099" required />
        <Field label="Longitude" name="longitude" type="number" step="any" placeholder="Ex: -47.0626" required />
      </div>
    </FormCard>
  );
}

function FormRotas() {
  const { data: paradas } = useEntityList(listarParadas, 'Não foi possível carregar as paradas cadastradas.');
  const { mutate, loading, error } = useEntityMutation<RotaInternaCreatePayload, unknown>(
    criarRotaInterna,
    'Não foi possível cadastrar a rota interna.',
  );
  const [paradaIds, setParadaIds] = useState<string[]>(['']);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setParadaIds(['']);
    setSuccess(null);
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    const ordenadas: ParadaNaRota[] = paradaIds
      .filter((id) => id !== '')
      .map((id, index) => ({ parada_id: Number(id), ordem: index + 1 }));

    if (ordenadas.length === 0) return;

    try {
      await mutate({ cidade: String(data.get('cidade') ?? ''), paradas: ordenadas });
      setSuccess('Rota interna cadastrada com sucesso.');
      event.currentTarget.reset();
      setParadaIds(['']);
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <FormCard
      title="Cadastro de Rotas Internas"
      onSubmit={handleSubmit}
      onReset={reset}
      submitting={loading}
      error={error}
      success={success}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Cidade da Rota" name="cidade" placeholder="Ex: Campinas" required span={2} />
        <OrderedParadaList paradas={paradas} value={paradaIds} onChange={setParadaIds} />
      </div>
    </FormCard>
  );
}

function FormHorarios() {
  const { mutate, loading, error } = useEntityMutation<HorarioTurnoViagemCreatePayload, unknown>(
    criarHorarioTurnoViagem,
    'Não foi possível cadastrar o horário.',
  );
  const [turno, setTurno] = useState<TurnoHorario | ''>('');
  const [ida, setIda] = useState('');
  const [volta, setVolta] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const invalido = ida !== '' && volta !== '' && volta <= ida;

  const reset = () => {
    setTurno('');
    setIda('');
    setVolta('');
    setSuccess(null);
  };

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
      setSuccess('Horário cadastrado com sucesso.');
      event.currentTarget.reset();
      reset();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <FormCard
      title="Configuração de Horários por Turno"
      onSubmit={handleSubmit}
      onReset={reset}
      submitting={loading}
      error={error}
      success={success}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Cidade" name="cidade" placeholder="Ex: Campinas" required span={2} />
        <SelectField
          label="Turno"
          name="turno"
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
            name="horario_ida"
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
            name="horario_volta"
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
    </FormCard>
  );
}

function FormVeiculos() {
  const { mutate, loading, error } = useEntityMutation<VeiculoCreatePayload, unknown>(
    criarVeiculo,
    'Não foi possível cadastrar o veículo.',
  );
  const [categoria, setCategoria] = useState<CategoriaVeiculo | ''>('');
  const [status, setStatus] = useState<StatusVeiculo>('ativo');
  const [comodidades, setComodidades] = useState<Record<string, boolean>>(
    Object.fromEntries(COMODIDADES.map((c) => [c.key, false])),
  );
  const [fotoPath, setFotoPath] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const capacidade = CATEGORIAS_VEICULO.find((c) => c.value === categoria)?.capacidade;
  const toggleComodidade = (key: string) => setComodidades((prev) => ({ ...prev, [key]: !prev[key] }));

  const reset = () => {
    setCategoria('');
    setStatus('ativo');
    setComodidades(Object.fromEntries(COMODIDADES.map((c) => [c.key, false])));
    setFotoPath(null);
    setSuccess(null);
  };

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
      setSuccess('Veículo cadastrado com sucesso.');
      event.currentTarget.reset();
      reset();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <FormCard
      title="Cadastro de Veículos"
      onSubmit={handleSubmit}
      onReset={reset}
      submitting={loading}
      error={error}
      success={success}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Placa" name="placa" placeholder="Ex: ABC-1234" required />
        <Field label="Modelo" name="modelo" placeholder="Ex: Marcopolo Torino" required />
        <SelectField
          label="Categoria"
          name="categoria"
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
            placeholder="Selecione a categoria"
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        </div>
        <Field label="Cidade Base" name="cidade_base" placeholder="Ex: Campinas" required span={2} />
        <SelectField
          label="Status do Veículo"
          name="status"
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
          <p className="text-[11px] text-gray-400 mt-1.5">
            Enviado como booleanos nomeados: ar_condicionado, banheiro, persiana, luz_leitura, tomada
          </p>
        </div>
        <div className="sm:col-span-2">
          <FileUpload
            label="Foto do Veículo"
            bucket="fotos"
            folder="veiculos"
            accept="image/jpeg,image/png,image/webp"
            value={fotoPath}
            onChange={setFotoPath}
          />
        </div>
      </div>
    </FormCard>
  );
}

function FormMotoristas() {
  const { mutate, loading, error } = useEntityMutation<MotoristaCreatePayload, unknown>(
    criarMotorista,
    'Não foi possível cadastrar o motorista.',
  );
  const [fotoPath, setFotoPath] = useState<string | null>(null);
  const [cpf, setCpf] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => { setSuccess(null); setFotoPath(null); setCpf(''); };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    const turno = String(data.get('turno') ?? '');
    if (!turno) return;
    try {
      await mutate({
        nome: String(data.get('nome') ?? ''),
        cpf,
        telefone: String(data.get('telefone') ?? '') || undefined,
        data_nasc: String(data.get('data_nasc') ?? ''),
        senha: String(data.get('senha') ?? ''),
        turno: turno as Turno,
        cidade_trabalho: String(data.get('cidade_trabalho') ?? ''),
        residencia: String(data.get('residencia') ?? ''),
        foto: fotoPath ?? undefined,
      });
      setSuccess('Motorista cadastrado com sucesso.');
      event.currentTarget.reset();
      reset();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <FormCard
      title="Cadastro de Motoristas"
      onSubmit={handleSubmit}
      onReset={reset}
      submitting={loading}
      error={error}
      success={success}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nome Completo" name="nome" placeholder="Ex: Carlos Souza" required span={2} />
        <CpfField required value={cpf} onChange={setCpf} />
        <Field label="Telefone" name="telefone" type="tel" placeholder="(00) 00000-0000" />
        <Field label="Data de Nascimento" name="data_nasc" type="date" required />
        <Field label="Senha" name="senha" type="password" placeholder="••••••••" required />
        <SelectField label="Turno" name="turno" required options={TURNOS_COMPLETOS} />
        <Field label="Cidade de Trabalho" name="cidade_trabalho" placeholder="Ex: Campinas" required />
        <Field label="Residência" name="residencia" placeholder="Ex: Valinhos — Rua das Flores, 123" required span={2} />
        <div className="sm:col-span-2">
          <FileUpload
            label="Foto do Motorista"
            hint="Foto de perfil do motorista"
            bucket="fotos"
            folder="motoristas"
            accept="image/jpeg,image/png,image/webp"
            value={fotoPath}
            onChange={setFotoPath}
          />
        </div>
      </div>
    </FormCard>
  );
}

function FormClientes() {
  const { criar, loading, error } = useCriarCliente();
  const [fotoPath, setFotoPath] = useState<string | null>(null);
  const [cpf, setCpf] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => { setSuccess(null); setFotoPath(null); setCpf(''); };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    const payload: ClienteCreatePayload = {
      nome: String(data.get('nome') ?? ''),
      cpf,
      telefone: String(data.get('telefone') ?? '') || undefined,
      data_nasc: String(data.get('data_nasc') ?? ''),
      senha: String(data.get('senha') ?? ''),
      foto: fotoPath ?? undefined,
    };
    try {
      await criar(payload);
      setSuccess('Cliente cadastrado com sucesso.');
      event.currentTarget.reset();
      reset();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <FormCard
      title="Cadastro de Clientes"
      onSubmit={handleSubmit}
      onReset={reset}
      submitting={loading}
      error={error}
      success={success}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nome Completo" name="nome" placeholder="Ex: Maria Silva" required span={2} />
        <CpfField required value={cpf} onChange={setCpf} />
        <Field label="Telefone" name="telefone" type="tel" placeholder="(00) 00000-0000" />
        <Field label="Data de Nascimento" name="data_nasc" type="date" required />
        <Field label="Senha" name="senha" type="password" placeholder="••••••••" required span={2} />
        <div className="sm:col-span-2">
          <FileUpload
            label="Foto do Cliente"
            hint="Foto de perfil do cliente"
            bucket="fotos"
            folder="clientes"
            accept="image/jpeg,image/png,image/webp"
            value={fotoPath}
            onChange={setFotoPath}
          />
        </div>
      </div>
    </FormCard>
  );
}

function FormVinculos() {
  const { data: clientes } = useEntityList(listarClientes, 'Não foi possível carregar os clientes cadastrados.');
  const { data: destinos } = useEntityList(listarDestinos, 'Não foi possível carregar os destinos cadastrados.');
  const { data: rotas } = useEntityList(listarRotasInternas, 'Não foi possível carregar as rotas internas cadastradas.');

  const criarVinculoParaCliente = ({ clienteId, ...payload }: VinculoCreatePayload & { clienteId: number }) =>
    criarVinculo(clienteId, payload);

  const { mutate, loading, error } = useEntityMutation<VinculoCreatePayload & { clienteId: number }, unknown>(
    criarVinculoParaCliente,
    'Não foi possível cadastrar o vínculo.',
  );

  const [horariosFixos, setHorariosFixos] = useState<DiaSemana[]>([]);
  const [comprovantePath, setComprovantePath] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setHorariosFixos([]);
    setComprovantePath(null);
    setSuccess(null);
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    const clienteId = Number(data.get('cliente_id'));
    const tipo = String(data.get('tipo') ?? '');
    const turno = String(data.get('turno') ?? '');
    const destinoId = Number(data.get('destino_id'));
    const rotaInternaId = Number(data.get('rota_interna_id'));

    if (!clienteId || !tipo || !turno || !destinoId || !rotaInternaId || horariosFixos.length === 0) return;

    try {
      await mutate({
        clienteId,
        tipo: tipo as TipoVinculo,
        turno: turno as Turno,
        destino_id: destinoId,
        rota_interna_id: rotaInternaId,
        curso: String(data.get('curso') ?? '') || undefined,
        comprovante: comprovantePath ?? undefined,
        validade: String(data.get('validade') ?? ''),
        horarios_fixos: horariosFixos,
      });
      setSuccess('Vínculo cadastrado com sucesso.');
      event.currentTarget.reset();
      reset();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <FormCard
      title="Cadastro de Vínculos do Cliente"
      onSubmit={handleSubmit}
      onReset={reset}
      submitting={loading}
      error={error}
      success={success}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          label="Cliente"
          name="cliente_id"
          required
          options={clientes.map((c) => ({ value: String(c.id), label: `${c.nome} — CPF ${c.cpf}` }))}
          hint="Vínculo é uma entidade própria — um cliente pode ter múltiplos vínculos ao longo do tempo (histórico, renovações)"
          span={2}
        />
        <SelectField label="Tipo" name="tipo" required options={TIPOS_VINCULO} />
        <SelectField label="Turno" name="turno" required options={TURNOS_COMPLETOS} />
        <SelectField
          label="Destino"
          name="destino_id"
          required
          options={destinos.map((d) => ({ value: String(d.id), label: `${d.nome} — ${d.cidade}` }))}
        />
        <SelectField
          label="Rota Interna"
          name="rota_interna_id"
          required
          options={rotas.map((r) => ({ value: String(r.id), label: `Rota — ${r.cidade} (#${r.id})` }))}
        />
        <Field label="Curso" name="curso" placeholder="Ex: Engenharia de Computação" />
        <Field label="Validade do Vínculo" name="validade" type="date" required />
        <WeekdayPicker
          label="Horários Fixos (dias com transporte)"
          name="horarios_fixos"
          required
          value={horariosFixos}
          onChange={setHorariosFixos}
        />
        <div className="sm:col-span-2">
          <FileUpload
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
    </FormCard>
  );
}

function FormAdmins() {
  const { mutate, loading, error } = useEntityMutation<AdminCreatePayload, unknown>(
    criarAdmin,
    'Não foi possível cadastrar o administrador.',
  );
  const [success, setSuccess] = useState<string | null>(null);
  const [senhaMismatch, setSenhaMismatch] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    const senha = String(data.get('senha') ?? '');
    const confirmarSenha = String(data.get('confirmar_senha') ?? '');

    if (senha !== confirmarSenha) {
      setSenhaMismatch(true);
      return;
    }
    setSenhaMismatch(false);

    try {
      await mutate({
        email: String(data.get('email') ?? ''),
        senha,
        cidade: String(data.get('cidade') ?? '') || undefined,
      });
      setSuccess('Administrador cadastrado com sucesso.');
      event.currentTarget.reset();
    } catch {
      // erro já refletido em `error`
    }
  };

  return (
    <FormCard
      title="Cadastro de Administradores"
      onSubmit={handleSubmit}
      onReset={() => { setSuccess(null); setSenhaMismatch(false); }}
      submitting={loading}
      error={senhaMismatch ? 'As senhas informadas não coincidem.' : error}
      success={success}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="E-mail" name="email" type="email" placeholder="admin@bondrota.com" required span={2} />
        <Field label="Senha" name="senha" type="password" placeholder="••••••••" required />
        <Field label="Confirmar Senha" name="confirmar_senha" type="password" placeholder="••••••••" required />
        <Field label="Cidade" name="cidade" placeholder="Ex: São Paulo" span={2} />
        <div className="sm:col-span-2 rounded-xl p-3 text-xs text-amber-700" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          Administradores têm acesso completo ao sistema. Cadastre apenas usuários autorizados.
        </div>
      </div>
    </FormCard>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

const tabs = [
  { id: 'destinos', label: 'Destinos' },
  { id: 'paradas', label: 'Paradas' },
  { id: 'rotas', label: 'Rotas Internas' },
  { id: 'horarios', label: 'Horários por Turno' },
  { id: 'veiculos', label: 'Veículos' },
  { id: 'motoristas', label: 'Motoristas' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'vinculos', label: 'Vínculos do Cliente' },
  { id: 'admins', label: 'Administradores' },
];

export default function CadastrosPage() {
  const [active, setActive] = useState('destinos');

  const renderForm = () => {
    switch (active) {
      case 'destinos': return <FormDestinos />;
      case 'paradas': return <FormParadas />;
      case 'rotas': return <FormRotas />;
      case 'horarios': return <FormHorarios />;
      case 'veiculos': return <FormVeiculos />;
      case 'motoristas': return <FormMotoristas />;
      case 'clientes': return <FormClientes />;
      case 'vinculos': return <FormVinculos />;
      case 'admins': return <FormAdmins />;
      default: return null;
    }
  };

  return (
    <div className="min-h-full">
      <Header title="Central de Cadastros" subtitle="Gerencie todas as entidades do sistema" />
      <div className="p-4 sm:p-6">

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-x-auto">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
              style={
                active === id
                  ? { background: '#4A6FA5', color: '#ffffff' }
                  : { background: 'transparent', color: '#6B7280' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {renderForm()}
      </div>
    </div>
  );
}
