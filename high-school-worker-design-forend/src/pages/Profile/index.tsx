import { Card, Avatar, Button, message, Tag } from 'antd';
import { UserOutlined, SettingOutlined, HistoryOutlined, LogoutOutlined, EditOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores';
import { userApi, studentApi } from '../../api';
import type { Student } from '../../types';

const menuItems = [
  { icon: <HistoryOutlined />, title: '历史记录', desc: '查看所有操作记录' },
  { icon: <SettingOutlined />, title: '设置', desc: '应用偏好设置' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

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

  useEffect(() => {
    // 获取学生资料
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoadingStudent(true);
    try {
      const response = await studentApi.getMe();
      if (response.code === 0 && response.data) {
        setStudentData(response.data);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setStudentData(null);
      } else {
        console.error('Failed to fetch student data:', error);
      }
    } finally {
      setLoadingStudent(false);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/auth');
  };

  const handleEditStudent = () => {
    navigate('/student');
  };

  const calculateCompleteness = (student: Student | null): number => {
    if (!student) return 0;
    let score = 0;
    const totalFields = 7;
    
    if (student.name) score++;
    if (student.education) score++;
    if (student.major) score++;
    if (student.graduationYear) score++;
    if (student.skills && student.skills.length > 0) score++;
    if (student.certificates && student.certificates.length > 0) score++;
    if (student.internship && student.internship.length > 0) score++;
    
    return Math.round((score / totalFields) * 100);
  };

  return (
    <div className="min-h-screen relative z-10 p-4">
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
            onClick={handleEditStudent}
          >
            编辑学生资料
          </Button>
        </div>
        {/* 学生资料状态 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {studentData ? (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  已创建学生资料
                </Tag>
              ) : (
                <Tag icon={<ExclamationCircleOutlined />} color="warning">
                  未创建学生资料
                </Tag>
              )}
              {studentData && (
                <span className="text-sm text-gray-500">
                  完成度: {calculateCompleteness(studentData)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 学生资料信息 */}
      <Card 
        title="学生资料"
        className="mb-4"
        extra={
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={handleEditStudent}
          >
            {studentData ? '编辑' : '创建'}
          </Button>
        }
      >
        {loadingStudent ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : studentData ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">姓名</span>
              <span className="font-medium">{studentData.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">学历</span>
              <span className="font-medium">
                {studentData.education === 'bachelor' ? '本科' :
                 studentData.education === 'master' ? '硕士' :
                 studentData.education === 'phd' ? '博士' :
                 studentData.education === 'high_school' ? '高中' :
                 studentData.education || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">专业</span>
              <span className="font-medium">{studentData.major || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">毕业年份</span>
              <span className="font-medium">{studentData.graduationYear || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">技能</span>
              <div className="flex flex-wrap gap-1">
                {studentData.skills && studentData.skills.length > 0 ? (
                  studentData.skills.map((skill: any, index: number) => (
                    <Tag key={index} color="blue">{skill.name}</Tag>
                  ))
                ) : (
                  <span className="text-gray-400">暂无</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">证书</span>
              <div className="flex flex-wrap gap-1">
                {studentData.certificates && studentData.certificates.length > 0 ? (
                  studentData.certificates.map((cert: any, index: number) => (
                    <Tag key={index} color="green">{cert.name}</Tag>
                  ))
                ) : (
                  <span className="text-gray-400">暂无</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">实习经历</span>
              <span className="font-medium">{studentData.internship?.length || 0} 条</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">项目经验</span>
              <span className="font-medium">{studentData.projects?.length || 0} 条</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <ExclamationCircleOutlined className="text-4xl text-yellow-500 mb-2" />
            <div className="text-gray-500 mb-4">您还没有创建学生资料</div>
            <Button type="primary" onClick={handleEditStudent}>
              立即创建
            </Button>
          </div>
        )}
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