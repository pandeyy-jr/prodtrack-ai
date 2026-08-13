import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variants = {
  primary: 'bg-[#D99219] text-[#17130c] shadow-[0_10px_28px_rgba(217,146,25,0.16)] hover:bg-[#F0AE35]',
  secondary: 'bg-white/[0.035] text-[#ECE8DF] ring-1 ring-inset ring-white/[0.11] hover:border-[#D99219]/50 hover:bg-[#D99219]/10',
  ghost: 'text-[#A6A29A] hover:bg-white/[0.055] hover:text-[#F4F0E8]',
};

const Button = ({ children, className = '', variant = 'primary', ...props }: ButtonProps) => (
  <button
    className={`inline-flex h-11 items-center justify-center gap-2 rounded-none px-4 text-sm font-semibold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
