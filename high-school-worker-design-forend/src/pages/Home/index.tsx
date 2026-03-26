export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">欢迎使用职业规划助手</h1>
        <p className="text-gray-600 mb-6">AI 驱动的职业发展解决方案</p>
        
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="font-semibold text-gray-700 mb-3">快速开始</h2>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-600 font-medium">生成职业规划</span>
              <p className="text-sm text-gray-500 mt-1">基于您的背景定制学习路径</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <span className="text-green-600 font-medium">上传简历优化</span>
              <p className="text-sm text-gray-500 mt-1">AI 智能分析和优化建议</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <span className="text-purple-600 font-medium">模拟面试练习</span>
              <p className="text-sm text-gray-500 mt-1">大厂/国企双模式实战演练</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-3">选择目标赛道</h2>
          <div className="flex gap-4">
            <button className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
              大厂技术岗
            </button>
            <button className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors">
              国企研发岗
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}