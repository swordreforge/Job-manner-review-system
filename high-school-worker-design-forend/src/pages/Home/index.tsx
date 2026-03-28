import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">欢迎使用职业规划助手</h1>
        <p className="text-gray-600 mb-6">AI 驱动的职业发展解决方案</p>
        
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="font-semibold text-gray-700 mb-3">快速开始</h2>
          <div className="space-y-3">
            <div 
              className="p-3 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={() => navigate('/holland')}
            >
              <span className="text-orange-600 font-medium">职业倾向测试</span>
              <p className="text-sm text-gray-500 mt-1">5分钟了解适合的职业方向</p>
            </div>
            <div 
              className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => navigate('/plan')}
            >
              <span className="text-blue-600 font-medium">生成职业规划</span>
              <p className="text-sm text-gray-500 mt-1">基于您的背景定制学习路径</p>
            </div>
            <div 
              className="p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => navigate('/resume')}
            >
              <span className="text-green-600 font-medium">上传简历优化</span>
              <p className="text-sm text-gray-500 mt-1">AI 智能分析和优化建议</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <span className="text-purple-600 font-medium">模拟面试练习</span>
              <p className="text-sm text-gray-500 mt-1">大厂/国企双模式实战演练</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}