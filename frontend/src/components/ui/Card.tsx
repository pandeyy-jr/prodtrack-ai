import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'interactive' | 'minimal';
  hover?: boolean;
}

const variants = {
  default: 'bg-[#171715] border border-white/[0.10] shadow-[0_14px_36px_rgba(0,0,0,0.16)]',
  interactive: 'bg-[#171715] border border-white/[0.10] shadow-[0_14px_36px_rgba(0,0,0,0.16)] hover:border-[#D99219]/45 hover:bg-[#1C1B18] transition-all duration-250',
  minimal: 'bg-transparent border border-white/[0.10]',
};

const Card = ({ children, className = '', variant = 'default', hover = false }: CardProps) => {
  const variantClass = variants[variant];
  const hoverClass = hover && variant === 'default' ? 'hover:bg-hover transition-all duration-250 hover:shadow-lift hover:border-glass' : '';
  
  return (
    <section className={`rounded-none ${variantClass} ${hoverClass} ${className}`}>
      {children}
    </section>
  );
};

export default Card;
