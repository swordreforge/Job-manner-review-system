import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, FileTextOutlined, UserOutlined, BulbOutlined, BankOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

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

const navItems: NavItem[] = [
  { key: 'home', title: '首页', icon: <HomeOutlined />, path: '/start', matchPaths: ['/start', '/'] },
  { key: 'plan', title: '职业规划', icon: <BulbOutlined />, path: '/plan', matchPaths: ['/plan', '/holland'] },
  { key: 'resume', title: '简历优化', icon: <FileTextOutlined />, path: '/resume', matchPaths: ['/resume'] },
  { key: 'jobs', title: '岗位搜索', icon: <BankOutlined />, path: '/jobs', matchPaths: ['/jobs'] },
  { key: 'profile', title: '个人中心', icon: <UserOutlined />, path: '/profile', matchPaths: ['/profile', '/settings', '/student'] },
];

export default function SidebarNav({ isCollapsed, onToggleCollapse }: SidebarNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isActive = (item: NavItem) => {
    const pathname = location.pathname;
    if (item.matchPaths) {
      return item.matchPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    }
    return pathname === item.path || pathname.startsWith(item.path + '/');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  if (isMobile) {
    return null;
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-30 ${
        isCollapsed ? 'w-16' : 'w-[220px]'
      }`}
    >
      <div className={`h-16 flex items-center border-b border-gray-100 ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">职</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-gray-800 truncate">职业规划助手</span>
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
                    active
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.title : undefined}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full" />
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

      <div className="border-t border-gray-100">
        <button
          onClick={() => navigate('/settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 ${
            isActive({ key: 'settings', title: '', icon: null, path: '/settings', matchPaths: ['/settings'] })
              ? 'bg-orange-50 text-orange-600'
              : ''
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? '设置' : undefined}
        >
          <SettingOutlined className="text-lg" />
          {!isCollapsed && <span className="font-medium">设置</span>}
        </button>
      </div>

      <div className={`border-t border-gray-100 p-3 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
          title={isCollapsed ? '展开菜单' : '收起菜单'}
        >
          {isCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          {!isCollapsed && <span className="text-sm">收起</span>}
        </button>
      </div>

      {!isCollapsed && (
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <UserOutlined className="text-white text-lg" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">用户</p>
              <p className="text-xs text-gray-400 truncate">user@example.com</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
