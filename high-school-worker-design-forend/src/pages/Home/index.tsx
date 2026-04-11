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

function NetworkBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),transparent_45%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.08),transparent_40%),linear-gradient(180deg,#f7faff_0%,#f4f7fc_100%)]" />
      <svg className="absolute inset-0 h-full w-full opacity-35" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden>
        <g stroke="#9bb4d5" strokeWidth="1" fill="none">
          <path d="M80 160 C220 80, 420 100, 540 210 S840 360, 1120 280" />
          <path d="M40 420 C260 300, 430 360, 680 420 S920 600, 1180 540" />
          <path d="M120 700 C340 600, 560 620, 760 700 S980 780, 1180 740" />
        </g>
        <g fill="#7fa4d3">
          <circle cx="220" cy="128" r="4" />
          <circle cx="520" cy="210" r="5" />
          <circle cx="860" cy="340" r="4" />
          <circle cx="366" cy="360" r="4" />
          <circle cx="764" cy="442" r="5" />
          <circle cx="980" cy="590" r="4" />
        </g>
      </svg>
      <div className="absolute -left-24 top-24 h-44 w-44 rotate-12 rounded-[32px] border border-blue-100/60 bg-white/40 shadow-[0_10px_35px_rgba(45,94,182,0.08)]" />
      <div className="absolute right-8 top-36 h-24 w-24 rounded-full border border-blue-100/70 bg-blue-50/60" />
      <div className="absolute bottom-20 right-12 h-36 w-36 -rotate-12 rounded-3xl border border-slate-200/70 bg-white/55 shadow-[0_8px_28px_rgba(15,23,42,0.06)]" />
    </div>
  );
}

function InsightIconCluster({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-28 w-44 sm:h-32 sm:w-52 md:h-36 md:w-56 ${className}`}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 224 144" aria-hidden>
        <g stroke="rgba(191,219,254,0.72)" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M58 36 C98 40, 130 52, 166 72" />
          <path d="M58 36 C88 66, 108 90, 114 108" />
          <path d="M114 108 C132 98, 148 86, 166 72" />
        </g>
        <g fill="rgba(219,234,254,0.92)">
          <circle cx="58" cy="36" r="3.5" />
          <circle cx="166" cy="72" r="3.5" />
          <circle cx="114" cy="108" r="3.5" />
        </g>
      </svg>
      <div className="absolute left-8 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/15 text-base text-blue-100 shadow-[0_10px_24px_rgba(1,16,43,0.3)] sm:h-12 sm:w-12 sm:text-lg md:h-14 md:w-14 md:rounded-2xl md:text-xl">
        <ApartmentOutlined />
      </div>
      <div className="absolute right-8 top-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/35 bg-white/20 text-base text-cyan-100 shadow-[0_10px_24px_rgba(1,16,43,0.3)] sm:h-12 sm:w-12 sm:text-lg md:h-14 md:w-14 md:rounded-2xl md:text-xl">
        <BarChartOutlined />
      </div>
      <div className="absolute left-[5.2rem] bottom-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/35 bg-white/20 text-base text-indigo-100 shadow-[0_10px_24px_rgba(1,16,43,0.3)] sm:h-12 sm:w-12 sm:text-lg md:h-14 md:w-14 md:rounded-2xl md:text-xl">
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
      accentClass: 'text-blue-600',
      bgClass: 'from-blue-50 to-blue-100/60',
    },
    {
      key: 'prepare',
      step: '优化简历',
      title: '智能诊断并优化简历',
      desc: '按目标岗位给出结构化修改建议',
      path: '/resume',
      icon: <FileTextOutlined />,
      accentClass: 'text-emerald-600',
      bgClass: 'from-emerald-50 to-emerald-100/60',
    },
    {
      key: 'plan',
      step: '制定规划',
      title: '生成专属成长路线',
      desc: '阶段化任务与学习目标一键生成',
      path: '/plan',
      icon: <SolutionOutlined />,
      accentClass: 'text-indigo-600',
      bgClass: 'from-indigo-50 to-indigo-100/60',
    },
    {
      key: 'practice',
      step: '模拟面试',
      title: '实战演练提升表达',
      desc: '大厂/国企双模式，实时反馈改进点',
      path: '/interview',
      icon: <MessageOutlined />,
      accentClass: 'text-purple-600',
      bgClass: 'from-purple-50 to-purple-100/60',
    },
  ];

  const recommendations = [
    {
      key: 'jobs',
      title: '岗位图谱探索',
      desc: '查看不同岗位的发展路径、技能要求与转岗关系。',
      path: '/jobs',
      icon: <ApartmentOutlined className="text-3xl text-blue-600" />,
    },
    {
      key: 'resume',
      title: '简历深度优化',
      desc: '从结构完整度到竞争力，生成可执行的优化建议。',
      path: '/resume',
      icon: <FileTextOutlined className="text-3xl text-emerald-600" />,
    },
    {
      key: 'interview',
      title: 'AI 模拟面试',
      desc: '围绕目标岗位生成问题并给出表达和逻辑反馈。',
      path: '/interview',
      icon: <MessageOutlined className="text-3xl text-violet-600" />,
    },
  ];

  return (
    <div className="relative z-10 min-h-screen overflow-hidden pb-20">
      <NetworkBackground />

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:space-y-6 sm:py-6 md:px-6 md:py-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/75 p-5 shadow-[0_8px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-6 md:p-8">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br from-blue-200/35 to-cyan-100/20 blur-2xl" />
          <div className="absolute left-20 top-0 h-20 w-20 rotate-12 rounded-2xl border border-blue-100/70 bg-blue-50/40" />
          <h1 className="relative mb-2 text-xl font-bold text-slate-800 sm:text-2xl md:text-3xl">欢迎来到职业规划助手</h1>
          <p className="relative max-w-2xl text-sm leading-6 text-slate-600">
            从职业测试、简历优化到面试演练，AI 帮你构建更清晰、更可执行的职业成长路径。
          </p>
        </section>

        <section className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_10px_34px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">快速开始</h2>
          <StepRail steps={features.map((item) => item.step)} />

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                className={`group rounded-2xl border border-white bg-gradient-to-br ${item.bgClass} p-4 text-left shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(30,64,175,0.18)]`}
              >
                <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ${item.accentClass}`}>
                  <span className="text-xl">{item.icon}</span>
                </div>
                <div className="text-base font-semibold text-slate-800">{item.title}</div>
                <div className="mt-1 text-sm text-slate-600">{item.desc}</div>
                <div className="mt-3 inline-flex items-center text-sm font-medium text-slate-500 group-hover:text-slate-700">
                  进入功能 <ArrowRightOutlined className="ml-2" />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full rounded-3xl border border-blue-200/50 bg-gradient-to-br from-[#123e75] via-[#0f3568] to-[#0b2a51] p-5 text-white shadow-[0_16px_40px_rgba(2,32,78,0.35)] sm:p-6 md:w-[92%] md:p-7">
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h3 className="text-2xl font-semibold leading-tight">完成职业测试，获取专属报告</h3>
              <p className="mt-2 text-sm leading-6 text-blue-100/90 md:text-base">
                5 分钟完成专业测试，深入了解适合你的职业方向，结合能力画像给出下一步行动建议。
              </p>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/holland')}
                className="mt-5 h-11 w-full rounded-xl border-0 bg-white/95 px-5 font-medium text-[#123e75] shadow-[0_8px_18px_rgba(4,22,48,0.35)] hover:!bg-white sm:w-auto"
              >
                立即开始测试 <ArrowRightOutlined />
              </Button>
            </div>
            <div className="mx-auto flex w-full justify-center md:mx-0 md:w-auto md:justify-end">
              <InsightIconCluster className="scale-95 sm:scale-100" />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">推荐功能</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recommendations.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                className="group rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_26px_rgba(29,78,216,0.14)]"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                  {item.icon}
                </div>
                <div className="text-base font-semibold text-slate-800">{item.title}</div>
                <p className="mt-2 min-h-[42px] text-sm leading-6 text-slate-600">{item.desc}</p>
                <div className="mt-3 inline-flex items-center text-sm font-medium text-blue-700">
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