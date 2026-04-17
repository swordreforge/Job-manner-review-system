import { useState, useEffect } from 'react';
import { Button, message, Steps, Drawer, Modal } from 'antd';
import { FileTextOutlined, BulbOutlined, AimOutlined, BankOutlined, MessageOutlined, MenuOutlined, LeftOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api';

interface Step {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actionPath: string;
}

const steps: Step[] = [
  {
    key: 'resume',
    title: '完善简历',
    description: '上传简历或手动填写学生信息',
    icon: <FileTextOutlined />,
    actionPath: '/resume',
  },
  {
    key: 'holland',
    title: '霍兰德职业测试',
    description: '了解职业兴趣类型',
    icon: <BulbOutlined />,
    actionPath: '/holland',
  },
  {
    key: 'plan',
    title: '查看职业规划',
    description: '个性化职业规划',
    icon: <AimOutlined />,
    actionPath: '/plan',
  },
  {
    key: 'jobs',
    title: '搜索岗位',
    description: '浏览符合方向的岗位',
    icon: <BankOutlined />,
    actionPath: '/jobs',
  },
  {
    key: 'interview',
    title: '模拟面试',
    description: 'AI面试练习',
    icon: <MessageOutlined />,
    actionPath: '/interview',
  },
];

interface OnboardingWizardModalProps {
  open: boolean;
  onComplete: () => void;
}

export default function OnboardingWizardModal({ open, onComplete }: OnboardingWizardModalProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [folded, setFolded] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (open && folded) {
      setShowWelcomeModal(true);
    }
  }, [open]);

  const handleComplete = async () => {
    try {
      await userApi.completeOnboarding();
      message.success('欢迎加入！开始你的职业探索之旅吧');
      onComplete();
    } catch {
      message.error('操作失败，请重试');
    }
  };

  const handleSkip = async () => {
    try {
      await userApi.completeOnboarding();
      onComplete();
    } catch {
      message.error('操作失败，请重试');
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleOpenGuide = () => {
    setShowWelcomeModal(false);
    setFolded(false);
  };

  if (!open) return null;

  return (
    <>
      <Modal
        open={showWelcomeModal}
        onCancel={() => setShowWelcomeModal(false)}
        footer={null}
        closable={false}
        maskClosable={false}
        centered
        width={400}
      >
        <div className="text-center py-4">
          <div
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--md-sys-color-primary-container)' }}
          >
            <RocketOutlined style={{ fontSize: '40px', color: 'var(--md-sys-color-on-primary-container)' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            欢迎加入！
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            让我们开始你的职业探索之旅吧
          </p>
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              你将完成以下任务：
            </p>
            <ul className="text-sm space-y-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              <li>1. 完善简历 - 让系统更好地推荐岗位</li>
              <li>2. 霍兰德测试 - 了解你的职业兴趣</li>
              <li>3. 职业规划 - 获取个性化建议</li>
              <li>4. 搜索岗位 - 找到合适的工作</li>
              <li>5. 模拟面试 - 提升面试技巧</li>
            </ul>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            点击右上角的
            <span className="font-bold" style={{ color: 'var(--md-sys-color-primary)' }}>
              「引导」
            </span>
            按钮开始
          </p>
          <Button type="primary" size="large" block onClick={handleOpenGuide}>
            立即开始
          </Button>
        </div>
      </Modal>

      <div
        className="onboarding-folded"
        style={{
          position: 'fixed',
          right: folded ? '0' : '-200px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1001,
          transition: 'right 0.3s ease',
        }}
      >
        <Button
          type="primary"
          shape="round"
          size="large"
          onClick={() => setFolded(false)}
          style={{
            padding: '16px 8px',
            height: 'auto',
            writingMode: 'vertical-lr',
            textOrientation: 'upright',
            backgroundColor: 'var(--md-sys-color-primary)',
          }}
        >
          <MenuOutlined /> 引导
        </Button>
      </div>

      <Drawer
        title={null}
        placement="right"
        onClose={() => setFolded(true)}
        open={!folded}
        width={280}
        closable={false}
        mask={false}
        styles={{
          body: { padding: '16px', backgroundColor: 'var(--md-sys-color-surface)' },
          header: { display: 'none' },
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--md-sys-color-on-surface)' }}>新手引导</span>
          <Button type="text" size="small" onClick={() => setFolded(true)}>
            <LeftOutlined />
          </Button>
        </div>

        <Steps
          direction="vertical"
          current={currentStep}
          size="small"
          items={steps.map((step, index) => ({
            title: (
              <span
                style={{
                  color: index === currentStep ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                  cursor: 'pointer',
                }}
                onClick={() => handleNavigate(step.actionPath)}
              >
                {step.title}
              </span>
            ),
            description: (
              <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                {step.description}
              </span>
            ),
            icon: step.icon,
          }))}
        />

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button
            type="primary"
            block
            onClick={() => handleNavigate(steps[currentStep].actionPath)}
          >
            去完成当前步骤
          </Button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((s) => s - 1)}
              style={{ flex: 1 }}
            >
              上一步
            </Button>
            <Button
              disabled={currentStep === steps.length - 1}
              onClick={() => setCurrentStep((s) => s + 1)}
              style={{ flex: 1 }}
            >
              下一步
            </Button>
          </div>
          <Button type="link" block onClick={handleSkip}>
            跳过引导
          </Button>
          <Button 
            block 
            onClick={handleComplete}
            disabled={currentStep !== steps.length - 1}
            className={currentStep !== steps.length - 1 ? 'opacity-50' : ''}
          >
            {currentStep !== steps.length - 1 ? `完成 (第${currentStep + 1}/5步)` : '完成'}
          </Button>
        </div>
      </Drawer>
    </>
  );
}