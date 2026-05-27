import { useEffect, useState } from 'react';
import { Segmented, Modal, Card } from 'antd';
import { useAIChatStore } from '../../stores';
import ConversationList from './components/ConversationList';
import ChatView from './components/ChatView';

export default function AIAssistantPage() {
  const {
    conversations,
    currentConversationId,
    messages,
    isStreaming,
    mode,
    currentScore,
    currentFeedback,
    averageScore,
    loadConversations,
    createConversation,
    renameConversation,
    deleteConversation,
    selectConversation,
    sendMessage,
    setMode,
  } = useAIChatStore();

  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const currentConversation = conversations.find((c) => c.id === currentConversationId);
  const isInterview = currentConversation?.chatType === 'interview_review';
  const isInterviewRunning = isInterview && currentConversation?.interviewStatus === 'running';
  const isInterviewCompleted = isInterview && currentConversation?.interviewStatus === 'completed';

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const filteredConversations = conversations.filter((c) =>
    mode === 'normal' ? c.chatType === 'ai_assistant' : c.chatType === 'interview_review'
  );

  const handleCreate = () => {
    if (mode === 'interview') {
      setInterviewModalVisible(true);
    } else {
      createConversation();
    }
  };

  const handleStartInterview = (interviewMode: 'practice' | 'assessment') => {
    createConversation(undefined, 'interview_review', interviewMode);
    setInterviewModalVisible(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--surface-container)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">AI 对话</h2>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'normal' | 'interview')}
          options={[
            { label: '普通模式', value: 'normal' },
            { label: '面试模式', value: 'interview' },
          ]}
        />
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="w-64 border-r border-[var(--color-border)] bg-[var(--surface-container-low)]">
          <ConversationList
            conversations={filteredConversations}
            currentId={currentConversationId}
            onSelect={selectConversation}
            onCreate={handleCreate}
            onRename={renameConversation}
            onDelete={deleteConversation}
            mode={mode}
          />
        </div>
        <div className="flex-1 min-w-0 bg-[var(--surface)]">
          {currentConversationId ? (
            <ChatView
              messages={messages}
              onSend={sendMessage}
              isStreaming={isStreaming}
              isInterview={isInterview}
              currentScore={currentScore}
              currentFeedback={currentFeedback}
              averageScore={averageScore}
              isInterviewRunning={isInterviewRunning}
              isInterviewCompleted={isInterviewCompleted}
              conversationName={currentConversation?.name || ''}
              onEndInterview={() => {
                if (currentConversation?.interviewSessionId) {
                  useAIChatStore.getState().endInterview(currentConversation.interviewSessionId);
                }
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)]">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-30">
                {mode === 'interview' ? 'psychology' : 'forum'}
              </span>
              <p className="text-lg">
                {mode === 'interview' ? '选择或创建一个面试对话开始' : '选择或创建一个对话开始'}
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        title="选择面试模式"
        open={interviewModalVisible}
        onCancel={() => setInterviewModalVisible(false)}
        footer={null}
        width={480}
      >
        <div className="space-y-4">
          <Card
            hoverable
            onClick={() => handleStartInterview('practice')}
            className="cursor-pointer"
            style={{ borderColor: 'var(--md-sys-color-primary)' }}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🏢</div>
              <div className="font-semibold text-lg mb-1">大厂技术面</div>
              <div className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                算法题、项目深挖、系统设计
              </div>
              <div className="text-xs mt-2 p-2 rounded" style={{ color: 'var(--md-sys-color-on-surface-variant)', backgroundColor: 'var(--md-sys-color-primary-container)' }}>
                💡 重点准备项目复盘、算法刷题、行业分析，突出数据成果和独立解决问题能力
              </div>
            </div>
          </Card>
          <Card
            hoverable
            onClick={() => handleStartInterview('assessment')}
            className="cursor-pointer"
            style={{ borderColor: 'var(--md-sys-color-success)' }}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🏛️</div>
              <div className="font-semibold text-lg mb-1">国企综合面</div>
              <div className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                行测、申论、综合素养
              </div>
              <div className="text-xs mt-2 p-2 rounded" style={{ color: 'var(--md-sys-color-on-surface-variant)', backgroundColor: 'var(--md-sys-color-success-container, #e8f5e9)' }}>
                💡 准备自我介绍模板、结构化问题库，突出稳定性、组织纪律性、文字功底
              </div>
            </div>
          </Card>
        </div>
      </Modal>
    </div>
  );
}