import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { RocketOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const features = [
  {
    title: 'AI智能分析',
    desc: '基于DeepSeek大模型，提供精准的职业规划建议',
    icon: '🤖',
  },
  {
    title: '职业图谱',
    desc: '可视化展示岗位晋升和转岗路径，了解职业发展可能性',
    icon: '🗺️',
  },
  {
    title: '简历优化',
    desc: '智能分析简历，针对目标岗位提供优化建议',
    icon: '📝',
  },
  {
    title: '模拟面试',
    desc: '大厂/国企双模式，AI实时反馈面试表现',
    icon: '🎯',
  },
];

const compareData = [
  { feature: 'AI职业规划', us: true, competitionA: false, competitionB: false },
  { feature: '岗位图谱可视化', us: true, competitionA: true, competitionB: false },
  { feature: '简历AI优化', us: true, competitionA: false, competitionB: true },
  { feature: '模拟面试', us: true, competitionA: true, competitionB: false },
  { feature: '霍兰德职业测试', us: true, competitionA: false, competitionB: true },
  { feature: '个性化学习路径', us: true, competitionA: false, competitionB: false },
];

export default function Landing() {
  const navigate = useNavigate();

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
      <div className="px-6 py-20 text-center">
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

      {/* Features Section */}
      <div id="features" className="px-6 py-16 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            核心<span className="text-orange-400">功能</span>
          </h2>
          <p className="text-gray-400">全方位助你职业成长</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">

                  {features.map((item, idx) => (

                    <motion.div

                      key={idx}

                      initial={{ opacity: 0, y: 50 }}

                      whileInView={{ opacity: 1, y: 0 }}

                      viewport={{ margin: "-50px" }}

                      transition={{ duration: 0.5, delay: idx * 0.1 }}

                      whileHover={{

                        scale: 1.08,

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

                        transitionHover={{ duration: 0.5 }}

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
                  transition={{ type: "spring", stiffness: 400 }}
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