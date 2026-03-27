import { Card, Avatar, Button, message } from 'antd';
import { UserOutlined, SettingOutlined, HistoryOutlined, LogoutOutlined, EditOutlined, BookOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../../stores';
import { userApi } from '../../api';

const menuItems = [
  { icon: <HistoryOutlined />, title: '历史记录', desc: '查看所有操作记录' },
  { icon: <SettingOutlined />, title: '设置', desc: '应用偏好设置' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();

  useEffect(() => {
    // 如果用户信息为空，重新获取
    if (!user) {
      const fetchUserInfo = async () => {
        try {
          const userInfo = await userApi.getInfo();
          if (userInfo && userInfo.data) {
            setUser(userInfo.data);
          }
        } catch (error) {
          console.error('Failed to fetch user info:', error);
        }
      };
      fetchUserInfo();
    }
  }, [user, setUser]);

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/auth');
  };

  const handleEditProfile = () => {
    // TODO: 实现编辑个人资料功能
    message.info('编辑功能开发中');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* 用户信息卡片 */}
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <Avatar size={64} icon={<UserOutlined />} className="bg-blue-500" />
          <div className="flex-1">
            <div className="font-medium text-lg">{user?.username || '未登录'}</div>
            <div className="text-gray-500 text-sm">{user?.email || '暂无邮箱'}</div>
            <div className="text-gray-400 text-xs mt-1">
              账户类型: {user?.role === 'admin' ? '管理员' : '用户'}
            </div>
          </div>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={handleEditProfile}
          >
            编辑
          </Button>
        </div>
      </Card>

      {/* 学生资料信息 */}
      <Card 
        title="个人资料"
        className="mb-4"
        extra={<BookOutlined />}
      >
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">用户名</span>
            <span className="font-medium">{user?.username || '-'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">邮箱</span>
            <span className="font-medium">{user?.email || '-'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">手机号</span>
            <span className="font-medium">{user?.phone || '未设置'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">注册时间</span>
            <span className="font-medium">
              {user?.createdAt ? formatDate(user.createdAt) : '-'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">账户状态</span>
            <span className="font-medium text-green-600">
              <TrophyOutlined className="mr-1" />
              正常
            </span>
          </div>
        </div>
      </Card>

      {/* 功能菜单 */}
      <Card>
        <div className="space-y-0">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50"
            >
              <Avatar size="small" icon={item.icon} className="bg-blue-500" />
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-gray-500 text-sm">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 退出登录按钮 */}
      <Button 
        block 
        className="mt-4" 
        danger 
        icon={<LogoutOutlined />}
        onClick={handleLogout}
      >
        退出登录
      </Button>
    </div>
  );
}