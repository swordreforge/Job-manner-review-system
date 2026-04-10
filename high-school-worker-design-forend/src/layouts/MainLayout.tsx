import { Outlet, useLocation } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { HomeOutlined, FileTextOutlined, UserOutlined, BulbOutlined, BankOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { key: 'home', title: '首页', icon: <HomeOutlined />, path: '/' },
    { key: 'plan', title: '规划', icon: <BulbOutlined />, path: '/plan' },
    { key: 'resume', title: '简历', icon: <FileTextOutlined />, path: '/resume' },
    { key: 'jobs', title: '岗位', icon: <BankOutlined />, path: '/jobs' },
    { key: 'profile', title: '我的', icon: <UserOutlined />, path: '/profile' },
  ];

  // 处理 /start 路由，显示为首页
  const isStartPage = location.pathname === '/start';

  // 根据当前路由计算应该高亮的标签
  const getActiveTab = () => {
    const pathname = location.pathname;
    
    // /start 也高亮首页
    if (pathname === '/start') return 'home';
    
    // 精确匹配
    const exactMatch = tabs.find(tab => tab.path === pathname);
    if (exactMatch) return exactMatch.key;
    
    // 特殊路由匹配
    if (pathname.startsWith('/holland')) return 'home';
    if (pathname.startsWith('/plan')) return 'plan';
    if (pathname.startsWith('/resume')) return 'resume';
    if (pathname.startsWith('/jobs')) return 'jobs';
    if (pathname.startsWith('/profile')) return 'profile';
    
    // 默认返回首页
    return 'home';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (key: string) => {
    const tab = tabs.find(t => t.key === key);
    if (tab) {
      // 首页跳转到 /start
      if (tab.key === 'home') {
        navigate('/start');
      } else {
        navigate(tab.path);
      }
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative z-10 pb-[60px]">
        <Outlet />
      </div>
      <TabBar
        activeKey={activeTab}
        onChange={handleTabChange}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20"
      >
        <TabBar.Item 
          key="home" 
          title={isStartPage ? "开始" : "首页"} 
          icon={<RocketOutlined />} 
        />
        {tabs.slice(1).map((tab) => (
          <TabBar.Item key={tab.key} title={tab.title} icon={tab.icon} />
        ))}
      </TabBar>
    </div>
  );
}