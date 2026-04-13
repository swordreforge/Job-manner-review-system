import { useState, useEffect } from 'react';
import { Card, Upload, Button, message, Steps, Result, List, Tag, Progress, Empty, Modal, Drawer, Space, Popconfirm } from 'antd';
import { UploadOutlined, FileTextOutlined, CheckCircleOutlined, ReloadOutlined, HistoryOutlined, DeleteOutlined, EyeOutlined, InboxOutlined, SafetyCertificateOutlined, RocketOutlined, BulbOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { studentApi } from '../../api';
import type { Student, ResumeHistoryRecord } from '../../types';
import { useTaskStore } from '../../stores';

export default function ResumePage() {
  type ApiErrorLike = {
    response?: {
      status?: number;
      data?: {
        msg?: string;
        message?: string;
      };
    };
    message?: string;
  };

  // 文件队列状态类型
  type FileQueueItem = {
    uid: string;
    file: File;
    status: 'waiting' | 'uploading' | 'success' | 'failed';
    progress: number;
    error?: string;
    result?: Student;
  };

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [profile, setProfile] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 文件队列相关状态
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [isUploadingQueue, setIsUploadingQueue] = useState(false);
  const [currentUploadingIndex, setCurrentUploadingIndex] = useState(-1);
  const [showQueue, setShowQueue] = useState(false);

  // PDF预览相关状态
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewFileUrl, setPreviewFileUrl] = useState('');

  // 历史记录相关状态
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyList, setHistoryList] = useState<ResumeHistoryRecord[]>([]);

  // 任务状态管理
  const { setActiveTask, hasActiveTask } = useTaskStore();

  // 监听任务状态变化，用于调试
  useEffect(() => {
    console.log('[Resume] Task state changed:', { hasActiveTask });
  }, [hasActiveTask]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize] = useState(10);

  // 详情抽屉状态
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<ResumeHistoryRecord | null>(null);

  // 加载历史记录
  const loadHistory = async (page = historyPage) => {
    setHistoryLoading(true);
    try {
      const response = await studentApi.getResumeHistory({ page, pageSize: historyPageSize });
      if (response.code === 0) {
        setHistoryPage(page);
        setHistoryList(response.data.list);
        setHistoryTotal(response.data.total);
      } else {
        message.error(response.msg || '加载历史记录失败');
      }
    } catch (err: unknown) {
      const apiErr = err as ApiErrorLike;
      console.error('Load history error:', err);
      if (apiErr.response?.status === 401) {
        message.error('请先登录');
        return;
      }
      message.error('加载历史记录失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 打开历史记录
  const handleOpenHistory = () => {
    setHistoryVisible(true);
    void loadHistory(1);
  };

  // 查看详情
  const handleViewDetail = async (id: number) => {
    try {
      const response = await studentApi.getResumeHistoryDetail(id);
      if (response.code === 0) {
        setDetailRecord(response.data);
        setDetailVisible(true);
      } else {
        message.error(response.msg || '加载详情失败');
      }
    } catch (err: unknown) {
      console.error('Load detail error:', err);
      message.error('加载详情失败');
    }
  };

  // 删除历史记录
  const handleDeleteHistory = async (id: number) => {
    try {
      const response = await studentApi.deleteResumeHistory(id);
      if (response.code === 0) {
        message.success('删除成功');
        await loadHistory(historyPage);
      } else {
        message.error(response.msg || '删除失败');
      }
    } catch (err: unknown) {
      console.error('Delete history error:', err);
      message.error('删除失败');
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 文件转 base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // 处理文件加入队列
  const handleAddToQueue = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择简历文件');
      return;
    }

    // 验证所有文件
    const invalidFiles: string[] = [];
    const maxSize = 10 * 1024 * 1024;

    fileList.forEach((fileItem) => {
      const file = fileItem.originFileObj;
      if (!file) {
        return;
      }

      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
        invalidFiles.push(`${file.name}：只支持 PDF 和 DOCX 格式`);
      } else if (file.size > maxSize) {
        invalidFiles.push(`${file.name}：文件大小不能超过 10MB`);
      }
    });

    if (invalidFiles.length > 0) {
      message.error(invalidFiles[0]);
      return;
    }

    // 创建文件队列
    const queue: FileQueueItem[] = fileList.map((fileItem) => ({
      uid: fileItem.uid,
      file: fileItem.originFileObj!,
      status: 'waiting',
      progress: 0,
    }));

    setFileQueue(queue);
    setShowQueue(true);
    message.success('文件已加入队列');
  };

  // 处理文件上传（开始解析）
  const handleUpload = async () => {
    if (fileQueue.length === 0) {
      message.warning('请先加入文件到队列');
      return;
    }
    void handleUploadQueue();
  };

  // 处理队列上传
  const handleUploadQueue = async () => {
    setIsUploadingQueue(true);
    setCurrentUploadingIndex(0);
    setActiveTask(true, '简历上传和解析中');

    // 逐个处理队列中的文件
    for (let i = 0; i < fileQueue.length; i++) {
      setCurrentUploadingIndex(i);
      await processFileInQueue(i);

      // 如果上一个文件失败，可以选择继续或停止
      const currentStatus = fileQueue[i]?.status;
      if (currentStatus === 'failed') {
        // 继续处理下一个文件
        continue;
      }
    }

    setIsUploadingQueue(false);
    setCurrentUploadingIndex(-1);
    setActiveTask(false);

    // 检查是否有成功解析的文件
    const firstSuccess = fileQueue.find((item) => item.status === 'success');
    if (firstSuccess?.result) {
      setProfile(firstSuccess.result);
      setParsed(true);
    }
  };

  // 处理单个文件上传
  const processFileInQueue = async (index: number) => {
    const item = fileQueue[index];
    if (!item) return;

    try {
      // 更新状态为上传中
      setFileQueue((prev) =>
        prev.map((queueItem, idx) =>
          idx === index ? { ...queueItem, status: 'uploading', progress: 0 } : queueItem
        )
      );

      // 文件转 base64
      setFileQueue((prev) =>
        prev.map((queueItem, idx) =>
          idx === index ? { ...queueItem, progress: 20 } : queueItem
        )
      );
      const base64Content = await fileToBase64(item.file);

      // 上传到后端
      setFileQueue((prev) =>
        prev.map((queueItem, idx) =>
          idx === index ? { ...queueItem, progress: 40 } : queueItem
        )
      );

      const response = await studentApi.uploadResume({
        fileContent: base64Content,
        fileName: item.file.name,
      });

      // 处理响应
      if (response && response.code === 0) {
        setFileQueue((prev) =>
          prev.map((queueItem, idx) =>
            idx === index
              ? { ...queueItem, status: 'success', progress: 100, result: response.data }
              : queueItem
          )
        );
        message.success(`${item.file.name} 解析完成`);
      } else {
        throw new Error(response?.msg || '解析失败');
      }
    } catch (err: unknown) {
      const apiErr = err as ApiErrorLike;
      let errorMsg = '上传失败';

      if (apiErr.response?.data) {
        errorMsg = apiErr.response.data.msg || apiErr.response.data.message || errorMsg;
      } else if (apiErr.message) {
        errorMsg = apiErr.message;
      }

      // 特殊处理 401 错误
      if (apiErr.response?.status === 401) {
        errorMsg = '请先登录后再上传简历';
        message.error(errorMsg);
        setActiveTask(false);
        setTimeout(() => {
          window.location.href = '/auth';
        }, 1500);
        setIsUploadingQueue(false);
        return;
      }

      setFileQueue((prev) =>
        prev.map((queueItem, idx) =>
          idx === index
            ? { ...queueItem, status: 'failed', progress: 0, error: errorMsg }
            : queueItem
        )
      );
      message.error(`${item.file.name} ${errorMsg}`);
    }
  };

  // 从队列中移除文件
  const removeFileFromQueue = (uid: string) => {
    setFileQueue((prev) => prev.filter((item) => item.uid !== uid));
  };

  // 重置队列
  const resetQueue = () => {
    setActiveTask(false);
    setFileQueue([]);
    setFileList([]);
    setShowQueue(false);
    setIsUploadingQueue(false);
    setCurrentUploadingIndex(-1);
  };

  // 重新上传
  const handleReset = () => {
    setFileList([]);
    setParsed(false);
    setProfile(null);
    setProgress(0);
    setError(null);
    resetQueue();
  };

  // 转换学历枚举值到中文
  const getEducationText = (education?: string) => {
    const map: Record<string, string> = {
      'high_school': '高中',
      'bachelor': '本科',
      'master': '硕士',
      'phd': '博士',
    };
    return education ? (map[education] || education) : '未提取';
  };

  return (
    <div className="min-h-screen relative z-10 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">简历解析</h1>
          <Button
            icon={<HistoryOutlined />}
            onClick={handleOpenHistory}
          >
            查看历史
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <Steps
            current={parsed ? 2 : parsing ? 1 : 0}
            className="mb-6"
            items={[
              { title: '上传简历', icon: <UploadOutlined /> },
              { title: 'AI 解析', icon: <FileTextOutlined /> },
              { title: '优化建议', icon: <CheckCircleOutlined /> },
            ]}
          />

          {!parsed ? (
            <>
              <Card title="上传简历" className="shadow-sm">
                <Upload.Dragger
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  beforeUpload={() => false}
                  accept=".pdf,.docx"
                  multiple
                  onRemove={() => setError(null)}
                  className="[&.ant-upload-wrapper_.ant-upload-drag]:border-2! [&.ant-upload-wrapper_.ant-upload-drag]:border-dashed! [&.ant-upload-wrapper_.ant-upload-drag]:border-slate-300! [&.ant-upload-wrapper_.ant-upload-drag]:bg-slate-50!"
                >
                  <p className="ant-upload-drag-icon mb-3!">
                    <InboxOutlined className="text-5xl text-blue-500" />
                  </p>
                  <p className="ant-upload-text text-base font-medium">点击上传，或将文件拖拽到此处</p>
                  <p className="ant-upload-hint mt-2">支持 PDF、DOCX 格式，文件大小不超过 10MB，可批量上传</p>
                </Upload.Dragger>

                {progress > 0 && progress < 100 && (
                  <Progress
                    percent={progress}
                    status="active"
                    className="mt-4"
                    format={() => parsing ? 'AI 解析中...' : '上传中...'}
                  />
                )}

                {/* 队列文件列表 */}
                {fileQueue.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        上传队列 ({fileQueue.filter((item) => item.status === 'success').length}/{fileQueue.length})
                      </span>
                      {!isUploadingQueue && (
                        <Button size="small" type="link" onClick={resetQueue}>
                          清空队列
                        </Button>
                      )}
                    </div>
                    <List
                      size="small"
                      dataSource={fileQueue}
                      renderItem={(item, index) => (
                        <List.Item
                          key={item.uid}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            if (item.status === 'success' && item.result) {
                              // 创建临时的详情记录用于显示
                              const tempDetail: ResumeHistoryRecord = {
                                id: Date.now(), // 使用时间戳作为临时ID
                                resumeFileName: item.file.name,
                                createdAt: Math.floor(Date.now() / 1000),
                                completenessScore: item.result.completeness || 0,
                                competitivenessScore: item.result.competitiveness || 0,
                                suggestions: item.result.suggestions || [],
                                parsedProfile: item.result,
                              };
                              setDetailRecord(tempDetail);
                              setDetailVisible(true);
                            } else if (item.status === 'failed') {
                              message.error(`解析失败：${item.error || '未知错误'}`);
                            }
                          }}
                          actions={[
                            !isUploadingQueue && (
                              <Button
                                size="small"
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFileFromQueue(item.uid);
                                }}
                              />
                            ),
                          ].filter(Boolean)}
                        >
                          <List.Item.Meta
                            avatar={
                              <FileTextOutlined
                                className={
                                  item.status === 'success'
                                    ? 'text-green-500'
                                    : item.status === 'failed'
                                    ? 'text-red-500'
                                    : item.status === 'uploading'
                                    ? 'text-blue-500'
                                    : 'text-gray-400'
                                }
                              />
                            }
                            title={
                              <span className="text-sm">
                                {item.file.name}
                                {item.status === 'uploading' && currentUploadingIndex === index && (
                                  <Tag color="blue" className="ml-2">
                                    上传中
                                  </Tag>
                                )}
                                {item.status === 'success' && (
                                  <Tag color="success" className="ml-2">
                                    成功
                                  </Tag>
                                )}
                                {item.status === 'failed' && (
                                  <Tag color="error" className="ml-2">
                                    失败
                                  </Tag>
                                )}
                                {item.status === 'waiting' && (
                                  <Tag className="ml-2">
                                    等待中
                                  </Tag>
                                )}
                              </span>
                            }
                            description={
                              <div className="w-full">
                                {item.status === 'uploading' && (
                                  <Progress
                                    percent={item.progress}
                                    size="small"
                                    showInfo={false}
                                  />
                                )}
                                {item.status === 'failed' && item.error && (
                                  <span className="text-red-500 text-xs">{item.error}</span>
                                )}
                                {item.status === 'success' && item.result && (
                                  <span className="text-green-600 text-xs">
                                    完整度：{item.result.completeness || 0}分 | 竞争力：{item.result.competitiveness || 0}分
                                  </span>
                                )}
                                {item.status === 'success' && (
                                  <span className="text-blue-500 text-xs ml-2">
                                    点击查看详情
                                  </span>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="mt-5 flex justify-center">
                  <Button
                    type="primary"
                    className="px-8"
                    onClick={fileQueue.length > 0 ? handleUpload : handleAddToQueue}
                    loading={isUploadingQueue}
                    disabled={fileList.length === 0}
                  >
                    {isUploadingQueue ? '解析中...' : fileQueue.length > 0 ? '开始解析' : '加入队列'}
                  </Button>
                </div>
              </Card>

              <Card className="mt-4" size="small">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-gray-500">示例模板：</span>
                  <Button
                    type="link"
                    className="px-0!"
                    icon={<FileTextOutlined />}
                    onClick={() => {
                      setPreviewFileName('黑白设计通用国际贸易财务会计专业简历.pdf');
                      setPreviewFileUrl('/examples/黑白设计通用国际贸易财务会计专业简历.pdf');
                      setPreviewVisible(true);
                    }}
                  >
                    预览模板.pdf
                  </Button>
                  <Button
                    type="link"
                    className="px-0!"
                    icon={<FileTextOutlined />}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/examples/黑白设计通用国际贸易财务会计专业简历.docx';
                      link.download = '黑白设计通用国际贸易财务会计专业简历.docx';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      message.success('模板下载成功');
                    }}
                  >
                    下载模板.docx
                  </Button>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card size="small">
                  <div className="flex items-start gap-3">
                    <BulbOutlined className="text-2xl text-violet-500" />
                    <div>
                      <div className="font-medium">智能提取</div>
                      <div className="text-sm text-gray-500">自动识别教育背景、技能与项目经历</div>
                    </div>
                  </div>
                </Card>
                <Card size="small">
                  <div className="flex items-start gap-3">
                    <SafetyCertificateOutlined className="text-2xl text-emerald-500" />
                    <div>
                      <div className="font-medium">安全隐私</div>
                      <div className="text-sm text-gray-500">上传链路受控，过程仅用于当前解析任务</div>
                    </div>
                  </div>
                </Card>
                <Card size="small">
                  <div className="flex items-start gap-3">
                    <RocketOutlined className="text-2xl text-orange-500" />
                    <div>
                      <div className="font-medium">优化建议</div>
                      <div className="text-sm text-gray-500">生成可执行的简历完善建议，提升竞争力</div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          ) : (
        <Result
                    status="success"
                    title="简历解析完成"
                    subTitle="AI 已完成简历分析，以下是详细信息"
                    extra={[
                      <Button
                        type="primary"
                        key="optimize"
                        onClick={() => {
                          const element = document.getElementById('suggestions-section');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                      >
                        查看优化建议
                      </Button>,
                      <Button key="reset" icon={<ReloadOutlined />} onClick={handleReset}>
                        重新上传
                      </Button>,
                    ]}
                  >          <div className="text-left space-y-4 max-w-3xl mx-auto">
            {profile ? (
              <>
                {/* 基础信息 */}
                <Card title="基础信息" size="small">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500">姓名：</span>
                      <span className="font-medium">{profile.name || '未提取'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">学历：</span>
                      <span className="font-medium">{getEducationText(profile.education)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">专业：</span>
                      <span className="font-medium">{profile.major || '未提取'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">毕业年份：</span>
                      <span className="font-medium">{profile.graduationYear || '未提取'}</span>
                    </div>
                  </div>
                </Card>

                {/* 技能列表 */}
                <Card title="技能列表" size="small">
                  {profile.skills && profile.skills.length > 0 ? (
                    <List
                      dataSource={profile.skills}
                      renderItem={(skill) => (
                        <List.Item>
                          <div className="flex items-center gap-4 w-full">
                            <Tag color="blue" className="text-base px-3 py-1">
                              {skill.name}
                            </Tag>
                            <div className="flex-1">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>掌握程度：{skill.level}/100</span>
                                <span>掌握年限：{skill.years} 年</span>
                              </div>
                              <Progress
                                percent={skill.level}
                                size="small"
                                showInfo={false}
                                strokeColor={{
                                  '0%': '#108ee9',
                                  '100%': '#87d068',
                                }}
                              />
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="未提取到技能信息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>

                {/* 证书列表 */}
                <Card title="证书列表" size="small">
                  {profile.certificates && profile.certificates.length > 0 ? (
                    <List
                      dataSource={profile.certificates}
                      renderItem={(cert) => (
                        <List.Item>
                          <div className="flex items-center gap-4">
                            <Tag color="green" className="text-base px-3 py-1">
                              {cert.name}
                            </Tag>
                            <div className="text-sm text-gray-600">
                              <span>等级：{cert.level}</span>
                              <span className="mx-2">|</span>
                              <span>获得年份：{cert.year}</span>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="未提取到证书信息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>

                {/* 实习经历 */}
                <Card title="实习经历" size="small">
                  {profile.internship && profile.internship.length > 0 ? (
                    <List
                      dataSource={profile.internship}
                      renderItem={(item) => (
                        <List.Item>
                          <div className="w-full">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-lg">{item.company}</h4>
                                <p className="text-gray-600">{item.position}</p>
                              </div>
                              <Tag color="purple">{item.duration} 个月</Tag>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                            )}
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="未提取到实习经历" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>

                {/* 项目经历 */}
                <Card title="项目经历" size="small">
                  {profile.projects && profile.projects.length > 0 ? (
                    <List
                      dataSource={profile.projects}
                      renderItem={(project) => (
                        <List.Item>
                          <div className="w-full">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-lg">{project.name}</h4>
                              <Tag color="orange">{project.role}</Tag>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                            {project.technologies && project.technologies.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {project.technologies.map((tech, index) => (
                                  <Tag key={index} color="cyan">
                                    {tech}
                                  </Tag>
                                ))}
                              </div>
                            )}
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="未提取到项目经历" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>

                {/* 评估结果 */}
                <Card title="评估结果" size="small">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">完整度</span>
                        <span className="font-medium text-lg">{profile.completeness || 0}分</span>
                      </div>
                      <Progress
                        percent={profile.completeness ?? 0}
                        showInfo={false}
                        strokeColor={(profile.completeness ?? 0) >= 80 ? '#52c41a' : (profile.completeness ?? 0) >= 60 ? '#faad14' : '#ff4d4f'}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">竞争力</span>
                        <span className="font-medium text-lg">{profile.competitiveness ?? 0}分</span>
                      </div>
                      <Progress
                        percent={profile.competitiveness ?? 0}
                        showInfo={false}
                        strokeColor={(profile.competitiveness ?? 0) >= 80 ? '#52c41a' : (profile.competitiveness ?? 0) >= 60 ? '#faad14' : '#ff4d4f'}
                      />
                    </div>
                  </div>
                  {profile.resumeContent && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-gray-600 mb-1">简历内容长度</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {profile.resumeContent.length.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">字符</p>
                      </div>
                    </div>
                  )}
                </Card>

                {/* 优化建议 */}
                {profile.suggestions && profile.suggestions.length > 0 && (
                  <Card id="suggestions-section" title="优化建议" size="small">
                    <List
                      dataSource={profile.suggestions}
                      renderItem={(suggestion, index) => (
                        <List.Item>
                          <div className="flex items-start gap-3">
                            <Tag color="orange">{index + 1}</Tag>
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        </List.Item>
                      )}
                    />
                  </Card>
                )}
              </>
            ) : (
              <Empty description="解析结果为空" />
            )}
          </div>
        </Result>
          )}
        </div>

      {/* 历史记录弹窗 */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            简历解析历史
          </Space>
        }
        open={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
        width={800}
        style={{ maxWidth: '90vw' }}
      >
        <List
          loading={historyLoading}
          dataSource={historyList}
          pagination={{
            current: historyPage,
            pageSize: historyPageSize,
            total: historyTotal,
            onChange: (page) => {
              void loadHistory(page);
            },
          }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDetail(item.id)}
                >
                  查看
                </Button>,
                <Popconfirm
                  title="确定删除这条历史记录吗？"
                  onConfirm={() => handleDeleteHistory(item.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <FileTextOutlined />
                    {item.resumeFileName}
                  </Space>
                }
                description={
                  <Space orientation="vertical" size="small">
                    <div>
                      <span className="text-gray-500">时间：</span>
                      {formatTime(item.createdAt)}
                    </div>
                    <div>
                      <span className="text-gray-500">完整度：</span>
                      <Progress
                        percent={item.completenessScore}
                        size="small"
                        format={(percent) => `${percent}分`}
                        style={{ width: 120, display: 'inline-block' }}
                      />
                      <span className="ml-2 text-gray-500">竞争力：</span>
                      <Progress
                        percent={item.competitivenessScore}
                        size="small"
                        format={(percent) => `${percent}分`}
                        style={{ width: 120, display: 'inline-block' }}
                      />
                    </div>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* 历史详情抽屉 */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            历史记录详情
          </Space>
        }
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        size="large"
      >
        {detailRecord && (
          <div className="space-y-4">
            <Card title="基本信息" size="small">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">文件名：</span>
                  <span className="font-medium">{detailRecord.resumeFileName}</span>
                </div>
                <div>
                  <span className="text-gray-500">解析时间：</span>
                  <span className="font-medium">{formatTime(detailRecord.createdAt)}</span>
                </div>
              </div>
            </Card>

            <Card title="评估结果" size="small">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">完整度</span>
                    <span className="font-medium text-lg">{detailRecord.completenessScore}分</span>
                  </div>
                  <Progress
                    percent={detailRecord.completenessScore}
                    showInfo={false}
                    strokeColor={detailRecord.completenessScore >= 80 ? '#52c41a' : detailRecord.completenessScore >= 60 ? '#faad14' : '#ff4d4f'}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">竞争力</span>
                    <span className="font-medium text-lg">{detailRecord.competitivenessScore}分</span>
                  </div>
                  <Progress
                    percent={detailRecord.competitivenessScore}
                    showInfo={false}
                    strokeColor={detailRecord.competitivenessScore >= 80 ? '#52c41a' : detailRecord.competitivenessScore >= 60 ? '#faad14' : '#ff4d4f'}
                  />
                </div>
              </div>
            </Card>

            {detailRecord.suggestions && detailRecord.suggestions.length > 0 && (
              <Card title="优化建议" size="small">
                <List
                  dataSource={detailRecord.suggestions}
                  renderItem={(suggestion, index) => (
                    <List.Item>
                      <div className="flex items-start gap-3">
                        <Tag color="orange">{index + 1}</Tag>
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {detailRecord.parsedProfile && (
              <Card title="解析后的档案" size="small">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">姓名：</span>
                    <span className="font-medium">{detailRecord.parsedProfile.name || '未提取'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">学历：</span>
                    <span className="font-medium">{getEducationText(detailRecord.parsedProfile.education)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">专业：</span>
                    <span className="font-medium">{detailRecord.parsedProfile.major || '未提取'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">毕业年份：</span>
                    <span className="font-medium">{detailRecord.parsedProfile.graduationYear || '未提取'}</span>
                  </div>
                </div>
                {detailRecord.parsedProfile.skills && detailRecord.parsedProfile.skills.length > 0 && (
                  <div className="mt-4">
                    <div className="text-gray-500 mb-2">技能：</div>
                    <Space wrap>
                      {detailRecord.parsedProfile.skills.map((skill, index) => (
                        <Tag key={index} color="blue">
                          {skill.name}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </Drawer>

      {/* PDF预览模态框 */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            简历模板预览
          </Space>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        style={{ maxWidth: '1200px' }}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<FileTextOutlined />}
            onClick={() => {
              const link = document.createElement('a');
              link.href = previewFileUrl;
              link.download = previewFileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              message.success('下载成功');
            }}
          >
            下载模板
          </Button>,
        ]}
      >
        <div className="h-[70vh]">
          <iframe
            src={previewFileUrl}
            title={previewFileName}
            className="w-full h-full border-0"
          />
        </div>
      </Modal>
      </div>
    </div>
  );
}