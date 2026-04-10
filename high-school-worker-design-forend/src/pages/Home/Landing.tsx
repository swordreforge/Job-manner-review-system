import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { RocketOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons';

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
      <div className="fixed top-6 right-6 z-50">
        <Button 
          type="primary"
          size="large"
          icon={<RightOutlined />}
          onClick={() => navigate('/auth')}
          className="bg-gradient-to-r from-orange-500 to-pink-500 border-0 h-12 px-6 rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
        >
          Get Started
        </Button>
      </div>

      {/* Hero Section */}
      <div className="px-6 py-20 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 mb-8 shadow-lg shadow-orange-500/30">
          <RocketOutlined className="text-5xl text-white" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          职业规划<span className="text-orange-400">助手</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          AI驱动的职业发展解决方案，助你找到理想工作
          <br />
          <span className="text-gray-500">从职业测试到入职offer，一站式服务</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            type="primary"
            size="large"
            icon={<RightOutlined />}
            onClick={() => navigate('/auth')}
            className="bg-orange-500 border-orange-500 hover:bg-orange-600 h-14 px-10 text-lg rounded-full"
          >
            立即开始
          </Button>
          <Button 
            size="large"
            onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="border-gray-600 text-white hover:bg-gray-800 h-14 px-10 text-lg rounded-full"
          >
            了解更多
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            核心<span className="text-orange-400">功能</span>
          </h2>
          <p className="text-gray-400">全方位助你职业成长</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl transition-all hover:transform hover:scale-[1.02]"
              style={{ 
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Section */}
      <div className="px-6 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            与市面<span className="text-orange-400">产品对比</span>
          </h2>
          <p className="text-gray-400">功能全面领先，让求职更简单</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-4 text-left text-gray-400">功能</th>
                <th className="py-4 text-orange-400 font-bold">我们</th>
                <th className="py-4 text-gray-500">竞品A</th>
                <th className="py-4 text-gray-500">竞品B</th>
              </tr>
            </thead>
            <tbody>
              {compareData.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-800">
                  <td className="py-4 text-left text-gray-300">{row.feature}</td>
                  <td className="py-4">
                    {row.us ? (
                      <CheckOutlined className="text-green-400 text-xl" />
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="py-4">
                    {row.competitionA ? (
                      <CheckOutlined className="text-gray-500 text-xl" />
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="py-4">
                    {row.competitionB ? (
                      <CheckOutlined className="text-gray-500 text-xl" />
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">准备好开启你的职业之旅了吗？</h2>
        <p className="text-gray-400 mb-8">5分钟了解适合自己的职业方向</p>
        <Button 
          type="primary"
          size="large"
          icon={<RocketOutlined />}
          onClick={() => navigate('/auth')}
          className="bg-gradient-to-r from-orange-500 to-pink-500 border-0 h-14 px-10 text-lg rounded-full"
        >
          立即开始 →
        </Button>
      </div>

      {/* Footer */}
      <div className="px-6 py-8 border-t border-gray-800 text-center text-gray-500">
        <p>© 2024 职业规划助手. All rights reserved.</p>
      </div>
    </div>
  );
}