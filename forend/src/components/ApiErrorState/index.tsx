import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ApiErrorStateProps {
  error: string;
  title?: string;
  onRetry?: () => void;
}

export default function ApiErrorState({ error, title = '加载失败', onRetry }: ApiErrorStateProps) {
  return (
    <div
      className="my-4 p-4"
      style={{
        backgroundColor: 'var(--md-sys-color-error-container)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        border: '1px solid var(--md-sys-color-error)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <ExclamationCircleOutlined style={{ color: 'var(--md-sys-color-error)', fontSize: '1.25rem' }} />
        <span className="md-typescale-title-medium" style={{ color: 'var(--md-sys-color-on-error-container)' }}>
          {title}
        </span>
      </div>
      <p className="md-typescale-body-medium mb-3" style={{ color: 'var(--md-sys-color-on-error-container)', opacity: 0.85 }}>
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="md-typescale-label-large px-4 py-1.5 transition-colors"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--md-sys-color-error)',
            border: '1px solid var(--md-sys-color-error)',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--md-sys-color-error)';
            e.currentTarget.style.color = 'var(--md-sys-color-on-error)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--md-sys-color-error)';
          }}
        >
          重试
        </button>
      )}
    </div>
  );
}