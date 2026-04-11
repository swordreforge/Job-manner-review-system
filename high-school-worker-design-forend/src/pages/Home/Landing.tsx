import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { RocketOutlined, RightOutlined, CheckOutlined, LeftOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { FaFolder, FaCog, FaFileAlt, FaLaptopCode, FaChartLine, FaUserGraduate } from 'react-icons/fa';
import { RiWindowsFill } from 'react-icons/ri';
import LaserRay from '../../components/LaserRay';
import LaserGradient from '../../components/LaserGradient';

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
];

export default function Landing() {
  const navigate = useNavigate();
  const [hoveredFeatureIndex, setHoveredFeatureIndex] = useState(0);

  const showPrevFeature = () => {
    setHoveredFeatureIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const showNextFeature = () => {
    setHoveredFeatureIndex((prev) => (prev + 1) % features.length);
  };

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%)' }}>
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
            icon={<RightOutlined />}
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-orange-500 to-pink-500 border-0 h-12 px-6 rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
          >
            Get Started
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
            <RocketOutlined className="text-5xl text-white" />
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
      <div id="features" className="px-6 py-16 max-w-6xl mx-auto">
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 p-8 backdrop-blur-sm">
            {/* 单张大图展示 */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={hoveredFeatureIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <motion.img
                    src={features[hoveredFeatureIndex].imageUrl}
                    alt={features[hoveredFeatureIndex].title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  />
                  {/* 功能信息覆盖层 */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6"
                  >
                    <div>
                      <h3 className="text-2xl font-semibold text-white mb-2">{features[hoveredFeatureIndex].title}</h3>
                      <p className="text-base text-gray-300">{features[hoveredFeatureIndex].desc}</p>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-y-0 left-3 right-3 flex items-center justify-between pointer-events-none">
                <motion.button
                  type="button"
                  aria-label="上一张"
                  onClick={showPrevFeature}
                  className="pointer-events-auto w-10 h-10 rounded-full bg-black/45 border border-white/20 text-white flex items-center justify-center hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LeftOutlined />
                </motion.button>
                <motion.button
                  type="button"
                  aria-label="下一张"
                  onClick={showNextFeature}
                  className="pointer-events-auto w-10 h-10 rounded-full bg-black/45 border border-white/20 text-white flex items-center justify-center hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RightOutlined />
                </motion.button>
              </div>
            </div>
            {/* 图片指示器 */}
            <div className="flex justify-center gap-2 mt-4">
              {features.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setHoveredFeatureIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === hoveredFeatureIndex ? 'bg-orange-400 w-6' : 'bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          </div>
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
          {/* 弹幕轨道 - 每条弹幕独立的垂直轨道 */}
          <div className="absolute inset-0 py-6">
            {comments.map((comment, idx) => (
              <motion.div
                key={comment.id}
                className="absolute h-10 flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900/80 border border-gray-700/50 whitespace-nowrap"
                style={{
                  top: `${idx * 40}px`,
                  backgroundColor: `${comment.color}20`,
                  borderColor: `${comment.color}40`,
                }}
                initial={{ x: '100%' }}
                animate={{ x: '-150%' }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: idx * 2.5,
                }}
              >
                <span className="text-lg">{comment.avatar}</span>
                <span className="text-sm font-semibold" style={{ color: comment.color }}>{comment.user}:</span>
                <span className="text-sm text-gray-300">{comment.text}</span>
              </motion.div>
            ))}
          </div>

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
                    icon={<RocketOutlined />}
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-orange-500 to-pink-500 border-0 h-14 px-10 text-lg rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
                  >
                    立即开始 →
                  </Button>
                </motion.div>      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="px-6 py-8 border-t border-gray-800 text-center text-gray-500"
      >
        <p>© 2024 职业规划助手. All rights reserved.</p>
      </motion.div>
    </div>
  );
}

