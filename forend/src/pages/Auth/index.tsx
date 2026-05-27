import { useState, useCallback, useMemo } from 'react';
import { Form, Input, Button, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, CheckCircleFilled, HomeOutlined, BankOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi, teacherApi } from '../../api';
import { useAuthStore, useThemeStore } from '../../stores';
import FeatureIcon from '../../components/FeatureIcon';
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
  const GraduationCapIcon = ({ className = "" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10L12 5L21 10L12 15L3 10Z" />
      <path d="M5 12V18C5 19.1046 8.13401 20 12 20C15.866 20 19 19.1046 19 18V12" />
      <path d="M5 18C5 19.1046 8.13401 20 12 20C15.866 20 19 19.1046 19 18" />
    </svg>
  );

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
  const { theme, toggleTheme } = useThemeStore();

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
            
            // Redirect based on role
            const targetPath = userInfo.data.role === 'teacher' ? '/teacher/index' : '/start';
            setTimeout(() => {
              navigate(targetPath);
            }, 800);
            return;
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

  const handleTeacherRegister = async (values: { username: string; password: string; email: string; name: string; schoolCode: string; employeeId?: string; department?: string }) => {
    setLoading(true);
    try {
      const result = await teacherApi.register(values);
      if (result.code === 0) {
        message.success('教师注册成功，请登录');
        setActiveTab('login');
      } else {
        message.error(result.msg || '注册失败');
      }
    } catch (error: unknown) {
      console.error('Teacher register error:', error);
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
    {
      key: 'teacher-register',
      label: '教师注册',
      children: (
        <AnimatePresence mode="wait">
          <motion.div
            key={`teacher-register-${tabKey}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="tab-content-wrapper"
          >
            <Form
              form={registerForm}
              onFinish={handleTeacherRegister}
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
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                <Form.Item
                  name="name"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="姓名"
                    size="large"
                    className="auth-input"
                  />
                </Form.Item>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Form.Item
                  name="schoolCode"
                  rules={[{ required: true, message: '请输入学校代码' }]}
                >
                  <Input
                    prefix={<BankOutlined />}
                    placeholder="学校代码 (6位)"
                    size="large"
                    className="auth-input"
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
                    注册教师账号
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

  const featurePool = useMemo(() => [
    { icon: 'robot' as const, text: 'AI 智能解析简历' },
    { icon: 'target' as const, text: '精准岗位匹配' },
    { icon: 'chart' as const, text: '一键生成职业报告' },
    { icon: 'map' as const, text: '可视化晋升路径' },
    { icon: 'trend' as const, text: '职业成长趋势分析' },
    { icon: 'search' as const, text: '海量岗位数据库' },
    { icon: 'graduation' as const, text: '技能差距精准定位' },
    { icon: 'briefcase' as const, text: '个性化职业建议' },
    { icon: 'bolt' as const, text: '秒级智能分析' },
  ], []);

  const brandFeatures = useMemo(() => {
    const copy = [...featurePool];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy.slice(0, 3);
  }, [featurePool]);

  const brandTitle = activeTab === 'register' ? '开启你的职业规划' : activeTab === 'teacher-register' ? '教师专属平台' : '欢迎回来';
  const brandSubtitle = activeTab === 'register' ? '免费注册，立即体验 AI 驱动的职业发展路径规划' : activeTab === 'teacher-register' ? '教师端管理，全方位助力学生成长' : '继续你的职业规划之旅，让 AI 为你保驾护航';

  return (
    <div className="auth-root">
      <div className="auth-brand-panel">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />

        <div className="auth-brand-inner">
          <div className="auth-brand-logo">
            <GraduationCapIcon className="auth-brand-logo-icon" />
            <span className="auth-brand-logo-text">Job <span>Router</span></span>
          </div>

          <div className="auth-brand-tagline">
            <div className="auth-brand-tagline-main">{brandTitle}</div>
            <div className="auth-brand-tagline-sub">{brandSubtitle}</div>
          </div>

          <div className="auth-brand-features">
            {brandFeatures.map((feat, idx) => (
              <motion.div
                key={feat.icon}
                className="auth-brand-feature-item"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="auth-brand-feature-icon"><FeatureIcon name={feat.icon} size={18} /></div>
                <span className="auth-brand-feature-text">{feat.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="auth-top-actions"
          >
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={() => navigate('/welcome')}
              className="auth-home-button"
            >
              返回首页
            </Button>
            <Button
              type="text"
              onClick={toggleTheme}
              className="auth-theme-button"
              icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              aria-label={theme === 'dark' ? '切换为浅色模式' : '切换为深色模式'}
              title={theme === 'dark' ? '切换为浅色模式' : '切换为深色模式'}
            />
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
        </div>
      </div>
    </div>
  );
}
