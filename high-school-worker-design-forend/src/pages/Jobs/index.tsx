import { useState, useEffect, useRef } from 'react';
import { Card, Select, Spin, Empty, Button, message, Tabs, Tag, List, Descriptions } from 'antd';
import { ReloadOutlined, ApartmentOutlined, RiseOutlined, BulbOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { jobApi, jobPathApi } from '../../api';
import type { Job, PromotionPath, TransferPath } from '../../types';

type GraphLink = {
  source: number;
  target: number;
  name: string;
  lineStyle: { color: string; width: number; type?: 'solid' | 'dashed'; curveness?: number };
  label?: { show: boolean; formatter: string };
};

type GraphTooltipParam = {
  dataType?: 'node' | 'edge';
  data?: { name?: string };
};

export default function JobsPage() {
  const chartRef = useRef<ReactECharts | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [promotionPath, setPromotionPath] = useState<PromotionPath | null>(null);
  const [transferPaths, setTransferPaths] = useState<TransferPath[]>([]);
  const [pathsLoading, setPathsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('graph');
  const [activeCategory, setActiveCategory] = useState('tech');

  const popularJobs = ['前端工程师', 'Java 开发', '产品经理'];

  useEffect(() => {
    void loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      void loadJobDetail(selectedJobId);
      void loadJobPaths(selectedJobId);
    } else {
      setSelectedJob(null);
      setPromotionPath(null);
      setTransferPaths([]);
    }
  }, [selectedJobId]);

  useEffect(() => {
    const handleResize = () => {
      if (activeTab === 'graph') {
        chartRef.current?.getEchartsInstance().resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'graph') return;
    const timer = window.setTimeout(() => {
      chartRef.current?.getEchartsInstance().resize();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [selectedJobId, activeTab]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await jobApi.list({ page: 1, pageSize: 100 });
      if (response.data?.list) {
        setJobs(response.data.list);
      }
    } catch (error) {
      console.error('获取岗位列表失败:', error);
      message.error('获取岗位列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadJobDetail = async (jobId: number) => {
    try {
      const response = await jobApi.get(jobId);
      if (response.data) {
        setSelectedJob(response.data);
      }
    } catch (error) {
      console.error('获取岗位详情失败:', error);
    }
  };

  const loadJobPaths = async (jobId: number) => {
    try {
      setPathsLoading(true);
      const [promotionResp, transferResp] = await Promise.all([
        jobPathApi.getPromotionPath(jobId),
        jobPathApi.getTransferPaths(jobId),
      ]);

      if (promotionResp.data) {
        setPromotionPath(promotionResp.data);
      } else {
        setPromotionPath(null);
      }

      if (transferResp.data) {
        setTransferPaths(transferResp.data);
      } else {
        setTransferPaths([]);
      }
    } catch (error) {
      console.error('获取岗位路径失败:', error);
      message.error('获取岗位路径失败');
    } finally {
      setPathsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedJobId) {
      void loadJobPaths(selectedJobId);
    }
  };

  const handleGenerateAnalysis = async (toJobId: number, pathType: string) => {
    if (!selectedJobId) return;
    try {
      message.loading({ content: 'AI正在分析路径...', key: 'analysis' });
      await jobPathApi.generatePathAnalysis(selectedJobId, {
        toJobId,
        pathType,
      });
      message.success({ content: '分析完成', key: 'analysis' });
      await loadJobPaths(selectedJobId);
    } catch (error) {
      console.error('生成路径分析失败:', error);
      message.error({ content: '生成路径分析失败', key: 'analysis' });
    }
  };

  const handleGenerateAllPaths = async () => {
    if (!selectedJobId) {
      message.warning('请先选择一个岗位');
      return;
    }
    
    // 先加载路径数据
    await loadJobPaths(selectedJobId);
    
    // 等待状态更新
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 如果没有路径数据，调用AI生成晋升目标
    if (!promotionPath || promotionPath.nextJobs.length === 0) {
      message.loading('正在生成晋升目标，请稍候...', 0);
      try {
        await jobPathApi.generatePathAnalysis(selectedJobId, {
          pathType: 'promotion',
        });
        message.destroy();
        message.success('晋升目标生成成功');
        // 刷新路径数据
        await loadJobPaths(selectedJobId);
      } catch (error) {
        message.destroy();
        console.error('生成晋升目标失败:', error);
        message.error('生成晋升目标失败');
      }
      return;
    }
    
    const promises: Promise<void>[] = [];
    
    // 对每个晋升路径目标调用AI分析
    if (promotionPath?.nextJobs && promotionPath.nextJobs.length > 0) {
      for (const nextJob of promotionPath.nextJobs) {
        // 跳过自引用路径
        if (nextJob.id === selectedJobId) continue;
        promises.push(handleGenerateAnalysis(nextJob.id, 'promotion'));
      }
    }
    
    // 对每个换岗路径目标调用AI分析
    if (transferPaths.length > 0) {
      for (const transferPath of transferPaths) {
        // 跳过自引用路径
        if (transferPath.toJob.id === selectedJobId) continue;
        promises.push(handleGenerateAnalysis(transferPath.toJob.id, 'transfer'));
      }
    }
    
    if (promises.length === 0) {
      message.warning('该岗位暂无发展路径数据');
      return;
    }
    
    message.loading('正在分析路径，请稍候...', 0);
    
    // 并行执行所有分析
    await Promise.all(promises);
    
    // 刷新显示
    await loadJobPaths(selectedJobId);
    message.destroy();
    message.success('路径分析完成');
  };

  const getGraphOption = () => {
    if (!selectedJob) return {};

    // 使用 Map 来追踪已添加的节点，避免重复
    const nodeMap = new Map<number, Record<string, unknown>>();
    const links: GraphLink[] = [];

    // 添加当前岗位节点
    nodeMap.set(selectedJob.id, {
      id: selectedJob.id,
      name: selectedJob.name,
      category: 0,
      symbolSize: 60,
      itemStyle: { color: '#1890ff' },
    });

    // 添加晋升路径节点（按适配度从大到小排序，形成链式路径）
    if (promotionPath?.nextJobs) {
      const sortedJobs = [...promotionPath.nextJobs]
        .filter(nextJob => nextJob.id !== selectedJob.id)
        .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
      
      let prevJobId = selectedJob.id;
      
      sortedJobs.forEach((nextJob) => {
        // 显示标签：名称 + 匹配分数
        const rawScore = nextJob.matchScore ?? 0;
        const displayScore = rawScore > 1
          ? Math.round(rawScore)
          : Math.round(rawScore * 100);
        const labelText = rawScore > 0
          ? `${nextJob.name}\n${displayScore}%`
          : nextJob.name;
        
        if (!nodeMap.has(nextJob.id)) {
          nodeMap.set(nextJob.id, {
            id: nextJob.id,
            name: labelText,
            category: 1,
            symbolSize: 55,
            itemStyle: { color: '#52c41a' },
          });
        }

        // 从上一个节点连接到当前节点（形成链式）
        links.push({
          source: prevJobId,
          target: nextJob.id,
          name: '晋升',
          lineStyle: {
            color: '#52c41a',
            width: 5,
            curveness: 0,
            type: 'solid',
          },
        });
        
        // 更新上一个节点 ID
        prevJobId = nextJob.id;
      });
    }

    // 添加换岗路径节点（按适配度从大到小排序，形成链式路径）
    const sortedTransferPaths = transferPaths
      .filter(tp => tp.fromJob.id === selectedJob.id && tp.toJob.id !== selectedJob.id)
      .sort((a, b) => b.matchScore - a.matchScore);
    
    let prevTransferJobId = selectedJob.id;
    
    sortedTransferPaths.forEach((transferPath) => {
      // 添加目标岗位节点
      if (!nodeMap.has(transferPath.toJob.id)) {
        const tsScore = transferPath.matchScore > 1 
          ? Math.round(transferPath.matchScore) 
          : Math.round(transferPath.matchScore * 100);
        
        nodeMap.set(transferPath.toJob.id, {
          id: transferPath.toJob.id,
          name: `${transferPath.toJob.name}\n${tsScore}%`,
          category: 1,
          symbolSize: 50,
          itemStyle: { color: '#faad14' },
        });
      }

      // 从上一个节点连接到当前节点（形成链式）
      links.push({
        source: prevTransferJobId,
        target: transferPath.toJob.id,
        name: '换岗',
        lineStyle: {
          color: '#faad14',
          width: 5,
          curveness: 0,
          type: 'solid',
        },
      });
      
      // 更新上一个节点 ID
      prevTransferJobId = transferPath.toJob.id;
    });

    const nodes = Array.from(nodeMap.values());
    
    // 创建节点 ID 到索引的映射
    const idToIndex = new Map<number, number>();
    nodes.forEach((node, index) => {
      idToIndex.set(node.id as number, index);
    });
    
    // 调试信息
    console.log('=== 图谱数据 ===');
    console.log('节点数量:', nodes.length);
    console.log('节点ID到索引的映射:', Object.fromEntries(idToIndex));
    
    // 将 links 中的 source 和 target 从 ID 转换为索引
    const fixedLinks = links.map(link => ({
      ...link,
      source: idToIndex.get(link.source as number),
      target: idToIndex.get(link.target as number),
    })).filter(link => link.source !== undefined && link.target !== undefined);
    
    console.log('修正后的连线数量:', fixedLinks.length);
    console.log('修正后的连线详情:', JSON.stringify(fixedLinks, null, 2));

    return {
      title: {
        text: `${selectedJob.name} - 岗位发展路径`,
        left: 'center',
      },
      tooltip: {
        formatter: (params: GraphTooltipParam) => {
          if (params.dataType === 'node') {
            return `<b>${params.data?.name ?? ''}</b>`;
          } else {
            return `<b>${params.data?.name ?? ''}</b>`;
          }
        },
      },
      legend: {
        data: ['当前岗位', '发展路径'],
        top: '10%',
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: nodes,
          links: fixedLinks,
          categories: [
            { name: '当前岗位' },
            { name: '发展路径' },
          ],
          roam: true,
          draggable: true,
          center: ['50%', '50%'],
          zoom: 1.2,
          label: {
            show: true,
            position: 'bottom',
          },
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [0, 15],
          force: {
            repulsion: 400,
            edgeLength: [150, 250],
          },
          emphasis: {
            focus: 'adjacency',
          },
        },
      ],
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#faad14';
    return '#ff4d4f';
  };

  const handleQuickPick = (jobName: string) => {
    const target = jobs.find((job) => {
      const name = job.name ?? '';
      return name.includes(jobName) || jobName.includes(name);
    });

    if (!target) {
      message.info(`未找到岗位: ${jobName}`);
      return;
    }

    setSelectedJobId(target.id);
    message.success(`已选择: ${target.name}`);
  };

  return (
    <div className="min-h-screen relative z-10 p-4 md:p-6">
      <div className="w-full space-y-4">
        <Card title="岗位发展路径图谱" className="shadow-sm">
          <Tabs
            activeKey={activeCategory}
            onChange={setActiveCategory}
            className="mb-3"
            items={[
              { key: 'tech', label: '技术研发' },
              { key: 'design', label: '产品设计' },
              { key: 'ops', label: '运营' },
              { key: 'sales', label: '销售' },
            ]}
          />

          <div className="flex flex-wrap gap-3 items-center">
            <Select
              style={{ width: 320 }}
              placeholder="选择岗位"
              loading={loading}
              value={selectedJobId}
              onChange={setSelectedJobId}
              allowClear
              options={jobs.map((job) => ({
                value: job.id,
                label: `${job.name ?? ''}${job.industry ? ` (${job.industry})` : ''}`,
              }))}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={pathsLoading}
              disabled={!selectedJobId}
            >
              刷新
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">热门推荐:</span>
            {popularJobs.map((name) => {
              const isActive = selectedJob ? (selectedJob.name ?? '').includes(name) : false;
              return (
                <Tag
                  key={name}
                  color={isActive ? 'blue' : 'default'}
                  className="cursor-pointer px-3 py-1"
                  onClick={() => handleQuickPick(name)}
                >
                  {name}
                </Tag>
              );
            })}
          </div>
        </Card>

        {!selectedJobId && (
          <Card className="min-h-125 overflow-hidden">
            <div className="relative min-h-125 rounded-xl border border-slate-200 bg-linear-to-b from-slate-50 to-white">
              <div className="pointer-events-none absolute inset-0 opacity-40">
                <div className="absolute left-[15%] top-[20%] h-2 w-2 rounded-full bg-slate-300" />
                <div className="absolute left-[30%] top-[35%] h-2 w-2 rounded-full bg-slate-300" />
                <div className="absolute right-[22%] top-[25%] h-2 w-2 rounded-full bg-slate-300" />
                <div className="absolute right-[35%] bottom-[28%] h-2 w-2 rounded-full bg-slate-300" />
                <div className="absolute left-[28%] bottom-[24%] h-2 w-2 rounded-full bg-slate-300" />
                <div className="absolute left-[16%] top-[21%] h-px w-32 rotate-12 bg-slate-200" />
                <div className="absolute left-[30%] top-[35%] h-px w-40 -rotate-12 bg-slate-200" />
                <div className="absolute right-[35%] bottom-[28%] h-px w-28 rotate-6 bg-slate-200" />
              </div>

              <div className="relative z-10 flex min-h-125 flex-col items-center justify-center px-6 text-center">
                <h3 className="text-2xl font-semibold text-slate-800">选择一个岗位，探索完整发展路径</h3>
                <p className="mt-3 max-w-2xl text-slate-500">
                  你可以通过上方筛选快速定位岗位，系统将自动生成岗位图谱、晋升方向与换岗机会。
                </p>
                <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white/80 p-4 text-left">
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <ApartmentOutlined />
                      探索完整技能栈
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white/80 p-4 text-left">
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <RiseOutlined />
                      清晰的晋升路线
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white/80 p-4 text-left">
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <BulbOutlined />
                      核心竞争力分析
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {selectedJob && (
          <div className="space-y-4">
            {/* 岗位详情 */}
            <Card title="岗位详情">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="岗位名称">{selectedJob.name}</Descriptions.Item>
                <Descriptions.Item label="行业">{selectedJob.industry || '-'}</Descriptions.Item>
                <Descriptions.Item label="公司">{selectedJob.company || '-'}</Descriptions.Item>
                <Descriptions.Item label="地点">{selectedJob.location || '-'}</Descriptions.Item>
                <Descriptions.Item label="薪资范围">{selectedJob.salaryRange || '-'}</Descriptions.Item>
              </Descriptions>
              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div className="mt-4">
                  <div className="text-gray-600 text-sm mb-2">专业技能：</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map((skill, index) => (
                      <Tag key={index} color="blue">
                        {skill}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
              {selectedJob.certificates && selectedJob.certificates.length > 0 && (
                <div className="mt-4">
                  <div className="text-gray-600 text-sm mb-2">证书要求：</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.certificates.map((cert, index) => (
                      <Tag key={index} color="green">
                        {cert}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* 路径图谱 */}
            <Card className="min-h-170 w-full [&_.ant-card-body]:flex [&_.ant-card-body]:h-full [&_.ant-card-body]:flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">发展路径图谱</h3>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  loading={pathsLoading}
                  onClick={() => {
                    void handleGenerateAllPaths();
                  }}
                >
                  AI智能分析
                </Button>
              </div>
              <Tabs
                className="flex-1 flex flex-col"
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'graph',
                    label: '图谱视图',
                    children: (
                      <div className="flex w-full flex-1 items-center justify-center min-h-[520px]">
                        {pathsLoading ? (
                          <div className="py-8 flex justify-center items-center w-full">
                            <Spin size="large" />
                          </div>
                        ) : promotionPath || transferPaths.length > 0 ? (
                          <div className="flex h-full min-h-[520px] w-full items-center justify-center">
                            <ReactECharts
                              ref={chartRef}
                              option={getGraphOption()}
                              style={{ height: '100%', minHeight: '520px', width: '100%' }}
                              onChartReady={(chart) => chart.resize()}
                            />
                          </div>
                        ) : (
                          <div className="flex w-full min-h-[520px] items-center justify-center">
                            <Empty description="暂无发展路径数据" />
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'promotion',
                    label: '晋升路径',
                    children: (
                      <div className="min-h-150">
                        {pathsLoading ? (
                          <div className="py-8 flex justify-center">
                            <Spin size="large" />
                          </div>
                        ) : promotionPath?.nextJobs && promotionPath.nextJobs.length > 0 ? (
                          <List
                              dataSource={promotionPath.nextJobs}
                              renderItem={(nextJob) => (
                                <List.Item>
                                  <List.Item.Meta
                                    title={nextJob.name}
                                    description={
                                      <div>
                                        {nextJob.requiredSkills && nextJob.requiredSkills.length > 0 && (
                                          <div className="mt-2">
                                            <div className="text-gray-600 text-sm">所需技能：</div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {nextJob.requiredSkills.map((skill, idx) => (
                                                <Tag key={idx}>{skill}</Tag>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {nextJob.learningPath && (
                                          <div className="mt-2">
                                            <div className="text-gray-600 text-sm">推荐理由：</div>
                                            <div className="mt-1 text-sm text-gray-500">
                                              {nextJob.learningPath}
                                            </div>
                                          </div>
                                        )}
                                        {nextJob.matchScore && nextJob.matchScore > 0 && (
                                          <div className="mt-2">
                                            <Tag color="blue">匹配度: {nextJob.matchScore > 1 ? Math.round(nextJob.matchScore) : Math.round(nextJob.matchScore * 100)}%</Tag>
                                          </div>
                                        )}
                                      </div>
                                    }
                                  />
                                </List.Item>
                              )}
                            />
                          ) : (
                            <div className="min-h-150 flex items-center justify-center">
                              <Empty description="暂无晋升路径" />
                            </div>
                          )}
                        </div>
                      ),
                  },
                  {
                    key: 'transfer',
                    label: '换岗路径',
                    children: (
                      <div className="min-h-150">
                        {pathsLoading ? (
                          <div className="py-8 flex justify-center">
                            <Spin size="large" />
                          </div>
                        ) : transferPaths.length > 0 ? (
                          <List
                            dataSource={transferPaths.filter(tp => tp.toJob.id !== selectedJob.id)}
                            renderItem={(transferPath) => (
                              <List.Item>
                                <List.Item.Meta
                                  title={
                                    <div className="flex items-center gap-2">
                                      <span>{transferPath.toJob.name}</span>
                                      <Tag color={getScoreColor(transferPath.matchScore)}>
                                        匹配度: {transferPath.matchScore > 1 ? Math.round(transferPath.matchScore) : Math.round(transferPath.matchScore * 100)}%
                                      </Tag>
                                    </div>
                                  }
                                  description={
                                    <div>
                                      {transferPath.transferSkills && transferPath.transferSkills.length > 0 && (
                                        <div className="mt-2">
                                          <div className="text-gray-600 text-sm">可迁移技能：</div>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {transferPath.transferSkills.map((skill, idx) => (
                                              <Tag key={idx}>{skill}</Tag>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {transferPath.learningPath && transferPath.learningPath.length > 0 && (
                                        <div className="mt-2">
                                          <div className="text-gray-600 text-sm">学习路径：</div>
                                          <div className="mt-1">
                                            {String(transferPath.learningPath)
                                              .split(/[\n；;]/)
                                              .filter((step) => step.trim().length > 0)
                                              .map((step: string, idx: number) => (
                                                <div key={idx} className="text-sm text-gray-500">
                                                  {idx + 1}. {step.trim()}
                                                </div>
                                              ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        ) : (
                          <div className="min-h-150 flex items-center justify-center">
                            <Empty description="暂无换岗路径" />
                          </div>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}