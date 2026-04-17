import { useState } from 'react';
import { Modal, Button, message } from 'antd';
import { FileTextOutlined, BulbOutlined, AimOutlined, BankOutlined, MessageOutlined } from '@ant-design/icons';
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
    description: '上传简历或手动填写学生信息，让系统更好地为你推荐岗位',
    icon: <FileTextOutlined />,
    actionPath: '/resume',
  },
  {
    key: 'holland',
    title: '霍兰德职业测试',
    description: '通过测试了解你的职业兴趣类型',
    icon: <BulbOutlined />,
    actionPath: '/holland',
  },
  {
    key: 'plan',
    title: '查看职业规划',
    description: '基于测试结果生成个性化职业规划',
    icon: <AimOutlined />,
    actionPath: '/plan',
  },
  {
    key: 'jobs',
    title: '搜索岗位',
    description: '浏览并搜索符合你方向的岗位',
    icon: <BankOutlined />,
    actionPath: '/jobs',
  },
  {
    key: 'interview',
    title: '模拟面试',
    description: 'AI 面试官陪你练习面试技巧',
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

  const currentStepData = steps[currentStep];

  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      maskClosable={false}
      width={480}
      centered
      className="onboarding-modal"
      styles={{
        body: { padding: '24px' },
      }}
    >
      <div className="text-center mb-6">
        <div className="text-sm text-gray-500 mb-2">
          {currentStep + 1} / {steps.length}
        </div>
        <div
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--md-sys-color-primary-container)' }}
        >
          <span style={{ fontSize: '32px', color: 'var(--md-sys-color-on-primary-container)' }}>
            {currentStepData.icon}
          </span>
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
          {currentStepData.title}
        </h2>
        <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {currentStepData.description}
        </p>
      </div>

      <Button
        type="primary"
        size="large"
        block
        className="mb-3"
        onClick={() => navigate(currentStepData.actionPath)}
      >
        去完成
      </Button>

      <div className="flex justify-between items-center mt-4">
        <Button
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((s) => s - 1)}
        >
          上一步
        </Button>
        
        {currentStep === steps.length - 1 ? (
          <Button type="primary" onClick={handleComplete}>
            完成
          </Button>
        ) : (
          <Button onClick={() => setCurrentStep((s) => s + 1)}>
            下一步
          </Button>
        )}
      </div>

      <div className="text-center mt-4">
        <Button type="link" size="small" onClick={handleSkip}>
          跳过
        </Button>
      </div>
    </Modal>
  );
}