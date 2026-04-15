import { Outlet, useLocation } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { HomeOutlined, FileTextOutlined, UserOutlined, BulbOutlined, BankOutlined, ExclamationCircleOutlined, BookOutlined, QuestionCircleOutlined, CompassOutlined, ReadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import { useTaskStore } from '../stores';
import { useState, useEffect } from 'react';
import SidebarNav from '../components/SidebarNav';

interface DocLink {
  title: string;
  icon: React.ReactNode;
  path: string;
}

const docLinks: DocLink[] = [
  { title: '使用指南', icon: <BookOutlined />, path: '/doc?tab=guide' },
  { title: '常见问题', icon: <QuestionCircleOutlined />, path: '/doc?tab=faq' },
  { title: '职业探索', icon: <CompassOutlined />, path: '/holland' },
  { title: '面试技巧', icon: <ReadOutlined />, path: '/interview' },
];

const DESKTOP_BREAKPOINT = 1024;

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasActiveTask, taskDescription, setActiveTask } = useTaskStore();
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const isStudentPage = location.pathname.startsWith('/student');
  const shouldFixTabBar = !isStudentPage && !isDesktop;

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const tabs = [
    { key: 'home', title: '首页', icon: <HomeOutlined />, path: '/' },
    { key: 'plan', title: '规划', icon: <BulbOutlined />, path: '/plan' },
    { key: 'resume', title: '简历', icon: <FileTextOutlined />, path: '/resume' },
    { key: 'jobs', title: '岗位', icon: <BankOutlined />, path: '/jobs' },
    { key: 'profile', title: '我的', icon: <UserOutlined />, path: '/profile' },
  ];

  const getActiveTab = () => {
    const pathname = location.pathname;
    
    if (pathname === '/start') return 'home';
    
    const exactMatch = tabs.find(tab => tab.path === pathname);
    if (exactMatch) return exactMatch.key;
    
    if (pathname.startsWith('/holland')) return 'home';
    if (pathname.startsWith('/plan')) return 'plan';
    if (pathname.startsWith('/resume')) return 'resume';
    if (pathname.startsWith('/jobs')) return 'jobs';
    if (pathname.startsWith('/student')) return 'profile';
    if (pathname.startsWith('/settings')) return 'profile';
    if (pathname.startsWith('/profile')) return 'profile';
    
    return 'home';
  };

  const activeTab = getActiveTab();

  useEffect(() => {
    console.log('[MainLayout] Task state:', { hasActiveTask, taskDescription });
  }, [hasActiveTask, taskDescription]);

  const handleTabChange = (key: string) => {
    const tab = tabs.find(t => t.key === key);
    if (tab) {
      const targetPath = tab.key === 'home' ? '/start' : tab.path;

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
    <div className="min-h-screen bg-gray-50">
      <SidebarNav 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={handleToggleSidebar} 
      />

      <div 
        className={`transition-all duration-300 ${
          isDesktop ? `ml-[${sidebarWidth}px]` : ''
        }`}
        style={isDesktop ? { marginLeft: `${sidebarWidth}px` } : undefined}
      >
        {isDesktop && (
          <div className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-2 sticky top-0 z-20">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>快速跳转</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {docLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    location.pathname + location.search === link.path ||
                    location.pathname.startsWith(link.path.split('?')[0]) && link.path.includes('?')
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {link.icon}
                  <span>{link.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`${shouldFixTabBar ? 'pb-[60px]' : ''}`}>
          <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </div>
      </div>

      {!isDesktop && (
        <TabBar
          activeKey={activeTab}
          onChange={handleTabChange}
          className={`${shouldFixTabBar ? 'fixed bottom-0 left-0 right-0' : 'sticky bottom-0'} bg-white border-t border-gray-200 z-20`}
        >
          <TabBar.Item
            key="home"
            title="首页"
            icon={<HomeOutlined />}
          />
          {tabs.slice(1).map((tab) => (
            <TabBar.Item key={tab.key} title={tab.title} icon={tab.icon} />
          ))}
        </TabBar>
      )}

      <Modal
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined className="text-yellow-500" />
            <span>确认切换页面</span>
          </div>
        }
        open={isModalVisible}
        onOk={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
        okText="确定切换"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div className="py-2">
          <p className="text-base text-gray-700">
            当前有任务正在执行中：<span className="font-semibold text-gray-900">{taskDescription || '简历上传或解析'}</span>
          </p>
          <p className="mt-2 text-sm text-gray-600">
            切换页面可能会导致任务中断，是否确认要继续切换？
          </p>
        </div>
      </Modal>
    </div>
  );
}
