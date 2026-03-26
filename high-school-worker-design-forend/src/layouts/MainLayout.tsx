import { Outlet } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { HomeOutlined, FileTextOutlined, UserOutlined, BulbOutlined } from '@ant-design/icons';
import { useUIStore } from '../stores';
import { useNavigate } from 'react-router-dom';

export default function MainLayout() {
  const { activeTab, setActiveTab } = useUIStore();
  const navigate = useNavigate();

  const tabs = [
    { key: 'home', title: '首页', icon: <HomeOutlined /> },
    { key: 'plan', title: '规划', icon: <BulbOutlined /> },
    { key: 'resume', title: '简历', icon: <FileTextOutlined /> },
    { key: 'profile', title: '我的', icon: <UserOutlined /> },
  ];

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    switch (key) {
      case 'home':
        navigate('/');
        break;
      case 'plan':
        navigate('/plan');
        break;
      case 'resume':
        navigate('/resume');
        break;
      case 'profile':
        navigate('/profile');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-[60px]">
        <Outlet />
      </div>
      <TabBar
        activeKey={activeTab}
        onChange={handleTabChange}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200"
      >
        {tabs.map((tab) => (
          <TabBar.Item key={tab.key} title={tab.title} icon={tab.icon} />
        ))}
      </TabBar>
    </div>
  );
}