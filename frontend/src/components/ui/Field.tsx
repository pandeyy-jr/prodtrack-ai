import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

const controlClass =
  'mt-2 h-11 w-full rounded-none border border-white/[0.12] bg-[#171715] px-3 text-sm font-medium text-[#F0EEE8] outline-none transition placeholder:text-[#A6A29A]/55 focus:border-[#D99219]/70 focus:ring-2 focus:ring-[#D99219]/10';

interface FieldProps {
  label: string;
  icon?: ReactNode;
}

export const TextField = ({
  label,
  icon,
  className = '',
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) => (
  <label className="block">
    <span className="flex items-center gap-2 text-sm text-[#C2BEB5]">
      {icon}
      {label}
    </span>
    <input className={`${controlClass} ${className}`} {...props} />
  </label>
);

export const SelectField = ({
  label,
  icon,
  className = '',
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) => (
  <label className="block">
    <span className="flex items-center gap-2 text-sm text-[#C2BEB5]">
      {icon}
      {label}
    </span>
    <select className={`${controlClass} ${className}`} {...props}>
      {children}
    </select>
  </label>
);
