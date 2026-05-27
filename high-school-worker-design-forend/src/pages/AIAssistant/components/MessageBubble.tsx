import { Tag } from 'antd';
import type { AIMessage } from '../../../types';

interface MessageBubbleProps {
  message: AIMessage;
  isInterview?: boolean;
}

export default function MessageBubble({ message, isInterview = false }: MessageBubbleProps) {
  const isUser = message.senderType !== 'assistant';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 shrink-0">
          <span className="material-symbols-outlined text-primary text-sm">
            {isInterview ? 'psychology' : 'smart_toy'}
          </span>
        </div>
      )}
      <div className="max-w-[75%]">
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-[var(--color-primary)] text-white rounded-br-md'
              : 'bg-[var(--surface-container-low)] text-[var(--color-text)] rounded-bl-md'
          }`}
        >
          {message.content || '...'}
        </div>
        {isInterview && !isUser && message.score != null && message.score > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <Tag color={message.score >= 80 ? 'green' : message.score >= 60 ? 'blue' : 'red'} className="text-xs">
              评分: {message.score}
            </Tag>
            {message.feedback && (
              <Tag color="blue" className="text-xs">
                {message.feedback}
              </Tag>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ml-2 shrink-0">
          <span className="material-symbols-outlined text-primary text-sm">person</span>
        </div>
      )}
    </div>
  );
}