import { useState, useEffect, useRef, useMemo } from 'react';
import { Modal, Input, Tag, type InputRef } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { NavItem } from '../../hooks/useNavItems';

export interface FlatNavItem extends NavItem {
  group: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  navItems: FlatNavItem[];
}

export default function CommandPalette({ open, onClose, onNavigate, navItems }: CommandPaletteProps) {
  const [keyword, setKeyword] = useState('');
  const inputRef = useRef<InputRef>(null);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return navItems;
    return navItems.filter(
      (item) =>
        item.title.toLowerCase().includes(kw) ||
        item.description.toLowerCase().includes(kw) ||
        item.group.toLowerCase().includes(kw),
    );
  }, [keyword, navItems]);

  const handleAfterOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setKeyword('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleSelect = (item: FlatNavItem) => {
    onNavigate(item.path);
    onClose();
  };

  const modalStyle: React.CSSProperties = {
    borderRadius: 'var(--md-sys-shape-corner-extra-large)',
    backgroundColor: 'var(--md-sys-color-surface-container)',
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--md-sys-color-surface-container-low)',
    borderColor: 'var(--md-sys-color-outline-variant)',
    borderRadius: 'var(--md-sys-shape-corner-medium)',
    color: 'var(--md-sys-color-on-surface)',
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
      closable={false}
      afterOpenChange={handleAfterOpenChange}
      styles={{
        body: {
          ...modalStyle,
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
        },
        mask: {
          backgroundColor: 'rgba(0,0,0,0.4)',
        },
      }}
    >
      <div style={{ padding: '16px 16px 8px' }}>
        <Input
          ref={inputRef}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="输入功能名称、分组或描述关键词..."
          prefix={<SearchOutlined style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />}
          size="large"
          variant="outlined"
          style={inputStyle}
          styles={{
            input: {
              color: 'var(--md-sys-color-on-surface)',
            },
            prefix: {
              marginRight: 8,
            },
          }}
        />
      </div>

      <div
        style={{
          maxHeight: 420,
          overflowY: 'auto',
          padding: '8px 16px 16px',
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 0',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            <SearchOutlined style={{ fontSize: 32, marginBottom: 12, display: 'block', opacity: 0.4 }} />
            <span>未找到匹配功能</span>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.key}
              onClick={() => handleSelect(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--md-sys-shape-corner-small)',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                marginBottom: 4,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  'var(--md-sys-color-surface-container-high)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  'var(--md-sys-color-primary-container)';
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  'var(--md-sys-color-surface-container-high)';
              }}
            >
              <span
                className="material-symbols-rounded"
                style={{
                  fontSize: 20,
                  color: 'var(--md-sys-color-on-surface-variant)',
                  flexShrink: 0,
                  width: 28,
                  textAlign: 'center',
                }}
              >
                {item.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: 'var(--md-sys-color-on-surface)',
                    fontWeight: 500,
                    fontSize: 14,
                    lineHeight: '20px',
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontSize: 12,
                    lineHeight: '16px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.description}
                </div>
              </div>
              <Tag
                style={{
                  margin: 0,
                  flexShrink: 0,
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-small)',
                  fontSize: 11,
                  lineHeight: '18px',
                  padding: '0 8px',
                }}
              >
                {item.group}
              </Tag>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
