import { Drawer, Tag, Button } from 'antd';
import { useAuthStore } from '../../stores';
import { useNavItems } from '../../hooks/useNavItems';
import type { NavItem, NavGroup } from '../../hooks/useNavItems';

interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
  onCommandOpen: () => void;
  isMobile: boolean;
  activePath: string;
  onNavClick: (path: string) => void;
}

function isActiveItem(activePath: string, item: NavItem): boolean {
  if (item.matchPaths) {
    for (const p of item.matchPaths) {
      if (activePath === p || (activePath.startsWith(p) && p !== '/')) {
        return true;
      }
    }
  }
  if (activePath === item.path || (activePath.startsWith(item.path) && item.path !== '/')) {
    return true;
  }
  return false;
}

function NavItemList({
  groups,
  activePath,
  onNavClick,
  onClose,
  isMobile,
}: {
  groups: NavGroup[];
  activePath: string;
  onNavClick: (path: string) => void;
  onClose: () => void;
  isMobile: boolean;
}) {
  return (
    <div style={{ padding: '0 16px' }}>
      {groups.map((group) => (
        <div key={group.title} style={{ marginBottom: '8px' }}>
          <div
            style={{
              padding: '8px 12px 4px',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            {group.title}
          </div>
          {group.items.map((item) => {
            const active = isActiveItem(activePath, item);
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavClick(item.path);
                  if (isMobile) onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--md-sys-shape-corner-small)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  backgroundColor: active
                    ? 'var(--md-sys-color-secondary-container)'
                    : 'transparent',
                  color: active
                    ? 'var(--md-sys-color-on-secondary-container)'
                    : 'var(--md-sys-color-on-surface-variant)',
                  textAlign: 'left',
                  position: 'relative',
                }}
              >
                {active && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                    style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
                  />
                )}
                <span
                  className="material-symbols-rounded"
                  style={{
                    fontSize: '20px',
                    flexShrink: 0,
                    color: active
                      ? 'var(--md-sys-color-on-secondary-container)'
                      : 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: active ? 600 : 500,
                      lineHeight: '1.3',
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      lineHeight: '1.3',
                      marginTop: '2px',
                      opacity: 0.7,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function QuickActionChips({
  groups,
  activePath,
  onNavClick,
  onClose,
  isMobile,
}: {
  groups: NavGroup[];
  activePath: string;
  onNavClick: (path: string) => void;
  onClose: () => void;
  isMobile: boolean;
}) {
  const flatItems = groups.flatMap((g) => g.items).slice(0, 6);

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--md-sys-color-on-surface-variant)',
          marginBottom: '8px',
          padding: '0 12px',
        }}
      >
        快捷入口
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 4px' }}>
        {flatItems.map((item) => {
          const active = isActiveItem(activePath, item);
          return (
            <Tag
              key={item.key}
              onClick={() => {
                onNavClick(item.path);
                if (isMobile) onClose();
              }}
              style={{
                cursor: 'pointer',
                borderRadius: 'var(--md-sys-shape-corner-small)',
                padding: '4px 12px',
                margin: 0,
                backgroundColor: active
                  ? 'var(--md-sys-color-secondary-container)'
                  : 'var(--md-sys-color-surface-container-high)',
                color: active
                  ? 'var(--md-sys-color-on-secondary-container)'
                  : 'var(--md-sys-color-on-surface-variant)',
                border: 'none',
                fontSize: '13px',
              }}
            >
              {item.title}
            </Tag>
          );
        })}
      </div>
    </div>
  );
}

function DrawerContent(props: NavigationDrawerProps) {
  const { onClose, onCommandOpen, activePath, onNavClick, isMobile } = props;
  const { user, role } = useAuthStore();
  const navRole = role === 'teacher' ? 'teacher' : 'student';
  const { navGroups } = useNavItems(navRole);

  const username = user?.username || '用户';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--md-sys-color-surface-container)',
      }}
    >
      {/* Top section: user card */}
      <div style={{ padding: '20px 16px 16px' }}>
        <div
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--md-sys-color-on-surface)',
            marginBottom: '4px',
          }}
        >
          {username}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--md-sys-color-on-surface-variant)',
            marginBottom: '12px',
          }}
        >
          统一导航 · 快速操作 · 状态感知
        </div>
        <Button
          size="small"
          onClick={() => {
            onCommandOpen();
            if (isMobile) onClose();
          }}
          style={{
            borderRadius: 'var(--md-sys-shape-corner-small)',
            backgroundColor: 'var(--md-sys-color-primary-container)',
            border: 'none',
            color: 'var(--md-sys-color-on-primary-container)',
            fontSize: '13px',
          }}
        >
          打开命令面板
        </Button>
      </div>

      {/* Separator */}
      <div
        style={{
          height: '1px',
          backgroundColor: 'var(--md-sys-color-outline-variant)',
          margin: '0 16px',
        }}
      />

      {/* Middle section: grouped navigation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        <NavItemList
          groups={navGroups}
          activePath={activePath}
          onNavClick={onNavClick}
          onClose={onClose}
          isMobile={isMobile}
        />
      </div>

      {/* Separator */}
      <div
        style={{
          height: '1px',
          backgroundColor: 'var(--md-sys-color-outline-variant)',
          margin: '0 16px',
        }}
      />

      {/* Bottom section: quick action chips */}
      <div style={{ padding: '16px 0 8px' }}>
        <QuickActionChips
          groups={navGroups}
          activePath={activePath}
          onNavClick={onNavClick}
          onClose={onClose}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}

export default function NavigationDrawer(props: NavigationDrawerProps) {
  const { open, onClose, isMobile } = props;

  if (isMobile) {
    return (
      <Drawer
        title={null}
        placement="left"
        closable={false}
        onClose={onClose}
        open={open}
        width={288}
        styles={{
          body: { padding: 0 },
        }}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          boxShadow: 'var(--md-sys-elevation-2)',
        }}
      >
        <DrawerContent {...props} />
      </Drawer>
    );
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '320px',
        zIndex: 40,
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderRight: '1px solid var(--md-sys-color-outline-variant)',
        boxShadow: 'var(--md-sys-elevation-2)',
        transition: 'transform 0.2s ease',
      }}
    >
      <DrawerContent {...props} />
    </div>
  );
}
