import { Card, Tabs, Form, Input, Button, message, Modal } from 'antd';
import { UserOutlined, LockOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores';
import { userApi } from '../../api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [form] = Form.useForm<{ username: string; email: string; phone: string }>();
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (user) {
        form.setFieldsValue({
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
        });
        return;
      }

      try {
        const res = await userApi.getInfo();
        if (res.code === 0 && res.data) {
          setUser(res.data);
          form.setFieldsValue({
            username: res.data.username || '',
            email: res.data.email || '',
            phone: res.data.phone || '',
          });
        }
      } catch {
        message.error('获取用户信息失败，请重新登录');
      }
    };

    void loadUser();
  }, [form, setUser, user]);

  const phoneRules = [
    {
      validator: (_: unknown, value: string) => {
        if (!value) return Promise.resolve();
        return /^1\d{10}$/.test(value)
          ? Promise.resolve()
          : Promise.reject(new Error('请输入有效的11位手机号'));
      },
    },
  ];

  const handleUpdateUserInfo = async (values: { username: string; phone: string }) => {
    setLoading(true);
    try {
      const response = await userApi.updateInfo({
        username: values.username?.trim(),
        phone: values.phone?.trim() || undefined,
      });
      if (response.code === 0) {
        message.success('用户信息更新成功');
        if (response.data) {
          setUser(response.data);
          form.setFieldsValue({
            username: response.data.username || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
          });
        } else if (user) {
          setUser({ ...user, username: values.username, phone: values.phone });
        }
      } else {
        message.error(response.msg || '更新失败');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { msg?: string } } };
      message.error(err.response?.data?.msg || '更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (values: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    setLoading(true);
    try {
      const response = await userApi.updatePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      if (response.code === 0) {
        message.success('密码修改成功，请重新登录');
        logout();
        navigate('/auth');
      } else {
        message.error(response.msg || '修改失败');
      }
    } catch {
      message.error('修改失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (values: { password: string }) => {
    setLoading(true);
    try {
      const response = await userApi.deleteAccount({ password: values.password });
      if (response.code === 0) {
        message.success('账号已注销');
        logout();
        navigate('/auth');
      } else {
        message.error(response.msg || '注销失败');
      }
    } catch {
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
            form={form}
            layout="vertical"
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
              rules={phoneRules}
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
          <Card title="修改密码">
            <Form layout="vertical" onFinish={handleUpdatePassword}>
              <Form.Item
                label="当前密码"
                name="oldPassword"
                rules={[
                  { required: true, message: '请输入当前密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password placeholder="请输入当前密码" />
              </Form.Item>
              <Form.Item
                label="新密码"
                name="newPassword"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>
              <Form.Item
                label="确认新密码"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请再次输入新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="请再次输入新密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
          <Card title="账号注销" className="border-red-200">
            <div className="text-gray-500 mb-4">
              注销账号将清除所有数据，此操作不可恢复，请谨慎操作。
            </div>
            <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteModalOpen(true)} loading={loading}>
              注销账号
            </Button>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen relative z-10 p-4">
      <div className="sticky top-0 z-30 mb-4 -mx-4 px-4 py-2 bg-white/90 backdrop-blur border-b border-gray-100 flex items-center gap-2">
        <Button onClick={() => navigate('/profile')}>&lt; 返回个人中心</Button>
        <h1 className="text-xl font-bold">设置</h1>
      </div>
      <Tabs items={userInfoItems} defaultActiveKey="user-info" />

      <Modal
        title="确认注销账号"
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        footer={null}
          destroyOnHidden
      >
        <Form layout="vertical" onFinish={handleDeleteAccount}>
          <Form.Item
            label="请输入当前密码确认"
            name="password"
            rules={[
              { required: true, message: '请输入当前密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="当前密码" />
          </Form.Item>
          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setDeleteModalOpen(false)}>取消</Button>
              <Button danger htmlType="submit" loading={loading}>确认注销</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}