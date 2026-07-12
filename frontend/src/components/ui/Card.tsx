import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'interactive' | 'minimal';
  hover?: boolean;
}

const variants = {
  default: 'bg-glass border border-glass backdrop-blur-glass shadow-glass',
  interactive: 'bg-glass border border-glass backdrop-blur-glass shadow-glass hover:bg-hover transition-all duration-250 hover:shadow-lift',
  minimal: 'bg-transparent border border-glass/50 backdrop-blur-[6px]',
};

const Card = ({ children, className = '', variant = 'default', hover = false }: CardProps) => {
  const variantClass = variants[variant];
  const hoverClass = hover && variant === 'default' ? 'hover:bg-hover transition-all duration-250 hover:shadow-lift hover:border-glass' : '';
  
  return (
    <section className={`rounded-lg ${variantClass} ${hoverClass} ${className}`}>
      {children}
    </section>
  );
};

export default Card;
