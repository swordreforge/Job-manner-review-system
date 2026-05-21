import { useState, useEffect } from 'react';
import { Button, message, Dropdown, Select, Space, Modal } from 'antd';
import { ReloadOutlined, SyncOutlined, SortAscendingOutlined, SortDescendingOutlined, DeleteOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores';
import { studentApi, reportApi } from '../../api';
import type { Student } from '../../types';
import SurfaceCard from '../../components/SurfaceCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import PageHeader from '../../components/PageHeader';

interface SkillItem {
  name: string;
  level: number;
  status: '已掌握' | '学习中' | '待学习';
}

interface TimelineItem {
  date: string;
  title: string;
  desc: string;
}

interface ReportItem {
  id: number;
  title: string;
  status: string;
  createdAt: number;
  content?: string;
  type: 'bigtech' | 'gov' | 'unknown';
}

export default function PlanPage() {
  const { track } = useUIStore();
  const [activeTrack, setActiveTrack] = useState<'bigtech' | 'gov'>(track);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [completeness, setCompleteness] = useState(0);
  const [competitiveness, setCompetitiveness] = useState(0);
  const [hasReport, setHasReport] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [sortBy, setSortBy] = useState<'desc' | 'asc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchStudentData();
  }, []);

  useEffect(() => {
    if (student) {
      loadReports();
    }
  }, [student]);

  useEffect(() => {
    if (selectedReportId && reports.length > 0) {
      const selectedReport = reports.find(r => r.id === selectedReportId);
      if (selectedReport?.content) {
        loadReportContent(selectedReport);
      }
    }
  }, [selectedReportId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const studentData = await studentApi.getMe();
      if (studentData && studentData.data) {
        setStudent(studentData.data);
      }
    } catch (error: any) {
      console.error('获取学生数据失败:', error);
      if (error.response?.data?.msg === 'student profile not found') {
        message.warning('您还没有创建学生资料，请先完善个人信息');
      } else if (error.response?.status === 401) {
        console.log('认证失败，已跳转到登录页');
      } else {
        message.error('获取学生数据失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setLoadingReports(true);
      const reportsData = await reportApi.getMe();
      if (reportsData && reportsData.data && reportsData.data.list) {
        const reportList = reportsData.data.list.map((r: any) => {
          let displayTitle = r.title || `职业规划报告 #${r.id}`;
          let reportType: 'bigtech' | 'gov' | 'unknown' = 'unknown';

          if (displayTitle.includes('- full')) {
            displayTitle = displayTitle.replace('- full', '(大厂)');
            reportType = 'bigtech';
          } else if (displayTitle.includes('- gap')) {
            displayTitle = displayTitle.replace('- gap', '(国企)');
            reportType = 'gov';
          }

          return {
            id: r.id,
            title: displayTitle,
            status: r.status,
            createdAt: r.createdAt,
            content: r.content,
            type: reportType,
          };
        });
        setReports(reportList);
        if (reportList.length > 0 && !selectedReportId) {
          setSelectedReportId(reportList[0].id);
        }
        return reportList;
      }
      return [];
    } catch (error) {
      console.error('获取报告列表失败:', error);
      message.error('获取报告列表失败');
      return [];
    } finally {
      setLoadingReports(false);
    }
  };

  const loadReportContent = (report: ReportItem) => {
    try {
      if (report.content) {
        const content = JSON.parse(report.content);
        setSkills(content.skills || []);
        setTimeline(content.timeline || []);
        setCompleteness(content.completeness || 0);
        setCompetitiveness(content.competitiveness || 0);
        setHasReport(true);
      }
    } catch (e) {
      console.error('解析报告内容失败:', e);
      setHasReport(false);
    }
  };

  const handleSelectReport = (reportId: number) => {
    setSelectedReportId(reportId);
  };

  const getFilteredAndSortedReports = () => {
    let filtered = [...reports];

    if (filterType !== 'all') {
      if (filterType === 'bigtech') {
        filtered = filtered.filter(report => report.type === 'bigtech');
      } else if (filterType === 'gov') {
        filtered = filtered.filter(report => report.type === 'gov');
      }
    }

    filtered.sort((a, b) => {
      return sortBy === 'desc'
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt;
    });

    return filtered;
  };

  const handleSortChange = (order: 'asc' | 'desc') => {
    setSortBy(order);
  };

  const handleTypeChange = (type: string) => {
    setFilterType(type);
  };

  const handleGenerateReport = async () => {
    if (!student?.id) {
      message.error('学生信息不存在');
      return;
    }

    setGenerating(true);
    try {
      const trackValue = activeTrack === 'bigtech' ? 'full' : 'gap';
      await reportApi.generateStream.fetchWithAuth(
        {
          studentId: student.id,
          track: trackValue,
        },
        (event) => {
          const data = event.data;
          if (event.type === 'report' || data.type === 'report') {
            setSkills(data.content?.skills || []);
            setTimeline(data.content?.timeline || []);
            setCompleteness(data.content?.completeness || 0);
            setCompetitiveness(data.content?.competitiveness || 0);
            setHasReport(true);
          }
        },
        (error) => {
          console.error('SSE stream error:', error);
        }
      );
      setGenerating(false);
      message.success('职业规划生成完成');
      loadReports();
    } catch (error) {
      console.error('生成报告失败:', error);
      message.error('生成报告失败');
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (reportId: number, event: React.MouseEvent) => {
    event.stopPropagation();

    Modal.confirm({
      className: 'plan-delete-modal-dark',
      rootClassName: 'plan-delete-modal-dark-root',
      wrapClassName: 'plan-delete-modal-dark-wrap',
      title: '确认删除',
      content: '确定要删除这条历史记录吗？删除后无法恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const isSelectedReport = selectedReportId === reportId;
          await reportApi.delete(reportId);
          message.success('删除成功');

          setHasReport(false);
          setSkills([]);
          setTimeline([]);
          setCompleteness(0);
          setCompetitiveness(0);

          const updatedReports = await loadReports();

          if (isSelectedReport) {
            const remainingReports = getFilteredAndSortedReports();
            if (remainingReports.length > 0) {
              const newSelectedId = remainingReports[0].id;
              const newSelectedReport = updatedReports.find(r => r.id === newSelectedId);
              setSelectedReportId(newSelectedId);
              if (newSelectedReport && newSelectedReport.content) {
                loadReportContent(newSelectedReport);
              } else {
                setHasReport(false);
              }
            } else {
              setSelectedReportId(null);
            }
          } else {
            if (selectedReportId) {
              const currentReport = updatedReports.find(r => r.id === selectedReportId);
              if (currentReport && currentReport.content) {
                loadReportContent(currentReport);
              } else {
                setHasReport(false);
              }
            }
          }
        } catch (error) {
          console.error('删除报告失败:', error);
          message.error('删除失败');
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已掌握': return 'var(--md-sys-color-success)';
      case '学习中': return 'var(--md-sys-color-primary)';
      default: return 'var(--md-sys-color-warning)';
    }
  };

  const getProgressColor = (value: number): string => {
    if (value >= 80) return 'var(--md-sys-color-success)';
    if (value >= 60) return 'var(--md-sys-color-warning)';
    return 'var(--md-sys-color-error)';
  };

  if (loading) {
    return (
      <div className="min-h-screen relative z-10 p-4">
        <PageHeader title="报告管理" description="查看和生成您的职业规划报告" icon={<span className="material-symbols-rounded">description</span>} />
        <SkeletonLoader type="card@3" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10 p-4">
      <PageHeader title="报告管理" description="查看和生成您的职业规划报告" icon={<span className="material-symbols-rounded">description</span>} />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            className="md-typescale-label-large px-4 py-1.5 transition-colors cursor-pointer"
            style={{
              backgroundColor: activeTrack === 'bigtech' ? 'var(--md-sys-color-primary-container)' : 'transparent',
              color: activeTrack === 'bigtech' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              border: `1px solid ${activeTrack === 'bigtech' ? 'var(--md-sys-color-outline-variant)' : 'var(--md-sys-color-outline)'}`,
              borderRadius: 'var(--md-sys-shape-corner-full)',
            }}
            onClick={() => setActiveTrack('bigtech')}
          >
            大厂技术面
          </button>
          <button
            className="md-typescale-label-large px-4 py-1.5 transition-colors cursor-pointer"
            style={{
              backgroundColor: activeTrack === 'gov' ? 'var(--md-sys-color-primary-container)' : 'transparent',
              color: activeTrack === 'gov' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              border: `1px solid ${activeTrack === 'gov' ? 'var(--md-sys-color-outline-variant)' : 'var(--md-sys-color-outline)'}`,
              borderRadius: 'var(--md-sys-shape-corner-full)',
            }}
            onClick={() => setActiveTrack('gov')}
          >
            国企综合面
          </button>
        </div>
        <Button
          icon={generating ? <SyncOutlined spin /> : <ReloadOutlined />}
          onClick={handleGenerateReport}
          loading={generating}
          className="ml-4"
        >
          {generating ? '生成中...' : '生成'}
        </Button>
      </div>

      {!student && !loading && (
        <SurfaceCard>
          <div className="text-center py-8">
            <span className="material-symbols-rounded text-4xl" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>inbox</span>
            <div className="md-typescale-body-large mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>您还没有创建学生资料</div>
            <Button type="primary" onClick={() => message.info('请在个人中心完善信息')} className="mt-3">
              完善个人信息
            </Button>
          </div>
        </SurfaceCard>
      )}

      {student && (
        <div className="flex flex-col gap-4">
          <SurfaceCard
            className="w-full"
            title={`历史记录 (${getFilteredAndSortedReports().length})`}
            action={
              <Space size="small">
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={loadReports}
                  loading={loadingReports}
                />
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'desc',
                        label: '时间降序',
                        icon: <SortDescendingOutlined />,
                        onClick: () => handleSortChange('desc'),
                      },
                      {
                        key: 'asc',
                        label: '时间升序',
                        icon: <SortAscendingOutlined />,
                        onClick: () => handleSortChange('asc'),
                      },
                    ],
                  }}
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={sortBy === 'desc' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
                  />
                </Dropdown>

                <Select
                  value={filterType}
                  onChange={handleTypeChange}
                  size="small"
                  style={{ width: 90 }}
                  options={[
                    { label: '全部', value: 'all' },
                    { label: '国企', value: 'gov' },
                    { label: '大厂', value: 'bigtech' },
                  ]}
                />
              </Space>
            }
          >
            <div className="space-y-2">
              {getFilteredAndSortedReports().length > 0 ? (
                getFilteredAndSortedReports().map((report) => {
                  let previewCompleteness = 0;
                  let previewCompetitiveness = 0;
                  try {
                    if (report.content) {
                      const content = JSON.parse(report.content);
                      previewCompleteness = content.completeness || 0;
                      previewCompetitiveness = content.competitiveness || 0;
                    }
                  } catch (e) {
                    console.error('解析报告预览失败:', e);
                  }

                  return (
                    <div
                      key={report.id}
                      className="p-3 cursor-pointer rounded transition-colors"
                      style={{
                        backgroundColor: 'var(--md-sys-color-surface-container-low)',
                        border: selectedReportId === report.id
                          ? '2px solid var(--md-sys-color-primary)'
                          : '1px solid var(--md-sys-color-outline-variant)',
                      }}
                      onClick={() => handleSelectReport(report.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-low)';
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="md-typescale-body-medium flex-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>{report.title}</div>
                        <Space size="small">
                          <span
                            className="md-typescale-label-small px-2 py-1 rounded"
                            style={{
                              backgroundColor: 'var(--md-sys-color-primary-container)',
                              color: 'var(--md-sys-color-on-primary-container)',
                            }}
                          >
                            {report.status}
                          </span>
                          <button
                            className="cursor-pointer transition-colors"
                            style={{ color: 'var(--md-sys-color-on-surface-variant)', border: 'none', background: 'none', padding: '4px' }}
                            onClick={(e) => handleDeleteReport(report.id, e)}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--md-sys-color-error)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--md-sys-color-on-surface-variant)'; }}
                          >
                            <DeleteOutlined />
                          </button>
                        </Space>
                      </div>
                      <div className="md-typescale-body-small mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {new Date(report.createdAt * 1000).toLocaleString('zh-CN')}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className="md-typescale-label-small" style={{ color: 'var(--md-sys-color-success)' }}>
                          完整度: {Math.round(previewCompleteness)}%
                        </span>
                        <span className="md-typescale-label-small" style={{ color: 'var(--md-sys-color-primary)' }}>
                          竞争力: {Math.round(previewCompetitiveness)}%
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-rounded text-4xl" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>inbox</span>
                  <div className="md-typescale-body-large mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {filterType === 'all' ? '暂无历史记录' : `暂无${filterType === 'bigtech' ? '大厂' : '国企'}的报告`}
                  </div>
                </div>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="w-full" title={reports.find(r => r.id === selectedReportId)?.title || '职业规划详情'}>
            {generating && (
              <div className="py-8 flex flex-col items-center">
                <SkeletonLoader type="card@3" />
                <p className="mt-4 md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>正在根据您的资料生成职业规划...</p>
              </div>
            )}

            {!generating && hasReport && (
              <>
                <SurfaceCard title="整体评估" className="mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>资料完整度</span>
                        <span className="md-typescale-label-medium" style={{ color: getProgressColor(Math.round(completeness)) }}>{Math.round(completeness)}%</span>
                      </div>
                      <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round(completeness)}%`, backgroundColor: getProgressColor(Math.round(completeness)), borderRadius: 'var(--md-sys-shape-corner-full)', height: '100%', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>竞争力指数</span>
                        <span className="md-typescale-label-medium" style={{ color: getProgressColor(Math.round(competitiveness)) }}>{Math.round(competitiveness)}%</span>
                      </div>
                      <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round(competitiveness)}%`, backgroundColor: getProgressColor(Math.round(competitiveness)), borderRadius: 'var(--md-sys-shape-corner-full)', height: '100%', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  </div>
                </SurfaceCard>

                <SurfaceCard title="技能掌握进度" className="mb-4">
                  <div className="space-y-4">
                    {skills.length > 0 ? (
                      skills.map((skill, index) => (
                        <div key={index} className="w-full">
                          <div className="flex justify-between mb-1">
                            <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{skill.name}</span>
                            <span className="md-typescale-label-medium" style={{ color: getStatusColor(skill.status) }}>{skill.status}</span>
                          </div>
                          <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '8px', overflow: 'hidden' }}>
                            <div style={{ width: `${skill.level}%`, backgroundColor: getStatusColor(skill.status), borderRadius: 'var(--md-sys-shape-corner-full)', height: '100%', transition: 'width 0.3s ease' }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <span className="material-symbols-rounded text-4xl" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>inbox</span>
                        <div className="md-typescale-body-large mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>暂无技能数据</div>
                      </div>
                    )}
                  </div>
                </SurfaceCard>

                <SurfaceCard title="学习时间轴">
                  {timeline.length > 0 ? (
                    <div className="space-y-4">
                      {timeline.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--md-sys-color-primary)' }} />
                            {idx < timeline.length - 1 && <div className="w-px flex-1" style={{ backgroundColor: 'var(--md-sys-color-outline-variant)' }} />}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="md-typescale-title-small" style={{ color: 'var(--md-sys-color-on-surface)' }}>{item.title}</div>
                            <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{item.desc}</div>
                            <div className="md-typescale-label-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{item.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="material-symbols-rounded text-4xl" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>inbox</span>
                      <div className="md-typescale-body-large mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>暂无时间轴数据</div>
                    </div>
                  )}
                </SurfaceCard>
              </>
            )}

            {!generating && !hasReport && (
              <SurfaceCard>
                <div className="text-center py-8">
                  <span className="material-symbols-rounded text-4xl" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>inbox</span>
                  <div className="md-typescale-body-large mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>暂无职业规划数据</div>
                  <Button type="primary" onClick={handleGenerateReport} className="mt-3">
                    生成职业规划
                  </Button>
                </div>
              </SurfaceCard>
            )}
          </SurfaceCard>
        </div>
      )}
    </div>
  );
}