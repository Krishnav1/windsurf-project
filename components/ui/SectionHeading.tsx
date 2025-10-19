import { ReactNode } from 'react';
import { palette, typography } from '@/lib/design/tokens';

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <div className={`space-y-4 ${alignment} ${className}`} style={{ color: palette.neutral[900] }}>
      {eyebrow && (
        <p className={typography.headings.eyebrow} style={{ color: palette.primary.base }}>
          {eyebrow}
        </p>
      )}
      <h2 className={typography.headings.h2}>{title}</h2>
      {description && (
        <div className={`${typography.body.large} max-w-2xl`} style={{ color: palette.neutral[500] }}>
          {description}
        </div>
      )}
    </div>
  );
}
