import { useState, useEffect } from 'react';
import { Card, Select, Spin, Empty, Button, message, Tabs, Tag, Progress, List, Descriptions } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { jobApi, jobPathApi } from '../../api';
import type { Job, PromotionPath, TransferPath } from '../../types';

const { Option } = Select;

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [promotionPath, setPromotionPath] = useState<PromotionPath | null>(null);
  const [transferPaths, setTransferPaths] = useState<TransferPath[]>([]);
  const [pathsLoading, setPathsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('graph');

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadJobDetail(selectedJobId);
      loadJobPaths(selectedJobId);
    } else {
      setSelectedJob(null);
      setPromotionPath(null);
      setTransferPaths([]);
    }
  }, [selectedJobId]);

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
      loadJobPaths(selectedJobId);
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
      loadJobPaths(selectedJobId);
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
    
    // 对每个晋升路径目标调用AI分析
    if (promotionPath?.nextJobs && promotionPath.nextJobs.length > 0) {
      for (const nextJob of promotionPath.nextJobs) {
        await handleGenerateAnalysis(nextJob.id, 'promotion');
      }
    }
    
    // 对每个换岗路径目标调用AI分析
    for (const transferPath of transferPaths) {
      await handleGenerateAnalysis(transferPath.toJob.id, 'transfer');
    }
    
    // 刷新显示
    await loadJobPaths(selectedJobId);
    message.success('路径分析完成');
  };

  const getGraphOption = () => {
    if (!selectedJob) return {};

    const nodes = [
      {
        id: selectedJob.id,
        name: selectedJob.name,
        category: 0,
        symbolSize: 60,
        itemStyle: {
          color: '#1890ff',
        },
      },
    ];

    const links = [];

    // 添加晋升路径节点
    if (promotionPath?.nextJobs) {
      promotionPath.nextJobs.forEach((nextJob, index) => {
        nodes.push({
          id: nextJob.id,
          name: nextJob.name,
          category: 1,
          symbolSize: 50,
          itemStyle: {
            color: '#52c41a',
          },
        });

        links.push({
          source: selectedJob.id,
          target: nextJob.id,
          name: '晋升',
          lineStyle: {
            color: '#52c41a',
            width: 2,
          },
          label: {
            show: true,
            formatter: '晋升',
          },
        });
      });
    }

    // 添加换岗路径节点
    transferPaths.forEach((transferPath) => {
      if (transferPath.toJob.id !== selectedJob.id) {
        const existingNode = nodes.find(n => n.id === transferPath.toJob.id);
        if (!existingNode) {
          nodes.push({
            id: transferPath.toJob.id,
            name: transferPath.toJob.name,
            category: 2,
            symbolSize: 45,
            itemStyle: {
              color: '#faad14',
            },
          });
        }

        const existingLink = links.find(
          l => l.source === selectedJob.id && l.target === transferPath.toJob.id
        );
        if (!existingLink) {
          links.push({
            source: selectedJob.id,
            target: transferPath.toJob.id,
            name: `换岗 (${Math.round(transferPath.matchScore * 100)}%)`,
            lineStyle: {
              color: '#faad14',
              width: 2,
              type: 'dashed',
            },
            label: {
              show: true,
              formatter: `换岗\n${Math.round(transferPath.matchScore * 100)}%`,
            },
          });
        }
      }
    });

    return {
      title: {
        text: `${selectedJob.name} - 岗位发展路径`,
        left: 'center',
      },
      tooltip: {
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            return `<b>${params.data.name}</b>`;
          } else {
            return `<b>${params.data.name}</b>`;
          }
        },
      },
      legend: {
        data: ['当前岗位', '晋升岗位', '换岗岗位'],
        top: '10%',
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: nodes,
          links: links,
          categories: [
            { name: '当前岗位' },
            { name: '晋升岗位' },
            { name: '换岗岗位' },
          ],
          roam: true,
          label: {
            show: true,
            position: 'bottom',
          },
          lineStyle: {
            width: 2,
          },
          force: {
            repulsion: 300,
            edgeLength: [100, 200],
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 4,
            },
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

  return (
    <div className="min-h-screen relative z-10 p-4">
      <Card title="岗位发展路径图谱" className="mb-4">
        <div className="flex gap-4 items-center">
          <Select
            style={{ width: 300 }}
            placeholder="选择岗位"
            loading={loading}
            value={selectedJobId}
            onChange={setSelectedJobId}
            allowClear
          >
            {jobs.map((job) => (
              <Option key={job.id} value={job.id}>
                {job.name}
                {job.industry && <span className="ml-2 text-gray-400">({job.industry})</span>}
              </Option>
            ))}
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={pathsLoading}
            disabled={!selectedJobId}
          >
            刷新
          </Button>
        </div>
      </Card>

      {!selectedJobId && (
        <Card>
          <Empty description="请选择一个岗位查看其发展路径" />
        </Card>
      )}

      {selectedJob && (
        <div className="flex gap-4">
          {/* 左侧：岗位详情 */}
          <Card className="w-80" title="岗位详情">
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
                    <Tag key={index} color={skill.required ? 'blue' : 'default'}>
                      {skill.name}
                      {skill.level && ` (Lv.${skill.level})`}
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

          {/* 右侧：路径图谱 */}
          <Card className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">发展路径图谱</h3>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />}
                loading={pathsLoading}
                onClick={() => handleGenerateAllPaths()}
              >
                AI智能分析
              </Button>
            </div>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'graph',
                  label: '图谱视图',
                  children: (
                    <div>
                      {pathsLoading ? (
                        <div className="py-8 flex justify-center">
                          <Spin size="large" tip="加载中..." />
                        </div>
                      ) : promotionPath || transferPaths.length > 0 ? (
                        <ReactECharts option={getGraphOption()} style={{ height: '500px' }} />
                      ) : (
                        <Empty description="暂无发展路径数据" />
                      )}
                    </div>
                  ),
                },
                {
                  key: 'promotion',
                  label: '晋升路径',
                  children: (
                    <div>
                      {pathsLoading ? (
                        <div className="py-8 flex justify-center">
                          <Spin size="large" tip="加载中..." />
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
                                              <Tag key={idx} size="small">{skill}</Tag>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {nextJob.learningPath && (
                                        <div className="mt-2">
                                          <div className="text-gray-600 text-sm">学习路径：</div>
                                          <div className="mt-1 text-sm text-gray-500">
                                            {nextJob.learningPath}
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
                          <Empty description="暂无晋升路径" />
                        )}
                      </div>
                    ),
                },
                {
                  key: 'transfer',
                  label: '换岗路径',
                  children: (
                    <div>
                      {pathsLoading ? (
                        <div className="py-8 flex justify-center">
                          <Spin size="large" tip="加载中..." />
                        </div>
                      ) : transferPaths.length > 0 ? (
                        <List
                          dataSource={transferPaths}
                          renderItem={(transferPath) => (
                            <List.Item>
                              <List.Item.Meta
                                title={
                                  <div className="flex items-center gap-2">
                                    <span>{transferPath.toJob.name}</span>
                                    <Tag color={getScoreColor(transferPath.matchScore)}>
                                      匹配度: {Math.round(transferPath.matchScore * 100)}%
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
                                            <Tag key={idx} size="small">{skill}</Tag>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {transferPath.learningPath && transferPath.learningPath.length > 0 && (
                                      <div className="mt-2">
                                        <div className="text-gray-600 text-sm">学习路径：</div>
                                        <div className="mt-1">
                                          {transferPath.learningPath.map((step, idx) => (
                                            <div key={idx} className="text-sm text-gray-500">
                                              {idx + 1}. {step}
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
                        <Empty description="暂无换岗路径" />
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
  );
}