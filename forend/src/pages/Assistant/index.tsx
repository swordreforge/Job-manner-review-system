import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Input, Popconfirm, message as antdMessage, Spin, Empty, Typography, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, MenuOutlined, SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUIStore } from '../../stores';
import { assistantApi } from '../../api';
import type { AssistantConversation, AssistantMessage } from '../../types';

const { Text } = Typography;

const QUICK_QUESTIONS = [
  { label: '如何准备大厂面试？', track: 'bigtech' as const },
  { label: '国企最看重什么能力？', track: 'gov' as const },
  { label: '帮我分析职业发展方向', track: 'bigtech' as const },
];

export default function AssistantPage() {
  const { track } = useUIStore();
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<AssistantConversation | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamContent, scrollToBottom]);

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConvs(true);
      const res = await assistantApi.listConversations(1, 100);
      if (res.code === 0 && res.data) {
        setConversations(res.data.list || []);
      }
    } catch {
      antdMessage.error('加载对话列表失败');
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      setLoadingMsgs(true);
      const res = await assistantApi.getMessages(conversationId);
      if (res.code === 0 && res.data) {
        setMessages(res.data.list || []);
      }
    } catch {
      antdMessage.error('加载消息失败');
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const handleSelectConversation = useCallback(async (conv: AssistantConversation) => {
    setActiveConversation(conv);
    setSidebarVisible(false);
    await loadMessages(conv.id);
  }, [loadMessages]);

  const handleNewConversation = useCallback(async () => {
    try {
      const res = await assistantApi.createConversation({ track });
      if (res.code === 0 && res.data) {
        const newConv = res.data;
        setConversations(prev => [newConv, ...prev]);
        setActiveConversation(newConv);
        setMessages([]);
        setStreamContent('');
        setSidebarVisible(false);
      } else {
        antdMessage.error(res.msg || '创建对话失败');
      }
    } catch {
      antdMessage.error('创建对话失败');
    }
  }, [track]);

  const handleDeleteConversation = useCallback(async (id: number) => {
    try {
      await assistantApi.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversation?.id === id) {
        setActiveConversation(null);
        setMessages([]);
        setStreamContent('');
      }
      antdMessage.success('对话已删除');
    } catch {
      antdMessage.error('删除失败');
    }
  }, [activeConversation]);

  const handleSend = useCallback(async (textInput?: string) => {
    const content = (textInput || input).trim();
    if (!content || streaming) return;

    let targetConvId = activeConversation?.id;

    if (!targetConvId) {
      try {
        const res = await assistantApi.createConversation({ track });
        if (res.code === 0 && res.data) {
          targetConvId = res.data.id;
          setActiveConversation(res.data);
          setConversations(prev => [res.data, ...prev]);
        } else {
          antdMessage.error(res.msg || '创建对话失败');
          return;
        }
      } catch {
        antdMessage.error('创建对话失败');
        return;
      }
    }

    const userMsg: AssistantMessage = {
      id: Date.now(),
      conversationId: targetConvId!,
      role: 'user',
      content,
      createdAt: Date.now() / 1000,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);
    setStreamContent('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await assistantApi.chatStream(
        { conversationId: targetConvId!, message: content },
        (event) => {
          if (controller.signal.aborted) return;

          if (event.type === 'chunk' || event.type === 'message' || event.type === 'data') {
            const text = event.data?.content || event.data?.text || event.data?.message || '';
            if (typeof text === 'string' && text) {
              setStreamContent(prev => prev + text);
            }
          }

          if (event.type === 'done' || (event.type === 'data' && event.data?.done)) {
            setStreaming(false);
            setStreamContent('');
            loadMessages(targetConvId!);
            loadConversations();
          }
        },
        (error) => {
          console.error('Stream error:', error);
          setStreaming(false);
          setStreamContent('');
          if (!controller.signal.aborted) {
            antdMessage.error('连接断开，请重试');
          }
        }
      );

      if (streaming) {
        setStreaming(false);
        setStreamContent('');
        loadMessages(targetConvId!);
        loadConversations();
      }
    } catch {
      setStreaming(false);
      setStreamContent('');
      if (!controller.signal.aborted) {
        antdMessage.error('发送失败');
      }
    } finally {
      abortRef.current = null;
    }
  }, [input, streaming, activeConversation, track, loadMessages, loadConversations]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const getTrackLabel = (t: 'bigtech' | 'gov') => t === 'bigtech' ? '大厂' : '国企';
  const getTrackColor = (t: 'bigtech' | 'gov') => t === 'bigtech' ? 'blue' : 'green';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        @media (max-width: 767px) {
          .assistant-sidebar {
            position: fixed;
            left: 0;
            top: 64px;
            bottom: 0;
            z-index: 100;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .assistant-sidebar.sidebar-open {
            transform: translateX(0);
          }
          .assistant-sidebar-overlay {
            display: block;
          }
        }
        @media (min-width: 768px) {
          .assistant-sidebar {
            transform: none !important;
            position: relative !important;
          }
          .assistant-sidebar-overlay {
            display: none !important;
          }
          .assistant-mobile-toggle {
            display: none !important;
          }
        }
        .assistant-msg-user {
          background-color: var(--md-sys-color-primary);
          color: var(--md-sys-color-on-primary);
          border-radius: 16px 4px 16px 16px;
        }
        .assistant-msg-assistant {
          background-color: var(--md-sys-color-surface-container-high);
          color: var(--md-sys-color-on-surface);
          border-radius: 4px 16px 16px 16px;
        }
        .assistant-msg-assistant p { margin-bottom: 0.5em; }
        .assistant-msg-assistant p:last-child { margin-bottom: 0; }
        .assistant-msg-assistant ul, .assistant-msg-assistant ol { padding-left: 1.5em; margin-bottom: 0.5em; }
        .assistant-msg-assistant code {
          background-color: var(--md-sys-color-surface-container);
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .assistant-msg-assistant pre {
          background-color: var(--md-sys-color-surface-container);
          padding: 0.75em;
          border-radius: 8px;
          overflow-x: auto;
          margin-bottom: 0.5em;
        }
        .assistant-msg-assistant pre code { background: none; padding: 0; }
        .assistant-msg-assistant h1, .assistant-msg-assistant h2, .assistant-msg-assistant h3 {
          font-size: 1em; font-weight: 600; margin: 0.5em 0 0.25em;
        }
        .assistant-msg-assistant strong { font-weight: 600; }
        .assistant-msg-assistant blockquote {
          border-left: 3px solid var(--md-sys-color-primary);
          padding-left: 0.75em;
          margin: 0.5em 0;
          color: var(--md-sys-color-on-surface-variant);
        }
      `}</style>

      {sidebarVisible && (
        <div
          className="assistant-sidebar-overlay"
          style={{
            position: 'fixed', inset: 0, zIndex: 99,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => setSidebarVisible(false)}
        />
      )}

      <div
        className={`assistant-sidebar ${sidebarVisible ? 'sidebar-open' : ''}`}
        style={{
          width: 280,
          minWidth: 280,
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderRight: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 16, borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            block
            onClick={handleNewConversation}
            size="large"
          >
            新对话
          </Button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {loadingConvs && conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Spin />
            </div>
          ) : conversations.length === 0 ? (
            <Empty
              description="暂无对话"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                style={{
                  padding: '10px 12px',
                  marginBottom: 6,
                  borderRadius: 8,
                  cursor: 'pointer',
                  backgroundColor: activeConversation?.id === conv.id
                    ? 'var(--md-sys-color-primary-container)'
                    : 'transparent',
                  color: activeConversation?.id === conv.id
                    ? 'var(--md-sys-color-on-primary-container)'
                    : 'var(--md-sys-color-on-surface)',
                  transition: 'background-color 0.2s',
                  border: activeConversation?.id === conv.id
                    ? '1px solid var(--md-sys-color-outline)'
                    : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: activeConversation?.id === conv.id ? 600 : 400,
                      fontSize: 14,
                    }}
                  >
                    {conv.title || '新对话'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Tag
                      color={getTrackColor(conv.track)}
                      style={{ fontSize: 11, lineHeight: '16px', padding: '0 4px', margin: 0 }}
                    >
                      {getTrackLabel(conv.track)}
                    </Tag>
                  </div>
                </div>
                <Popconfirm
                  title="确认删除此对话？"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0 }}
                  />
                </Popconfirm>
              </div>
            ))
          )}
        </div>

        <div style={{
          padding: 12,
          borderTop: '1px solid var(--md-sys-color-outline-variant)',
          textAlign: 'center',
        }}>
          <Text style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }}>
            当前赛道：{getTrackLabel(track)}
          </Text>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <Button
          className="assistant-mobile-toggle"
          icon={<MenuOutlined />}
          type="text"
          onClick={() => setSidebarVisible(!sidebarVisible)}
          style={{
            position: 'absolute', top: 8, left: 8, zIndex: 10,
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        />

        {!activeConversation && messages.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 24,
          }}>
            <div style={{ textAlign: 'center', maxWidth: 480 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 64, color: 'var(--md-sys-color-primary)' }}>
                smart_toy
              </span>
              <h2 style={{
                color: 'var(--md-sys-color-on-surface)',
                marginTop: 16, marginBottom: 8,
              }}>
                职业规划助手
              </h2>
              <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 24 }}>
                我可以帮你规划职业方向、准备面试、分析岗位匹配度。选择一个问题开始，或直接输入你的问题。
              </p>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12, width: '100%',
              }}>
                {QUICK_QUESTIONS.map((q, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (!streaming) handleSend(q.label);
                    }}
                    style={{
                      padding: '16px 12px',
                      borderRadius: 12,
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      cursor: streaming ? 'not-allowed' : 'pointer',
                      backgroundColor: 'var(--md-sys-color-surface-container-low)',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!streaming) {
                        e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container)';
                        e.currentTarget.style.borderColor = 'var(--md-sys-color-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-low)';
                      e.currentTarget.style.borderColor = 'var(--md-sys-color-outline-variant)';
                    }}
                  >
                    <div style={{ fontSize: 14, color: 'var(--md-sys-color-on-surface)', marginBottom: 4 }}>
                      {q.label}
                    </div>
                    <Tag color={getTrackColor(q.track)} style={{ fontSize: 10, lineHeight: '14px', padding: '0 4px', margin: 0 }}>
                      {getTrackLabel(q.track)}
                    </Tag>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              ref={messagesContainerRef}
              style={{
                flex: 1, overflowY: 'auto', padding: '16px 20px',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}
            >
              {loadingMsgs ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin />
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {msg.role !== 'user' && (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        backgroundColor: 'var(--md-sys-color-primary-container)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginRight: 8, marginTop: 4,
                      }}>
                        <RobotOutlined style={{ color: 'var(--md-sys-color-on-primary-container)', fontSize: 16 }} />
                      </div>
                    )}
                    <div
                      className={msg.role === 'user' ? 'assistant-msg-user' : 'assistant-msg-assistant'}
                      style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        fontSize: 14,
                        lineHeight: 1.6,
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.role === 'user' ? (
                        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        backgroundColor: 'var(--md-sys-color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginLeft: 8, marginTop: 4,
                      }}>
                        <UserOutlined style={{ color: 'var(--md-sys-color-on-primary)', fontSize: 14 }} />
                      </div>
                    )}
                  </div>
                ))
              )}

              {streaming && streamContent && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    backgroundColor: 'var(--md-sys-color-primary-container)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginRight: 8, marginTop: 4,
                  }}>
                    <RobotOutlined style={{ color: 'var(--md-sys-color-on-primary-container)', fontSize: 16 }} />
                  </div>
                  <div
                    className="assistant-msg-assistant"
                    style={{
                      maxWidth: '70%',
                      padding: '10px 14px',
                      fontSize: 14,
                      lineHeight: 1.6,
                      wordBreak: 'break-word',
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
                  </div>
                </div>
              )}

              {streaming && !streamContent && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    backgroundColor: 'var(--md-sys-color-primary-container)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <RobotOutlined style={{ color: 'var(--md-sys-color-on-primary-container)', fontSize: 16 }} />
                  </div>
                  <div style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    borderRadius: '4px 16px 16px 16px',
                    color: 'var(--md-sys-color-on-surface)',
                    fontSize: 14,
                  }}>
                    <Spin size="small" />
                    <span style={{ marginLeft: 8 }}>思考中...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div style={{
              padding: '12px 20px 16px',
              borderTop: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface)',
            }}>
              <div style={{ display: 'flex', gap: 8, maxWidth: 800, margin: '0 auto' }}>
                <Input.TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入你的问题..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  disabled={streaming}
                  style={{ flex: 1, resize: 'none' }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => handleSend()}
                  loading={streaming}
                  disabled={!input.trim() || streaming}
                  style={{ alignSelf: 'flex-end' }}
                >
                  发送
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}