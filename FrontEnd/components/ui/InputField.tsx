'use client';

interface InputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: 'email' | 'password';
}

const EmailIcon = () => (
  <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="16" height="12" rx="2" stroke="#9CA3AF" strokeWidth="1.5" />
    <path d="M1 3L9 8L17 3" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="12" height="9" rx="2" stroke="#9CA3AF" strokeWidth="1.5" />
    <path d="M4 8V5.5C4 3.567 5.567 2 7.5 2H8.5C10.433 2 12 3.567 12 5.5V8" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="13" r="1.5" fill="#9CA3AF" />
  </svg>
);

export default function InputField({ label, type, placeholder, value, onChange, icon }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-500 tracking-wider uppercase">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3 flex items-center justify-center">
          {icon === 'email' ? <EmailIcon /> : <LockIcon />}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 placeholder-gray-400 text-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-200"
        />
      </div>
    </div>
  );
}
