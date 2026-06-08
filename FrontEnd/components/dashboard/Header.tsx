'use client';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 border-b"
      style={{ background: '#ffffff', borderColor: '#E5E7EB' }}
    >
      <div>
        <h2 className="text-gray-800 font-semibold text-[15px] leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-gray-400 text-xs leading-tight mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
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
