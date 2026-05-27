import { useEffect, useRef } from 'react';
import { Spin, Button, Tag } from 'antd';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import type { AIMessage } from '../../../types';

interface ChatViewProps {
  messages: AIMessage[];
  onSend: (content: string) => void;
  isStreaming: boolean;
  isInterview?: boolean;
  currentScore?: number | null;
  currentFeedback?: string;
  averageScore?: number;
  isInterviewRunning?: boolean;
  isInterviewCompleted?: boolean;
  conversationName?: string;
  onEndInterview?: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'var(--md-sys-color-success)';
  if (score >= 80) return 'var(--md-sys-color-primary)';
  if (score >= 70) return 'var(--md-sys-color-warning)';
  if (score >= 60) return 'var(--md-sys-color-warning)';
  return 'var(--md-sys-color-error)';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 70) return '中等';
  if (score >= 60) return '及格';
  return '需要改进';
}

export default function ChatView({
  messages,
  onSend,
  isStreaming,
  isInterview = false,
  currentScore,
  currentFeedback,
  averageScore = 0,
  isInterviewRunning = false,
  isInterviewCompleted = false,
  conversationName = '',
  onEndInterview,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {isInterview && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--surface-container)]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg" style={{ color: 'var(--md-sys-color-primary)' }}>
              psychology
            </span>
            <span className="font-medium text-sm">{conversationName}</span>
          </div>
          <div className="flex items-center gap-2">
            {averageScore > 0 && (
              <Tag color={averageScore >= 80 ? 'green' : averageScore >= 60 ? 'blue' : 'red'}>
                平均分: {averageScore.toFixed(1)} ({getScoreLabel(averageScore)})
              </Tag>
            )}
            {isInterviewRunning && onEndInterview && (
              <Button size="small" danger onClick={onEndInterview}>
                结束面试
              </Button>
            )}
            {isInterviewCompleted && (
              <Tag color="green">面试已完成</Tag>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)]">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-30">
              {isInterview ? 'psychology' : 'smart_toy'}
            </span>
            <p className="text-lg font-medium mb-2 text-[var(--color-text)]">
              {isInterview ? '面试模拟' : '你好，我是职途助手'}
            </p>
            <p className="text-sm">
              {isInterview ? '回答面试官的问题，系统会实时评分' : '可以问我任何关于求职、简历、面试的问题'}
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isInterview={isInterview}
          />
        ))}
        {isStreaming && messages.length > 0 && messages[messages.length - 1]?.senderType === 'assistant' && !messages[messages.length - 1]?.content && (
          <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
              <span className="material-symbols-outlined text-primary text-sm">
                {isInterview ? 'psychology' : 'smart_toy'}
              </span>
            </div>
            <Spin size="small" />
          </div>
        )}
      </div>
      {isInterview && currentScore !== null && currentScore !== undefined && (
        <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--surface-container-low)]">
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>本次评分</span>
            <span className="text-xl font-bold" style={{ color: getScoreColor(currentScore) }}>
              {currentScore}
            </span>
            <span className="text-sm" style={{ color: getScoreColor(currentScore) }}>
              {getScoreLabel(currentScore)}
            </span>
            {currentFeedback && (
              <span className="text-sm ml-2" style={{ color: 'var(--color-text-secondary)' }}>
                💡 {currentFeedback}
              </span>
            )}
          </div>
        </div>
      )}
      <ChatInput
        onSend={onSend}
        disabled={isStreaming || (isInterview && isInterviewCompleted)}
        placeholder={isInterview ? '输入你的回答...' : '输入你的求职问题...'}
      />
    </div>
  );
}