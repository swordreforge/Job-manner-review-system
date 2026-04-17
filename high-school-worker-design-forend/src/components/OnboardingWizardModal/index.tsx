import { useState } from 'react';
import { Button, message, Steps, Drawer } from 'antd';
import { FileTextOutlined, BulbOutlined, AimOutlined, BankOutlined, MessageOutlined, MenuOutlined, LeftOutlined } from '@ant-design/icons';
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

  if (!open) return null;

  return (
    <>
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
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
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
          <Button block onClick={handleComplete}>
            完成
          </Button>
        </div>
      </Drawer>
    </>
  );
}