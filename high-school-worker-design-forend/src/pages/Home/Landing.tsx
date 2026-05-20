import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { RightOutlined, CheckOutlined, PauseOutlined, CaretRightOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { FaFolder, FaCog, FaFileAlt, FaLaptopCode, FaChartLine, FaUserGraduate } from 'react-icons/fa';
import { RiWindowsFill } from 'react-icons/ri';
import BarrageCanvas from '../../components/BarrageCanvas';
import { useAuthStore } from '../../stores';
import ScrollStack, { ScrollStackItem } from '../../components/ScrollStack';
//123
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
      <path d="M3 10L12 5L21 10L12 15L3 10Z" />
      <path d="M5 12V18C5 19.1046 8.13401 20 12 20C15.866 20 19 19.1046 19 18V12" />
      <path d="M5 18C5 19.1046 8.13401 20 12 20C15.866 20 19 19.1046 19 18" />
    </svg>
);

const features = [
  {
    title: 'AI智能分析',
    desc: '基于DeepSeek大模型，提供精准的职业规划建议',
    detailDesc: '通过深度分析你的技能、经验和兴趣，AI智能分析系统能为你量身定制职业发展路径。无论是转行、晋升还是跳槽，系统都会根据最新的市场趋势和岗位需求，为你提供专业的建议和指导。',
    icon: '🤖',
    imageUrl: 'https://blog.swordreforge.top/img/worker-show/jobs.webp',
    features: [
      { icon: '🎯', text: '精准匹配' },
      { icon: '📊', text: '数据分析' },
      { icon: '🚀', text: '智能推荐' },
      { icon: '💡', text: '个性化建议' },
    ],
    scenarios: ['职业迷茫期', '技能转型', '求职规划', '晋升决策'],
    stats: [
      { label: '匹配准确率', value: '95%' },
      { label: '用户满意度', value: '98%' },
      { label: '职业发展提速', value: '40%' },
    ],
    buttonText: '立即体验',
    buttonLink: '/holland',
  },
  {
    title: '职业图谱',
    desc: '可视化展示岗位晋升和转岗路径，了解职业发展可能性',
    detailDesc: '职业图谱以直观的树状图形式展示完整的职业发展路径。你可以清晰地看到从初级到高级的晋升阶梯，了解不同岗位之间的转换要求。系统会根据你的当前职位，推荐最合适的职业发展路径，并标注关键的能力提升节点。',
    icon: '🗺️',
    imageUrl: 'https://blog.swordreforge.top/img/worker-show/plan.webp',
    features: [
      { icon: '🌳', text: '可视化路径' },
      { icon: '📈', text: '晋升阶梯' },
      { icon: '🔄', text: '转岗建议' },
      { icon: '🎓', text: '能力提升' },
    ],
    scenarios: ['职业规划', '晋升准备', '转岗决策', '目标设定'],
    stats: [
      { label: '岗位覆盖', value: '500+' },
      { label: '路径准确率', value: '92%' },
      { label: '平均晋升时间', value: '-30%' },
    ],
    buttonText: '探索路径',
    buttonLink: '/plan',
  },
  {
    title: '简历优化',
    desc: '智能分析简历，针对目标岗位提供优化建议',
    detailDesc: 'AI简历优化引擎会深度分析你的简历内容，针对特定的目标岗位提供个性化的优化建议。系统会指出简历中的亮点和不足，优化项目描述，突出关键技能，并根据ATS系统的要求调整格式。',
    icon: '📝',
    imageUrl: 'https://blog.swordreforge.top/img/worker-show/profile.webp',
    features: [
      { icon: '🔍', text: '智能分析' },
      { icon: '✨', text: '亮点突出' },
      { icon: '🎯', text: '精准匹配' },
      { icon: '📄', text: 'ATS优化' },
    ],
    scenarios: ['求职准备', '简历升级', '投递优化', '转行求职'],
    stats: [
      { label: '投递回复率', value: '+200%' },
      { label: '面试邀请', value: '+150%' },
      { label: '优化效率', value: '10分钟' },
    ],
    buttonText: '优化简历',
    buttonLink: '/resume',
  },
  {
    title: '模拟面试',
    desc: '大厂/国企双模式，AI实时反馈面试表现',
    detailDesc: '模拟面试系统提供大厂和国企两种不同的面试模式。大厂模式侧重技术深度和算法能力，国企模式注重综合素质和表达逻辑。AI面试官会根据你的回答实时反馈，指出优点和改进点，帮助你提升面试技巧。',
    icon: '🎯',
    imageUrl: 'https://blog.swordreforge.top/img/worker-show/start.webp',
    features: [
      { icon: '🎭', text: '真实模拟' },
      { icon: '🤖', text: 'AI反馈' },
      { icon: '📊', text: '表现分析' },
      { icon: '💪', text: '能力提升' },
    ],
    scenarios: ['面试准备', '技能提升', '求职冲刺', '压力训练'],
    stats: [
      { label: '面试通过率', value: '+80%' },
      { label: '用户评分', value: '4.9分' },
      { label: '平均练习时长', value: '15分钟' },
    ],
    buttonText: '开始面试',
    buttonLink: '/interview',
  },
];

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
  { id: 24, user: '金融小明', avatar: '💰', text: '国企求职指导太专业了，帮我分析各岗位发展前景', color: '#6C5CE7' },
  { id: 25, user: '产品Amy', avatar: '📱', text: '智能推荐岗位真的很准，每天都能发现新的机会', color: '#A29BFE' },
  { id: 26, user: '数据小陈', avatar: '📊', text: '职业测评报告分析得太详细了，连我自己都没想到的优势被发现了', color: '#74B9FF' },
  { id: 27, user: '前端阿杰', avatar: '💻', text: '大厂面试题库太全了，算法题命中率超高！', color: '#00CEC9' },
  { id: 28, user: 'HR小美', avatar: '👔', text: '帮学生优化过的简历确实专业，筛选效率提升不少', color: '#FD79A8' },
  { id: 29, user: '考公达人', avatar: '🏛️', text: '体制内求职攻略应有尽有，上岸经验分享特别实用', color: '#81ECEC' },
  { id: 30, user: '跳槽老张', avatar: '🚀', text: '中年转行也不怕，AI给我规划的新路径太清晰了', color: '#FAB1A0' },
  { id: 31, user: '应届小白', avatar: '🌟', text: '从简历到面试全程辅导，秋招终于拿到满意offer！', color: '#DFE6E9' },
  { id: 32, user: '技术总监', avatar: '👑', text: '团队招聘用了这个平台，人才匹配度明显提高', color: '#B2BEC3' },
  { id: 33, user: '销售冠军', avatar: '💪', text: '销售类面试话术总结得太到位了，帮我拿下了大客户', color: '#FF7675' },
  { id: 35, user: '创业老板', avatar: '💡', text: '创业经历包装得高大上，投资人看了都说好', color: '#FFEAA7' },
  { id: 36, user: '法务小刘', avatar: '⚖️', text: '法律行业求职指导非常专业，少走了很多弯路', color: '#74B9FF' },
  { id: 37, user: '医疗从业者', avatar: '🏥', text: '医疗AI岗位推荐太精准了，正好是我梦寐以求的方向', color: '#55EFC4' },
  { id: 38, user: '机械工程师', avatar: '🔧', text: '制造业转型互联网的路径规划得太详细了', color: '#FDCB6E' },
  { id: 39, user: '新媒体运营', avatar: '📱', text: '爆款文案生成器太好用了，粉丝增长蹭蹭的', color: '#E17055' },
  { id: 40, user: '客服主管', avatar: '🎧', text: '客服晋升管理层的攻略太实用了，感恩！', color: '#00B894' },
];

const FEATURE_ROTATE_INTERVAL_MS = 5000;

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, isAuthChecked, initialize } = useAuthStore();
  const [hoveredFeatureIndex, setHoveredFeatureIndex] = useState(0);
  const [isFeatureAutoPlay, setIsFeatureAutoPlay] = useState(true);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [percent, setPercent] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const galleryViewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const draggedRef = useRef(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthChecked && isAuthenticated) {
      navigate('/start', { replace: true });
    }
  }, [isAuthenticated, isAuthChecked, navigate]);

  useEffect(() => {
    if (!loading && !typingDone) {
      const fullText = '职业未来';
      let i = 0;
      const interval = setInterval(() => {
        setTypedText(fullText.slice(0, i + 1));
        i++;
        if (i >= fullText.length) {
          clearInterval(interval);
          setTypingDone(true);
        }
      }, 180);
      return () => clearInterval(interval);
    }
  }, [loading, typingDone]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = Math.min(80, Math.floor(window.innerWidth / 18));
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p) continue;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas!.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas!.height) p.vy *= -1;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        ctx!.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          if (!p2) continue;
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(p2.x, p2.y);
            ctx!.strokeStyle = `rgba(99, 102, 241, ${0.12 * (1 - dist / 140)})`;
            ctx!.lineWidth = 0.8;
            ctx!.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [loading]);

  if (!isAuthChecked || (isAuthChecked && isAuthenticated)) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-400">加载中...</div>
        </div>
    );
  }

  const handleShakeClick = () => {
    if (isShaking) return;
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  };

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
    if (!isFeatureAutoPlay) return;

    const autoPlayTimer = window.setTimeout(() => {
      setHoveredFeatureIndex((prev) => (prev + 1) % features.length);
    }, FEATURE_ROTATE_INTERVAL_MS);

    return () => {
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

  useEffect(() => {
    const DISPLAY_DURATION = 800;
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

  return (
      <>
        <style>{`
        @keyframes morph {
          0%, 100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: translate(0, 0) rotate(0deg); }
          25% { border-radius: 58% 42% 35% 65% / 50% 60% 40% 50%; transform: translate(20px, -30px) rotate(5deg); }
          50% { border-radius: 50% 50% 60% 40% / 40% 50% 50% 60%; transform: translate(-15px, 20px) rotate(-3deg); }
          75% { border-radius: 40% 60% 50% 50% / 55% 35% 65% 45%; transform: translate(25px, 10px) rotate(4deg); }
        }
        .text-gradient-animated {
          background: linear-gradient(90deg, #1976d2, #6366f1, #a855f7, #06b6d4, #1976d2);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-flow 4s linear infinite;
        }
        @keyframes gradient-flow {
          to { background-position: 200% center; }
        }
        .typing-cursor {
          -webkit-text-fill-color: #6366f1;
          animation: blink-cursor 0.75s step-end infinite;
          font-weight: 300;
        }
        @keyframes blink-cursor {
          50% { opacity: 0; }
        }
        @keyframes feature-dot-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .feature-dot-progress {
          animation-name: feature-dot-progress;
          animation-timing-function: linear;
          animation-fill-mode: both;
          animation-iteration-count: 1;
        }
        @keyframes barrage-scroll {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(calc(-100vw - 140%), 0, 0); }
        }
.landing-cta-btn {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          box-shadow: 0 8px 32px rgba(99,102,241,0.35);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          font-weight: 600;
          letter-spacing: 0.3px;
          cursor: pointer;
        }
        .landing-cta-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 44px rgba(99,102,241,0.4), 0 0 0 4px rgba(99,102,241,0.1);
        }
        .landing-btn-glass {
          backdrop-filter: blur(12px);
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(0,0,0,0.08);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .landing-btn-glass:hover {
          transform: translateY(-3px);
          background: rgba(255,255,255,0.8);
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }
      `}</style>
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
                  <div className="mt-3 text-xs tracking-[0.2em] uppercase font-medium text-[#9ca3cf] bg-white/5 backdrop-blur-sm px-4 py-1.5 rounded-full inline-block">
                    加载中...
                  </div>
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

        <AnimatePresence mode="wait">
          {!loading && (
              <motion.div
                  className="min-h-screen"
                  style={{ background: '#fafbfe' }}
              >
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.3 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
                >
                  <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2.5 cursor-pointer"
                        onClick={() => navigate('/welcome')}
                    >
                      <GraduationCapIcon className="w-8 h-8 text-gray-900" />
                      <span className="text-xl font-bold text-gray-900">
                    Job <span className="text-indigo-600">Router</span>
                  </span>
                    </motion.div>

                    {/* Desktop nav buttons */}
                    <div className="hidden md:flex items-center gap-4">
                      <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('/doc')}
                          className="landing-btn-glass flex items-center gap-2 px-6 py-2.5 rounded-full text-gray-700 font-medium"
                      >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        <span>文档</span>
                      </motion.button>
                      <motion.button
                          whileHover={{ scale: 1.05, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('/auth')}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-medium landing-cta-btn text-sm"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <span>登录/注册</span>
                      </motion.button>
                    </div>

                    {/* Mobile hamburger */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setMobileMenu(true)}
                        className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Mobile drawer */}
                <AnimatePresence>
                  {mobileMenu && (
                    <>
                      <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
                          onClick={() => setMobileMenu(false)}
                      />
                      <motion.div
                          initial={{ x: '100%' }}
                          animate={{ x: 0 }}
                          exit={{ x: '100%' }}
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          className="fixed top-0 right-0 bottom-0 z-[70] w-[220px] bg-white shadow-2xl"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                              <GraduationCapIcon className="w-6 h-6 text-gray-900" />
                              <span className="font-bold text-gray-900">Job <span className="text-indigo-600">Router</span></span>
                            </div>
                            <button onClick={() => setMobileMenu(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <nav className="flex flex-col gap-2">
                            <button
                                onClick={() => { navigate('/doc'); setMobileMenu(false); }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-left"
                            >
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span className="font-medium">帮助文档</span>
                            </button>
                            <button
                                onClick={() => { navigate('/auth'); setMobileMenu(false); }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-white mt-2 text-left landing-cta-btn"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              </svg>
                              <span className="font-medium">登录/注册</span>
                            </button>
                          </nav>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <div className="relative min-h-screen flex flex-col items-center justify-center px-8 text-center overflow-hidden" onMouseMove={handleMouseMove}>
                  {/* Particle canvas */}
                  <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }} />
                  {/* Gradient base */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #eef2ff 0%, #e0e7ff 20%, #ede9fe 40%, #e0f2fe 60%, #f0fdf4 80%, #fefce8 100%)', zIndex: 0 }} />
                  {/* Grid mesh overlay */}
                  <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '48px 48px', zIndex: 1 }} />
                  {/* Morphing geo blobs (jelly effect) */}
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
                    <div style={{ position: 'absolute', width: 500, height: 500, top: -150, right: -120, background: 'linear-gradient(135deg, #6366f1, #a78bfa)', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', filter: 'blur(60px)', opacity: 0.4, animation: 'morph 15s ease-in-out infinite' }} />
                    <div style={{ position: 'absolute', width: 400, height: 400, bottom: -120, left: -100, background: 'linear-gradient(135deg, #06b6d4, #67e8f9)', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', filter: 'blur(60px)', opacity: 0.4, animation: 'morph 15s ease-in-out infinite', animationDelay: '-5s' }} />
                    <div style={{ position: 'absolute', width: 300, height: 300, top: '45%', left: '55%', background: 'linear-gradient(135deg, #f59e0b, #fde68a)', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', filter: 'blur(60px)', opacity: 0.4, animation: 'morph 15s ease-in-out infinite', animationDelay: '-10s' }} />
                    <div style={{ position: 'absolute', width: 200, height: 200, top: '25%', left: '10%', background: 'linear-gradient(135deg, #10b981, #6ee7b7)', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', filter: 'blur(60px)', opacity: 0.4, animation: 'morph 15s ease-in-out infinite', animationDelay: '-7s' }} />
                  </div>
                  {/* Mouse-following glow */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      width: 500, height: 500, left: mousePos.x - 250, top: mousePos.y - 250,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
                      transition: 'left 0.3s ease-out, top 0.3s ease-out',
                      zIndex: 4,
                    }}
                  />

                  <div className="relative" style={{ zIndex: 10 }}>
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-sm font-medium text-indigo-600 mb-8 backdrop-blur-sm"
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      AI 驱动 · 免费使用 · 极速响应
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-bold mb-8"
                        style={{ letterSpacing: '-2px', lineHeight: '1.15' }}
                    >
                      用 <span className="text-gradient-animated">AI</span> 规划你的
                      <br />
                      <span className="text-gradient-animated inline-block min-w-[4ch]">
                        {typedText}<span className="typing-cursor">|</span>
                      </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-lg text-gray-600 max-w-[660px] mx-auto mb-12"
                        style={{ lineHeight: '1.85' }}
                    >
                      最懂大学生的 AI 职业规划助手
                      <br />
                      <span className="text-gray-500">上传简历即获专属画像，智能匹配最优岗位，一键生成职业发展报告</span>
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="flex flex-row gap-4 justify-center"
                    >
                      <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400 }}>
                      <button
                          onClick={() => navigate('/auth')}
                          className="landing-cta-btn inline-flex items-center justify-center gap-2 py-3 px-8 text-base font-semibold tracking-wide rounded-full text-white border-0 whitespace-nowrap"
                      >
                        立即开始
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400 }}>
                      <button
                          onClick={() => navigate('/auth')}
                          className="landing-btn-glass inline-flex items-center justify-center gap-2 py-3 px-8 text-base font-semibold tracking-wide rounded-full text-gray-700 whitespace-nowrap"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                        已有账号
                      </button>
                    </motion.div>
                    </motion.div>
                  </div>
                </div>

                <div id="features" className="px-6 pt-16 pb-4 w-full">
                  <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="text-center mb-12"
                  >
                    <h2 className="text-4xl font-bold mb-4" style={{ color: '#0f172a' }}>
                      核心功能
                    </h2>
                    <p className="text-gray-500">全方位助你职业成长</p>
                  </motion.div>

                  <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="mb-12"
                  >
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
                              style={{ gap: `${cardGap}px` }}
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
                                      className="relative aspect-[16/9] shrink-0 overflow-hidden rounded-xl md:rounded-2xl border border-gray-200 bg-white shadow-lg"
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
                                        className="absolute inset-0 rounded-xl md:rounded-2xl overflow-hidden w-full h-full"
                                    >
                                      <img
                                          src={item.imageUrl}
                                          alt={item.title}
                                          className="absolute inset-0 w-full h-full object-cover rounded-xl md:rounded-2xl"
                                          draggable={false}
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
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

                    <div className="mt-5 flex justify-center">
                      <div className="inline-flex min-w-[320px] md:min-w-[44px] items-center justify-between gap-3 rounded-full border border-gray-300 bg-white/80 px-6 py-2 backdrop-blur-md shadow-sm">
                        <div className="flex items-center gap-2">
                          {features.map((_, idx) => (
                              <motion.button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleFeatureDotClick(idx)}
                                  className={`h-2.5 rounded-full transition-all duration-300 ${
                                      idx === hoveredFeatureIndex ? 'relative w-16 overflow-hidden bg-gray-300' : 'w-2.5 bg-gray-400'
                                  }`}
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                              >
                                {idx === hoveredFeatureIndex ? (
                                    <span
                                        key={`${hoveredFeatureIndex}-${isFeatureAutoPlay ? 'play' : 'pause'}`}
                                        className="feature-dot-progress absolute inset-y-0 left-0 rounded-full bg-indigo-600"
                                        style={{
                                          animationDuration: `${FEATURE_ROTATE_INTERVAL_MS}ms`,
                                          animationPlayState: isFeatureAutoPlay ? 'running' : 'paused',
                                        }}
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
                                isFeatureAutoPlay ? 'bg-indigo-100 border-indigo-300 text-indigo-600' : 'bg-gray-100 border-gray-300 text-gray-600'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                          {isFeatureAutoPlay ? <PauseOutlined /> : <CaretRightOutlined />}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>

                  {/* 核心改动：横向拉宽至 1400px，纵向压窄至 55vh，优化内部间距适配新比例 */}
                  <div className="w-full max-w-[1400px] mx-auto pt-10 pb-0 px-4 md:px-8">
                    <ScrollStack
                        useWindowScroll={true}
                        itemDistance={100}
                        itemStackDistance={0}
                        stackPosition="15%"
                        baseScale={0.9}
                        rotationAmount={0}
                        blurAmount={0}
                    >
                      {features.map((item, idx) => (
                          <ScrollStackItem
                              key={idx}
                              itemClassName="max-w-full mx-auto !bg-white !border !border-gray-200 !rounded-[2rem] !p-6 md:!p-10 !shadow-[0_2px_12px_rgba(0,0,0,0.06)] !h-[55vh] min-h-[480px] w-full flex flex-col justify-start overflow-hidden"
                          >
                            <div className="relative z-10 flex flex-col h-full overflow-y-auto pr-3 custom-scrollbar">
                              <div className="flex items-center gap-5 mb-5 shrink-0">
                                <div className="text-4xl md:text-5xl bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-center shrink-0">
                                  {item.icon}
                                </div>
                                <div>
                                  <h3 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 tracking-tight">{item.title}</h3>
                                  <p className="text-gray-500 text-base md:text-lg leading-snug">{item.desc}</p>
                                </div>
                              </div>

                              <div className="w-full h-px bg-gray-100 mb-5 shrink-0" />

                              <div className="mb-5 flex-grow">
                                <p className="text-gray-600 text-base md:text-lg leading-relaxed" style={{ lineHeight: '1.8' }}>{item.detailDesc}</p>
                              </div>

                              <div className="w-full h-px bg-gray-100 mb-5 shrink-0" />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-widest">
                                    适用场景
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {item.scenarios.map((scenario, sIdx) => (
                                        <span
                                            key={sIdx}
                                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600 cursor-default"
                                        >
                                  {scenario}
                                </span>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-widest">
                                    效果数据
                                  </h4>
                                  <div className="grid grid-cols-3 gap-3">
                                    {item.stats.map((stat, stIdx) => (
                                        <div
                                            key={stIdx}
                                            className="text-center p-3 bg-gray-50 border border-gray-100 rounded-2xl"
                                        >
                                          <div className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">{stat.value}</div>
                                          <div className="text-xs md:text-sm text-gray-500 font-medium">{stat.label}</div>
                                        </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                          </ScrollStackItem>
                      ))}
                    </ScrollStack>
                  </div>
                </div>

                <div className="px-6 pt-0 pb-16 max-w-5xl mx-auto relative z-10">
                  <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ margin: "-100px" }}
                      transition={{ duration: 0.6 }}
                      className="text-center mb-12"
                  >
                    <h2 className="text-4xl font-bold mb-4" style={{ color: '#0f172a' }}>
                      与市面产品对比
                    </h2>
                    <p className="text-gray-500">功能全面领先，让求职更简单</p>
                  </motion.div>

                  <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ margin: "-50px" }}
                      transition={{ duration: 0.6 }}
                      className="space-y-0 bg-white p-6 md:p-10 rounded-2xl border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                  >
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="grid grid-cols-4 gap-4 pb-5 border-b border-gray-200 text-sm md:text-base font-bold tracking-wide"
                    >
                      <div className="text-left text-gray-500">功能对比</div>
                      <div className="text-left text-indigo-600 font-semibold">我们</div>
                      <div className="text-left text-gray-500">竞品A</div>
                      <div className="text-left text-gray-500">竞品B</div>
                    </motion.div>
                    {compareData.map((row, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.08 }}
                            className="grid grid-cols-4 gap-4 py-5 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2"
                        >
                          <div className="text-left font-medium text-gray-700">{row.feature}</div>
                          <div className="text-left">{row.us && <CheckOutlined className="text-indigo-600 text-xl font-bold" />}</div>
                          <div className="text-left">{row.competitionA && <CheckOutlined className="text-gray-500 text-lg" />}</div>
                          <div className="text-left">{row.competitionB && <CheckOutlined className="text-gray-500 text-lg" />}</div>
                        </motion.div>
                    ))}
                  </motion.div>
                </div>

                <div className="px-6 py-12 max-w-6xl mx-auto">
                  <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ margin: "-100px" }}
                      transition={{ duration: 0.6 }}
                      className="text-center mb-8"
                  >
                    <h2 className="text-3xl font-bold mb-3" style={{ color: '#0f172a' }}>
                      用户真实评价
                    </h2>
                    <p className="text-gray-500">听听他们的使用体验</p>
                  </motion.div>

                  <div className="relative h-96 bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                    <BarrageCanvas comments={comments} trackCount={8} trackHeight={48} speed={200} spawnInterval={200} />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="px-6 py-20 text-center"
                    style={{ background: '#0f172a' }}
                >
                  <motion.h2
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="text-3xl font-bold mb-6 text-white"
                  >
                    准备好开启你的职业之旅了吗？
                  </motion.h2>
                  <motion.p
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="text-gray-300 mb-8"
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
                        className="landing-cta-btn bg-gradient-to-r from-orange-500 to-pink-500 border-0 h-14 px-10 text-lg rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
                    >
                      立即开始 →
                    </Button>
                  </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="px-6 py-8 border-t border-gray-100 text-center text-gray-400"
                >
                  <p>© 2026 Job Router. All rights reserved.</p>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>

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
                      className="absolute -top-4 right-4 w-10 h-10 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-all"
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

