import { useNavigate } from 'react-router-dom';
import { Card, Steps, Button } from 'antd';
import { CompassOutlined, FileTextOutlined, SolutionOutlined, MessageOutlined } from '@ant-design/icons';

const GraduationCapSVG = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-16 h-16 text-yellow-400"
    style={{ transform: 'rotate(-15deg)', filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
  >
    <path d="M21.79 8.65l-9.5-5.7c-.46-.28-1.02-.28-1.48 0l-9.5 5.7C.58 9.17 0 10.12 0 11.15v1.7c0 1.03.58 1.98 1.31 2.5l9.5 5.7c.46.28 1.02.28 1.48 0l9.5-5.7c.73-.52 1.31-1.47 1.31-2.5v-1.7c0-1.03-.58-1.98-1.31-2.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
    <path d="M12 6c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
  </svg>
);

export default function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      key: 'think',
      title: '还没想好？',
      desc: '先做职业倾向测试',
      subDesc: '5分钟找到适合你的方向',
      icon: <CompassOutlined className="text-orange-500 text-2xl" />,
      color: 'orange',
      path: '/holland',
    },
    {
      key: 'prepare',
      title: '准备好求职？',
      desc: '上传简历让AI优化',
      subDesc: '针对目标岗位智能分析',
      icon: <FileTextOutlined className="text-green-500 text-2xl" />,
      color: 'green',
      path: '/resume',
    },
    {
      key: 'plan',
      title: '想要规划？',
      desc: '生成职业规划方案',
      subDesc: '定制学习路径和目标',
      icon: <SolutionOutlined className="text-blue-500 text-2xl" />,
      color: 'blue',
      path: '/plan',
    },
    {
      key: 'practice',
      title: '面试紧张？',
      desc: '模拟面试练习',
      subDesc: '大厂/国企双模式实战',
      icon: <MessageOutlined className="text-purple-500 text-2xl" />,
      color: 'purple',
      path: '/interview',
    },
  ];

  const colorMap: Record<string, string> = {
    orange: '#fff7e6',
    green: '#f6ffed',
    blue: '#e6f7ff',
    purple: '#f9f0ff',
  };

  return (
    <div className="min-h-screen relative z-10 pb-20">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            欢迎使用职业规划助手 👋
          </h1>
          <p className="text-gray-600">AI 驱动的职业发展解决方案，助你找到理想工作</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
          <h2 className="font-semibold text-gray-700 mb-4">快速开始</h2>
          
          <Steps
            current={-1}
            direction="horizontal"
            items={[
              { title: '职业测试' },
              { title: '优化简历' },
              { title: '制定规划' },
              { title: '模拟面试' },
            ]}
            className="mb-6"
          />

          <div className="grid grid-cols-2 gap-3">
            {features.map((item) => (
              <div
                key={item.key}
                className="p-4 rounded-lg cursor-pointer hover:shadow-md transition-all"
                style={{ backgroundColor: colorMap[item.color] }}
                onClick={() => navigate(item.path)}
              >
                <div className="mb-2">{item.icon}</div>
                <div className="font-medium text-gray-800 text-sm">{item.title}</div>
                <div className="text-xs text-gray-600 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <Card 
          className="mb-4 relative overflow-hidden" 
          bordered={false} 
          style={{ background: '#1a1a1a', minHeight: '160px' }}
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <GraduationCapSVG />
          </div>
          <div className="text-white pr-28">
            <div className="text-2xl mb-2">
              🤔 求职迷茫？不知道该做什么？🔥
            </div>
            <div className="text-sm opacity-80 mb-3">
              从职业倾向测试开始，5分钟了解适合自己的职业方向
            </div>
            <Button 
              type="default" 
              ghost 
              onClick={() => navigate('/holland')}
              className="text-white border-white hover:text-white hover:border-white"
            >
              立即开始测试 →
            </Button>
          </div>
        </Card>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-3">推荐功能</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => navigate('/jobs')}>
              <span>🔍 浏览岗位图谱</span>
              <span className="text-gray-400">→</span>
            </div>
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => navigate('/resume')}>
              <span>📄 智能简历优化</span>
              <span className="text-gray-400">→</span>
            </div>
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => navigate('/interview')}>
              <span>💬 AI模拟面试</span>
              <span className="text-gray-400">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}