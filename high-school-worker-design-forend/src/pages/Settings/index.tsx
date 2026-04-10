import { Card, Tabs, Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../stores';
import { userApi } from '../../api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleUpdateUserInfo = async (values: { username: string; phone: string }) => {
    setLoading(true);
    try {
      const response = await userApi.updateInfo(values);
      if (response.code === 0) {
        message.success('用户信息更新成功');
        if (user) {
          setUser({ ...user, username: values.username, phone: values.phone });
        }
      } else {
        message.error(response.msg || '更新失败');
      }
    } catch {
      message.error('更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await userApi.updateEmail(values);
      if (response.code === 0) {
        message.success('邮箱修改成功');
      } else {
        message.error(response.msg || '修改失败');
      }
    } catch {
      message.error('修改失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const response = await userApi.deleteAccount();
      if (response.code === 0) {
        message.success('账号已注销');
        navigate('/auth');
      } else {
        message.error(response.msg || '注销失败');
      }
    } catch (error) {
      message.error('注销失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const userInfoItems = [
    {
      key: 'user-info',
      label: (
        <span>
          <UserOutlined className="mr-2" />
          用户信息
        </span>
      ),
      children: (
        <Card>
          <Form
            layout="vertical"
            initialValues={{
              username: user?.username || '',
              email: user?.email || '',
              phone: user?.phone || '',
            }}
            onFinish={handleUpdateUserInfo}
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item
              label="邮箱"
              name="email"
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              label="手机号"
              name="phone"
            >
              <Input placeholder="请输入手机号（选填）" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <LockOutlined className="mr-2" />
          账号安全
        </span>
      ),
      children: (
        <div className="space-y-4">
          <Card title="修改绑定邮箱">
            <Form layout="vertical" onFinish={handleUpdateEmail}>
              <Form.Item
                label="新邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入新邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入新邮箱" />
              </Form.Item>
              <Form.Item
                label="当前密码"
                name="password"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password placeholder="请输入当前密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  修改邮箱
                </Button>
              </Form.Item>
            </Form>
          </Card>
          <Card title="账号注销" className="border-red-200">
            <div className="text-gray-500 mb-4">
              注销账号将清除所有数据，此操作不可恢复，请谨慎操作。
            </div>
            <Button danger icon={<DeleteOutlined />} onClick={handleDeleteAccount} loading={loading}>
              注销账号
            </Button>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen relative z-10 p-4">
      <div className="mb-4 flex items-center gap-2">
        <Button onClick={() => navigate('/profile')}>&lt; 返回</Button>
        <h1 className="text-xl font-bold">设置</h1>
      </div>
      <Tabs items={userInfoItems} defaultActiveKey="user-info" />
    </div>
  );
}