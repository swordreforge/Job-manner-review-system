import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hollandApi } from '../../api';
import type { HollandAnswer, HollandTestInfo } from '../../types';

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
    // 检查是否已经回答过这个问题
    const existingIndex = answers.findIndex(a => a.questionId === questionId);
    const newAnswers = existingIndex >= 0
      ? answers.map((a, i) => i === existingIndex ? { questionId, selectedType } : a)
      : [...answers, { questionId, selectedType } as HollandAnswer];
    
    setAnswers(newAnswers);

    // 自动跳到下一题
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
      <div className="min-h-screen relative z-10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">加载题目中...</p>
        </div>
      </div>
    );
  }

  if (error && !testInfo) {
    return (
      <div className="min-h-screen relative z-10 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 shadow-sm max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadQuestions}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            重新加载
          </button>
        </div>
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
    <div className="min-h-screen relative z-10">
      <div className="p-6 max-w-3xl mx-auto">
        {/* 头部信息 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{testInfo.testInfo.name}</h1>
          <p className="text-gray-600 mb-4">{testInfo.testInfo.description}</p>
          
          {/* 进度条 */}
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                题目 {currentQuestionIndex + 1} / {testInfo.questions.length}
              </span>
              <span className="text-sm font-medium text-orange-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 题目卡片 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
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
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: careerType?.color }}
                      ></div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-800">{option.text}</div>
                        <div className="text-sm text-gray-500 mt-1">{careerType?.name}</div>
                      </div>
                      {isSelected && (
                        <div className="text-orange-500">
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

          {/* 导航按钮 */}
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              上一题
            </button>
            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '提交中...' : '提交测试'}
              </button>
            ) : (
              <button
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                下一题
              </button>
            )}
          </div>
        </div>

        {/* 题目导航 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-3">题目导航</h3>
          <div className="grid grid-cols-6 gap-2">
            {testInfo.questions.map((q, index) => {
              const isAnswered = answers.some(a => a.questionId === q.id);
              const isCurrent = index === currentQuestionIndex;
              
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-orange-500 text-white'
                      : isAnswered
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}