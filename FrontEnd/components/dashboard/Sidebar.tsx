'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Database,
  Navigation2,
  Bus,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/cadastros', label: 'Central de Cadastros', icon: Users, exact: false },
  { href: '/dashboard/dados', label: 'Visualização de Dados', icon: Database, exact: false },
  { href: '/dashboard/monitoramento', label: 'Monitoramento Live', icon: Navigation2, exact: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-64 flex flex-col z-30 select-none"
      style={{ background: 'linear-gradient(180deg, #1A2540 0%, #1E2B47 60%, #243355 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#4A6FA5' }}
        >
          <Bus size={20} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-[15px] leading-tight tracking-wide">BondRota</p>
          <p className="text-[11px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
            SGTU Admin
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p
          className="text-[10px] font-semibold tracking-widest uppercase px-3 mb-3"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Menu Principal
        </p>
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150"
              style={{
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.45)',
                background: isActive ? 'rgba(74,111,165,0.45)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)';
                }
              }}
            >
              <Icon size={17} className="shrink-0" />
              <span className="flex-1 leading-tight">{label}</span>
              {isActive && <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
            </Link>
          );
        })}
      </nav>

      {/* User profile + Logout */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: '#4A6FA5' }}
          >
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-[13px] font-semibold leading-tight truncate">Administrador</p>
            <p className="text-[11px] leading-tight truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
              admin@bondrota.com
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium transition-all duration-150"
          style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#f87171';
            (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
          }}
        >
          <LogOut size={14} />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}
