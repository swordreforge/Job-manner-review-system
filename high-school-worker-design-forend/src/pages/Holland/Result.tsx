import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hollandApi, type HollandResult } from '../../api';

export default function HollandResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<HollandResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadResult(parseInt(id));
    }
  }, [id]);

  const loadResult = async (testId: number) => {
    try {
      setLoading(true);
      const response = await hollandApi.getResult(testId);
      if (response.code === 0 && response.data) {
        setResult(response.data);
      } else {
        setError(response.msg || '加载结果失败');
      }
    } catch (err) {
      setError('加载结果失败，请重试');
      console.error('Failed to load result:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetest = () => {
    navigate('/holland');
  };

  const handleViewHistory = () => {
    navigate('/holland/history');
  };

  const handleGenerateReport = () => {
    navigate(`/plan?holland=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">加载结果中...</p>
        </div>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 shadow-sm max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => loadResult(parseInt(id!))}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const maxScore = Math.max(...Object.values(result.scores));

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="p-6 max-w-4xl mx-auto">
        {/* 职业代码 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="text-center">
            <h1 className="text-sm text-gray-600 mb-2">您的职业兴趣代码</h1>
            <div className="text-6xl font-bold mb-4" style={{ color: result.topTypes[0]?.color }}>
              {result.careerCode}
            </div>
            <p className="text-gray-700">{result.description}</p>
          </div>
        </div>

        {/* 六边形雷达图 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">职业类型分布</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {result.topTypes.map((typeInfo, index) => (
              <div
                key={typeInfo.type}
                className="p-4 rounded-lg border-2"
                style={{ borderColor: typeInfo.color }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: typeInfo.color }}
                  ></div>
                  <span className="font-semibold" style={{ color: typeInfo.color }}>
                    {typeInfo.name}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">{typeInfo.description}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(typeInfo.score / maxScore) * 100}%`,
                        backgroundColor: typeInfo.color
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{typeInfo.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 得分详情 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">各类型得分</h2>
          <div className="space-y-3">
            {Object.entries(result.scores).map(([type, score]) => {
              const typeInfo = result.topTypes.find(t => t.type === type);
              const color = typeInfo?.color || '#999';
              
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="w-12 font-bold text-center" style={{ color }}>
                    {type}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${(score / maxScore) * 100}%`,
                        backgroundColor: color
                      }}
                    ></div>
                  </div>
                  <div className="w-8 text-right font-medium text-gray-700">{score}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 推荐职业 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">推荐职业</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {result.suitableJobs.map((job, index) => (
              <div
                key={index}
                className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg"
              >
                <div className="font-medium text-gray-800">{job}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleRetest}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              重新测试
            </button>
            <button
              onClick={handleViewHistory}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              查看历史
            </button>
            <button
              onClick={handleGenerateReport}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              生成职业规划
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}