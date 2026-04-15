import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import {
  ApartmentOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  CompassOutlined,
  FileTextOutlined,
  MessageOutlined,
  PercentageOutlined,
  SolutionOutlined,
} from '@ant-design/icons';

type QuickFeature = {
  key: string;
  step: string;
  title: string;
  desc: string;
  path: string;
  icon: React.ReactNode;
  accentClass: string;
  bgClass: string;
};

function InsightIconCluster({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-24 w-36 sm:h-28 sm:w-44 md:h-32 md:w-48 ${className}`}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 224 144" aria-hidden>
        <g stroke="rgba(11,87,208,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <path d="M58 36 C98 40, 130 52, 166 72" />
          <path d="M58 36 C88 66, 108 90, 114 108" />
          <path d="M114 108 C132 98, 148 86, 166 72" />
        </g>
        <g fill="rgba(11,87,208,0.5)">
          <circle cx="58" cy="36" r="3" />
          <circle cx="166" cy="72" r="3" />
          <circle cx="114" cy="108" r="3" />
        </g>
      </svg>
      <div 
        className="absolute left-6 top-2 flex h-9 w-9 items-center justify-center rounded-lg text-sm sm:h-10 sm:w-10 sm:text-base md:h-11 md:w-11 md:rounded-xl md:text-lg"
        style={{ 
          backgroundColor: 'var(--md-sys-color-primary-container)',
          color: 'var(--md-sys-color-on-primary-container)',
          boxShadow: 'var(--md-sys-elevation-1)'
        }}
      >
        <ApartmentOutlined />
      </div>
      <div 
        className="absolute right-6 top-8 flex h-9 w-9 items-center justify-center rounded-lg text-sm sm:h-10 sm:w-10 sm:text-base md:h-11 md:w-11 md:rounded-xl md:text-lg"
        style={{ 
          backgroundColor: 'var(--md-sys-color-secondary-container)',
          color: 'var(--md-sys-color-on-secondary-container)',
          boxShadow: 'var(--md-sys-elevation-1)'
        }}
      >
        <BarChartOutlined />
      </div>
      <div 
        className="absolute left-14 bottom-2 flex h-9 w-9 items-center justify-center rounded-lg text-sm sm:h-10 sm:w-10 sm:text-base md:h-11 md:w-11 md:rounded-xl md:text-lg"
        style={{ 
          backgroundColor: 'var(--md-sys-color-tertiary-container)',
          color: 'var(--md-sys-color-on-tertiary-container)',
          boxShadow: 'var(--md-sys-elevation-1)'
        }}
      >
        <PercentageOutlined />
      </div>
    </div>
  );
}

function StepRail({ steps }: { steps: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-y-4 md:grid-cols-4 md:gap-x-3 md:gap-y-0">
      {steps.map((title, idx) => (
        <div key={title} className="relative md:pr-2">
          {idx < steps.length - 1 && (
            <div className="absolute left-4 top-8 h-7 w-px bg-gradient-to-b from-blue-200 via-blue-300 to-transparent sm:hidden" />
          )}
          {idx < steps.length - 1 && (
            <div className="absolute left-10 right-1 top-4 hidden h-px bg-gradient-to-r from-blue-200 via-blue-300 to-transparent md:block" />
          )}
          <div className="relative z-10 flex items-center gap-3 md:flex-col md:items-start md:gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 shadow-[0_2px_8px_rgba(30,64,175,0.12)]">
              {idx + 1}
            </div>
            <span className="pt-1 text-sm font-medium leading-5 text-slate-700 md:max-w-[88px] md:pt-0">
              {title}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  const features: QuickFeature[] = [
    {
      key: 'think',
      step: '职业测试',
      title: '完成职业倾向测试',
      desc: '5分钟识别你的优势画像与适配方向',
      path: '/holland',
      icon: <CompassOutlined />,
      accentClass: 'text-[var(--md-sys-color-primary)]',
      bgClass: 'from-[var(--md-sys-color-primary-container)] to-[rgba(211,228,255,0.4)]',
    },
    {
      key: 'prepare',
      step: '优化简历',
      title: '智能诊断并优化简历',
      desc: '按目标岗位给出结构化修改建议',
      path: '/resume',
      icon: <FileTextOutlined />,
      accentClass: 'text-[#1B8C3B]',
      bgClass: 'from-[#D4EDDA] to-[rgba(212,237,218,0.4)]',
    },
    {
      key: 'plan',
      step: '制定规划',
      title: '生成专属成长路线',
      desc: '阶段化任务与学习目标一键生成',
      path: '/plan',
      icon: <SolutionOutlined />,
      accentClass: 'text-[#6B5DD3]',
      bgClass: 'from-[#E8E5F9] to-[rgba(232,229,249,0.4)]',
    },
    {
      key: 'practice',
      step: '模拟面试',
      title: '实战演练提升表达',
      desc: '大厂/国企双模式，实时反馈改进点',
      path: '/interview',
      icon: <MessageOutlined />,
      accentClass: 'text-[#9C27B0]',
      bgClass: 'from-[#F3E5F5] to-[rgba(243,229,245,0.4)]',
    },
  ];

  const recommendations = [
    {
      key: 'jobs',
      title: '岗位图谱探索',
      desc: '查看不同岗位的发展路径、技能要求与转岗关系。',
      path: '/jobs',
      icon: <ApartmentOutlined className="text-2xl text-[var(--md-sys-color-primary)]" />,
    },
    {
      key: 'resume',
      title: '简历深度优化',
      desc: '从结构完整度到竞争力，生成可执行的优化建议。',
      path: '/resume',
      icon: <FileTextOutlined className="text-2xl text-[#1B8C3B]" />,
    },
    {
      key: 'interview',
      title: 'AI 模拟面试',
      desc: '围绕目标岗位生成问题并给出表达和逻辑反馈。',
      path: '/interview',
      icon: <MessageOutlined className="text-2xl text-[#9C27B0]" />,
    },
  ];

  return (
    <div className="relative z-10 min-h-screen overflow-hidden pb-20">
      <div className="absolute inset-0 -z-10" 
        style={{ 
          background: 'linear-gradient(180deg, var(--md-sys-color-surface-container) 0%, var(--md-sys-color-surface) 100%)'
        }} 
      />

      <div className="mx-auto max-w-5xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5 md:px-5 md:py-6 lg:space-y-6 lg:py-8">
        {/* Welcome Card - MD3 Filled Card */}
        <section 
          className="relative overflow-hidden rounded-2xl p-5 sm:p-5 md:p-7"
          style={{ 
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            boxShadow: 'var(--md-sys-elevation-1)'
          }}
        >
          <h1 className="relative mb-2 text-xl font-medium sm:text-2xl md:text-3xl" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            欢迎来到职业规划助手
          </h1>
          <p className="relative max-w-2xl text-sm leading-6" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            从职业测试、简历优化到面试演练，AI 帮你构建更清晰、更可执行的职业成长路径。
          </p>
        </section>

        {/* Quick Start - MD3 Outlined Card */}
        <section 
          className="rounded-2xl p-5 sm:p-5 md:p-6"
          style={{ 
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            borderRadius: 'var(--md-sys-shape-corner-large)'
          }}
        >
          <h2 className="mb-4 text-lg font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>快速开始</h2>
          <StepRail steps={features.map((item) => item.step)} />

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                className="group rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: `linear-gradient(135deg, ${item.bgClass.split(' ')[0]}, ${item.bgClass.split(' ')[1]})`,
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  boxShadow: 'var(--md-sys-elevation-1)'
                }}
              >
                <div 
                  className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg shadow-sm"
                  style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
                >
                  <span className="text-lg">{item.icon}</span>
                </div>
                <div className="text-base font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{item.title}</div>
                <div className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{item.desc}</div>
                <div className="mt-3 inline-flex items-center text-sm font-medium" style={{ color: 'var(--md-sys-color-primary)' }}>
                  进入功能 <ArrowRightOutlined className="ml-1.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Career Test CTA - MD3 Filled Card with Primary Container */}
        <section 
          className="mx-auto w-full rounded-2xl p-5 sm:p-5 md:w-[92%] md:p-6 lg:p-7"
          style={{ 
            background: 'linear-gradient(135deg, var(--md-sys-color-primary-container) 0%, var(--md-sys-color-surface-container-high) 100%)',
            boxShadow: 'var(--md-sys-elevation-2)'
          }}
        >
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center lg:gap-5">
            <div className="max-w-xl">
              <h3 className="text-lg sm:text-xl font-medium leading-tight" style={{ color: 'var(--md-sys-color-on-primary-container)' }}>
                完成职业测试，获取专属报告
              </h3>
              <p className="mt-2 text-sm leading-6 md:text-base" style={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.9 }}>
                5 分钟完成专业测试，深入了解适合你的职业方向，结合能力画像给出下一步行动建议。
              </p>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/holland')}
                className="mt-4 h-10 w-full rounded-full border-0 sm:w-auto px-6 font-medium"
                style={{ 
                  backgroundColor: 'var(--md-sys-color-primary)',
                  boxShadow: 'var(--md-sys-elevation-1)'
                }}
              >
                立即开始测试 <ArrowRightOutlined />
              </Button>
            </div>
            <div className="mx-auto flex w-full justify-center md:mx-0 md:w-auto md:justify-end">
              <InsightIconCluster className="scale-90 sm:scale-95" />
            </div>
          </div>
        </section>

        {/* Recommendations - MD3 Card */}
        <section 
          className="rounded-2xl p-5 md:p-6"
          style={{ 
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            boxShadow: 'var(--md-sys-elevation-0)'
          }}
        >
          <h3 className="mb-4 text-lg font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>推荐功能</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recommendations.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                className="group rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  boxShadow: 'var(--md-sys-elevation-0)'
                }}
              >
                <div 
                  className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}
                >
                  {item.icon}
                </div>
                <div className="text-base font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{item.title}</div>
                <p className="mt-2 min-h-[42px] text-sm leading-5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{item.desc}</p>
                <div className="mt-3 inline-flex items-center text-sm font-medium" style={{ color: 'var(--md-sys-color-primary)' }}>
                  立即体验
                  <ArrowRightOutlined className="ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}