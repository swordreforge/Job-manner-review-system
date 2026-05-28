import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { hollandApi } from '../../api';
import type { HollandResult } from '../../types';
import SurfaceCard from '../../components/SurfaceCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import PageHeader from '../../components/PageHeader';
import { getEChartsM3Theme } from '../../components/EChartsM3Theme';

export default function HollandResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<HollandResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const radarOption = useMemo(() => {
    if (!result) return {};
    const m3Theme = getEChartsM3Theme();
    const m3Radar = m3Theme.radar as Record<string, unknown>;

    const typeMap: Record<string, { name: string; color: string }> = {};
    result.topTypes.forEach(t => {
      typeMap[t.type] = { name: t.name, color: t.color };
    });

    const maxScore = Math.max(...Object.values(result.scores));
    const indicator = Object.entries(result.scores).map(([type]) => ({
      name: typeMap[type]?.name || type,
      max: maxScore * 1.1,
    }));

    const scoreValues = Object.values(result.scores);
    const areaColor = result.topTypes[0]?.color || '#f97316';

    return {
      backgroundColor: 'transparent',
      tooltip: m3Theme.tooltip,
      radar: {
        ...m3Radar,
        indicator,
        shape: 'polygon' as const,
        splitNumber: 4,
        axisName: {
          ...(m3Radar?.axisName as Record<string, unknown>),
          fontSize: 13,
          fontWeight: 600,
        },
      },
      series: [
        {
          type: 'radar' as const,
          data: [
            {
              value: scoreValues,
              name: '兴趣得分',
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: { color: areaColor, width: 2 },
              areaStyle: {
                color: {
                  type: 'radial' as const,
                  x: 0.5, y: 0.5, r: 0.5,
                  colorStops: [
                    { offset: 0, color: areaColor + '40' },
                    { offset: 1, color: areaColor + '15' },
                  ],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
              },
              itemStyle: { color: areaColor },
            },
          ],
        },
      ],
    };
  }, [result]);

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
      <div className="min-h-screen relative z-10 flex items-center justify-center">
        <div className="text-center w-full max-w-5xl px-6">
          <SkeletonLoader type="card@3" />
          <p className="md-typescale-body-large mt-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>加载结果中...</p>
        </div>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="min-h-screen relative z-10 flex items-center justify-center">
        <SurfaceCard variant="elevated" style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <p className="md-typescale-body-large mb-4" style={{ color: 'var(--md-sys-color-error)' }}>{error}</p>
          <button
            onClick={() => loadResult(parseInt(id!))}
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
            重新加载
          </button>
        </SurfaceCard>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const maxScore = Math.max(...Object.values(result.scores));

  return (
    <div className="min-h-screen relative z-10">
      <div className="p-6 max-w-5xl mx-auto">
        <PageHeader title="测试结果" icon={<span className="material-symbols-rounded">assessment</span>} />

        <SurfaceCard variant="elevated" className="mb-6">
          <div className="text-center">
            <h1 className="md-typescale-body-large mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>您的职业兴趣代码</h1>
            <div className="md-typescale-display-large font-bold mb-4" style={{ color: result.topTypes[0]?.color }}>
              {result.careerCode}
            </div>
            <p className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{result.description}</p>
          </div>
        </SurfaceCard>

        <SurfaceCard variant="elevated" title="兴趣雷达图" className="mb-6">
          <ReactECharts option={radarOption} style={{ height: 320 }} />
        </SurfaceCard>

        <SurfaceCard variant="elevated" title="职业类型分布" className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {result.topTypes.map((typeInfo) => (
              <div
                key={typeInfo.type}
                className="p-4"
                style={{
                  borderRadius: 'var(--md-sys-shape-corner-large)',
                  border: `2px solid ${typeInfo.color}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: typeInfo.color }}
                  ></div>
                  <span className="md-typescale-title-small font-semibold" style={{ color: typeInfo.color }}>
                    {typeInfo.name}
                  </span>
                </div>
                <div className="md-typescale-body-small mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{typeInfo.description}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(typeInfo.score / maxScore) * 100}%`,
                        backgroundColor: typeInfo.color
                      }}
                    ></div>
                  </div>
                  <span className="md-typescale-label-large font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{typeInfo.score}</span>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard variant="elevated" title="各类型得分" className="mb-6">
          <div className="space-y-3">
            {Object.entries(result.scores).map(([type, score]) => {
              const typeInfo = result.topTypes.find(t => t.type === type);
              const color = typeInfo?.color || 'var(--md-sys-color-on-surface-variant)';
              
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="w-12 md-typescale-label-large font-bold text-center" style={{ color }}>
                    {type}
                  </div>
                  <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                    <div
                      className="h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${(score / maxScore) * 100}%`,
                        backgroundColor: color
                      }}
                    ></div>
                  </div>
                  <div className="w-8 text-right md-typescale-label-large font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{score}</div>
                </div>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard variant="elevated" title="推荐职业" className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {result.suitableJobs.map((job, index) => (
              <div
                key={index}
                className="p-3"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  borderRadius: 'var(--md-sys-shape-corner-large)',
                }}
              >
                <div className="md-typescale-body-medium font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{job}</div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard variant="elevated">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleRetest}
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
              重新测试
            </button>
            <button
              onClick={handleViewHistory}
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
              查看历史
            </button>
            <button
              onClick={handleGenerateReport}
              className="md-typescale-label-large px-6 py-3 transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--md-sys-color-success, #1B8C3B)',
                color: 'var(--md-sys-color-on-success, #FFF)',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                border: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              去生成职业规划
            </button>
            <button
              onClick={() => navigate('/start')}
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
              返回首页
            </button>
          </div>
        </SurfaceCard>

        {error && (
          <div
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 md-typescale-body-medium"
            style={{
              backgroundColor: 'var(--md-sys-color-error)',
              color: 'var(--md-sys-color-on-error)',
              borderRadius: 'var(--md-sys-shape-corner-large)',
              boxShadow: 'var(--md-sys-elevation-3)',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}