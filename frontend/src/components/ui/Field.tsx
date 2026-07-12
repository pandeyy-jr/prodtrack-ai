import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

const controlClass =
  'mt-2 h-11 w-full rounded-lg border border-white/[0.05] bg-[#0B1F1A] px-3 text-sm font-medium text-[#E8FDF5] outline-none transition placeholder:text-[#E8FDF5]/35 focus:border-[#00FFC6]/60 focus:ring-2 focus:ring-[#00FFC6]/10';

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
    <span className="flex items-center gap-2 text-sm text-[#E8FDF5]/55">
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
    <span className="flex items-center gap-2 text-sm text-[#E8FDF5]/55">
      {icon}
      {label}
    </span>
    <select className={`${controlClass} ${className}`} {...props}>
      {children}
    </select>
  </label>
);
