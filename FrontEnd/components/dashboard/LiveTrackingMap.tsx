'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Motorista } from '@/types/motorista';
import type { MotoristaAtivo } from '@/types/rastreamento';

// Centro/zoom usados apenas enquanto não há nenhum motorista ativo transmitindo.
const CENTRO_PADRAO: [number, number] = [-9.787, -36.349];
const ZOOM_PADRAO = 13;

function apenasNumeros(valor: string): string {
  return valor.replace(/\D/g, '');
}

function formatarCpf(cpf: string): string {
  const digitos = apenasNumeros(cpf);
  if (digitos.length !== 11) return cpf;
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarHorario(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Pin em formato de ônibus na cor de marca (#4A6FA5) — evita depender dos ícones
// padrão do Leaflet, cujas URLs não resolvem corretamente quando empacotadas pelo Next.js.
const iconeMotorista = L.divIcon({
  className: '',
  html: `
    <div style="width: 30px; height: 38px; transform: translate(-15px, -36px);">
      <svg width="30" height="38" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.7 23.3 0 15 0z" fill="#4A6FA5"/>
        <circle cx="15" cy="14" r="9.5" fill="#ffffff"/>
        <rect x="9.5" y="10" width="11" height="8" rx="2" fill="#4A6FA5"/>
        <rect x="11" y="11.5" width="3" height="2.5" rx="0.6" fill="#ffffff"/>
        <rect x="16" y="11.5" width="3" height="2.5" rx="0.6" fill="#ffffff"/>
      </svg>
    </div>
  `,
  iconSize: [30, 38],
  iconAnchor: [15, 38],
  popupAnchor: [0, -36],
});

/** Recentraliza/enquadra o mapa para englobar os motoristas ativos sempre que o conjunto muda (alguém entra ou sai). */
function AjustarEnquadramento({ motoristasAtivos }: { motoristasAtivos: MotoristaAtivo[] }) {
  const map = useMap();

  // Só recalcula o enquadramento quando o conjunto de CPFs muda — não a cada
  // atualização de posição, para não "puxar" o mapa enquanto o usuário navega.
  const chaveConjunto = useMemo(
    () => motoristasAtivos.map((m) => m.cpf).sort().join('|'),
    [motoristasAtivos],
  );

  useEffect(() => {
    if (motoristasAtivos.length === 0) return;

    if (motoristasAtivos.length === 1) {
      const [unico] = motoristasAtivos;
      map.setView([unico.latitude, unico.longitude], Math.max(map.getZoom(), 15), { animate: true });
      return;
    }

    const bounds = L.latLngBounds(motoristasAtivos.map((m) => [m.latitude, m.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 16, animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveConjunto]);

  return null;
}

interface LiveTrackingMapProps {
  motoristasAtivos: MotoristaAtivo[];
  motoristas: Motorista[];
}

export default function LiveTrackingMap({ motoristasAtivos, motoristas }: LiveTrackingMapProps) {
  return (
    <MapContainer
      center={CENTRO_PADRAO}
      zoom={ZOOM_PADRAO}
      className="w-full h-full rounded-2xl"
      style={{ background: '#e8ede8' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <AjustarEnquadramento motoristasAtivos={motoristasAtivos} />

      {motoristasAtivos.map((motorista) => {
        const motoristaCadastrado = motoristas.find((m) => apenasNumeros(m.cpf) === motorista.cpf);
        const titulo = motoristaCadastrado?.nome ?? `CPF ${formatarCpf(motorista.cpf)}`;

        return (
          <Marker key={motorista.cpf} position={[motorista.latitude, motorista.longitude]} icon={iconeMotorista}>
            <Popup>
              <div style={{ fontSize: 12, lineHeight: 1.5, minWidth: 140 }}>
                <p style={{ fontWeight: 700, color: '#1E2B47', margin: 0 }}>{titulo}</p>
                {motoristaCadastrado && (
                  <p style={{ color: '#6b7280', margin: '2px 0 0' }}>CPF: {formatarCpf(motorista.cpf)}</p>
                )}
                <p style={{ color: '#6b7280', margin: '2px 0 0' }}>
                  Última atualização: {formatarHorario(motorista.timestamp)}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
