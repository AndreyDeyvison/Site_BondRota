'use client';

import Image from "next/image";

interface PrimaryButtonProps {
  label: string;
  onClick?: () => void;
  loading?: boolean;
}

export default function PrimaryButton({ label, onClick, loading }: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-bold text-[rgb(146,88,2)] text-lg tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-20"
      style={{
        background: loading ? '#B8890E' : 'linear-gradient(135deg, #D4A017 0%, #E8B820 100%)',
        boxShadow: '0 10px 15px rgba(212, 160, 23, 0.4)',
      }}
    >
      <span>{loading ? 'Entrando...' : label}</span>
      {!loading && <Image src="/images/icones/bus.png" alt="Ônibus" width={24} height={24}/>}
    </button>
  );
}
