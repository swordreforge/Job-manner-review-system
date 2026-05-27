import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hollandApi } from '../../api';
import type { HollandResult } from '../../types';
import SurfaceCard from '../../components/SurfaceCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import PageHeader from '../../components/PageHeader';

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className="text-center w-full max-w-4xl px-6">
          <SkeletonLoader type="list" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      <div className="p-6 max-w-4xl mx-auto">
        <PageHeader title="测试历史" description="查看您的职业兴趣测试记录" icon={<span className="material-symbols-rounded">history</span>} />

        {error && (
          <div
            className="px-4 py-3 mb-6 md-typescale-body-medium"
            style={{
              backgroundColor: 'var(--md-sys-color-error-container)',
              border: '1px solid var(--md-sys-color-error)',
              color: 'var(--md-sys-color-error)',
              borderRadius: 'var(--md-sys-shape-corner-large)',
            }}
          >
            {error}
          </div>
        )}

        {history.length === 0 ? (
          <SurfaceCard variant="elevated" className="text-center">
            <div style={{ color: 'var(--md-sys-color-on-surface-variant)' }} className="mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="md-typescale-body-large mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>暂无测试记录</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/holland')}
                className="md-typescale-label-large px-6 py-2.5 transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  border: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary-container)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary-container)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary)'; }}
              >
                开始测试
              </button>
              <button
                onClick={() => navigate(-1)}
                className="md-typescale-label-large px-6 py-2.5 transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--md-sys-color-primary)',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  border: '1px solid var(--md-sys-color-outline)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                返回上级
              </button>
            </div>
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            {history.map((record) => (
              <SurfaceCard variant="elevated" key={record.testId}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="md-typescale-headline-medium font-bold"
                        style={{ color: record.topTypes[0]?.color }}
                      >
                        {record.careerCode}
                      </div>
                      <div className="flex gap-2">
                        {record.topTypes.slice(0, 3).map((typeInfo) => (
                          <span
                            key={typeInfo.type}
                            className="px-2 py-1 md-typescale-label-small rounded-full"
                            style={{ backgroundColor: typeInfo.color, color: 'var(--md-sys-color-on-primary)' }}
                          >
                            {typeInfo.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="md-typescale-body-small mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{record.description}</p>
                    <div className="md-typescale-label-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      测试时间：{formatDate(record.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewResult(record.testId)}
                    className="md-typescale-label-large px-4 py-2 transition-colors cursor-pointer whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--md-sys-color-primary)',
                      color: 'var(--md-sys-color-on-primary)',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                      border: 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary-container)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary-container)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary)'; }}
                  >
                    查看详情
                  </button>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 md-typescale-label-large transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface)',
              }}
              onMouseEnter={(e) => { if (page !== 1) e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-low)'; }}
            >
              上一页
            </button>
            <span className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              第 {page} / {totalPages} 页
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 md-typescale-label-large transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface)',
              }}
              onMouseEnter={(e) => { if (page !== totalPages) e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-low)'; }}
            >
              下一页
            </button>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/holland')}
              className="md-typescale-label-large px-6 py-3 transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                border: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary-container)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary-container)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary)'; e.currentTarget.style.color = 'var(--md-sys-color-on-primary)'; }}
            >
              开始新测试
            </button>
            <button
              onClick={() => navigate(-1)}
              className="md-typescale-label-large px-6 py-3 transition-colors cursor-pointer"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--md-sys-color-primary)',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                border: '1px solid var(--md-sys-color-outline)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              返回上级
            </button>
          </div>
        )}
      </div>
    </div>
  );
}