import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { RightOutlined, CheckOutlined, PauseOutlined, CaretRightOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { FaFolder, FaCog, FaFileAlt, FaLaptopCode, FaChartLine, FaUserGraduate } from 'react-icons/fa';
import { RiWindowsFill } from 'react-icons/ri';
import LaserRay from '../../components/LaserRay';
import LaserGradient from '../../components/LaserGradient';

// 自定义博士帽 SVG 组件
const GraduationCapIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* 帽顶（方形） */}
    <path d="M3 10L12 5L21 10L12 15L3 10Z" />

    {/* 帽身（圆柱形底部） */}
    <path d="M5 12V18C5 19.1046 8.13401 20 12 20C15.866 20 19 19.1046 19 18V12" />
    <path d="M5 18C5 19.1046 8.13401 20 12 20C15.866 20 19 19.1046 19 18" />
  </svg>
);

// 自定义文档 SVG 组件
const DocumentIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* 文档主体 */}
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" />
    {/* 折角 */}
    <path d="M14 2V8H20" />
    {/* 文档内容线条 */}
    <path d="M8 12H16" />
    <path d="M8 16H16" />
  </svg>
);

const features = [
  {
    title: 'AI智能分析',
    desc: '基于DeepSeek大模型，提供精准的职业规划建议',
    icon: '🤖',
    imageUrl: 'https://swordreforge.top/img/worker-show/jobs.webp',
  },
  {
    title: '职业图谱',
    desc: '可视化展示岗位晋升和转岗路径，了解职业发展可能性',
    icon: '🗺️',
    imageUrl: 'https://swordreforge.top/img/worker-show/plan.webp',
  },
  {
    title: '简历优化',
    desc: '智能分析简历，针对目标岗位提供优化建议',
    icon: '📝',
    imageUrl: 'https://swordreforge.top/img/worker-show/profile.webp',
  },
  {
    title: '模拟面试',
    desc: '大厂/国企双模式，AI实时反馈面试表现',
    icon: '🎯',
    imageUrl: 'https://swordreforge.top/img/worker-show/start.webp',
  },
];

// 浮动图标配置
const floatingIcons = [
  { Icon: FaFolder, size: 28, left: '5%', top: '15%', duration: 6, delay: 0 },
  { Icon: FaCog, size: 32, left: '85%', top: '25%', duration: 8, delay: 1 },
  { Icon: FaFileAlt, size: 24, left: '15%', top: '70%', duration: 5, delay: 0.5 },
  { Icon: FaLaptopCode, size: 36, left: '75%', top: '80%', duration: 9, delay: 1.5 },
  { Icon: FaChartLine, size: 30, left: '45%', top: '10%', duration: 7, delay: 2.5 },
  { Icon: FaUserGraduate, size: 26, left: '92%', top: '60%', duration: 5.5, delay: 3.5 },
  { Icon: RiWindowsFill, size: 34, left: '8%', top: '45%', duration: 8, delay: 2 },
];

const compareData = [
  { feature: 'AI职业规划', us: true, competitionA: false, competitionB: false },
  { feature: '岗位图谱可视化', us: true, competitionA: true, competitionB: false },
  { feature: '简历AI优化', us: true, competitionA: false, competitionB: true },
  { feature: '模拟面试', us: true, competitionA: true, competitionB: false },
  { feature: '霍兰德职业测试', us: true, competitionA: false, competitionB: true },
  { feature: '个性化学习路径', us: true, competitionA: false, competitionB: false },
];

// 用户评论弹幕数据
const comments = [
  { id: 1, user: '小明', avatar: '👨‍💼', text: 'AI职业规划太准了！精准定位了我的优势方向', color: '#FF6B6B' },
  { id: 2, user: '小李', avatar: '👩‍💻', text: '模拟面试帮我拿到了字节offer！感谢！', color: '#4ECDC4' },
  { id: 3, user: '王同学', avatar: '🧑‍🎓', text: '职业图谱让我清楚看到了晋升路径', color: '#45B7D1' },
  { id: 4, user: '张工', avatar: '👨‍🔬', text: '简历优化建议很专业，投递回复率提升200%', color: '#96CEB4' },
  { id: 5, user: '刘学姐', avatar: '👩‍🏫', text: '霍兰德测试结果和我的性格完全吻合', color: '#FFEAA7' },
  { id: 6, user: '陈同学', avatar: '🧑‍💻', text: '一站式服务太方便了，再也不用到处找资源', color: '#DDA0DD' },
  { id: 7, user: '赵总', avatar: '👨‍💼', text: '推荐给团队新人，反馈都很好', color: '#98D8C8' },
  { id: 8, user: '孙同学', avatar: '👩‍🎨', text: '界面设计很赞，用户体验一流', color: '#F7DC6F' },
  { id: 9, user: '李大漂亮', avatar: '💁‍♀️', text: 'AI模拟面试的压力面太真实了，紧张得我手心出汗！', color: '#FF9F43' },
  { id: 10, user: '代码狂魔', avatar: '👨‍💻', text: '深色模式好评！非常适合我们这些半夜熬夜改简历的', color: '#54A0FF' },
  { id: 11, user: 'HR张姐', avatar: '👩‍💼', text: '这上面生成的简历排版很符合大厂ATS系统标准，看着舒服', color: '#10AC84' },
  { id: 12, user: '迷茫的应届生', avatar: '🥺', text: '做完性格测试终于知道自己适合什么岗位了，不再像无头苍蝇', color: '#FF9FF3' },
  { id: 13, user: '周硕', avatar: '🧑‍🔬', text: '岗位匹配度分析得十分精准，省去了大量海投的无用功', color: '#00D2D3' },
  { id: 14, user: '吴产品', avatar: '🤵', text: '转行求职必备神器！帮我把以前的经验完美包装成了产品方向', color: '#F368E0' },
  { id: 15, user: '郑同学', avatar: '🧑‍🔧', text: '原本平平无奇的项目经验被AI润色后瞬间高大上了，刚拿了SP！', color: '#F5CD79' },
  { id: 16, user: '运营小七', avatar: '🧚‍♀️', text: '每天睡前必刷一下行业动态，内容推荐做得太懂我了', color: '#786FA6' },
  { id: 17, user: '老林', avatar: '👴', text: '35岁职场危机？用这个重新做了一次赛道规划，豁然开朗！', color: '#E15F41' },
  { id: 18, user: '考研党小赵', avatar: '📚', text: '秋招春招的时间线梳理得明明白白，简直是保姆级求职攻略', color: '#778BEB' },
  { id: 19, user: '大牛哥', avatar: '🦸‍♂️', text: '薪资预测功能特别靠谱，今天跟HR谈薪的时候非常有底气！', color: '#CF6A87' },
  { id: 20, user: '实习生小猫', avatar: '🐱', text: '第一次找实习全靠这里的面经汇总，顺利上岸腾讯啦~', color: '#F3A683' },
  { id: 21, user: '海归小吴', avatar: '✈️', text: '留学生求职的时间差总算被填平了，名企校招信息更新得飞快', color: '#63CDDA' },
  { id: 22, user: '设计喵', avatar: '🎨', text: '不但能改文字，简历的视觉排版也能自动搞定，强推！', color: '#EA8685' },
  { id: 23, user: '测试老王', avatar: '🕵️‍♂️', text: '试用过市面上好几款，这家的大模型响应速度是最快的，不卡顿', color: '#F8A5C2' },
];

const BARRAGE_TRACK_COUNT = 7;
const BARRAGE_TRACK_HEIGHT = 48;
const BARRAGE_TOP_OFFSET = 24;
const BARRAGE_SCHEDULER_TICK_MS = 2000;
const BARRAGE_MIN_GAP_MS = 10;
const FEATURE_ROTATE_INTERVAL_MS = 5000;

type CommentItem = (typeof comments)[number];

type ActiveBarrage = {
  instanceId: number;
  comment: CommentItem;
  track: number;
  duration: number; // 👈 新增：每条弹幕专属的动画时长
};

const commentById = new Map(comments.map((item) => [item.id, item]));

const shuffleArray = <T,>(items: T[]) => {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

export default function Landing() {
  const navigate = useNavigate();
  const [hoveredFeatureIndex, setHoveredFeatureIndex] = useState(0);
  const [isFeatureAutoPlay, setIsFeatureAutoPlay] = useState(true);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [percent, setPercent] = useState(0);
  const [featureAutoPlayProgress, setFeatureAutoPlayProgress] = useState(0);
  const [activeBarrages, setActiveBarrages] = useState<ActiveBarrage[]>([]);
  const barrageQueueRef = useRef<number[]>([]);
  const occupiedTracksRef = useRef<Set<number>>(new Set());
  const lastSpawnAtRef = useRef(0);
  const barrageInstanceIdRef = useRef(1);
  const galleryViewportRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef<number | null>(null);
  const draggedRef = useRef(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);

  const showPrevFeature = () => {
    setHoveredFeatureIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const showNextFeature = () => {
    setHoveredFeatureIndex((prev) => (prev + 1) % features.length);
  };

  const handleFeatureDotClick = (nextIndex: number) => {
    if (nextIndex === hoveredFeatureIndex) return;
    setHoveredFeatureIndex(nextIndex);
  };

  const handleImageClick = () => {
    setPreviewImageUrl(features[hoveredFeatureIndex].imageUrl);
    setImagePreviewOpen(true);
  };

  const fallbackViewportWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth, 1280) : 1024;
  const resolvedViewportWidth = viewportWidth > 0 ? viewportWidth : fallbackViewportWidth;
  const isMobileGallery = resolvedViewportWidth < 768;
  const cardGap = isMobileGallery ? 12 : 20;
  const cardWidth = resolvedViewportWidth * (isMobileGallery ? 0.88 : 0.72);
  const trackBaseOffset = (resolvedViewportWidth - cardWidth) / 2;
  const trackX = trackBaseOffset - hoveredFeatureIndex * (cardWidth + cardGap) + dragOffset;

  useEffect(() => {
    if (!isFeatureAutoPlay) {
      setFeatureAutoPlayProgress(0);
      return;
    }

    const startAt = performance.now();
    let rafId = 0;

    const updateProgress = (now: number) => {
      const elapsed = now - startAt;
      setFeatureAutoPlayProgress(Math.min(elapsed / FEATURE_ROTATE_INTERVAL_MS, 1));
      rafId = window.requestAnimationFrame(updateProgress);
    };

    rafId = window.requestAnimationFrame(updateProgress);
    const autoPlayTimer = window.setTimeout(() => {
      setHoveredFeatureIndex((prev) => (prev + 1) % features.length);
    }, FEATURE_ROTATE_INTERVAL_MS);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(autoPlayTimer);
    };
  }, [isFeatureAutoPlay, hoveredFeatureIndex]);

  useEffect(() => {
    const viewport = galleryViewportRef.current;
    if (!viewport) return;

    const updateViewportWidth = () => {
      setViewportWidth(viewport.clientWidth);
    };

    updateViewportWidth();
    const observer = new ResizeObserver(updateViewportWidth);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [loading]);

  const finalizeGalleryDrag = () => {
    if (!isDraggingGallery) return;

    const threshold = Math.max(40, cardWidth * 0.14);
    if (dragOffset <= -threshold) {
      showNextFeature();
    } else if (dragOffset >= threshold) {
      showPrevFeature();
    }

    setDragOffset(0);
    dragStartXRef.current = null;
    setIsDraggingGallery(false);
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  };

  const handleGalleryPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartXRef.current = event.clientX;
    draggedRef.current = false;
    setIsDraggingGallery(true);
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGalleryPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingGallery || dragStartXRef.current === null) return;

    const delta = event.clientX - dragStartXRef.current;
    if (Math.abs(delta) > 6) {
      draggedRef.current = true;
    }
    setDragOffset(delta);
  };

  const handleGalleryCardClick = (index: number) => {
    if (draggedRef.current) return;
    if (index === hoveredFeatureIndex) {
      handleImageClick();
      return;
    }
    setHoveredFeatureIndex(index);
  };

  const handleGalleryKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showPrevFeature();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showNextFeature();
    }
  };

  // 品牌展示动画（纯展示，不等待资源）
  useEffect(() => {
    const DISPLAY_DURATION = 800; // 显示时长（毫秒）
    let startTime: number | null = null;
    let animationId: number | null = null;

    const updateProgress = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
        animationId = requestAnimationFrame(updateProgress);
        return;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / DISPLAY_DURATION);
      const currentPercent = progress * 100;

      if (currentPercent >= 99.8) {
        setPercent(100);
        setTimeout(() => setLoading(false), 100);
        return;
      }

      setPercent(Math.floor(currentPercent));
      animationId = requestAnimationFrame(updateProgress);
    };

    animationId = requestAnimationFrame(updateProgress);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  useEffect(() => {
    // 💡 新增：用一个 Set 来存储所有的 setTimeout ID，方便随时掐断它们
    const timeoutIds = new Set<number>();

    const spawnBarrage = () => {
      // 💡 修复 1：如果页面在后台（用户切到了其他标签页），直接不执行发射逻辑
      if (document.hidden) return;

      const availableTracks = Array.from({ length: BARRAGE_TRACK_COUNT }, (_, index) => index)
          .filter((track) => !occupiedTracksRef.current.has(track));

      if (availableTracks.length === 0) return;

      const now = Date.now();
      if (now - lastSpawnAtRef.current < BARRAGE_MIN_GAP_MS) return;

      if (barrageQueueRef.current.length === 0) {
        barrageQueueRef.current = shuffleArray(comments.map((item) => item.id));
      }

      const nextCommentId = barrageQueueRef.current.shift();
      if (typeof nextCommentId !== 'number') return;

      const comment = commentById.get(nextCommentId);
      if (!comment) return;

      const track = availableTracks[Math.floor(Math.random() * availableTracks.length)];

      const estimatedWidth = 100 + (comment.text.length + comment.user.length) * 16;
      const containerWidth = Math.min(window.innerWidth, 1152);
      const SPEED = 120;
      const duration = (containerWidth + estimatedWidth) / SPEED;
      const clearTimeMs = ((estimatedWidth + 80) / SPEED) * 1000;

      const instanceId = barrageInstanceIdRef.current;
      barrageInstanceIdRef.current += 1;
      lastSpawnAtRef.current = now;

      occupiedTracksRef.current.add(track);
      setActiveBarrages((prev) => [...prev, { instanceId, comment, track, duration }]);

      // 💡 修改：把 timeout 存起来
      const timeoutId = window.setTimeout(() => {
        occupiedTracksRef.current.delete(track);
        timeoutIds.delete(timeoutId); // 执行完了就从 Set 里删掉
      }, clearTimeMs);
      timeoutIds.add(timeoutId);
    };

    spawnBarrage();
    const intervalId = window.setInterval(spawnBarrage, BARRAGE_SCHEDULER_TICK_MS);

    // ==========================================
    // 💡 核心修复 2：监听页面的可见性变化
    // ==========================================
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 用户切走时：清空屏幕上的弹幕、清空被占用的轨道、掐断所有正在倒计时的 setTimeout
        setActiveBarrages([]);
        occupiedTracksRef.current.clear();
        timeoutIds.forEach(id => window.clearTimeout(id));
        timeoutIds.clear();
      } else {
        // 用户切回来时：重置上次发射时间，防止瞬间连发
        lastSpawnAtRef.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // 卸载组件时的终极清理
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      timeoutIds.forEach(id => window.clearTimeout(id));
      // occupiedTracksRef.current.clear();
      // barrageQueueRef.current = [];
      // lastSpawnAtRef.current = 0;
    };
  }, []);

  return (
    <>
      {/* 加载动画 */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0.9, 0.4, 1.1] }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 30% 10%, #0f1222, #03050b)',
              backdropFilter: 'blur(2px)',
            }}
          >
            <div className="text-center relative w-[280px] h-[280px] flex flex-col items-center justify-center">
              {/* 多环动画区 */}
              <div className="relative w-[200px] h-[200px] mb-8 flex items-center justify-center">
                <div
                  className="absolute w-[180px] h-[180px] rounded-full border-2 border-transparent"
                  style={{
                    borderTopColor: '#3b82f6',
                    borderRightColor: '#8b5cf6',
                    animation: 'spin 1.4s linear infinite',
                    filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.5))',
                  }}
                />
                <div
                  className="absolute w-[140px] h-[140px] rounded-full border-2 border-transparent"
                  style={{
                    borderBottomColor: '#06b6d4',
                    borderLeftColor: '#c084fc',
                    animation: 'spinReverse 1.8s cubic-bezier(0.5, 0, 0.5, 1) infinite',
                    filter: 'drop-shadow(0 0 5px rgba(6,182,212,0.6))',
                  }}
                />
                <div
                  className="absolute w-[100px] h-[100px] rounded-full border-2 border-transparent opacity-80"
                  style={{
                    borderTopColor: '#f472b6',
                    borderLeftColor: '#a78bfa',
                    animation: 'spin 2.2s linear infinite',
                    filter: 'drop-shadow(0 0 4px rgba(244,114,182,0.4))',
                  }}
                />
                {/* 中心脉冲点 */}
                <motion.div
                  className="absolute w-6 h-6 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #c084fc)',
                    boxShadow: '0 0 15px #8b5cf6',
                  }}
                  animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              </div>

              {/* 百分比显示 */}
              <div className="relative z-10 font-bold text-[3.2rem] tracking-wider mt-5" style={{
                background: 'linear-gradient(135deg, #fff, #a0c4ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {percent}
                <span className="text-[2rem]">%</span>
              </div>

              {/* 加载文本 */}
              <div className="mt-3 text-xs tracking-[0.2em] uppercase font-medium text-[#9ca3cf] bg-white/5 backdrop-blur-sm px-4 py-1.5 rounded-full inline-block">
                加载中...
              </div>

              {/* 底部装饰光晕 */}
              <motion.div
                className="absolute w-[300px] h-[300px] rounded-full -z-10"
                style={{
                  background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0) 70%)',
                }}
                animate={{
                  opacity: [0.4, 0.8],
                  scale: [1, 1.1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              />

              {/* 动画样式 */}
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes spinReverse {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(-360deg); }
                }
              `}</style>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主内容 */}
      <AnimatePresence mode="wait">
        {!loading && (
          <motion.div
            className="min-h-screen text-white"
            style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%)' }}
          >
      {/* Floating Get Started Button */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 100, delay: 1 }}
        className="fixed top-6 right-6 z-50"
      >
        <motion.div
          whileHover={{ 
            scale: 1.08,
            boxShadow: [
              "0 10px 30px rgba(251, 146, 60, 0.3)",
              "0 15px 40px rgba(251, 146, 60, 0.4)",
              "0 15px 40px rgba(251, 146, 60, 0.4)"
            ]
          }}
          whileTap={{ scale: 0.98 }}
          transition={{
            boxShadow: { duration: 0.4 },
            scale: { type: "spring", stiffness: 400 }
          }}
        >
          <Button
            type="primary"
            size="large"
            icon={<DocumentIcon className="w-5 h-5" />}
            onClick={() => navigate('/doc')}
            className="bg-gradient-to-r from-orange-500 to-pink-500 border-0 h-12 px-6 rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
          >
            文档
          </Button>
        </motion.div>
      </motion.div>

      {/* Hero Section */}
      <div className="relative px-6 py-20 text-center overflow-hidden">
        {/* 镭射效果背景 */}
        <LaserGradient />
        <LaserRay />

        {/* 淡紫色渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 -z-10" />

        {/* 浮动图标层 - 不影响点击 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingIcons.map((item, idx) => {
            const { Icon, size, left, top, duration, delay } = item;
            return (
              <motion.div
                key={idx}
                className="absolute text-purple-400/40"
                style={{
                  left,
                  top,
                }}
                initial={{ y: 0, rotate: 0 }}
                animate={{
                  y: [0, -40, 0],
                  rotate: [0, 8, 0],
                }}
                transition={{
                  duration,
                  delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Icon size={size} />
              </motion.div>
            );
          })}
        </div>

        {/* 内容层 - 确保在浮动层上方 */}
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 200,
              duration: 0.8
            }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 mb-8 shadow-lg shadow-orange-500/30"
          >
            <GraduationCapIcon className="w-16 h-16 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            职业规划<span className="text-orange-400">助手</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            AI驱动的职业发展解决方案，助你找到理想工作
            <br />
            <span className="text-gray-500">从职业测试到入职offer，一站式服务</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Button
                type="primary"
                size="large"
                icon={<RightOutlined />}
                onClick={() => navigate('/auth')}
                className="bg-orange-500 border-orange-500 hover:bg-orange-600 h-14 px-10 text-lg rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
              >
                立即开始
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Button
                size="large"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-gray-600 text-white hover:bg-gray-800 h-14 px-10 text-lg rounded-full shadow-lg hover:shadow-gray-500/30 transition-all duration-300"
              >
                了解更多
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="px-6 py-16 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            核心<span className="text-orange-400">功能</span>
          </h2>
          <p className="text-gray-400">全方位助你职业成长</p>
        </motion.div>

        {/* 功能图片展示区域 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <>
            <div className="relative rounded-none border border-transparent bg-transparent p-2 md:p-4">
              <div className="relative">
                <div
                  ref={galleryViewportRef}
                  tabIndex={0}
                  role="region"
                  aria-label="核心功能轮播"
                  onKeyDown={handleGalleryKeyDown}
                  onPointerDown={handleGalleryPointerDown}
                  onPointerMove={handleGalleryPointerMove}
                  onPointerUp={finalizeGalleryDrag}
                  onPointerCancel={finalizeGalleryDrag}
                  className={`overflow-hidden select-none ${isDraggingGallery ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                  <motion.div
                    className="flex"
                    style={{
                      gap: `${cardGap}px`,
                    }}
                    animate={{ x: trackX }}
                    transition={isDraggingGallery
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 100, damping: 34, mass: 1.2 }}
                  >
                    {features.map((item, idx) => {
                      const isActive = idx === hoveredFeatureIndex;
                      return (
                        <motion.article
                          key={item.title}
                          style={{ width: cardWidth, minWidth: cardWidth }}
                          className="relative h-[30rem] md:h-[42rem] shrink-0 overflow-hidden rounded-2xl md:rounded-3xl border border-white/15 bg-[#11131a]"
                          animate={{
                            opacity: isActive ? 1 : (isMobileGallery ? 0.85 : 0.62),
                            scale: isActive ? 1 : (isMobileGallery ? 0.96 : 0.92),
                          }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                        >
                          <button
                            type="button"
                            aria-label={isActive ? `预览${item.title}` : `切换到${item.title}`}
                            onClick={() => handleGalleryCardClick(idx)}
                            className="absolute inset-0"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="h-full w-full object-cover"
                              draggable={false}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4 text-left">
                              <h3 className="text-2xl md:text-4xl font-semibold tracking-tight">{item.title}</h3>
                              <p className="mt-2 text-sm md:text-base text-white/80 leading-relaxed">{item.desc}</p>
                            </div>
                          </button>
                        </motion.article>
                      );
                    })}
                  </motion.div>
                </div>

              </div>
            </div>

            {/* 独立轮换控制胶囊 */}
            <div className="mt-5 flex justify-center">
              <div className="inline-flex min-w-[320px] md:min-w-[44px] items-center justify-between gap-3 rounded-full border border-white/45 bg-white/15 px-6 py-2 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  {features.map((_, idx) => (
                    <motion.button
                      key={idx}
                      type="button"
                      onClick={() => handleFeatureDotClick(idx)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        idx === hoveredFeatureIndex ? 'relative w-16 overflow-hidden bg-white/30' : 'w-2.5 bg-white/60'
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {idx === hoveredFeatureIndex ? (
                        <span
                          className="absolute inset-y-0 left-0 rounded-full bg-white/95"
                          style={{ width: `${Math.max(0, Math.min(featureAutoPlayProgress, 1)) * 100}%` }}
                        />
                      ) : null}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  type="button"
                  aria-label={isFeatureAutoPlay ? '关闭自动轮换' : '开启自动轮换'}
                  onClick={() => setIsFeatureAutoPlay((prev) => !prev)}
                  className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
                    isFeatureAutoPlay
                      ? 'bg-white/35 border-white/90 text-white'
                      : 'bg-white/20 border-white/60 text-white/90'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isFeatureAutoPlay ? <PauseOutlined /> : <CaretRightOutlined />}
                </motion.button>
              </div>
            </div>
          </>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">

                  {features.map((item, idx) => (

                    <motion.div

                      key={idx}

                      initial={{ opacity: 0, y: 50 }}

                      whileInView={{ opacity: 1, y: 0 }}

                      whileHover={{

                        scale: 1.05,

                        boxShadow: [

                          "0 20px 40px rgba(0,0,0,0.3)",

                          "0 30px 60px rgba(251, 146, 60, 0.15)",

                          "0 30px 60px rgba(251, 146, 60, 0.15)"

                        ],

                        borderColor: "rgba(251, 146, 60, 0.6)",

                        background: [

                          "rgba(255,255,255,0.05)",

                          "rgba(255,255,255,0.08)",

                          "rgba(255,255,255,0.08)"

                        ]

                      }}

                      transition={{

                        boxShadow: { duration: 0.4 },

                        scale: { duration: 0.3, type: "spring", stiffness: 400 }

                      }}

                      onMouseEnter={() => setHoveredFeatureIndex(idx)}

                      className="p-6 rounded-2xl cursor-pointer relative overflow-hidden"

                      style={{

                        background: 'rgba(255,255,255,0.05)',

                        border: '1px solid rgba(255,255,255,0.1)',

                        width: '100%',

                        maxWidth: '480px'

                      }}

                    >

                      {/* 光泽效果层 */}

                      <motion.div

                        className="absolute inset-0 rounded-2xl pointer-events-none"

                        initial={{ opacity: 0 }}

                        whileHover={{

                          opacity: 1,

                          background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)"

                        }}

                        transition={{ duration: 0.3 }}

                      />

                      {/* 发光边框效果 */}

                      <motion.div

                        className="absolute inset-0 rounded-2xl pointer-events-none"

                        initial={{ opacity: 0 }}

                        whileHover={{

                          opacity: 1,

                          boxShadow: "inset 0 0 20px rgba(251, 146, 60, 0.1)"

                        }}

                        transition={{ duration: 0.3 }}

                      />

                      <motion.div

                        initial={{ scale: 0 }}

                        whileInView={{ scale: 1 }}

                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}

                        transition={{ type: "spring", delay: idx * 0.1 + 0.2 }}


                        className="text-4xl mb-4 relative z-10"

                      >

                        {item.icon}

                      </motion.div>

                      <h3 className="text-xl font-semibold mb-2 relative z-10">{item.title}</h3>

                      <p className="text-gray-400 relative z-10">{item.desc}</p>

                    </motion.div>

                  ))}

                </div>      </div>

      {/* Comparison Section */}
      <div className="px-6 py-16 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            与市面<span className="text-orange-400">产品对比</span>
          </h2>
          <p className="text-gray-400">功能全面领先，让求职更简单</p>
        </motion.div>

        <motion.div

                  initial={{ opacity: 0, scale: 0.95 }}

                  whileInView={{ opacity: 1, scale: 1 }}

                  viewport={{ margin: "-50px" }}

                  transition={{ duration: 0.6 }}

                  className="space-y-0"

                >

                  {/* 表头 */}

                  <motion.div

                    initial={{ opacity: 0, y: -20 }}

                    whileInView={{ opacity: 1, y: 0 }}

                    transition={{ duration: 0.5 }}

                    className="grid grid-cols-4 gap-4 pb-4 border-b border-gray-700 text-sm font-semibold"

                  >

                    <div className="text-left text-gray-400">功能</div>

                    <div className="text-left text-orange-400">我们</div>

                    <div className="text-center text-gray-500">竞品A</div>

                    <div className="text-center text-gray-500">竞品B</div>

                  </motion.div>

        

                  {/* 表格行 */}

                  {compareData.map((row, idx) => (

                    <motion.div

                      key={idx}

                      initial={{ opacity: 0, x: -20 }}

                      whileInView={{ opacity: 1, x: 0 }}

                      transition={{ duration: 0.4, delay: idx * 0.08 }}

                      whileHover={{

                        background: 'rgba(255,255,255,0.08)',

                        scale: 1.02,

                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"

                      }}

                      className="grid grid-cols-4 gap-4 py-4 border-b border-gray-800 cursor-pointer relative rounded-lg overflow-hidden"

                    >

                      {/* 悬停时的光泽效果 */}

                      <motion.div

                        className="absolute inset-0 pointer-events-none"

                        initial={{ opacity: 0 }}

                        whileHover={{

                          opacity: 1,

                          background: "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)"

                        }}

                        transition={{ duration: 0.3 }}

                      />

                      <div className="text-left text-gray-300 relative z-10 whitespace-nowrap">{row.feature}</div>

                      <div className="text-left relative z-10">

                        {row.us ? (

                          <motion.div

                            initial={{ scale: 0 }}

                            whileInView={{ scale: 1 }}

                            whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}

                            transition={{ type: "spring", delay: idx * 0.08 + 0.2 }}

                            className="inline-block"

                          >

                            <CheckOutlined className="text-green-400 text-xl" />

                          </motion.div>

                        ) : (

                          <span className="text-gray-600">-</span>

                        )}

                      </div>

                      <div className="text-center relative z-10">

                        {row.competitionA ? (

                          <CheckOutlined className="text-gray-500 text-xl" />

                        ) : (

                          <span className="text-gray-600">-</span>

                        )}

                      </div>

                      <div className="text-center relative z-10">

                        {row.competitionB ? (

                          <CheckOutlined className="text-gray-500 text-xl" />

                        ) : (

                          <span className="text-gray-600">-</span>

                        )}

                      </div>

                    </motion.div>

                  ))}

                </motion.div>
      </div>

      {/* 用户评论弹幕区域 */}
      <div className="px-6 py-12 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold mb-3">
            用户<span className="text-orange-400">真实评价</span>
          </h2>
          <p className="text-gray-400">听听他们的使用体验</p>
        </motion.div>

        {/* 弹幕区域 */}
        <div className="relative h-96 bg-gradient-to-r from-gray-800/30 via-gray-700/30 to-gray-800/30 rounded-xl overflow-hidden backdrop-blur-sm border border-gray-700/50">
          <div className="absolute inset-0 pointer-events-none">
            {activeBarrages.map((item) => (
                <motion.div
                    key={item.instanceId}
                    className="absolute h-10 flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900/80 border border-gray-700/50 whitespace-nowrap"
                    style={{
                      top: `${BARRAGE_TOP_OFFSET + item.track * BARRAGE_TRACK_HEIGHT}px`,
                      left: '100%',
                      backgroundColor: `${item.comment.color}20`,
                      borderColor: `${item.comment.color}40`,
                    }}
                    initial={{ x: 0 }}
                    animate={{ x: 'calc(-100vw - 140%)' }}
                    transition={{
                      duration: item.duration, // 👈 核心修改：使用刚刚动态计算好的专属时长
                      ease: 'linear',
                    }}
                    onAnimationComplete={() => {
                      // ✨ 核心修复：动画彻底结束（20秒后）飞出屏幕外时，仅仅销毁自身的 DOM。
                      // 不要在这里释放轨道，因为轨道早在上面 setTimeout 时就已经释放了。
                      setActiveBarrages((prev) => prev.filter((barrage) => barrage.instanceId !== item.instanceId));
                    }}
                >
                  <span className="text-lg">{item.comment.avatar}</span>
                  <span className="text-sm font-semibold" style={{ color: item.comment.color }}>{item.comment.user}:</span>
                  <span className="text-sm text-gray-300">{item.comment.text}</span>
                </motion.div>
            ))}
          </div>
          {/* ...装饰性元素... */}

          {/* 装饰性元素 */}
          <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-2 left-1/2 w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="px-6 py-20 text-center"
      >
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl font-bold mb-6"
        >
          准备好开启你的职业之旅了吗？
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-gray-400 mb-8"
        >
          5分钟了解适合自己的职业方向
        </motion.p>
        <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="primary"
                    size="large"
                    icon={<GraduationCapIcon className="w-5 h-5" />}
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-orange-500 to-pink-500 border-0 h-14 px-10 text-lg rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
                  >
                    立即开始 →
                  </Button>
                </motion.div>
              </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="px-6 py-8 border-t border-gray-800 text-center text-gray-500"
      >
        <p>© 2026 职业规划助手. All rights reserved.</p>
      </motion.div>
      </motion.div>
      )}
      </AnimatePresence>

      {/* 图片预览模态框 */}
      <AnimatePresence>
        {imagePreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setImagePreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-7xl max-h-[90vh] w-full mx-auto p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                onClick={() => setImagePreviewOpen(false)}
                className="absolute -top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
              <img
                src={previewImageUrl}
                alt="预览"
                className="w-full h-full object-contain rounded-lg shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

