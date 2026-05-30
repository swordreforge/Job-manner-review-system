import { useNavigate } from 'react-router-dom';
import { Button, Tag, Tooltip, Modal, message } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useAuthStore, useThemeStore } from '../../stores';
import GraduationCapLogo from '../GraduationCapLogo';

interface TopAppBarProps {
  onMenuClick: () => void;
  onCommandOpen: () => void;
  isMobile: boolean;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
  sidebarOpen?: boolean;
}

export default function TopAppBar({ onMenuClick, onCommandOpen, isMobile, onToggleSidebar, showSidebarToggle, sidebarOpen }: TopAppBarProps) {
  const navigate = useNavigate();
  const { role, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    Modal.confirm({
      className: 'logout-confirm-modal-dark',
      rootClassName: 'logout-confirm-modal-dark-root',
      wrapClassName: 'logout-confirm-modal-dark-wrap',
      title: '确认退出',
      icon: <LogoutOutlined />,
      content: '确定要退出登录吗？',
      okText: '退出',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        logout();
        message.success('已退出登录');
        navigate('/welcome', { replace: true });
      },
    });
  };

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 sticky top-0 z-20"
      style={{
        backgroundColor: 'var(--md-sys-color-surface)',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        height: '56px',
      }}
    >
      <div className="flex items-center gap-2">
        {isMobile && (
          <Button
            type="text"
            icon={<span className="material-symbols-rounded" style={{ fontSize: 20 }}>menu</span>}
            onClick={onMenuClick}
            className="flex items-center justify-center w-9 h-9 rounded-full"
            style={{
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
            aria-label="打开导航菜单"
          />
        )}
        {showSidebarToggle && (
          <Tooltip title={sidebarOpen ? '收起侧边栏 (Ctrl+B)' : '展开侧边栏 (Ctrl+B)'}>
            <Button
              type="text"
              icon={<span className="material-symbols-rounded" style={{ fontSize: 20 }}>{sidebarOpen ? 'sidebar_left' : 'sidebar_left'}</span>}
              onClick={onToggleSidebar}
              className="flex items-center justify-center w-9 h-9 rounded-full"
              style={{
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
              aria-label={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
            />
          </Tooltip>
        )}
        <div className="flex items-center gap-2">
          <GraduationCapLogo className="w-8 h-8" />
          <span
            className="font-medium text-base hidden sm:block"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            职业规划助手
          </span>
        </div>
        <Tag
          style={{
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
            border: 'none',
            borderRadius: '16px',
            padding: '0 12px',
            height: '24px',
            lineHeight: '24px',
            fontSize: '12px',
          }}
        >
          {role === 'teacher' ? '教师' : '学生'}
        </Tag>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <Button
          type="text"
          onClick={onCommandOpen}
          className="flex items-center gap-2 rounded-full"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            color: 'var(--md-sys-color-on-surface-variant)',
            border: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>search</span>
          <span>快速导航</span>
          {!isMobile && (
            <kbd
              className="px-1.5 py-0.5 text-xs rounded"
              style={{
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface-variant)',
                border: '1px solid var(--md-sys-color-outline-variant)',
              }}
            >
              Ctrl+K
            </kbd>
          )}
        </Button>

        <Tooltip title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}>
          <Button
            type="text"
            icon={<span className="material-symbols-rounded" style={{ fontSize: 20 }}>{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>}
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-full"
            style={{
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          />
        </Tooltip>

        <Tooltip title="退出登录">
          <Button
            type="text"
            icon={<span className="material-symbols-rounded" style={{ fontSize: 20 }}>logout</span>}
            onClick={handleLogout}
            className="flex items-center justify-center w-9 h-9 rounded-full"
            style={{
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          />
        </Tooltip>
      </div>
    </header>
  );
}
