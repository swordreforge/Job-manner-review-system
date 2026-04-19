import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Segmented, Input, Avatar, Tag, message, Spin, Modal, Progress, List } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, HistoryOutlined, FileTextOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { interviewApi } from '../../api';
import type { InterviewSession, InterviewMessage, InterviewHistoryItem, InterviewReport } from '../../types';
import './FloatingPolygons.css';

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
  // 录音相关引用
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
    // 扩展的常见语音识别错误映射
    const corrections: Record<string, string> = {
      // 面试相关
      '面是关好': '面试官好',
      '面试关好': '面试官好',
      '面试观好': '面试官好',
      '魔神': '某人',
      '魔魔': '某某',
      '男子': '某某',
      '默默审的': '某某申的',
      '默默姓的': '某某姓的',
      '默默名': '某某名',
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
      
      // 常见同音字/近音字
      '以致': '以致',
      '以致于': '以至于',
      '必须': '必需',
      '必需': '必须',
      '反应': '反应',
      '反映': '反应',
      '截止': '截止',
      '截至': '截止',
      '权利': '权利',
      '权力': '权利',
      '制定': '制定',
      '制订': '制定',
      '界限': '界限',
      '界线': '界限',
      '包含': '包含',
      '包涵': '包含',
      '交代': '交代',
      '交待': '交代',
      '化妆': '化妆',
      '化装': '化妆',
      '检查': '检查',
      '检察': '检查',
      '分辨': '分辨',
      '分辩': '分辨',
      '含义': '含义',
      '涵义': '含义',

      // 职场常用词
      '简历': '简历',
      '简力': '简历',
      '简利': '简历',
      '职位': '职位',
      '只位': '职位',
      '只围': '职位',
      '岗位': '岗位',
      '港位': '岗位',
      '港尾': '岗位',
      '公司': '公司',
      '功司': '公司',
      '恭司': '公司',
      '项目': '项目',
      '向目': '项目',
      '项暮': '项目',
      '经验': '经验',
      '景验': '经验',
      '井验': '经验',
      '技能': '技能',
      '记能': '技能',
      '机能': '技能',
      '共生的': '关注的',
      '团队': '团队',
      '团对': '团队',
      '团堆': '团队',
      '合作': '合作',
      '合座': '合作',
      '沟通': '沟通',
      '勾通': '沟通',
      '构通': '沟通',
      '协调': '协调',
      '些调': '协调',
      '协条': '协调',
      '挑战': '挑战',
      '跳站': '挑战',
      '跳战': '挑战',
      '机会': '机会',
      '记会': '机会',
      '期望': '期望',
      '七望': '期望',
      '奇望': '期望',
      '发展': '发展',
      '创新': '创新',
      '创心': '创新',
      '学习': '学习',
      '雪习': '学习',
      '穴习': '学习',
      '进步': '进步',
      '进不': '进步',
      '目标': '目标',
      '目票': '目标',
      '目漂': '目标',
      '计划': '计划',
      '实现': '实现',
      '现实': '实现',
      '成就': '成就',
      '成绩': '成绩',
      '成功': '成功',
      '成公': '成功',
      '失败': '失败',
      '努力': '努力',
      '坚持': '坚持',
      '负责': '负责',
      '福责': '负责',
      '主动': '主动',
      '猪动': '主动',
      '积极': '积极',
      '机极': '积极',
      '认真': '认真',
      '真任': '认真',
      '仔细': '仔细',
      '专注': '专注',
      '砖注': '专注',
    };

    let correctedText = text;
    
    // 第一步：精确匹配替换（最快）
    Object.keys(corrections).forEach(wrong => {
      const correct = corrections[wrong];
      correctedText = correctedText.replace(new RegExp(wrong, 'g'), correct);
    });

    // 第二步：模糊匹配（基于编辑距离）
    correctedText = correctWithFuzzyMatch(correctedText, corrections);

    // 第三步：去重处理（清除连续重复的词汇）
    correctedText = removeDuplicates(correctedText);

    return correctedText;
  };

  // 去除连续重复的词汇
  const removeDuplicates = (text: string): string => {
    // 处理连续重复的汉字（2个或更多）
    // 例如：职位职位职位 → 职位
    let result = text.replace(/([^\s])\1{2,}/g, '$1');
    
    // 处理连续重复的词汇（2个字的词汇重复）
    // 例如：团队团队 → 团队
    result = result.replace(/([^\s]{2,})\1/g, '$1');
    
    // 处理连续重复的标点符号
    // 例如：，，， → ，
    result = result.replace(/([，。！？；：])\1+/g, '$1');
    
    // 处理连续重复的空格
    // 例如：    → （一个空格）
    result = result.replace(/\s+/g, ' ');
    
    return result;
  };

  // 计算编辑距离（Levenshtein 距离）
  const levenshteinDistance = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // 初始化矩阵
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // 填充矩阵
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // 删除
          matrix[i][j - 1] + 1,      // 插入
          matrix[i - 1][j - 1] + cost // 替换
        );
      }
    }

    return matrix[len1][len2];
  };

  // 模糊匹配纠错
  const correctWithFuzzyMatch = (text: string, corrections: Record<string, string>): string => {
    const words = text.split('');
    const correctedWords: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let bestMatch = word;
      let minDistance = Infinity;
      const threshold = 1; // 编辑距离阈值

      // 检查所有可能的纠错项
      for (const wrong of Object.keys(corrections)) {
        const distance = levenshteinDistance(word, wrong);
        
        // 如果编辑距离小于阈值且比当前最佳匹配更近
        if (distance <= threshold && distance < minDistance) {
          minDistance = distance;
          bestMatch = corrections[wrong];
        }
      }

      correctedWords.push(bestMatch);
    }

    return correctedWords.join('');
  };

  // 将音频 blob 转换为 PCM 格式
  const convertToPCM = async (audioBlob: Blob): Promise<Float32Array> => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const rawData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const targetSampleRate = 16000;
    
    if (sampleRate !== targetSampleRate) {
      const ratio = sampleRate / targetSampleRate;
      const newLength = Math.round(rawData.length / ratio);
      const resampledData = new Float32Array(newLength);
      for (let i = 0; i < newLength; i++) {
        resampledData[i] = rawData[Math.floor(i * ratio)];
      }
      audioContext.close();
      return resampledData;
    }
    
    audioContext.close();
    return rawData;
  };

  // 语音识别
  const transcribeAudio = async (audioBlob: Blob) => {
    setTranscribing(true);
    
    try {
      const pcmData = await convertToPCM(audioBlob);
      const int16Array = new Int16Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        const s = Math.max(-1, Math.min(1, pcmData[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      const voiceApiUrl = import.meta.env.VITE_VOICE_API_BASE_URL || 'http://localhost:8000';
      const formData = new FormData();
      const pcmBlob = new Blob([int16Array], { type: 'audio/raw' });
      formData.append('file', pcmBlob, 'recording.pcm');
      
      const response = await fetch(`${voiceApiUrl}/transcribe`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.text && data.text.trim()) {
          // 应用增强文本纠错（精确匹配 + 模糊匹配）
          const correctedText = correctText(data.text.trim());
          setInput(prev => prev + (prev ? ' ' : '') + correctedText);
          message.success('语音识别完成（已智能纠错）');
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
    message.success('已应用智能纠错（100+ 规则 + 模糊匹配）');
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
      ? '考察硬技能与产出能力：深挖项目经验、技术深度、业务理解、数据分析能力，多轮高压力面试（3-6轮），追问深、反套路，结果导向偏好"狼性"，着装随意氛围平等' 
      : '考察综合素质与稳定性：考察沟通表达、组织协调、政治素养、公文写作、抗压能力，轮次少周期长（2-3轮，1-2个月），偏结构化与半结构化，程序合规偏好"稳重"，着装正式氛围严肃';
  };

  const getModeShortDescription = (m: 'practice' | 'assessment') => {
    return m === 'practice' 
      ? '算法题、项目深挖、系统设计' 
      : '行测、申论、综合素养';
  };

  const getModeRecommendation = (m: 'practice' | 'assessment') => {
    return m === 'practice'
      ? '准备建议：重点准备项目复盘、算法刷题、行业分析，突出数据成果和独立解决问题能力，重视创新能力、学习速度、试错韧性'
      : '准备建议：准备自我介绍模板、结构化问题库，突出稳定性、组织纪律性、文字功底，提前了解企业最新政策动态，体现集体意识和政治觉悟';
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
              <p className="text-gray-600 dark:text-[var(--md-sys-color-on-surface-variant)]">选择面试模式，开始你的模拟面试练习</p>
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
            
            <Card 
              className={mode === 'practice' ? 'glass-effect border-blue-500 dark:border-blue-400 shadow-md' : 'glass-effect border-green-500 dark:border-green-400 shadow-md'}
            >
              <div className="text-center">
                                <div className="text-4xl mb-3">{mode === 'practice' ? '🏢' : '🏛️'}</div>
                                <div className="font-semibold text-lg mb-2">
                                  {mode === 'practice' ? '大厂技术面' : '国企综合面'}
                                </div>
                                <div className="text-gray-600 dark:text-[var(--md-sys-color-on-surface-variant)] mb-3 text-left">
                                  {getModeDescription(mode)}
                                </div>
                                <div className="text-sm text-gray-700 text-left bg-blue-50 dark:bg-[var(--md-sys-color-surface-container-high)] p-3 rounded-lg dark:text-[var(--md-sys-color-on-surface-variant)]">
                                  💡 {getModeRecommendation(mode)}
                                </div>
                              </div>            </Card>
            
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
                    <div className="text-sm text-gray-500 dark:text-[var(--md-sys-color-on-surface-variant)]">
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
                      <div className={`p-4 rounded-2xl interview-msg-${msg.role} ${
                        msg.role === 'user' 
                          ? 'rounded-tr-none' 
                          : 'rounded-tl-none'
                      }`}>
                        <div className="text-sm mb-1 opacity-75 interview-msg-label">
                          {msg.role === 'user' ? '你' : '面试官'}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {msg.score !== undefined && (
                          <div className="mt-2 pt-2 border-t interview-msg-score-divider">
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
                    <Card size="small" className="glass-effect interview-score-card">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">本次回答评分</div>
                        <div className="text-3xl font-bold" style={{ color: getScoreColor(currentScore) }}>
                          {currentScore}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{getScoreLabel(currentScore)}</div>
                        {currentFeedback && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
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
                  
                  <div className="flex-1 text-center text-sm text-gray-500 dark:text-[var(--md-sys-color-on-surface-variant)]">
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
                  title="智能纠错（100+ 规则 + 模糊匹配）"
                >
                  智能纠错
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
                        <span>{getModeShortDescription(item.mode)}</span>
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
                        <div className="text-xs text-gray-500 dark:text-[var(--md-sys-color-on-surface-variant)]">
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
              <Card title="总体评价" className="glass-effect interview-report-overview">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2" style={{ color: getScoreColor(currentReport.overallScore) }}>
                    {currentReport.overallScore.toFixed(1)}
                  </div>
                  <div className="text-xl text-gray-700 dark:text-[var(--md-sys-color-on-surface)] mb-4">{getScoreLabel(currentReport.overallScore)}</div>
                  <div className="text-gray-600 dark:text-[var(--md-sys-color-on-surface-variant)]">{currentReport.summary}</div>
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