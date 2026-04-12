import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Segmented, Input, Avatar, Tag, message, Spin, Modal, Progress, List, Select } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, HistoryOutlined, FileTextOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { interviewApi } from '../../api';
import type { InterviewSession, InterviewMessage, InterviewHistoryItem, InterviewReport } from '../../types';

export default function InterviewPage() {
  const [mode, setMode] = useState<'practice' | 'assessment'>('practice');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<string>('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyList, setHistoryList] = useState<InterviewHistoryItem[]>([]);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState<InterviewReport | null>(null);
  const [averageScore, setAverageScore] = useState<number>(0);
  // 录音相关状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [whisperModel, setWhisperModel] = useState('base');
  // 录音相关引用
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 清理录音资源
  useEffect(() => {
    return () => {
      // 组件卸载时清理资源
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleStart = async () => {
    try {
      setLoading(true);
      const response = await interviewApi.start({ mode });
      if (response.code === 0 && response.data) {
        setSession(response.data);
        setStarted(true);
        // 添加第一条AI消息
        setMessages([{
          id: 0,
          sessionId: response.data.id,
          role: 'assistant',
          content: response.data.firstQuestion,
          createdAt: Date.now() / 1000,
        }]);
      } else {
        message.error('启动面试失败');
      }
    } catch (error) {
      message.error('启动面试失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化录音时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 开始录音
  const startRecording = async () => {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // 创建 MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm' 
        });
        await transcribeAudio(audioBlob);
        
        // 停止所有音频轨道
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      message.info('开始录音...');
      
    } catch (error: any) {
      console.error('录音启动失败:', error);
      if (error.name === 'NotAllowedError') {
        message.error('无法访问麦克风，请允许麦克风权限');
      } else if (error.name === 'NotFoundError') {
        message.error('未检测到麦克风设备');
      } else {
        message.error('录音启动失败，请重试');
      }
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 文本纠错函数
  const correctText = (text: string): string => {
    // 常见语音识别错误映射
    const corrections: Record<string, string> = {
      // 面试相关
      '面是关好': '面试官好',
      '魔神': '某人',
      '魔魔': '某某',
      '摇解': '了解',
      '摇聘': '应聘',
      '摇求': '要求',
      '摇望': '希望',
      '摇请': '邀请',
      '摇约': '邀约',
      '摇见': '遇见',
      '摇想': '想象',
      '摇测': '预测',
      '摇计': '预计',
      '摇算': '预算',
      '摇期': '预期',
      '摇备': '预备',
      '摇案': '预案',
      '理想': '理想',
      '愿望': '愿望',
      '梦想': '梦想',
      '摇考': '考虑',
      '摇查': '调查',
      '摇研': '研究',
      '摇究': '探究',
      '摇验': '经验',
      '摇历': '经历',
      '摇练': '训练',
      '摇习': '学习',
      '摇问': '询问',
      '摇答': '回答',
      '摇询': '咨询',
      '摇要': '需要',
      '摇求': '需求',
      '摇控': '遥控',
      '摇制': '控制',
      '摇导': '指导',
      '摇向': '导向',
      '摇引': '引导',
      '摇领': '领导',
      '摇管': '管理',
      '摇理': '处理',
      '摇办': '办理',
      '摇序': '程序',
      '摇列': '排列',
      '摇放': '播放',
      '摇音': '声音',
      '摇乐': '音乐',
      '摇曲': '歌曲',
      '摇话': '通话',
      '摇机': '手机',
      '摇脑': '电脑',
      '摇网': '网络',
      '摇页': '网页',
      '摇站': '网站',
      '摇信': '短信',
      '摇件': '文件',
      '摇盘': '硬盘',
      '摇器': '容器',
      '摇瓶': '玻璃瓶',
      '摇杯': '杯子',
      '摇碗': '饭碗',
      '摇筷': '筷子',
      '摇刀': '小刀',
      '摇叉': '叉子',
      '摇勺': '勺子',
    };

    let correctedText = text;
    
    // 替换常见错误
    Object.keys(corrections).forEach(wrong => {
      const correct = corrections[wrong];
      // 使用正则表达式全局替换
      correctedText = correctedText.replace(new RegExp(wrong, 'g'), correct);
    });

    return correctedText;
  };

  // 语音识别
  const transcribeAudio = async (audioBlob: Blob) => {
    setTranscribing(true);
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    
    try {
      const response = await fetch(`http://localhost:8000/transcribe?model=${whisperModel}`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.text && data.text.trim()) {
          // 应用文本纠错
          const correctedText = correctText(data.text.trim());
          setInput(prev => prev + (prev ? ' ' : '') + correctedText);
          message.success('语音识别完成（已自动纠错）');
        } else {
          message.warning('未识别到语音内容，请重试');
        }
      } else {
        const error = await response.json();
        message.error(`识别失败: ${error.detail || '未知错误'}`);
      }
    } catch (error) {
      console.error('语音识别失败:', error);
      message.error('语音识别服务连接失败，请检查服务是否启动');
    } finally {
      setTranscribing(false);
    }
  };

  // 手动纠错函数
  const handleManualCorrect = () => {
    if (!input.trim()) {
      message.warning('请先输入内容');
      return;
    }
    
    const correctedText = correctText(input);
    setInput(correctedText);
    message.success('文本已纠错');
  };

  const handleSend = async () => {
    if (!input.trim() || !session || isChatting) return;

    const userMessage: InterviewMessage = {
      id: Date.now(),
      sessionId: session.id,
      role: 'user',
      content: input,
      createdAt: Date.now() / 1000,
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setCurrentScore(null);
    setCurrentFeedback('');
    setIsChatting(true);

    try {
      await interviewApi.chatStream(
        { sessionId: session.id, message: input },
        (event) => {
          console.log('收到SSE事件:', event);
          
          // 根据事件类型处理不同的数据
          if (event.type === 'question' && event.data.content) {
            // 添加或更新AI回复
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              const newAiMessage: InterviewMessage = {
                id: Date.now(),
                sessionId: session.id,
                role: 'assistant',
                content: event.data.content,
                createdAt: Date.now() / 1000,
              };
              
              // 检查是否已经有一条AI消息，如果就更新它，否则添加新的
              if (lastMessage && lastMessage.role === 'assistant') {
                return [...prev.slice(0, -1), newAiMessage];
              } else {
                return [...prev, newAiMessage];
              }
            });
          }
          
          if (event.type === 'score' && event.data.value !== undefined) {
            setCurrentScore(event.data.value);
          }
          
          if (event.type === 'feedback' && event.data.content) {
            setCurrentFeedback(event.data.content);
          }
          
          if (event.type === 'session_update' && event.data.averageScore !== undefined) {
            setAverageScore(event.data.averageScore);
          }
          
          if (event.type === 'done' && event.data.message === '面试结束') {
            message.success('面试已完成，可以查看报告');
            // 更新会话状态为已完成
            setSession(prev => prev ? { ...prev, status: 'completed' } : null);
            handleShowReport(session.id);
          }
        },
        (error) => {
          console.error('SSE错误:', error);
          message.error('连接断开');
        }
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败');
    } finally {
      setIsChatting(false);
    }
  };

  const handleEnd = async () => {
    if (!session) return;

    Modal.confirm({
      title: '确认结束面试？',
      content: '结束后将自动生成面试报告',
      okText: '确认结束',
      cancelText: '继续面试',
      onOk: async () => {
        try {
          const response = await interviewApi.end(session.id, 'user_completed');
          if (response.code === 0) {
            message.success('面试已结束');
            setSession(prev => prev ? { ...prev, status: 'completed' } : null);
            handleShowReport(session.id);
          } else if (response.code === 400 && response.msg === 'session already ended') {
            // 会话已结束，直接显示报告
            message.info('面试已经结束，正在为您显示报告');
            setSession(prev => prev ? { ...prev, status: 'completed' } : null);
            handleShowReport(session.id);
          } else {
            message.error(response.msg || '结束面试失败');
          }
        } catch (error) {
          message.error('结束面试失败');
          console.error(error);
        }
      },
    });
  };

  const handleCancel = async () => {
    if (!session) return;

    Modal.confirm({
      title: '确认取消面试？',
      content: '取消后将不会生成面试报告，可以重新开始新的面试',
      okText: '确认取消',
      okButtonProps: { danger: true },
      cancelText: '继续面试',
      onOk: async () => {
        try {
          const response = await interviewApi.end(session.id, 'cancelled');
          if (response.code === 0) {
            message.success('面试已取消');
            setSession(null);
            setMessages([]);
            setCurrentScore(null);
            setCurrentFeedback('');
            setAverageScore(0);
            setStarted(false);
          } else {
            message.error('取消面试失败');
          }
        } catch (error) {
          message.error('取消面试失败');
          console.error(error);
        }
      },
    });
  };

  const handleShowHistory = async () => {
    setHistoryVisible(true);
    setHistoryLoading(true);
    try {
      const response = await interviewApi.getHistory();
      if (response.code === 0 && response.data) {
        setHistoryList(response.data.list);
      }
    } catch (error) {
      message.error('获取历史记录失败');
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleShowReport = async (sessionId: number) => {
    setReportVisible(true);
    setReportLoading(true);
    
    // 添加重试逻辑，因为报告生成是异步的
    let retries = 0;
    const maxRetries = 3;
    
    const tryGetReport = async (): Promise<boolean> => {
      try {
        const response = await interviewApi.getReport(sessionId);
        if (response.code === 0 && response.data) {
          setCurrentReport(response.data);
          return true;
        } else {
          console.log('获取报告失败，可能报告还在生成中');
          return false;
        }
      } catch (error) {
        console.error('获取报告异常:', error);
        return false;
      }
    };
    
    // 尝试获取报告
    let success = await tryGetReport();
    
    // 如果失败，进行重试
    while (!success && retries < maxRetries) {
      retries++;
      console.log(`重试获取报告 (${retries}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // 递增延迟
      success = await tryGetReport();
    }
    
    if (!success) {
      message.error('获取报告失败，请稍后手动刷新或重新生成');
    }
    
    setReportLoading(false);
  };

  const getModeLabel = (m: 'practice' | 'assessment') => {
    return m === 'practice' ? '大厂技术面' : '国企综合面';
  };

  const getModeDescription = (m: 'practice' | 'assessment') => {
    return m === 'practice' 
      ? '算法题、项目深挖、系统设计' 
      : '行测、申论、综合素养';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 70) return '#faad14';
    if (score >= 60) return '#fa8c16';
    return '#f5222d';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '中等';
    if (score >= 60) return '及格';
    return '需要改进';
  };

  const handleBack = () => {
    if (started) {
      Modal.confirm({
        title: '确认返回？',
        content: '返回后将结束当前面试',
        okText: '确认返回',
        okButtonProps: { danger: true },
        cancelText: '继续面试',
        onOk: () => {
          if (session) {
            interviewApi.end(session.id, 'cancelled').catch(console.error);
          }
          setSession(null);
          setMessages([]);
          setCurrentScore(null);
          setCurrentFeedback('');
          setAverageScore(0);
          setStarted(false);
        },
      });
    }
  };

  return (
    <div className="min-h-screen p-4">
      {!started ? (
        <div className="max-w-4xl mx-auto mt-10 relative z-10">
          <Card 
            title={
              <div className="flex items-center gap-4">
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => navigate('/start')}
                  type="text"
                />
                <span className="text-2xl font-bold text-center flex-1">面试模拟系统</span>
              </div>
            } 
            className="glass-effect shadow-xl"
          >
            <div className="text-center mb-6">
              <p className="text-gray-600">选择面试模式，开始你的模拟面试练习</p>
            </div>
            
            <Segmented
              value={mode}
              onChange={(v) => setMode(v as 'practice' | 'assessment')}
              options={[
                { 
                  label: <div className="flex items-center gap-2">
                    <span>🏢</span>
                    <span>大厂技术面</span>
                  </div>, 
                  value: 'practice' 
                },
                { 
                  label: <div className="flex items-center gap-2">
                    <span>🏛️</span>
                    <span>国企综合面</span>
                  </div>, 
                  value: 'assessment' 
                },
              ]}
              className="w-full mb-6"
              size="large"
            />
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card 
                className={mode === 'practice' ? 'glass-effect border-blue-500 shadow-md' : 'glass-effect'}
                hoverable
                onClick={() => setMode('practice')}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🏢</div>
                  <div className="font-semibold text-lg mb-2">大厂技术面</div>
                  <div className="text-gray-500 text-sm">
                    算法题、项目深挖、系统设计
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    适合技术岗位求职者
                  </div>
                </div>
              </Card>
              
              <Card 
                className={mode === 'assessment' ? 'glass-effect border-green-500 shadow-md' : 'glass-effect'}
                hoverable
                onClick={() => setMode('assessment')}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🏛️</div>
                  <div className="font-semibold text-lg mb-2">国企综合面</div>
                  <div className="text-gray-500 text-sm">
                    行测、申论、综合素养
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    适合国企求职者
                  </div>
                </div>
              </Card>
            </div>
            
            <Button 
              type="primary" 
              size="large" 
              block 
              loading={loading}
              onClick={handleStart}
              className="h-12 text-lg"
            >
              开始模拟面试
            </Button>
            
            <div className="mt-6 text-center">
              <Button 
                icon={<HistoryOutlined />} 
                onClick={handleShowHistory}
                type="link"
              >
                查看历史记录
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto relative z-10">
          <Card 
            title={
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={handleBack}
                    type="text"
                  />
                  <Avatar size="large" icon={<RobotOutlined />} />
                  <div>
                    <div className="text-lg font-semibold">{getModeLabel(mode)} - 模拟面试</div>
                    <div className="text-sm text-gray-500">
                      平均分: <span style={{ color: getScoreColor(averageScore), fontWeight: 'bold' }}>
                        {averageScore.toFixed(1)} ({getScoreLabel(averageScore)})
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                {session && session.status === 'running' && (
                  <>
                    <Button danger onClick={handleCancel}>
                      取消面试
                    </Button>
                    <Button type="primary" onClick={handleEnd}>
                      结束面试
                    </Button>
                  </>
                )}
              </div>
              </div>
            }
            className="glass-effect shadow-xl"
          >
            <div className="flex flex-col" style={{ height: 'calc(100vh - 280px)' }}>
              <div className="flex-1 overflow-auto mb-4 space-y-4 p-2">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-3 max-w-[75%] ${
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}>
                      <Avatar 
                        size="small" 
                        icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        className={msg.role === 'user' ? 'bg-blue-500' : 'bg-green-500'}
                      />
                      <div className={`p-4 rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-blue-500 text-white rounded-tr-none' 
                          : 'bg-white shadow-sm rounded-tl-none'
                      }`}>
                        <div className="text-sm mb-1 opacity-75">
                          {msg.role === 'user' ? '你' : '面试官'}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {msg.score !== undefined && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <Tag color="green" className="mr-2">
                              评分: {msg.score}
                            </Tag>
                            {msg.feedback && (
                              <Tag color="blue">
                                反馈: {msg.feedback}
                              </Tag>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {currentScore !== null && (
                  <div className="flex justify-center">
                    <Card size="small" className="glass-effect bg-gradient-to-r from-green-50 to-blue-50">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">本次回答评分</div>
                        <div className="text-3xl font-bold" style={{ color: getScoreColor(currentScore) }}>
                          {currentScore}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{getScoreLabel(currentScore)}</div>
                        {currentFeedback && (
                          <div className="mt-2 text-sm text-gray-600 italic">
                            💡 {currentFeedback}
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="border-t pt-4">
                {/* 录音控制区域 */}
                <div className="flex items-center gap-3 mb-3">
                  {isRecording ? (
                    <Button
                      danger
                      size="large"
                      onClick={stopRecording}
                      loading={transcribing}
                      className="flex items-center gap-2 min-w-[180px]"
                    >
                      <span className="animate-pulse text-red-500">●</span>
                      停止录音 ({formatTime(recordingTime)})
                    </Button>
                  ) : (
                    <Button
                      size="large"
                      onClick={startRecording}
                      loading={transcribing}
                      disabled={!session || session.status !== 'running'}
                      className="flex items-center gap-2 min-w-[180px]"
                    >
                      🎤 开始录音
                    </Button>
                  )}
                  
                  {/* 模型选择器 */}
                  <Select
                    value={whisperModel}
                    onChange={setWhisperModel}
                    disabled={isRecording}
                    className="w-[150px]"
                    options={[
                      { value: 'base', label: 'Base (快)' },
                      { value: 'small', label: 'Small (准)' },
                      { value: 'medium', label: 'Medium (更准)' },
                    ]}
                  />
                  
                  <div className="flex-1 text-center text-sm text-gray-500">
                    {isRecording ? (
                      <span className="text-red-500 font-medium">正在录音...</span>
                    ) : transcribing ? (
                      <span className="text-blue-500 font-medium">正在识别...</span>
                    ) : (
                      <span>支持语音输入，点击按钮开始录音</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                <Input.Search
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onSearch={handleSend}
                  placeholder="输入你的回答或点击录音按钮..."
                  enterButton={
                    <Button type="primary" icon={<SendOutlined />}>
                      发送
                    </Button>
                  }
                  size="large"
                  disabled={!session || session.status !== 'running'}
                  className="flex-1"
                />
                <Button
                  icon={<CheckCircleOutlined />}
                  onClick={handleManualCorrect}
                  size="large"
                  disabled={!input.trim()}
                  title="自动纠错"
                >
                  纠错
                </Button>
              </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* 历史记录弹窗 */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <HistoryOutlined />
            <span>面试历史记录</span>
          </div>
        }
        open={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
        width={800}
      >
        <Spin spinning={historyLoading}>
          <List
            dataSource={historyList}
            renderItem={(item) => {
              const isCancelled = item.averageScore === 0;
              return (
                <List.Item
                  actions={[
                    <Button 
                      key="report" 
                      type="link" 
                      icon={<FileTextOutlined />}
                      disabled={isCancelled}
                      onClick={() => {
                        if (isCancelled) {
                          message.warning('已取消的面试无法查看报告');
                          return;
                        }
                        setHistoryVisible(false);
                        handleShowReport(item.id);
                      }}
                    >
                      查看报告
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div className="flex items-center gap-2">
                        <Tag color={item.mode === 'practice' ? 'blue' : 'green'}>
                          {getModeLabel(item.mode)}
                        </Tag>
                        <span>{getModeDescription(item.mode)}</span>
                        {isCancelled && (
                          <Tag color="default">已取消</Tag>
                        )}
                      </div>
                    }
                    description={
                      <div className="space-y-1">
                        <div>
                          {isCancelled ? (
                            <Tag color="default">
                              已取消
                            </Tag>
                          ) : (
                            <Tag color={item.status === 'completed' ? 'success' : 'processing'}>
                              {item.status === 'completed' ? '已完成' : '进行中'}
                            </Tag>
                          )}
                          <span className="ml-2 text-sm">
                            平均分: <span style={{ color: isCancelled ? '#999' : getScoreColor(item.averageScore), fontWeight: 'bold' }}>
                              {isCancelled ? '-' : item.averageScore.toFixed(1)}
                            </span>
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          问题数: {item.currentQuestion}/{item.totalQuestions} | 
                          时长: {Math.floor(item.durationSeconds / 60)}分钟
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Spin>
      </Modal>
      
      {/* 面试报告弹窗 */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined />
            <span>面试评估报告</span>
          </div>
        }
        open={reportVisible}
        onCancel={() => setReportVisible(false)}
        footer={null}
        width={900}
      >
        <Spin spinning={reportLoading}>
          {currentReport && (
            <div className="space-y-6">
              {/* 总体评分 */}
              <Card title="总体评价" className="glass-effect bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2" style={{ color: getScoreColor(currentReport.overallScore) }}>
                    {currentReport.overallScore.toFixed(1)}
                  </div>
                  <div className="text-xl text-gray-700 mb-4">{getScoreLabel(currentReport.overallScore)}</div>
                  <div className="text-gray-600">{currentReport.summary}</div>
                </div>
              </Card>
              
              {/* 各项能力评分 */}
              <Card title="能力评分" className="glass-effect">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>技术能力</span>
                      <span className="font-bold">{currentReport.skillScore.toFixed(1)}</span>
                    </div>
                    <Progress 
                      percent={currentReport.skillScore} 
                      strokeColor={getScoreColor(currentReport.skillScore)}
                      size="small"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>沟通表达</span>
                      <span className="font-bold">{currentReport.communicationScore.toFixed(1)}</span>
                    </div>
                    <Progress 
                      percent={currentReport.communicationScore} 
                      strokeColor={getScoreColor(currentReport.communicationScore)}
                      size="small"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>逻辑思维</span>
                      <span className="font-bold">{currentReport.logicScore.toFixed(1)}</span>
                    </div>
                    <Progress 
                      percent={currentReport.logicScore} 
                      strokeColor={getScoreColor(currentReport.logicScore)}
                      size="small"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>自信程度</span>
                      <span className="font-bold">{currentReport.confidenceScore.toFixed(1)}</span>
                    </div>
                    <Progress 
                      percent={currentReport.confidenceScore} 
                      strokeColor={getScoreColor(currentReport.confidenceScore)}
                      size="small"
                    />
                  </div>
                </div>
              </Card>
              
              {/* 优势分析 */}
              <Card title="✅ 优势分析" className="glass-effect">
                <List
                  dataSource={currentReport.strengths}
                  renderItem={(item) => (
                    <List.Item>
                      <CheckCircleOutlined className="text-green-500 mr-2" />
                      {item}
                    </List.Item>
                  )}
                />
              </Card>
              
              {/* 改进建议 */}
              <Card title="💡 改进建议" className="glass-effect">
                <List
                  dataSource={currentReport.improvementSuggestions}
                  renderItem={(item) => (
                    <List.Item>
                      <span className="text-blue-500 mr-2">•</span>
                      {item}
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
}