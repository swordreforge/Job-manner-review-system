import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api';
import type { UserProgressItem, UserProgressResp } from '../../types';

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

function ProgressCard({ progress, onNavigate }: { progress: UserProgressResp; onNavigate: (path: string) => void }) {
  const isAllComplete = progress.overallProgress >= 100;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isAllComplete) {
      const timer = setTimeout(() => setCollapsed(true), 600);
      return () => clearTimeout(timer);
    }
    setCollapsed(false);
  }, [isAllComplete]);

  const percentage = Math.round(progress.overallProgress);

  const containerStyle = {
    backgroundColor: isAllComplete
      ? 'var(--md-sys-color-primary-container)'
      : 'var(--md-sys-color-surface-container-low)',
    border: `1px solid ${isAllComplete ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
    borderRadius: 'var(--md-sys-shape-corner-large)',
    overflow: 'hidden',
    maxHeight: collapsed ? '56px' : '800px',
    transition: 'max-height 0.4s ease, background-color 0.3s ease, border-color 0.3s ease',
  };

  const stepColors: Record<string, { bg: string; fg: string }> = {
    holland_test: { bg: 'var(--md-sys-color-primary-container)', fg: 'var(--md-sys-color-on-primary-container)' },
    student_profile: { bg: 'var(--md-sys-color-secondary-container)', fg: 'var(--md-sys-color-on-secondary-container)' },
    resume_upload: { bg: 'var(--md-sys-color-tertiary-container)', fg: 'var(--md-sys-color-on-tertiary-container)' },
    career_report: { bg: 'var(--md-sys-color-error-container)', fg: 'var(--md-sys-color-on-error-container)' },
    interview_simulation: { bg: 'var(--md-sys-color-surface-container-high)', fg: 'var(--md-sys-color-on-surface)' },
  };

  return (
    <section style={containerStyle}>
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className="flex w-full items-center gap-4 p-5 sm:p-5 md:p-6"
        style={{ cursor: 'pointer', textAlign: 'left', border: 'none', background: 'none' }}
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-rounded text-2xl" style={{ color: isAllComplete ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface)' }}>
            {isAllComplete ? 'check_circle' : 'flag'}
          </span>
          <div className="min-w-0">
            <h2 className="md-typescale-title-large" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {isAllComplete ? '全部完成！继续探索更多功能' : '测评完成度'}
            </h2>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="h-2.5 flex-1 overflow-hidden"
            style={{ borderRadius: 'var(--md-sys-shape-corner-full)', backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                borderRadius: 'var(--md-sys-shape-corner-full)',
                backgroundColor: isAllComplete ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-secondary)',
              }}
            />
          </div>
          <span
            className="flex-shrink-0 text-sm font-semibold"
            style={{ color: isAllComplete ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)' }}
          >
            {percentage}%
          </span>
        </div>
        <span
          className="material-symbols-rounded text-xl flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--md-sys-color-on-surface-variant)',
            transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
        >
          expand_more
        </span>
      </button>

      <div style={{
        maxHeight: collapsed ? '0' : '2000px',
        opacity: collapsed ? 0 : 1,
        overflow: 'hidden',
        transition: 'max-height 0.4s ease, opacity 0.3s ease',
      }}>
        <div className="px-5 pb-5 sm:px-5 sm:pb-5 md:px-6 md:pb-6">
          <div className="flex flex-col gap-2">
            {progress.items.map((item) => {
              const colors = stepColors[item.key] || stepColors.interview_simulation;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.path)}
                  className="group flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    backgroundColor: item.completed ? colors.bg : 'var(--md-sys-color-surface)',
                    borderColor: item.completed ? 'transparent' : 'var(--md-sys-color-outline-variant)',
                    boxShadow: 'var(--md-sys-elevation-0)',
                  }}
                >
                  <span
                    className="material-symbols-rounded text-xl flex-shrink-0"
                    style={{ color: item.completed ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)' }}
                  >
                    {item.completed ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
                  >
                    <span className="material-symbols-rounded text-lg" style={{ color: colors.fg }}>{item.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="md-typescale-title-medium text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {item.title}
                    </div>
                    <div className="md-typescale-body-small mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {item.description}
                    </div>
                  </div>
                  {!item.completed && (
                    <span
                      className="material-symbols-rounded text-lg flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                      style={{ color: 'var(--md-sys-color-primary)' }}
                    >
                      arrow_forward
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgressResp | null>(null);

  const loadProgress = useCallback(async () => {
    try {
      const res = await userApi.getProgress();
      if (res.code === 0) {
        setProgress(res);
      }
    } catch {
      const fallback: UserProgressResp = {
        code: 0,
        msg: 'fallback',
        totalItems: 5,
        completedItems: 0,
        overallProgress: 0,
        items: [
          { key: 'holland_test', title: '霍兰德职业倾向测试', description: '完成职业兴趣测试，了解你的职业倾向', path: '/holland', icon: 'psychology', completed: false },
          { key: 'student_profile', title: '完善个人资料', description: '创建并完善你的学生资料档案', path: '/profile', icon: 'person_edit', completed: false },
          { key: 'resume_upload', title: '简历上传与解析', description: '上传简历，AI 智能解析构建职业画像', path: '/resume', icon: 'description', completed: false },
          { key: 'career_report', title: '职业规划报告', description: '生成专属职业规划与发展报告', path: '/plan', icon: 'map', completed: false },
          { key: 'interview_simulation', title: '模拟面试', description: 'AI 模拟面试，提升求职面试技巧', path: '/interview', icon: 'record_voice_over', completed: false },
        ],
      };
      setProgress(fallback);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

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

        {/* Progress Todo Card */}
        {progress && <ProgressCard progress={progress} onNavigate={(path) => navigate(path)} />}

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