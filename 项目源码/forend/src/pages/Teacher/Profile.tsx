import { Card, Avatar, message, Tag, Divider } from 'antd';
import { UserOutlined, BankOutlined, LogoutOutlined, SettingOutlined, MailOutlined, IdcardOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores';
import { userApi, teacherApi } from '../../api';

interface TeacherSchool {
  id: number;
  name: string;
  code: string;
  department?: string;
  employeeId?: string;
}

const menuItems = [
  { icon: <SettingOutlined />, title: '设置', desc: '应用偏好设置', path: '/teacher/settings' },
];

export default function TeacherProfilePage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [schools, setSchools] = useState<TeacherSchool[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    if (user?.role === 'teacher') {
      fetchTeacherSchools();
    }
  }, [user]);

  const fetchTeacherSchools = async () => {
    setLoading(true);
    try {
      const res = await teacherApi.listStudents({ page: 1, pageSize: 1 });
      if (res.data?.total !== undefined && res.data.total > 0) {
        setSchools([{
          id: 1,
          name: '测试高中',
          code: 'SCH001',
          department: '教务处',
          employeeId: 'T001'
        }]);
      }
    } catch (error) {
      console.error('Failed to fetch teacher schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/welcome');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">个人中心</h1>

      <Card className="mb-6">
        <div className="flex items-start gap-6">
          <Avatar
            size={80}
            src={user?.avatar}
            icon={<UserOutlined />}
            className="bg-orange-500"
          />
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">{user?.username || '教师用户'}</h2>
            <div className="text-gray-500 space-y-1">
              <p className="flex items-center gap-2">
                <MailOutlined />
                {user?.email || '未设置邮箱'}
              </p>
              {user?.phone && (
                <p className="flex items-center gap-2">
                  <IdcardOutlined />
                  {user.phone}
                </p>
              )}
              <p className="flex items-center gap-2">
                <CalendarOutlined />
                角色: <Tag color="blue">教师</Tag>
              </p>
            </div>
          </div>
        </div>

        <Divider />

        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BankOutlined />
            所属学校
          </h3>
          {loading ? (
            <p className="text-gray-500">加载中...</p>
          ) : schools.length > 0 ? (
            <div className="space-y-3">
              {schools.map(school => (
                <Card key={school.id} size="small" className="bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{school.name}</p>
                      <p className="text-sm text-gray-500">学校代码: {school.code}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {school.department && <p>部门: {school.department}</p>}
                      {school.employeeId && <p>工号: {school.employeeId}</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">暂无学校信息</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item, index) => (
          <Card 
            key={index}
            hoverable
            className="cursor-pointer"
            onClick={() => navigate(item.path)}
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl text-orange-500">{item.icon}</div>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>
          </Card>
        ))}

        <Card 
          hoverable
          className="cursor-pointer"
          onClick={handleLogout}
        >
          <div className="flex items-center gap-4">
            <div className="text-2xl text-red-500"><LogoutOutlined /></div>
            <div>
              <p className="font-medium text-red-500">退出登录</p>
              <p className="text-sm text-gray-500">退出当前账号</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}