import { useState, useEffect, useRef, useCallback } from 'react';
  import { Select, Spin, Empty, Button, message, Tabs, Tag, List, Descriptions, Input, Slider, Space, Pagination, Card, Row, Col } from 'antd';
  import { ReloadOutlined, ApartmentOutlined, RiseOutlined, BulbOutlined, SearchOutlined, FilterOutlined, EnvironmentOutlined, BankOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
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
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [promotionPath, setPromotionPath] = useState<PromotionPath | null>(null);
  const [transferPaths, setTransferPaths] = useState<TransferPath[]>([]);
  const [pathsLoading, setPathsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('graph');
  const [showFilters, setShowFilters] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterIndustry, setFilterIndustry] = useState<string | undefined>(undefined);
  const [filterLocation, setFilterLocation] = useState<string | undefined>(undefined);
  const [filterCompanyScale, setFilterCompanyScale] = useState<string | undefined>(undefined);
  const [filterSalaryMin, setFilterSalaryMin] = useState(0);
  const [filterSalaryMax, setFilterSalaryMax] = useState(100);

  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [companyScaleOptions, setCompanyScaleOptions] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);

  const popularJobs = ['科研人员', '硬件测试', '前端开发'];

  const loadJobs = useCallback(async (page: number, size: number) => {
    try {
      setLoading(true);
      const response = await jobApi.list({
        page,
        pageSize: size,
        keyword: searchKeyword || undefined,
        industry: filterIndustry,
        location: filterLocation,
        companyScale: filterCompanyScale,
        salaryMin: filterSalaryMin > 0 ? filterSalaryMin : undefined,
        salaryMax: filterSalaryMax < 100 ? filterSalaryMax : undefined,
      });
      if (response.data?.list) {
        setJobs(response.data.list);
        setTotal(response.data.total);
      } else {
        setJobs([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('获取岗位列表失败:', error);
      message.error('获取岗位列表失败');
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, filterIndustry, filterLocation, filterCompanyScale, filterSalaryMin, filterSalaryMax]);

  useEffect(() => {
    void loadJobs(currentPage, pageSize);
  }, [currentPage, pageSize, loadJobs]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const res = await jobApi.filterOptions();
        setIndustryOptions(res.industries || []);
        setCompanyScaleOptions(res.companyScales || []);
        setLocationOptions(res.locations || []);
      } catch {
        console.error('获取筛选选项失败');
      }
    };
    void loadFilterOptions();
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

  const handleResetView = () => {
  if (chartRef.current) {
    const chart = chartRef.current.getEchartsInstance();
    chart.dispatchAction({
      type: 'restore',
    });
    chart.setOption({
      series: [
        {
          zoom: 1.2,
          center: ['50%', '50%'],
        },
      ],
    });
  }
};

  const handleGenerateAllPaths = async () => {
    if (!selectedJobId) {
      message.warning('请先选择一个岗位');
      return;
    }
    
    await loadJobPaths(selectedJobId);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!promotionPath || promotionPath.nextJobs.length === 0) {
      message.loading('正在生成晋升目标，请稍候...', 0);
      try {
        await jobPathApi.generatePathAnalysis(selectedJobId, {
          pathType: 'promotion',
        });
        message.destroy();
        message.success('晋升目标生成成功');
        await loadJobPaths(selectedJobId);
      } catch (error) {
        message.destroy();
        console.error('生成晋升目标失败:', error);
        message.error('生成晋升目标失败');
      }
      return;
    }
    
    const promises: Promise<void>[] = [];
    
    if (promotionPath?.nextJobs && promotionPath.nextJobs.length > 0) {
      for (const nextJob of promotionPath.nextJobs) {
        if (nextJob.id === selectedJobId) continue;
        promises.push(handleGenerateAnalysis(nextJob.id, 'promotion'));
      }
    }
    
    if (transferPaths.length > 0) {
      for (const transferPath of transferPaths) {
        if (transferPath.toJob.id === selectedJobId) continue;
        promises.push(handleGenerateAnalysis(transferPath.toJob.id, 'transfer'));
      }
    }
    
    if (promises.length === 0) {
      message.warning('该岗位暂无发展路径数据');
      return;
    }
    
    message.loading('正在分析路径，请稍候...', 0);
    await Promise.all(promises);
    await loadJobPaths(selectedJobId);
    message.destroy();
    message.success('路径分析完成');
  };

  const handleSearch = () => {
    setCurrentPage(1);
    void loadJobs(1, pageSize);
  };

  const resetFilters = () => {
    setSearchKeyword('');
    setFilterIndustry(undefined);
    setFilterLocation(undefined);
    setFilterCompanyScale(undefined);
    setFilterSalaryMin(0);
    setFilterSalaryMax(100);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleQuickPick = async (jobName: string) => {
    const target = jobs.find((job) => {
      const name = job.name ?? '';
      return name.includes(jobName) || jobName.includes(name);
    });

    if (target) {
      setSelectedJobId(target.id);
      message.success(`已选择: ${target.name}`);
      return;
    }

    setSearchKeyword(jobName);
    setFilterIndustry(undefined);
    setFilterLocation(undefined);
    setFilterCompanyScale(undefined);
    setFilterSalaryMin(0);
    setFilterSalaryMax(100);
    setCurrentPage(1);

    try {
      setLoading(true);
      const response = await jobApi.list({ page: 1, pageSize: pageSize, keyword: jobName });
      if (response.data?.list && response.data.list.length > 0) {
        const found = response.data.list.find((job) => {
          const name = job.name ?? '';
          return name.includes(jobName) || jobName.includes(name);
        }) ?? response.data.list[0];
        setJobs(response.data.list);
        setTotal(response.data.total);
        setSelectedJobId(found.id);
        message.success(`已选择: ${found.name}`);
      } else {
        setJobs([]);
        setTotal(0);
        message.info(`未找到岗位: ${jobName}，请尝试搜索`);
      }
    } catch {
      message.error('搜索岗位失败');
    } finally {
      setLoading(false);
    }
  };

  const getGraphOption = () => {
    if (!selectedJob) return {};

    const nodeMap = new Map<number, Record<string, unknown>>();
    const links: GraphLink[] = [];

    nodeMap.set(selectedJob.id, {
      id: selectedJob.id,
      name: selectedJob.name,
      category: 0,
      symbolSize: 60,
      itemStyle: { color: '#1890ff' },
    });

    if (promotionPath?.nextJobs) {
      const sortedJobs = [...promotionPath.nextJobs]
        .filter(nextJob => nextJob.id !== selectedJob.id)
        .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
      
      let prevJobId = selectedJob.id;
      
      sortedJobs.forEach((nextJob) => {
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
        
        prevJobId = nextJob.id;
      });
    }

    const sortedTransferPaths = transferPaths
      .filter(tp => tp.fromJob.id === selectedJob.id && tp.toJob.id !== selectedJob.id)
      .sort((a, b) => b.matchScore - a.matchScore);
    
    let prevTransferJobId = selectedJob.id;
    
    sortedTransferPaths.forEach((transferPath) => {
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
      
      prevTransferJobId = transferPath.toJob.id;
    });

    const nodes = Array.from(nodeMap.values());
    
    const idToIndex = new Map<number, number>();
    nodes.forEach((node, index) => {
      idToIndex.set(node.id as number, index);
    });
    
    const fixedLinks = links.map(link => ({
      ...link,
      source: idToIndex.get(link.source as number),
      target: idToIndex.get(link.target as number),
    })).filter(link => link.source !== undefined && link.target !== undefined);

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
          scaleLimit: {
            min: 0.5,
            max: 3,
          },
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

  return (
    <div className="min-h-screen relative z-10 p-3 sm:p-4 md:p-6" style={{ backgroundColor: 'var(--md-sys-color-surface)' }}>
      <div className="w-full space-y-4">
        <div 
          className="p-4 sm:p-5"
          style={{ 
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            boxShadow: 'var(--md-sys-elevation-0)'
          }}
        >
          <div 
            className="text-lg font-medium mb-4"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            岗位发展路径图谱
          </div>

          {/* 搜索和筛选区域 */}
          <div className="space-y-3 mb-4">
            <div className="flex gap-2">
              <Input
                placeholder="搜索岗位名称、公司或行业..."
                prefix={<SearchOutlined />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
                style={{ borderRadius: 'var(--md-sys-shape-corner-full)', flex: 1 }}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                style={{ borderRadius: 'var(--md-sys-shape-corner-full)' }}
              >
                搜索
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  backgroundColor: showFilters ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)'
                }}
              >
                高级筛选 {total > 0 && `(${total})`}
              </Button>
              {(searchKeyword || filterIndustry || filterLocation || filterCompanyScale || filterSalaryMin > 0 || filterSalaryMax < 100) && (
                <Button onClick={resetFilters} size="small">
                  重置筛选
                </Button>
              )}
              {selectedJobId && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={pathsLoading}
                  style={{ 
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    backgroundColor: 'var(--md-sys-color-surface-container)'
                  }}
                >
                  刷新
                </Button>
              )}
            </div>

            {showFilters && (
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  border: '1px solid var(--md-sys-color-outline-variant)'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <div className="text-sm mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>行业</div>
                    <Select
                      placeholder="选择行业"
                      style={{ width: '100%' }}
                      value={filterIndustry}
                      onChange={(v) => setFilterIndustry(v)}
                      allowClear
                      showSearch
                      options={industryOptions.map(s => ({ value: s, label: s }))}
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>工作地点</div>
                    <Select
                      placeholder="选择城市"
                      style={{ width: '100%' }}
                      value={filterLocation}
                      onChange={(v) => setFilterLocation(v)}
                      allowClear
                      showSearch
                      options={locationOptions.map(s => ({ value: s, label: s }))}
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      <TeamOutlined style={{ marginRight: 4 }} />企业人数
                    </div>
                    <Select
                      placeholder="选择企业人数"
                      style={{ width: '100%' }}
                      value={filterCompanyScale}
                      onChange={(v) => setFilterCompanyScale(v)}
                      allowClear
                      options={companyScaleOptions.map(s => ({ value: s, label: s }))}
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      薪资范围: {filterSalaryMin > 0 ? `${filterSalaryMin}K` : '不限'} - {filterSalaryMax < 100 ? `${filterSalaryMax}K` : '不限'}
                    </div>
                    <Slider
                      range
                      min={0}
                      max={100}
                      value={[filterSalaryMin, filterSalaryMax]}
                      onChange={(value) => {
                        setFilterSalaryMin(value[0]);
                        setFilterSalaryMax(value[1]);
                      }}
                      marks={{ 0: '不限', 30: '30K', 60: '60K', 100: '100K+' }}
                    />
                  </div>
                </Space>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>热门推荐:</span>
            {popularJobs.map((name) => {
              const isActive = selectedJob ? (selectedJob.name ?? '').includes(name) : false;
              return (
                <Tag
                  key={name}
                  style={{
                    backgroundColor: isActive ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
                    color: isActive ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
                    border: 'none',
                    borderRadius: 'var(--md-sys-shape-corner-small)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleQuickPick(name)}
                >
                  {name}
                </Tag>
              );
            })}
          </div>
        </div>

        {/* 岗位列表区域 */}
        <div 
          className="p-4 sm:p-5"
          style={{ 
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            border: '1px solid var(--md-sys-color-outline-variant)'
          }}
        >
          <div 
            className="text-base font-medium mb-3"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            岗位列表 {total > 0 && <span style={{ fontWeight: 'normal', fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>共 {total} 个岗位</span>}
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Spin size="large" />
            </div>
          ) : jobs.length === 0 ? (
            <Empty description="暂无匹配的岗位，请调整筛选条件" />
          ) : (
            <Row gutter={[16, 16]}>
              {jobs.map((job) => (
                <Col key={job.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    hoverable
                    size="small"
                    onClick={() => setSelectedJobId(job.id)}
                    style={{
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      border: selectedJobId === job.id
                        ? '2px solid var(--md-sys-color-primary)'
                        : '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: selectedJobId === job.id
                        ? 'var(--md-sys-color-primary-container)'
                        : 'var(--md-sys-color-surface-container)',
                    }}
                  >
                    <div className="space-y-1">
                      <div 
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--md-sys-color-on-surface)' }}
                        title={job.name}
                      >
                        {job.name || '未知'}
                      </div>
                      <div className="text-xs space-y-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          <div className="flex items-center gap-1 truncate">
                            <BankOutlined style={{ fontSize: 12 }} />
                            <span className="truncate">{job.company || '未知'}</span>
                          </div>
                          <div className="flex items-center gap-1 truncate">
                            <EnvironmentOutlined style={{ fontSize: 12 }} />
                            <span className="truncate">{job.location || '未知'}</span>
                          </div>
                          <div className="flex items-center gap-1 truncate">
                            <DollarOutlined style={{ fontSize: 12 }} />
                            <span className="truncate" style={{ color: 'var(--md-sys-color-primary)' }}>{job.salaryRange || '未知'}</span>
                          </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(job.industry ? job.industry.split(',').slice(0, 2) : ['未知']).map((ind) => (
                          <Tag key={ind} style={{ fontSize: '10px', padding: '0 4px', margin: 0, borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                            {ind.trim()}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {total > pageSize && (
            <div className="mt-4 flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={handlePageChange}
                showSizeChanger
                showQuickJumper
                pageSizeOptions={['12', '21', '51']}
                size="small"
              />
            </div>
          )}
        </div>

        {!selectedJobId && !selectedJob && (
          <div 
            className="min-h-[300px] overflow-hidden p-6"
            style={{ 
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              borderRadius: 'var(--md-sys-shape-corner-large)',
              border: '1px solid var(--md-sys-color-outline-variant)'
            }}
          >
            <div className="relative z-10 flex min-h-[300px] flex-col items-center justify-center px-4 sm:px-6 text-center">
              <h3 className="text-xl sm:text-2xl font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                选择一个岗位，探索完整发展路径
              </h3>
              <p className="mt-3 max-w-2xl" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                你可以通过上方搜索和筛选快速定位岗位，系统将自动生成岗位图谱、晋升方向与换岗机会。
              </p>
              <div className="mt-6 sm:mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div 
                  className="rounded-xl border p-4 text-left"
                  style={{ 
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    borderColor: 'var(--md-sys-color-outline-variant)'
                  }}
                >
                  <div className="flex items-center gap-2 font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    <ApartmentOutlined style={{ color: 'var(--md-sys-color-primary)' }} />
                    探索完整技能栈
                  </div>
                </div>
                <div 
                  className="rounded-xl border p-4 text-left"
                  style={{ 
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    borderColor: 'var(--md-sys-color-outline-variant)'
                  }}
                >
                  <div className="flex items-center gap-2 font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    <RiseOutlined style={{ color: 'var(--md-sys-color-primary)' }} />
                    清晰的晋升路线
                  </div>
                </div>
                <div 
                  className="rounded-xl border p-4 text-left"
                  style={{ 
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    borderColor: 'var(--md-sys-color-outline-variant)'
                  }}
                >
                  <div className="flex items-center gap-2 font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    <BulbOutlined style={{ color: 'var(--md-sys-color-primary)' }} />
                    核心竞争力分析
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedJob && (
          <div className="space-y-4">
            {/* 岗位详情 */}
            <div 
              className="p-4 sm:p-5"
              style={{ 
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                border: '1px solid var(--md-sys-color-outline-variant)'
              }}
            >
              <div 
                className="text-lg font-medium mb-4"
                style={{ color: 'var(--md-sys-color-on-surface)' }}
              >
                岗位详情
              </div>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="岗位名称">{selectedJob.name}</Descriptions.Item>
                <Descriptions.Item label="行业">{selectedJob.industry || '-'}</Descriptions.Item>
                <Descriptions.Item label="公司">{selectedJob.company || '-'}</Descriptions.Item>
                <Descriptions.Item label="公司规模">{selectedJob.companyScale || '-'}</Descriptions.Item>
                <Descriptions.Item label="融资状态">{selectedJob.companyFundingStatus || '-'}</Descriptions.Item>
                <Descriptions.Item label="地点">{selectedJob.location || '-'}</Descriptions.Item>
                <Descriptions.Item label="薪资范围" span={2}>{selectedJob.salaryRange || '-'}</Descriptions.Item>
                <Descriptions.Item label="岗位编码" span={2}>{selectedJob.jobCode || '-'}</Descriptions.Item>
                <Descriptions.Item label="岗位分类">{selectedJob.category || '-'}</Descriptions.Item>
                <Descriptions.Item label="更新日期">{selectedJob.updateDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="公司简介" span={2}>
                  <div className="max-h-32 overflow-y-auto text-sm">
                    {selectedJob.companyDescription || '-'}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="详细职责" span={2}>
                  <div className="max-h-48 overflow-y-auto text-sm whitespace-pre-wrap">
                    {selectedJob.jobDetail || selectedJob.description || '-'}
                  </div>
                </Descriptions.Item>
                {selectedJob.sourceUrl && (
                  <Descriptions.Item label="来源链接" span={2}>
                    <a href={selectedJob.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      查看原始职位信息
                    </a>
                  </Descriptions.Item>
                )}
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
            </div>

            {/* 路径图谱 */}
            <div 
              className="min-h-[680px] w-full p-4 sm:p-5"
              style={{ 
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                border: '1px solid var(--md-sys-color-outline-variant)'
              }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-lg font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>发展路径图谱</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleResetView}
                    style={{ borderRadius: 'var(--md-sys-shape-corner-full)' }}
                  >
                    重置视图
                  </Button>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    loading={pathsLoading}
                    onClick={() => {
                      void handleGenerateAllPaths();
                    }}
                    style={{ borderRadius: 'var(--md-sys-shape-corner-full)' }}
                  >
                    AI智能分析
                  </Button>
                </div>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}