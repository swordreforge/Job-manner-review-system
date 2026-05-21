interface SkeletonLoaderProps {
  type?: 'card' | 'card@2' | 'card@3' | 'text' | 'heading' | 'stat' | 'list';
  className?: string;
}

export default function SkeletonLoader({ type = 'card', className = '' }: SkeletonLoaderProps) {
  const pulseBase: React.CSSProperties = {
    backgroundColor: 'var(--md-sys-color-surface-container-high)',
    borderRadius: 'var(--md-sys-shape-corner-small)',
    animation: 'md-pulse 1.5s ease-in-out infinite',
  };

  const configs: Record<string, React.ReactNode> = {
    card: (
      <div style={{ ...pulseBase, height: '200px', borderRadius: 'var(--md-sys-shape-corner-medium)' }} />
    ),
    'card@2': (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div style={{ ...pulseBase, height: '200px', borderRadius: 'var(--md-sys-shape-corner-medium)' }} />
        <div style={{ ...pulseBase, height: '200px', borderRadius: 'var(--md-sys-shape-corner-medium)' }} />
      </div>
    ),
    'card@3': (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div style={{ ...pulseBase, height: '200px', borderRadius: 'var(--md-sys-shape-corner-medium)' }} />
        <div style={{ ...pulseBase, height: '200px', borderRadius: 'var(--md-sys-shape-corner-medium)' }} />
        <div style={{ ...pulseBase, height: '200px', borderRadius: 'var(--md-sys-shape-corner-medium)' }} />
      </div>
    ),
    text: (
      <div className="space-y-2">
        <div style={{ ...pulseBase, height: '1rem', width: '80%' }} />
        <div style={{ ...pulseBase, height: '1rem', width: '60%' }} />
      </div>
    ),
    heading: (
      <div style={{ ...pulseBase, height: '1.5rem', width: '40%', marginBottom: '0.5rem' }} />
    ),
    stat: (
      <div className="text-center p-5" style={{ ...pulseBase, borderRadius: 'var(--md-sys-shape-corner-medium)' }}>
        <div style={{ ...pulseBase, height: '1.75rem', width: '3rem', margin: '0.5rem auto' }} />
        <div style={{ ...pulseBase, height: '0.75rem', width: '4rem', margin: '0 auto' }} />
      </div>
    ),
    list: (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3" style={{
            padding: '0.75rem',
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderRadius: 'var(--md-sys-shape-corner-small)'
          }}>
            <div style={{ ...pulseBase, height: '2.5rem', width: '2.5rem', borderRadius: '50%' }} />
            <div className="flex-1 space-y-1">
              <div style={{ ...pulseBase, height: '0.875rem', width: '60%' }} />
              <div style={{ ...pulseBase, height: '0.75rem', width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <>
      <style>{`
        @keyframes md-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div className={className} role="status" aria-label="加载中">
        {configs[type] || configs.card}
      </div>
    </>
  );
}