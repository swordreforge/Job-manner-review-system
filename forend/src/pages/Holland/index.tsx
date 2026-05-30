import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hollandApi } from '../../api';
import type { HollandAnswer, HollandTestInfo } from '../../types';
import SurfaceCard from '../../components/SurfaceCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import PageHeader from '../../components/PageHeader';

export default function HollandTestPage() {
  const navigate = useNavigate();
  const [testInfo, setTestInfo] = useState<HollandTestInfo | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<HollandAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await hollandApi.getQuestions();
      if (response.code === 0 && response.data) {
        setTestInfo(response.data);
      } else {
        setError(response.msg || '加载题目失败');
      }
    } catch (err) {
      setError('加载题目失败，请重试');
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, selectedType: 'R' | 'I' | 'A' | 'S' | 'E' | 'C') => {
    const existingIndex = answers.findIndex(a => a.questionId === questionId);
    const newAnswers = existingIndex >= 0
      ? answers.map((a, i) => i === existingIndex ? { questionId, selectedType } : a)
      : [...answers, { questionId, selectedType } as HollandAnswer];
    
    setAnswers(newAnswers);

    if (currentQuestionIndex < (testInfo?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.length !== testInfo?.questions.length) {
      setError('请完成所有题目后再提交');
      return;
    }

    try {
      setSubmitting(true);
      const response = await hollandApi.submitTest(answers);
      if (response.code === 0 && response.data) {
        navigate(`/holland/result/${response.data.testId}`);
      } else {
        setError(response.msg || '提交失败');
      }
    } catch (err) {
      setError('提交失败，请重试');
      console.error('Failed to submit test:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  if (loading) {
    return (
      <div className="relative z-10 flex items-center justify-center">
        <div className="text-center">
          <SkeletonLoader type="card" />
          <p className="md-typescale-body-large mt-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>加载题目中...</p>
        </div>
      </div>
    );
  }

  if (error && !testInfo) {
    return (
      <div className="relative z-10 flex items-center justify-center">
        <SurfaceCard variant="elevated" style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <p className="md-typescale-body-large mb-4" style={{ color: 'var(--md-sys-color-error)' }}>{error}</p>
          <button
            onClick={loadQuestions}
            className="md-typescale-label-large px-6 py-2.5 transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              border: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary-container)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary-container)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary)'; }}
          >
            重新加载
          </button>
        </SurfaceCard>
      </div>
    );
  }

  if (!testInfo) {
    return null;
  }

  const currentQuestion = testInfo.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / testInfo.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === testInfo.questions.length - 1;
  const allAnswered = answers.length === testInfo.questions.length;

  return (
    <div className="relative z-10">
      <div className="p-6 max-w-5xl mx-auto">
        <PageHeader title="职业兴趣测试" icon={<span className="material-symbols-rounded">psychology</span>} />

        <div className="mb-6">
          <h1 className="md-typescale-headline-small mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>{testInfo.testInfo.name}</h1>
          <p className="md-typescale-body-medium mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{testInfo.testInfo.description}</p>
          
          <SurfaceCard variant="elevated" className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                题目 {currentQuestionIndex + 1} / {testInfo.questions.length}
              </span>
              <span className="md-typescale-label-large" style={{ color: 'var(--md-sys-color-primary)' }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: 'var(--md-sys-color-primary)' }}
              ></div>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard variant="elevated" className="mb-6">
          <div className="mb-6">
            <h2 className="md-typescale-title-large mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {currentQuestion.question}
            </h2>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers.some(
                  a => a.questionId === currentQuestion.id && a.selectedType === option.type
                );
                const careerType = testInfo.careerTypes[option.type];
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(currentQuestion.id, option.type)}
                    className="w-full p-4 transition-all cursor-pointer text-left"
                    style={{
                      borderRadius: 'var(--md-sys-shape-corner-large)',
                      border: isSelected
                        ? `2px solid var(--md-sys-color-primary)`
                        : `2px solid var(--md-sys-color-outline-variant)`,
                      backgroundColor: isSelected
                        ? 'var(--md-sys-color-primary-container)'
                        : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)';
                        e.currentTarget.style.borderColor = 'var(--md-sys-color-outline)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'var(--md-sys-color-outline-variant)';
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: careerType?.color }}
                      ></div>
                      <div className="flex-1">
                        <div className="md-typescale-body-large font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{option.text}</div>
                        <div className="md-typescale-body-small mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{careerType?.name}</div>
                      </div>
                      {isSelected && (
                        <div style={{ color: 'var(--md-sys-color-primary)' }}>
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
            <button
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="md-typescale-label-large px-6 py-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: 'var(--md-sys-color-primary)',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                background: 'none',
                border: '1px solid var(--md-sys-color-outline)',
              }}
              onMouseEnter={(e) => { if (currentQuestionIndex !== 0) e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              上一题
            </button>
            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className="md-typescale-label-large px-6 py-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  border: 'none',
                }}
                onMouseEnter={(e) => { if (allAnswered && !submitting) { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary-container)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary-container)'; }}}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary)'; }}
              >
                {submitting ? '提交中...' : '提交测试'}
              </button>
            ) : (
              <button
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                className="md-typescale-label-large px-6 py-2.5 transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  border: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary-container)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary-container)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary)'; }}
              >
                下一题
              </button>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard variant="elevated">
          <h3 className="md-typescale-title-medium mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>题目导航</h3>
          <div className="grid grid-cols-6 gap-2">
            {testInfo.questions.map((q, index) => {
              const isAnswered = answers.some(a => a.questionId === q.id);
              const isCurrent = index === currentQuestionIndex;
              
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className="py-2 px-3 md-typescale-label-medium font-medium transition-colors cursor-pointer"
                  style={{
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    backgroundColor: isCurrent
                      ? 'var(--md-sys-color-primary)'
                      : isAnswered
                      ? 'var(--md-sys-color-success, #E8F5E9)'
                      : 'var(--md-sys-color-surface-container-high)',
                    color: isCurrent
                      ? 'var(--md-sys-color-on-primary)'
                      : isAnswered
                      ? 'var(--md-sys-color-success)'
                      : 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </SurfaceCard>

        {error && (
          <div
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 md-typescale-body-medium"
            style={{
              backgroundColor: 'var(--md-sys-color-error)',
              color: 'var(--md-sys-color-on-error)',
              borderRadius: 'var(--md-sys-shape-corner-large)',
              boxShadow: 'var(--md-sys-elevation-3)',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}