import type { CSSProperties, ReactNode } from 'react';

type StatColor = 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'warning' | 'info';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  color?: StatColor;
  className?: string;
  style?: CSSProperties;
}

const tonalColors: Record<StatColor, { bg: string; on: string }> = {
  primary: { bg: 'var(--md-sys-color-primary-container)', on: 'var(--md-sys-color-on-primary-container)' },
  secondary: { bg: 'var(--md-sys-color-secondary-container)', on: 'var(--md-sys-color-on-secondary-container)' },
  tertiary: { bg: 'var(--md-sys-color-tertiary-container)', on: 'var(--md-sys-color-on-tertiary-container)' },
  error: { bg: 'var(--md-sys-color-error-container)', on: 'var(--md-sys-color-on-error-container)' },
  success: { bg: 'var(--md-sys-color-success, #E8F5E9)', on: 'var(--md-sys-color-on-surface)' },
  warning: { bg: 'var(--md-sys-color-warning, #FFF3E0)', on: 'var(--md-sys-color-on-surface)' },
  info: { bg: 'var(--md-sys-color-info, #E3F2FD)', on: 'var(--md-sys-color-on-surface)' },
};

export default function StatCard({ icon, value, label, color = 'primary', className = '', style }: StatCardProps) {
  const colors = tonalColors[color];

  return (
    <div
      className={`text-center ${className}`}
      style={{
        backgroundColor: colors.bg,
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        padding: '1.25rem 1rem',
        ...style,
      }}
    >
      <div className="flex justify-center mb-1" style={{ color: colors.on, fontSize: '1.75rem' }}>
        {icon}
      </div>
      <div className="md-typescale-headline-small" style={{ color: colors.on }}>
        {value}
      </div>
      <div className="md-typescale-label-small" style={{ color: colors.on, opacity: 0.8 }}>
        {label}
      </div>
    </div>
  );
}