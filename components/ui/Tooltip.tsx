import { ReactNode } from 'react';

const baseStyles = {
  trigger: 'relative inline-flex group cursor-help items-center gap-1 text-sm text-slate-500 hover:text-slate-600 transition-colors',
  bubble: 'pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max max-w-xs -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150',
};

type TooltipProps = {
  label: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function Tooltip({ label, icon, children, className = '' }: TooltipProps) {
  return (
    <span className={`${baseStyles.trigger} ${className}`}>
      {icon}
      {children}
      <span className={baseStyles.bubble}>{label}</span>
    </span>
  );
}
