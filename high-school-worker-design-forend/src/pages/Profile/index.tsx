import { Card, Avatar, Button } from 'antd';
import { UserOutlined, SettingOutlined, HistoryOutlined, LogoutOutlined } from '@ant-design/icons';

const menuItems = [
  { icon: <HistoryOutlined />, title: '历史记录', desc: '查看所有操作记录' },
  { icon: <SettingOutlined />, title: '设置', desc: '应用偏好设置' },
];

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <Avatar size={64} icon={<UserOutlined />} />
          <div>
            <div className="font-medium text-lg">用户</div>
            <div className="text-gray-500">student@example.com</div>
          </div>
        </div>
      </Card>

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

      <Button block className="mt-4" danger icon={<LogoutOutlined />}>
        退出登录
      </Button>
    </div>
  );
}