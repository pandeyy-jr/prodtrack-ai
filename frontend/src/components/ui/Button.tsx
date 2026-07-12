import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variants = {
  primary: 'bg-[#00E676] text-[#04100A] shadow-[0_10px_28px_rgba(0,230,118,0.16)] hover:bg-[#25F08D]',
  secondary: 'bg-white/[0.055] text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.09]',
  ghost: 'text-[#94A3B8] hover:bg-white/[0.055] hover:text-white',
};

const Button = ({ children, className = '', variant = 'primary', ...props }: ButtonProps) => (
  <button
    className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
