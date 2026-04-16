import { Outlet, useLocation } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { HomeOutlined, FileTextOutlined, UserOutlined, BulbOutlined, BankOutlined, ExclamationCircleOutlined, BookOutlined, QuestionCircleOutlined, CompassOutlined, ReadOutlined, MoonOutlined, SunOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import { useTaskStore, useThemeStore, useAuthStore } from '../stores';
import { useState, useEffect } from 'react';
import SidebarNav from '../components/SidebarNav';

interface DocLink {
  title: string;
  icon: React.ReactNode;
  path: string;
}

const docLinks: DocLink[] = [
  { title: '使用指南', icon: <BookOutlined />, path: '/doc?tab=guide&doc=welcome' },
  { title: '常见问题', icon: <QuestionCircleOutlined />, path: '/doc?tab=faq&doc=faq' },
  { title: '职业探索', icon: <CompassOutlined />, path: '/holland' },
  { title: '面试技巧', icon: <ReadOutlined />, path: '/interview' },
];

const DESKTOP_BREAKPOINT = 1024;

const GraduationCapIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 10L12 5L21 10L12 15L3 10Z" />
    <path d="M5 12V18C5 19.1046 8.13401 20 12 20C15.866 20 19 19.1046 19 18V12" />
    <path d="M5 18C5 19.1046 8.13401 20 12 20C15.866 20 19 19.1046 19 18" />
  </svg>
);

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasActiveTask, taskDescription, setActiveTask } = useTaskStore();
  const { theme, toggleTheme } = useThemeStore();
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const isStudentPage = location.pathname.startsWith('/student');
  const isTeacherPage = location.pathname.startsWith('/teacher');
  const shouldFixTabBar = !isStudentPage && !isTeacherPage && !isDesktop;

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const { role } = useAuthStore();
  
  const studentTabs = [
    { key: 'home', title: '首页', icon: <HomeOutlined />, path: '/' },
    { key: 'plan', title: '规划', icon: <BulbOutlined />, path: '/plan' },
    { key: 'resume', title: '简历', icon: <FileTextOutlined />, path: '/resume' },
    { key: 'messages', title: '消息', icon: <MessageOutlined />, path: '/messages' },
    { key: 'jobs', title: '岗位', icon: <BankOutlined />, path: '/jobs' },
    { key: 'profile', title: '我的', icon: <UserOutlined />, path: '/profile' },
  ];

  const teacherTabs = [
    { key: 'dashboard', title: '工作台', icon: <HomeOutlined />, path: '/teacher/index' },
    { key: 'students', title: '学生', icon: <UserOutlined />, path: '/teacher/students' },
    { key: 'invite', title: '邀请码', icon: <FileTextOutlined />, path: '/teacher/invite-codes' },
    { key: 'alerts', title: '预警', icon: <ExclamationCircleOutlined />, path: '/teacher/alerts' },
    { key: 'messages', title: '消息', icon: <MessageOutlined />, path: '/teacher/messages' },
    { key: 'profile', title: '我的', icon: <UserOutlined />, path: '/teacher/profile' },
  ];

  const tabs = role === 'teacher' ? teacherTabs : studentTabs;

  const getActiveTab = () => {
    const pathname = location.pathname;
    
    // Teacher routes
    if (pathname === '/teacher/index') return 'dashboard';
    if (pathname.startsWith('/teacher/students')) return 'students';
    if (pathname.startsWith('/teacher/invite')) return 'invite';
    if (pathname.startsWith('/teacher/alerts')) return 'alerts';
    if (pathname.startsWith('/teacher/messages')) return 'messages';
    if (pathname.startsWith('/teacher/profile')) return 'profile';
    
    // Student routes
    if (pathname === '/start') return 'home';
    
    const exactMatch = tabs.find(tab => tab.path === pathname);
    if (exactMatch) return exactMatch.key;
    
    if (pathname.startsWith('/holland')) return 'home';
    if (pathname.startsWith('/plan')) return 'plan';
    if (pathname.startsWith('/resume')) return 'resume';
    if (pathname.startsWith('/messages')) return 'messages';
    if (pathname.startsWith('/jobs')) return 'jobs';
    if (pathname.startsWith('/student')) return 'profile';
    if (pathname.startsWith('/settings')) return 'profile';
    if (pathname.startsWith('/profile')) return 'profile';
    
    return role === 'teacher' ? 'dashboard' : 'home';
  };

  const activeTab = getActiveTab();

  useEffect(() => {
    console.log('[MainLayout] Task state:', { hasActiveTask, taskDescription });
  }, [hasActiveTask, taskDescription]);

  const handleTabChange = (key: string) => {
    const tab = tabs.find(t => t.key === key);
    if (tab) {
      let targetPath = tab.path;
      if (tab.key === 'home') targetPath = '/start';
      if (tab.key === 'dashboard') targetPath = '/teacher/index';

      if (hasActiveTask) {
        setPendingNavigation(targetPath);
        setIsModalVisible(true);
      } else {
        navigate(targetPath);
      }
    }
  };

  const handleConfirmNavigation = () => {
    setIsModalVisible(false);
    setActiveTask(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setIsModalVisible(false);
    setPendingNavigation(null);
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const sidebarWidth = isSidebarCollapsed ? 64 : 220;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--md-sys-color-surface)' }}>
      <SidebarNav 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={handleToggleSidebar} 
      />

      <div 
        className="transition-all duration-300"
        style={isDesktop ? { marginLeft: `${sidebarWidth}px` } : undefined}
      >
        {isDesktop && (
          <div 
            className="flex items-center justify-between px-4 md:px-6 sticky top-0 z-20"
            style={{ 
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderBottom: '1px solid var(--md-sys-color-outline-variant)',
              height: '56px'
            }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="flex items-center justify-center rounded-full"
                style={{ 
                  background: 'linear-gradient(135deg, #0B57D0, #1E88E5)',
                  width: '36px',
                  height: '36px',
                  boxShadow: 'var(--md-sys-elevation-1)'
                }}
              >
                <GraduationCapIcon className="w-5 h-5 text-white" />
              </div>
              <span 
                className="font-medium text-base hidden sm:block"
                style={{ color: 'var(--md-sys-color-on-surface)' }}
              >
                职业规划助手
              </span>
            </div>
            <div className="flex items-center gap-1 md:gap-2 overflow-x-auto">
              {docLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: location.pathname + location.search === link.path ||
                    (location.pathname.startsWith(link.path.split('?')[0]) && link.path.includes('?'))
                      ? 'var(--md-sys-color-primary-container)'
                      : 'transparent',
                    color: location.pathname + location.search === link.path ||
                    (location.pathname.startsWith(link.path.split('?')[0]) && link.path.includes('?'))
                      ? 'var(--md-sys-color-on-primary-container)'
                      : 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.title}</span>
                </button>
              ))}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-9 h-9 rounded-full text-sm transition-all"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
                title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
              >
                {theme === 'dark' ? <SunOutlined className="text-base" /> : <MoonOutlined className="text-base" />}
              </button>
            </div>
          </div>
        )}

        <div className={`${shouldFixTabBar ? 'pb-[60px]' : ''}`}>
          <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <Outlet />
          </div>
        </div>
      </div>

      {!isDesktop && (
        <TabBar
          activeKey={activeTab}
          onChange={handleTabChange}
          className="fixed bottom-0 left-0 right-0 z-20"
          style={{ 
            backgroundColor: 'var(--md-sys-color-surface-container)',
            borderTop: '1px solid var(--md-sys-color-outline-variant)'
          }}
        >
          {tabs.map((tab) => (
            <TabBar.Item 
              key={tab.key} 
              title={tab.title} 
              icon={tab.icon}
              style={{
                color: activeTab === tab.key ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)'
              }}
            />
          ))}
        </TabBar>
      )}

      <Modal
        title={
          <div className="flex items-center gap-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            <ExclamationCircleOutlined style={{ color: 'var(--md-sys-color-warning)' }} />
            <span>确认切换页面</span>
          </div>
        }
        open={isModalVisible}
        onOk={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
        okText="确定切换"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        styles={{
          header: { backgroundColor: 'var(--md-sys-color-surface-container)' },
          body: { backgroundColor: 'var(--md-sys-color-surface-container)' },
          footer: { backgroundColor: 'var(--md-sys-color-surface-container)' }
        }}
      >
        <div className="py-2">
          <p className="text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            当前有任务正在执行中：<span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{taskDescription || '简历上传或解析'}</span>
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            切换页面可能会导致任务中断，是否确认要继续切换？
          </p>
        </div>
      </Modal>
    </div>
  );
}
