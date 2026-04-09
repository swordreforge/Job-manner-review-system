import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hollandApi } from '../../api';
import type { HollandResult } from '../../types';

export default function HollandHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HollandResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await hollandApi.getHistory({ page, pageSize });
      if (response.code === 0 && response.data) {
        setHistory(response.data.list);
        setTotal(response.data.total);
      } else {
        setError(response.msg || '加载历史记录失败');
      }
    } catch (err) {
      setError('加载历史记录失败，请重试');
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewResult = (testId: number) => {
    navigate(`/holland/result/${testId}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && history.length === 0) {
    return (
      <div className="min-h-screen relative z-10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">加载历史记录中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      <div className="p-6 max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">测试历史</h1>
          <p className="text-gray-600">查看您的霍兰德职业倾向测试记录</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 历史记录列表 */}
        {history.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">暂无测试记录</p>
            <button
              onClick={() => navigate('/holland')}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              开始测试
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record) => (
              <div
                key={record.testId}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="text-3xl font-bold"
                        style={{ color: record.topTypes[0]?.color }}
                      >
                        {record.careerCode}
                      </div>
                      <div className="flex gap-2">
                        {record.topTypes.slice(0, 3).map((typeInfo) => (
                          <span
                            key={typeInfo.type}
                            className="px-2 py-1 text-xs rounded-full text-white"
                            style={{ backgroundColor: typeInfo.color }}
                          >
                            {typeInfo.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{record.description}</p>
                    <div className="text-xs text-gray-500">
                      测试时间：{formatDate(record.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewResult(record.testId)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-gray-600">
              第 {page} / {totalPages} 页
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}

        {/* 开始新测试按钮 */}
        {history.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => navigate('/holland')}
              className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              开始新测试
            </button>
          </div>
        )}
      </div>
    </div>
  );
}