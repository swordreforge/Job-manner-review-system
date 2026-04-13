import { useState, useCallback } from 'react';
import { Form, Input, Button, Card, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, CheckCircleFilled, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '../../api';
import { useAuthStore } from '../../stores';
import LaserGradient from '../../components/LaserGradient';
import LaserRay from '../../components/LaserRay';
import './Auth.css';

interface PasswordStrengthResult {
  score: number;
  label: string;
}

const getPasswordStrength = (password: string): PasswordStrengthResult => {
  let score = 0;
  
  if (!password) return { score: 0, label: '' };
  
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  const labels = ['', '弱', '中', '强'];
  return { score, label: labels[Math.min(score, 3)] || '强' };
};

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [tabKey, setTabKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await userApi.login(values);
      if (result.token) {
        setLoginSuccess(true);
        setToken(result.token);
        message.success('登录成功');

        try {
          const userInfo = await userApi.getInfo();
          if (userInfo && userInfo.data) {
            setUser(userInfo.data);
          }
        } catch (error) {
          console.error('Failed to get user info:', error);
        }

        setTimeout(() => {
          navigate('/start');
        }, 800);
      } else {
        message.error('登录失败');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const err = error as { response?: { data?: { msg?: string } }; message?: string };
      const errorMsg = err.response?.data?.msg || err.message || '登录失败，请检查网络连接';
      message.error(errorMsg);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleRegister = async (values: { username: string; password: string; email: string; phone?: string }) => {
    setLoading(true);
    try {
      const result = await userApi.register(values);
      if (result.code === 0 && result.data) {
        message.success('注册成功，请登录');
        setActiveTab('login');
        registerForm.resetFields();
      } else {
        message.error(result.msg || '注册失败');
      }
    } catch (error: unknown) {
      console.error('Register error:', error);
      const err = error as { response?: { data?: { msg?: string } }; message?: string };
      const errorMsg = err.response?.data?.msg || err.message || '注册失败，请检查网络连接';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = useCallback((key: string) => {
    setTabKey((prev) => prev + 1);
    setActiveTab(key);
    loginForm.resetFields();
    registerForm.resetFields();
    setPassword('');
  }, [loginForm, registerForm]);

  const passwordStrength = getPasswordStrength(password);

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <AnimatePresence mode="wait">
          <motion.div
            key={`login-${tabKey}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="tab-content-wrapper"
          >
            <Form
              form={loginForm}
              onFinish={handleLogin}
              layout="vertical"
              className="auth-form"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <Form.Item
                  name="username"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, message: '用户名至少3个字符' }
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名"
                    size="large"
                    className="auth-input"
                    autoComplete="username"
                  />
                </Form.Item>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少6个字符' }
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                    size="large"
                    className="auth-input"
                    autoComplete="current-password"
                  />
                </Form.Item>
              </motion.div>

              <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                          >
                            <Form.Item style={{ marginBottom: 0, marginTop: '1.5rem' }}>
                              <AnimatePresence mode="wait">
                                {loginSuccess ? (
                                  <motion.div
                                    key="success"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    transition={{ duration: 0.3, type: 'spring' }}
                                  >
                                    <Button
                                      type="primary"
                                      block
                                      size="large"
                                      className="auth-button auth-button-success"
                                      icon={
                                        <motion.div
                                          initial={{ scale: 0, rotate: -90 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          transition={{ delay: 0.1, duration: 0.4, type: 'spring' }}
                                        >
                                          <CheckCircleFilled />
                                        </motion.div>
                                      }
                                    >
                                      <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.15, duration: 0.3 }}
                                      >
                                        登录成功
                                      </motion.span>
                                    </Button>
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="login"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Button
                                      type="primary"
                                      htmlType="submit"
                                      loading={loading}
                                      block
                                      size="large"
                                      className="auth-button"
                                    >
                                      登录
                                    </Button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </Form.Item>
              
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.35, duration: 0.3 }}
                              className="text-center text-gray-500 text-sm"
                              style={{ marginTop: '1.25rem' }}
                            >
                              还没有账户？<a className="auth-link" onClick={() => handleTabChange('register')}>立即注册</a>
                            </motion.div>
                          </motion.div>            </Form>
          </motion.div>
        </AnimatePresence>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <AnimatePresence mode="wait">
          <motion.div
            key={`register-${tabKey}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="tab-content-wrapper"
          >
            <Form
              form={registerForm}
              onFinish={handleRegister}
              layout="vertical"
              className="auth-form"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <Form.Item
                  name="username"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, message: '用户名至少3个字符' },
                    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名"
                    size="large"
                    className="auth-input"
                    autoComplete="username"
                  />
                </Form.Item>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="邮箱"
                    size="large"
                    className="auth-input"
                    autoComplete="email"
                  />
                </Form.Item>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少6个字符' }
                  ]}
                  validateTrigger="onBlur"
                  style={{ marginBottom: password ? '0.5rem' : undefined }}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                    size="large"
                    className="auth-input"
                    autoComplete="new-password"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Item>

                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                    className="password-strength"
                  >
                    <div className="password-strength-bar">
                      <div
                        className={`password-strength-fill ${
                          passwordStrength.score <= 1
                            ? 'password-strength-weak'
                            : passwordStrength.score === 2
                            ? 'password-strength-medium'
                            : 'password-strength-strong'
                        }`}
                      />
                    </div>
                    <div className="password-strength-text">
                      <span className={`password-strength-label password-strength-${
                        passwordStrength.score <= 1
                          ? 'weak'
                          : passwordStrength.score === 2
                          ? 'medium'
                          : 'strong'
                      }`}>
                        密码强度：{passwordStrength.label}
                      </span>
                      <span style={{ color: '#94a3b8' }}>
                        {password.length < 6 ? `${6 - password.length}字符可继续` : ''}
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                <Form.Item
                  name="confirm"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}
                  validateTrigger="onBlur"
                  style={{ marginTop: password ? '1rem' : undefined }}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="确认密码"
                    size="large"
                    className="auth-input"
                    autoComplete="new-password"
                  />
                </Form.Item>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Form.Item
                  name="phone"
                  rules={[
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                  ]}
                  validateTrigger="onBlur"
                >
                  <Input
                    placeholder="手机号（可选）"
                    size="large"
                    className="auth-input"
                    autoComplete="tel"
                  />
                </Form.Item>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
              >
                <Form.Item style={{ marginBottom: 0, marginTop: '1rem' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                    className="auth-button"
                  >
                    注册
                  </Button>
                </Form.Item>

                <div className="text-center text-gray-500 text-sm" style={{ marginTop: '1.25rem' }}>
                  已有账户？<a className="auth-link" onClick={() => handleTabChange('login')}>立即登录</a>
                </div>
              </motion.div>
            </Form>
          </motion.div>
        </AnimatePresence>
      ),
    },
  ];

  return (
    <div className="auth-container">
      {/* 镭射效果背景 */}
      <LaserGradient />
      <LaserRay />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1]
        }}
        className="auth-card"
      >
        <Card className="auth-card" bordered={false}>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={() => navigate('/welcome')}
              className="auth-home-button"
            >
              返回首页
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="auth-header"
          >
            <h1 className="auth-title">职业规划助手</h1>
            <p className="auth-subtitle">AI 驱动的职业发展解决方案</p>
          </motion.div>

          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            centered
            className="auth-tabs"
            items={tabItems}
          />
        </Card>
      </motion.div>
    </div>
  );
}
