import { ReactNode } from 'react';
import { layout } from '@/lib/design/tokens';

type CardProps = {
  children: ReactNode;
  variant?: 'default' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
};

const paddingMap: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
}: CardProps) {
  const base = variant === 'glass' ? layout.glass : layout.card;
  const paddingClass = paddingMap[padding];

  return <div className={`${base} ${paddingClass} ${className}`.trim()}>{children}</div>;
}
