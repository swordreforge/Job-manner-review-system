import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, FileTextOutlined, UserOutlined, BulbOutlined, BankOutlined, LogoutOutlined, TeamOutlined, FileAddOutlined, AlertOutlined, MessageOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { Modal, message } from 'antd';
import { useAuthStore } from '../../stores';

interface SidebarNavProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  key: string;
  title: string;
  icon: React.ReactNode;
  path: string;
  matchPaths?: string[];
}

const studentNavItems: NavItem[] = [
  { key: 'home', title: '首页', icon: <HomeOutlined />, path: '/start', matchPaths: ['/start', '/'] },
  { key: 'plan', title: '职业规划', icon: <BulbOutlined />, path: '/plan', matchPaths: ['/plan', '/holland'] },
  { key: 'resume', title: '简历优化', icon: <FileTextOutlined />, path: '/resume', matchPaths: ['/resume'] },
  { key: 'messages', title: '消息中心', icon: <MessageOutlined />, path: '/messages', matchPaths: ['/messages'] },
  { key: 'jobs', title: '岗位搜索', icon: <BankOutlined />, path: '/jobs', matchPaths: ['/jobs'] },
  { key: 'profile', title: '个人中心', icon: <UserOutlined />, path: '/profile', matchPaths: ['/profile', '/settings', '/student'] },
];

const teacherNavItems: NavItem[] = [
  { key: 'dashboard', title: '工作台', icon: <HomeOutlined />, path: '/teacher/index', matchPaths: ['/teacher/index'] },
  { key: 'students', title: '学生管理', icon: <TeamOutlined />, path: '/teacher/students', matchPaths: ['/teacher/students'] },
  { key: 'invite', title: '邀请码', icon: <FileAddOutlined />, path: '/teacher/invite-codes', matchPaths: ['/teacher/invite-codes'] },
  { key: 'alerts', title: '预警管理', icon: <AlertOutlined />, path: '/teacher/alerts', matchPaths: ['/teacher/alerts'] },
  { key: 'messages', title: '消息中心', icon: <MessageOutlined />, path: '/teacher/messages', matchPaths: ['/teacher/messages'] },
  { key: 'profile', title: '个人中心', icon: <UserOutlined />, path: '/teacher/profile', matchPaths: ['/teacher/profile'] },
];

export default function SidebarNav({ isCollapsed }: SidebarNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, role } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = role === 'teacher' ? teacherNavItems : studentNavItems;

  const isActive = (item: NavItem) => {
    const pathname = location.pathname;
    if (item.matchPaths) {
      return item.matchPaths.some(p => pathname === p || (pathname.startsWith(p) && p !== '/'));
    }
    return pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  if (isMobile) {
    return null;
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col transition-all duration-300 ease-in-out z-30 ${
        isCollapsed ? 'w-16' : 'w-[220px]'
      }`}
      style={{ 
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderRight: '1px solid var(--md-sys-color-outline-variant)'
      }}
    >
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}
        style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">{role === 'teacher' ? '教' : '职'}</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold truncate" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {role === 'teacher' ? '教师工作台' : '职业规划助手'}
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.key}>
                <button
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                  style={{
                    backgroundColor: active ? 'var(--md-sys-color-primary-container)' : 'transparent',
                    color: active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                  }}
                  title={isCollapsed ? item.title : undefined}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full" style={{ backgroundColor: 'var(--md-sys-color-primary)' }} />
                  )}
                  <span className={`text-lg flex-shrink-0 ${active ? 'text-orange-500' : ''}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="font-medium truncate">{item.title}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {user && (
        <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', padding: '1rem' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserOutlined className="text-white text-lg" />
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {user?.username || '用户'}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {role === 'teacher' ? '教师' : '学生'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
        <button
          onClick={() => {
            const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
            Modal.confirm({
              className: 'logout-confirm-modal-dark',
              rootClassName: 'logout-confirm-modal-dark-root',
              wrapClassName: 'logout-confirm-modal-dark-wrap',
              style: {
                background: 'transparent',
                boxShadow: 'none',
                outline: 'none',
              },
              styles: {
                root: {
                  background: 'transparent',
                  boxShadow: 'none',
                  outline: 'none',
                },
                wrapper: {
                  background: 'transparent',
                  boxShadow: 'none',
                  outline: 'none',
                },
                container: {
                  background: 'transparent',
                  boxShadow: 'none',
                  outline: 'none',
                },
                ...(isDarkMode
                  ? {
                      body: {
                        background: '#111111',
                        color: '#ffffff',
                      },
                    }
                  : {}),
              },
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
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--md-sys-color-error)',
          }}
          title={isCollapsed ? '退出登录' : undefined}
        >
          <LogoutOutlined />
          {!isCollapsed && <span className="font-medium">退出登录</span>}
        </button>
      </div>
    </aside>
  );
}
