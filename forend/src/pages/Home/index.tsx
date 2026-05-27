import { useNavigate } from 'react-router-dom';

type QuickFeature = {
  key: string;
  step: string;
  title: string;
  desc: string;
  path: string;
  icon: string;
  containerColor: string;
  onContainerColor: string;
};

type Recommendation = {
  key: string;
  title: string;
  desc: string;
  path: string;
  icon: string;
  iconColor: string;
};

function InsightIconCluster({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-24 w-36 sm:h-28 sm:w-44 md:h-32 md:w-48 ${className}`}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 224 144" aria-hidden>
        <g stroke="var(--home-insight-link-color)" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M58 36 C98 40, 130 52, 166 72" />
          <path d="M58 36 C88 66, 108 90, 114 108" />
          <path d="M114 108 C132 98, 148 86, 166 72" />
        </g>
        <g fill="var(--home-insight-dot-color)">
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
        <span className="material-symbols-rounded">apartment</span>
      </div>
      <div
        className="absolute right-6 top-8 flex h-9 w-9 items-center justify-center rounded-lg text-sm sm:h-10 sm:w-10 sm:text-base md:h-11 md:w-11 md:rounded-xl md:text-lg"
        style={{
          backgroundColor: 'var(--md-sys-color-secondary-container)',
          color: 'var(--md-sys-color-on-secondary-container)',
          boxShadow: 'var(--md-sys-elevation-1)'
        }}
      >
        <span className="material-symbols-rounded">bar_chart</span>
      </div>
      <div
        className="absolute left-14 bottom-2 flex h-9 w-9 items-center justify-center rounded-lg text-sm sm:h-10 sm:w-10 sm:text-base md:h-11 md:w-11 md:rounded-xl md:text-lg"
        style={{
          backgroundColor: 'var(--md-sys-color-tertiary-container)',
          color: 'var(--md-sys-color-on-tertiary-container)',
          boxShadow: 'var(--md-sys-elevation-1)'
        }}
      >
        <span className="material-symbols-rounded">percent</span>
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
            <div
              className="absolute left-4 top-8 h-7 w-px sm:hidden"
              style={{
                background: `linear-gradient(to bottom, var(--md-sys-color-primary-container), transparent)`
              }}
            />
          )}
          {idx < steps.length - 1 && (
            <div
              className="absolute left-10 right-1 top-4 hidden h-px md:block"
              style={{
                background: `linear-gradient(to right, var(--md-sys-color-primary-container), transparent)`
              }}
            />
          )}
          <div className="relative z-10 flex items-center gap-3 md:flex-col md:items-start md:gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shadow-[0_2px_8px_rgba(30,64,175,0.12)]"
              style={{
                backgroundColor: 'var(--md-sys-color-primary-container)',
                border: '1px solid var(--md-sys-color-outline)',
                color: 'var(--md-sys-color-primary)',
              }}
            >
              {idx + 1}
            </div>
            <span
              className="pt-1 text-sm font-medium leading-5 md:max-w-[88px] md:pt-0"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
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
      step: '01',
      title: '职业测评',
      desc: '了解自己的职业兴趣和能力倾向',
      path: '/holland',
      icon: 'psychology',
      containerColor: 'var(--md-sys-color-primary-container)',
      onContainerColor: 'var(--md-sys-color-on-primary-container)',
    },
    {
      key: 'prepare',
      step: '02',
      title: '完善画像',
      desc: '上传简历或填写信息，构建你的职业画像',
      path: '/resume',
      icon: 'person_edit',
      containerColor: 'var(--md-sys-color-secondary-container)',
      onContainerColor: 'var(--md-sys-color-on-secondary-container)',
    },
    {
      key: 'plan',
      step: '03',
      title: '职业规划',
      desc: 'AI 生成专属职业规划报告',
      path: '/plan',
      icon: 'map',
      containerColor: 'var(--md-sys-color-tertiary-container)',
      onContainerColor: 'var(--md-sys-color-on-tertiary-container)',
    },
    {
      key: 'practice',
      step: '04',
      title: '模拟面试',
      desc: '与 AI 进行真实场景模拟面试',
      path: '/interview',
      icon: 'record_voice_over',
      containerColor: 'var(--md-sys-color-error-container)',
      onContainerColor: 'var(--md-sys-color-on-error-container)',
    },
  ];

  const recommendations: Recommendation[] = [
    {
      key: 'jobs',
      title: '岗位图谱探索',
      desc: '查看不同岗位的发展路径、技能要求与转岗关系。',
      path: '/jobs',
      icon: 'apartment',
      iconColor: 'var(--md-sys-color-primary)',
    },
    {
      key: 'resume',
      title: '简历深度优化',
      desc: '从结构完整度到竞争力，生成可执行的优化建议。',
      path: '/resume',
      icon: 'description',
      iconColor: 'var(--md-sys-color-secondary)',
    },
    {
      key: 'interview',
      title: 'AI 模拟面试',
      desc: '围绕目标岗位生成问题并给出表达和逻辑反馈。',
      path: '/interview',
      icon: 'chat',
      iconColor: 'var(--md-sys-color-tertiary)',
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
          <h1 className="md-typescale-headline-small relative mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            欢迎来到职业规划助手
          </h1>
          <p className="md-typescale-body-small relative max-w-2xl leading-6" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
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
          <h2 className="md-typescale-title-large mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>快速开始</h2>
          <StepRail steps={features.map((item) => item.step)} />

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                className="group rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-1"
                style={{
                  backgroundColor: item.containerColor,
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  boxShadow: 'var(--md-sys-elevation-1)'
                }}
              >
                <div
                  className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg shadow-sm"
                  style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
                >
                  <span className="material-symbols-rounded text-lg" style={{ color: item.onContainerColor }}>{item.icon}</span>
                </div>
                <div className="md-typescale-title-large" style={{ color: 'var(--md-sys-color-on-surface)' }}>{item.title}</div>
                <div className="md-typescale-body-small mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{item.desc}</div>
                <div className="mt-3 inline-flex items-center text-sm font-medium" style={{ color: 'var(--md-sys-color-primary)' }}>
                  进入功能 <span className="material-symbols-rounded ml-1.5 text-base transition-transform duration-200 group-hover:translate-x-1">arrow_forward</span>
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
              <h3 className="md-typescale-title-large leading-tight" style={{ color: 'var(--md-sys-color-on-primary-container)' }}>
                完成职业测试，获取专属报告
              </h3>
              <p className="md-typescale-body-small mt-2 leading-6 md:text-base" style={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.9 }}>
                5 分钟完成专业测试，深入了解适合你的职业方向，结合能力画像给出下一步行动建议。
              </p>
              <button
                onClick={() => navigate('/holland')}
                className="md-typescale-label-large mt-4 cursor-pointer border-none px-6 py-2.5 transition-colors"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary-container)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary-container)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary)'; }}
              >
                立即开始测试 <span className="material-symbols-rounded align-middle">arrow_forward</span>
              </button>
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
          <h3 className="md-typescale-title-large mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>推荐功能</h3>
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
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    color: item.iconColor,
                  }}
                >
                  <span className="material-symbols-rounded text-2xl">{item.icon}</span>
                </div>
                <div className="md-typescale-title-large" style={{ color: 'var(--md-sys-color-on-surface)' }}>{item.title}</div>
                <p className="md-typescale-body-small mt-2 min-h-[42px] leading-5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{item.desc}</p>
                <div className="mt-3 inline-flex items-center text-sm font-medium" style={{ color: 'var(--md-sys-color-primary)' }}>
                  立即体验
                  <span className="material-symbols-rounded ml-2 text-base transition-transform duration-200 group-hover:translate-x-1">arrow_forward</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}