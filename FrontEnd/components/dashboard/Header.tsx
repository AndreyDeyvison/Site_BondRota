'use client';

import { Menu } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { openSidebar } = useSidebar();

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 border-b gap-3"
      style={{ background: '#ffffff', borderColor: '#E5E7EB' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={openSidebar}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors lg:hidden shrink-0"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h2 className="text-gray-800 font-semibold text-[15px] leading-tight truncate">{title}</h2>
          {subtitle && (
            <p className="text-gray-400 text-xs leading-tight mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer"
          style={{ background: '#4A6FA5' }}
        >
          A
        </div>
      </div>
    </header>
  );
}
