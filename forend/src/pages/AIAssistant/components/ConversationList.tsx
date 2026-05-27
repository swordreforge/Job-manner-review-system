import { useState } from 'react';
import { Button, List, Input, Popconfirm, Empty } from 'antd';
import { PlusOutlined, MessageOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { AIConversation } from '../../../types';

interface ConversationListProps {
  conversations: AIConversation[];
  currentId: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  loading?: boolean;
  mode: 'normal' | 'interview';
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#1B8C3B';
  if (score >= 80) return '#0B57D0';
  if (score >= 70) return '#8F5900';
  if (score >= 60) return '#8F5900';
  return '#BA1A1A';
}

export default function ConversationList({
  conversations,
  currentId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  loading = false,
  mode,
}: ConversationListProps) {
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleRename = (id: number) => {
    if (renameValue.trim()) {
      onRename(id, renameValue.trim());
    }
    setRenaming(null);
    setRenameValue('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--color-border)]">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} block loading={loading}>
          {mode === 'interview' ? '新建面试' : '新建对话'}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <Empty description={mode === 'interview' ? '暂无面试' : '暂无对话'} className="mt-8" />
        ) : (
          <List
            dataSource={conversations}
            renderItem={(conv) => (
              <List.Item
                className={`cursor-pointer px-4 py-3 hover:bg-[var(--surface-container-high)] transition-colors ${
                  conv.id === currentId ? 'bg-[var(--color-primary-bg)]' : ''
                }`}
                onClick={() => {
                  if (renaming !== conv.id) onSelect(conv.id);
                }}
              >
                {renaming === conv.id ? (
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onPressEnter={() => handleRename(conv.id)}
                    onBlur={() => handleRename(conv.id)}
                    autoFocus
                    className="flex-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center min-w-0 flex-1">
                      <MessageOutlined className="mr-2 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-sm">{conv.name}</span>
                        {conv.chatType === 'interview_review' && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {conv.interviewStatus && (
                              <span
                                className="text-xs px-1 rounded"
                                style={{
                                  color: conv.interviewStatus === 'completed'
                                    ? 'var(--md-sys-color-success)'
                                    : conv.interviewStatus === 'running'
                                    ? 'var(--md-sys-color-primary)'
                                    : 'var(--md-sys-color-on-surface-variant)',
                                  backgroundColor: conv.interviewStatus === 'completed'
                                    ? 'var(--md-sys-color-success-container)'
                                    : conv.interviewStatus === 'running'
                                    ? 'var(--md-sys-color-primary-container)'
                                    : 'var(--md-sys-color-surface-container-high)',
                                }}
                              >
                                {conv.interviewStatus === 'completed' ? '已完成' : conv.interviewStatus === 'running' ? '进行中' : '已取消'}
                              </span>
                            )}
                            {conv.interviewAverageScore != null && conv.interviewAverageScore > 0 && (
                              <span className="text-xs" style={{ color: getScoreColor(conv.interviewAverageScore) }}>
                                {conv.interviewAverageScore.toFixed(1)}分
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <EditOutlined
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenaming(conv.id);
                          setRenameValue(conv.name);
                        }}
                      />
                      <Popconfirm
                        title="确定删除此对话？"
                        onConfirm={() => onDelete(conv.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <DeleteOutlined
                          className="text-[var(--color-text-secondary)] hover:text-red-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </div>
                  </div>
                )}
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}