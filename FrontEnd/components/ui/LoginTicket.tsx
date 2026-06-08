'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InputField from './InputField';
import PrimaryButton from './PrimaryButton';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/services/api';

export default function LoginTicket() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginAsAdmin } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await loginAsAdmin(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .login-ticket-float {
          animation: float 6s ease-in-out infinite;
        }

        /* A mágica do furo real: Criamos uma máscara que pinta o cartão inteiro,
          exceto duas esferas transparentes nas bordas laterais bem no meio (50%).
        */
        .ticket-cutout-mask {
          mask-image: 
            radial-gradient(circle at left center, transparent 14px, black 15px),
            radial-gradient(circle at right center, transparent 14px, black 15px);
          mask-composite: intersect;
          -webkit-mask-image: 
            radial-gradient(circle at left center, transparent 14px, black 15px),
            radial-gradient(circle at right center, transparent 14px, black 15px);
          -webkit-mask-composite: destination-in;
        }
      `}</style>

      <div className="login-ticket-float relative w-[38vw]">
        
        {/* Adicionada a classe 'ticket-cutout-mask' aqui.
          Agora o cartão possui furos físicos transparentes!
        */}
        <div
          className="ticket-cutout-mask rounded-2xl overflow-hidden flex flex-col"
          style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 4px 20px rgba(0,0,0,0.2)',
            minHeight: '48vh',
          }}
        >
          {/* Header */}
          <div
            className="relative flex flex-col items-center py-10 px-6"
            style={{ background: 'linear-gradient(160deg, #4A6FA5 0%, #3A5A90 100%)' }}
          >
            {/* Bus icon */}
            <div className="mb-4 mt-1">
              <Image
                  src="/images/icones/bigBus.png"
                  alt='Icone de Onibus'
                  width={48}
                  height={48}
              />
            </div>

            <h1 className="text-white font-bold text-2xl tracking-[0.12em] uppercase text-center leading-tight">
              Sistema BondRota
            </h1>
            <p className="text-white/60 text-sm tracking-[0.18em] uppercase mt-1">
              Tela de Login
            </p>
          </div>

          {/* Body */}
          <div
            className="flex flex-col flex-1 gap-10 px-15 py-10 justify-center"
            style={{ background: '#F2F3F5' }}
          >
            {/* Linha pontilhada alinhada perfeitamente com o centro do furo */}
            <div
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(180,180,180,0.4) 20%, rgba(180,180,180,0.4) 80%, transparent 100%)',
                height: '1px',
                borderTop: '2px dashed rgba(160,160,160,0.4)',
              }}
            />

            <InputField
              label="Seu E-mail"
              type="email"
              placeholder="email@empresa.com"
              value={email}
              onChange={setEmail}
              icon="email"
            />

            <InputField
              label="Sua Senha"
              type="password"
              placeholder="Senha"
              value={password}
              onChange={setPassword}
              icon="password"
            />

            {error && (
              <p className="-mt-6 text-sm font-medium text-red-500 text-center">{error}</p>
            )}

            <PrimaryButton
              label="Entrar Agora"
              onClick={handleLogin}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </>
  );
}