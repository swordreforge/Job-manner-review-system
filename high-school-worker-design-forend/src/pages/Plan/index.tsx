import { useState, useEffect } from 'react';
import { Segmented, Card, Progress, Timeline, Button, Spin, Empty, message } from 'antd';
import { ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores';
import { studentApi, reportApi } from '../../api';
import type { Student } from '../../types';

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
      // 检查是否是学生资料不存在的错误
      if (error.response?.data?.msg === 'student profile not found') {
        message.warning('您还没有创建学生资料，请先完善个人信息');
      } else if (error.response?.status === 401) {
        // 401错误由API拦截器处理，这里不重复处理
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
        const reportList = reportsData.data.list.map((r: any) => ({
          id: r.id,
          title: r.title || `职业规划报告 #${r.id}`,
          status: r.status,
          createdAt: r.createdAt,
          content: r.content,
        }));
        setReports(reportList);
        // 自动选择最新的报告
        if (reportList.length > 0 && !selectedReportId) {
          setSelectedReportId(reportList[0].id);
        }
      }
    } catch (error) {
      console.error('获取报告列表失败:', error);
      message.error('获取报告列表失败');
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

  const handleGenerateReport = async () => {
    if (!student?.id) {
      message.error('学生信息不存在');
      return;
    }

    setGenerating(true);
    try {
      const trackValue = activeTrack === 'bigtech' ? 'full' : 'gap';
      const streamUrl = reportApi.generateStream({
        studentId: student.id,
        track: trackValue,
      });

      const eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'report') {
            setSkills(data.content?.skills || []);
            setTimeline(data.content?.timeline || []);
            setCompleteness(data.content?.completeness || 0);
            setCompetitiveness(data.content?.competitiveness || 0);
            setHasReport(true);
          }
        } catch (e) {
          console.error('解析SSE数据失败:', e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setGenerating(false);
        message.success('职业规划生成完成');
        // 生成完成后重新加载报告列表
        loadReports();
      };

      eventSource.onopen = () => {
        console.log('SSE连接已建立');
      };
    } catch (error) {
      console.error('生成报告失败:', error);
      message.error('生成报告失败');
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已掌握': return '#52c41a';
      case '学习中': return '#1890ff';
      default: return '#faad14';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <Segmented
          value={activeTrack}
          onChange={(v) => setActiveTrack(v as 'bigtech' | 'gov')}
          options={[
            { label: '大厂技术岗', value: 'bigtech' },
            { label: '国企研发岗', value: 'gov' },
          ]}
          className="flex-1"
        />
        <Button
          icon={generating ? <SyncOutlined spin /> : <ReloadOutlined />}
          onClick={handleGenerateReport}
          loading={generating}
          className="ml-4"
        >
          {generating ? '生成中...' : '重新生成'}
        </Button>
      </div>

      {!student && !loading && (
        <Card>
          <Empty
            description="您还没有创建学生资料"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => message.info('请在个人中心完善信息')}>
              完善个人信息
            </Button>
          </Empty>
        </Card>
      )}

      {student && (
        <div className="flex gap-4">
          {/* 左侧历史记录列表面板 */}
          <Card
            className="w-80"
            title={
              <div className="flex items-center justify-between">
                <span>历史记录</span>
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={loadReports}
                  loading={loadingReports}
                />
              </div>
            }
          >
            <div className="space-y-2">
              {reports.length > 0 ? (
                reports.map((report) => {
                  // 解析content获取预览信息
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
                      className={`p-3 cursor-pointer rounded hover:bg-gray-100 transition-colors ${
                        selectedReportId === report.id
                          ? 'bg-blue-50 border-2 border-blue-200'
                          : 'border border-gray-200'
                      }`}
                      onClick={() => handleSelectReport(report.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium flex-1 text-sm">{report.title}</div>
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-600">
                          {report.status}
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {new Date(report.createdAt * 1000).toLocaleString('zh-CN')}
                      </div>
                      {/* 关键指标预览 */}
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="text-green-600">
                          完整度: {Math.round(previewCompleteness)}%
                        </span>
                        <span className="text-blue-600">
                          竞争力: {Math.round(previewCompetitiveness)}%
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <Empty description="暂无历史记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </Card>

          {/* 右侧详情展示 */}
          <Card className="flex-1" title={reports.find(r => r.id === selectedReportId)?.title || '职业规划详情'}>
            {generating && (
              <div className="py-8 flex flex-col items-center">
                <Spin size="large" tip="生成中..." />
                <p className="mt-4 text-gray-500">正在根据您的资料生成职业规划...</p>
              </div>
            )}

            {!generating && hasReport && (
              <>
                <Card title="整体评估" className="mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-600 text-sm mb-1">资料完整度</div>
                      <Progress percent={Math.round(completeness)} strokeColor="#52c41a" />
                    </div>
                    <div>
                      <div className="text-gray-600 text-sm mb-1">竞争力指数</div>
                      <Progress percent={Math.round(competitiveness)} strokeColor="#1890ff" />
                    </div>
                  </div>
                </Card>

                <Card title="技能掌握进度" className="mb-4">
                  <div className="space-y-4">
                    {skills.length > 0 ? (
                      skills.map((skill, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{skill.name}</span>
                            <span style={{ color: getStatusColor(skill.status) }}>{skill.status}</span>
                          </div>
                          <Progress percent={skill.level} strokeColor={getStatusColor(skill.status)} />
                        </div>
                      ))
                    ) : (
                      <Empty description="暂无技能数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                  </div>
                </Card>

                <Card title="学习时间轴">
                  {timeline.length > 0 ? (
                    <Timeline
                      items={timeline.map(item => ({
                        color: 'blue',
                        content: (
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-gray-500 text-sm">{item.desc}</div>
                            <div className="text-gray-400 text-xs">{item.date}</div>
                          </div>
                        ),
                      }))}
                    />
                  ) : (
                    <Empty description="暂无时间轴数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>
              </>
            )}

            {!generating && !hasReport && (
              <Card>
                <Empty
                  description="暂无职业规划数据"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary" onClick={handleGenerateReport}>
                    生成职业规划
                  </Button>
                </Empty>
              </Card>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}