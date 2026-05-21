import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

type SurfaceVariant = 'elevated' | 'filled' | 'outlined';

interface SurfaceCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: SurfaceVariant;
  title?: ReactNode;
  titleIcon?: ReactNode;
  action?: ReactNode;
  padding?: boolean;
  children: ReactNode;
}

const variantStyles: Record<SurfaceVariant, CSSProperties> = {
  elevated: {
    backgroundColor: 'var(--md-sys-color-surface-container-low)',
    borderRadius: 'var(--md-sys-shape-corner-large)',
    boxShadow: 'var(--md-sys-elevation-1)',
    border: '1px solid var(--md-sys-color-outline-variant)',
  },
  filled: {
    backgroundColor: 'var(--md-sys-color-surface-container)',
    borderRadius: 'var(--md-sys-shape-corner-large)',
    boxShadow: 'var(--md-sys-elevation-0)',
    border: 'none',
  },
  outlined: {
    backgroundColor: 'var(--md-sys-color-surface)',
    borderRadius: 'var(--md-sys-shape-corner-large)',
    boxShadow: 'var(--md-sys-elevation-0)',
    border: '1px solid var(--md-sys-color-outline-variant)',
  },
};

export default function SurfaceCard({
  variant = 'elevated',
  title,
  titleIcon,
  action,
  padding = true,
  children,
  className = '',
  style,
  ...rest
}: SurfaceCardProps) {
  const hasHeader = title || action;

  return (
    <div
      className={className}
      style={{ ...variantStyles[variant], overflow: 'hidden', ...style }}
      {...rest}
    >
      {hasHeader && (
        <div
          className="flex items-center justify-between px-4 py-3 font-medium"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center gap-2">
            {titleIcon && (
              <span style={{ color: 'var(--md-sys-color-primary)' }} className="text-lg">
                {titleIcon}
              </span>
            )}
            <span className="md-typescale-title-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {title}
            </span>
          </div>
          {action}
        </div>
      )}
      <div className={padding ? 'p-4' : ''}>{children}</div>
    </div>
  );
}