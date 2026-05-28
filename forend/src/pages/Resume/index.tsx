import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Button, message, Steps, List, Tag, Modal, Drawer, Space, Popconfirm } from 'antd';
import { UploadOutlined, FileTextOutlined, CheckCircleOutlined, ReloadOutlined, HistoryOutlined, DeleteOutlined, EyeOutlined, InboxOutlined, SafetyCertificateOutlined, RocketOutlined, BulbOutlined, ExportOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { studentApi } from '../../api';
import type { Student, ResumeHistoryRecord } from '../../types';
import { useTaskStore } from '../../stores';
import SurfaceCard from '../../components/SurfaceCard';

import PageHeader from '../../components/PageHeader';

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

  type FileQueueItem = {
    uid: string;
    file: File;
    status: 'waiting' | 'uploading' | 'success' | 'failed';
    progress: number;
    error?: string;
    result?: Student;
  };

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const navigate = useNavigate();
  const [parsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [profile, setProfile] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [isUploadingQueue, setIsUploadingQueue] = useState(false);
  const [currentUploadingIndex, setCurrentUploadingIndex] = useState(-1);
  const [, setShowQueue] = useState(false);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewFileUrl, setPreviewFileUrl] = useState('');

  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyList, setHistoryList] = useState<ResumeHistoryRecord[]>([]);

  const { setActiveTask, hasActiveTask } = useTaskStore();

  useEffect(() => {
    console.log('[Resume] Task state changed:', { hasActiveTask });
  }, [hasActiveTask]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize] = useState(10);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<ResumeHistoryRecord | null>(null);

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

  const handleOpenHistory = () => {
    setHistoryVisible(true);
    void loadHistory(1);
  };

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

  const handleAddToQueue = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择简历文件');
      return;
    }

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

  const handleUpload = async () => {
    if (fileQueue.length === 0) {
      message.warning('请先加入文件到队列');
      return;
    }
    void handleUploadQueue();
  };

  const handleUploadQueue = async () => {
    setIsUploadingQueue(true);
    setCurrentUploadingIndex(0);
    setActiveTask(true, '简历上传和解析中');

    for (let i = 0; i < fileQueue.length; i++) {
      setCurrentUploadingIndex(i);
      await processFileInQueue(i);

      const currentStatus = fileQueue[i]?.status;
      if (currentStatus === 'failed') {
        continue;
      }
    }

    setIsUploadingQueue(false);
    setCurrentUploadingIndex(-1);
    setActiveTask(false);

    const firstSuccess = fileQueue.find((item) => item.status === 'success');
    if (firstSuccess?.result) {
      setProfile(firstSuccess.result);
      setParsed(true);
    }
  };

  const processFileInQueue = async (index: number) => {
    const item = fileQueue[index];
    if (!item) return;

    try {
      setFileQueue((prev) =>
        prev.map((queueItem, idx) =>
          idx === index ? { ...queueItem, status: 'uploading', progress: 0 } : queueItem
        )
      );

      setFileQueue((prev) =>
        prev.map((queueItem, idx) =>
          idx === index ? { ...queueItem, progress: 20 } : queueItem
        )
      );
      const base64Content = await fileToBase64(item.file);

      setFileQueue((prev) =>
        prev.map((queueItem, idx) =>
          idx === index ? { ...queueItem, progress: 40 } : queueItem
        )
      );

      const response = await studentApi.uploadResume({
        fileContent: base64Content,
        fileName: item.file.name,
      });

      if (response && response.code === 0) {
        const result = response.data;
        const skillsCount = result.skills?.length || 0;
        const certsCount = result.certificates?.length || 0;
        const internshipCount = result.internship?.length || 0;
        const projectsCount = result.projects?.length || 0;

        const summaryParts = [];
        if (skillsCount > 0) summaryParts.push(`${skillsCount}个技能`);
        if (certsCount > 0) summaryParts.push(`${certsCount}个证书`);
        if (internshipCount > 0) summaryParts.push(`${internshipCount}段实习经历`);
        if (projectsCount > 0) summaryParts.push(`${projectsCount}个项目经历`);

        const summaryMsg = summaryParts.length > 0
          ? `${item.file.name} 解析完成（${summaryParts.join('、')}）`
          : `${item.file.name} 解析完成`;

        setFileQueue((prev) =>
          prev.map((queueItem, idx) =>
            idx === index
              ? { ...queueItem, status: 'success', progress: 100, result: response.data }
              : queueItem
          )
        );
        message.success(summaryMsg);
        setProfile(response.data);
        setParsed(true);
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

  const removeFileFromQueue = (uid: string) => {
    setFileQueue((prev) => prev.filter((item) => item.uid !== uid));
  };

  const resetQueue = () => {
    setActiveTask(false);
    setFileQueue([]);
    setFileList([]);
    setShowQueue(false);
    setIsUploadingQueue(false);
    setCurrentUploadingIndex(-1);
  };

  const handleReset = () => {
    setFileList([]);
    setParsed(false);
    setProfile(null);
    setProgress(0);
    setError(null);
    resetQueue();
  };

  const getEducationText = (education?: string) => {
    const map: Record<string, string> = {
      'high_school': '高中',
      'bachelor': '本科',
      'master': '硕士',
      'phd': '博士',
    };
    return education ? (map[education] || education) : '未提取';
  };

  const getProgressColor = (value: number): string => {
    if (value >= 80) return 'var(--md-sys-color-success)';
    if (value >= 60) return 'var(--md-sys-color-warning)';
    return 'var(--md-sys-color-error)';
  };

  return (
    <div className="resume-page min-h-screen relative z-10 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <PageHeader title="简历解析">
          <Button
            icon={<HistoryOutlined />}
            onClick={handleOpenHistory}
          >
            查看历史
          </Button>
        </PageHeader>

        <div className="mx-auto">
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
              <SurfaceCard title="上传简历">
                <Upload.Dragger
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  beforeUpload={() => false}
                  accept=".pdf,.docx"
                  multiple
                  onRemove={() => setError(null)}
                  className="resume-upload-dragger [&.ant-upload-wrapper_.ant-upload-drag]:border-2! [&.ant-upload-wrapper_.ant-upload-drag]:border-dashed! [&.ant-upload-wrapper_.ant-upload-drag]:border-[var(--md-sys-color-outline-variant)]! [&.ant-upload-wrapper_.ant-upload-drag]:bg-[var(--md-sys-color-surface-container)]!"
                >
                  <p className="ant-upload-drag-icon mb-3!">
                    <InboxOutlined style={{ fontSize: '3rem', color: 'var(--md-sys-color-primary)' }} />
                  </p>
                  <p className="ant-upload-text text-base font-medium">点击上传，或将文件拖拽到此处</p>
                  <p className="ant-upload-hint mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>支持 PDF、DOCX 格式，文件大小不超过 10MB，可批量上传</p>
                </Upload.Dragger>

                {progress > 0 && progress < 100 && (
                  <div className="mt-4">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>上传进度</span>
                        <span className="md-typescale-label-medium" style={{ color: 'var(--md-sys-color-primary)' }}>{progress}%</span>
                      </div>
                      <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, backgroundColor: 'var(--md-sys-color-primary)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '100%', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  </div>
                )}

                {fileQueue.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
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
                          className="cursor-pointer"
                          style={{ hoverBackgroundColor: 'var(--md-sys-color-surface-container-low)' }}
                          onClick={() => {
                            if (item.status === 'success' && item.result) {
                              const tempDetail: ResumeHistoryRecord = {
                                id: Date.now(),
                                resumeFileName: item.file.name,
                                createdAt: Math.floor(Date.now() / 1000),
                                completenessScore: item.result.completeness || 0,
                                competitivenessScore: item.result.competitiveness || 0,
                                suggestions: item.result.suggestions || [],
                                parsedProfile: item.result,
                                resumeContent: '',
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
                                style={
                                  item.status === 'success'
                                    ? { color: 'var(--md-sys-color-success)' }
                                    : item.status === 'failed'
                                    ? { color: 'var(--md-sys-color-error)' }
                                    : item.status === 'uploading'
                                    ? { color: 'var(--md-sys-color-primary)' }
                                    : { color: 'var(--md-sys-color-outline)' }
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
                                  <div className="w-full">
                                    <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '6px', overflow: 'hidden' }}>
                                      <div style={{ width: `${item.progress}%`, backgroundColor: 'var(--md-sys-color-primary)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '100%', transition: 'width 0.3s ease' }} />
                                    </div>
                                  </div>
                                )}
                                {item.status === 'failed' && item.error && (
                                  <span className="text-xs" style={{ color: 'var(--md-sys-color-error)' }}>{item.error}</span>
                                )}
                                {item.status === 'success' && item.result && (
                                  <span className="text-xs" style={{ color: 'var(--md-sys-color-success)' }}>
                                    完整度：{item.result.completeness || 0}分 | 竞争力：{item.result.competitiveness || 0}分
                                  </span>
                                )}
                                {item.status === 'success' && (
                                  <span className="text-xs ml-2" style={{ color: 'var(--md-sys-color-primary)' }}>
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
                  <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--md-sys-color-error-container)', border: '1px solid var(--md-sys-color-error-container)' }}>
                    <p className="text-sm" style={{ color: 'var(--md-sys-color-error)' }}>{error}</p>
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
              </SurfaceCard>

              <SurfaceCard variant="outlined" className="mt-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>示例模板：</span>
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
              </SurfaceCard>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <SurfaceCard variant="outlined">
                  <div className="flex items-start gap-3">
                    <BulbOutlined className="text-2xl" style={{ color: 'var(--md-sys-color-tertiary)' }} />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>智能提取</div>
                      <div className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>自动识别教育背景、技能与项目经历</div>
                    </div>
                  </div>
                </SurfaceCard>
                <SurfaceCard variant="outlined">
                  <div className="flex items-start gap-3">
                    <SafetyCertificateOutlined className="text-2xl" style={{ color: 'var(--md-sys-color-success)' }} />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>安全隐私</div>
                      <div className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>上传链路受控，过程仅用于当前解析任务</div>
                    </div>
                  </div>
                </SurfaceCard>
                <SurfaceCard variant="outlined">
                  <div className="flex items-start gap-3">
                    <RocketOutlined className="text-2xl" style={{ color: 'var(--md-sys-color-warning)' }} />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>优化建议</div>
                      <div className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>生成可执行的简历完善建议，提升竞争力</div>
                    </div>
                  </div>
                </SurfaceCard>
              </div>
            </>
          ) : (
            <>
            <div className="text-center py-8">
              <span className="material-symbols-rounded text-5xl" style={{ color: 'var(--md-sys-color-success)' }}>check_circle</span>
              <div className="md-typescale-headline-small mt-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>简历解析完成</div>
              <div className="md-typescale-body-medium mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>您的简历信息已成功提取</div>
              <div className="flex justify-center gap-3 mt-6">
                <Button
                  type="primary"
                  onClick={() => {
                    const element = document.getElementById('suggestions-section');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  查看优化建议
                </Button>
                <Button
                  onClick={() => navigate('/resume/editor', { state: { profile } })}
                >
                  优化并导出简历
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重新上传
                </Button>
              </div>
            </div>
            <div className="text-left space-y-4 mx-auto">
              {profile ? (
                <>
                  <SurfaceCard title="基础信息">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>姓名：</span>
                        <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{profile.name || '未提取'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>学历：</span>
                        <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{getEducationText(profile.education)}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>专业：</span>
                        <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{profile.major || '未提取'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>毕业年份：</span>
                        <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{profile.graduationYear || '未提取'}</span>
                      </div>
                    </div>
                  </SurfaceCard>

                  <SurfaceCard title="技能列表">
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
                                <div className="flex justify-between text-sm mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                  <span>掌握程度：{skill.level}/100</span>
                                  <span>掌握年限：{skill.years} 年</span>
                                </div>
                                <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '8px', overflow: 'hidden' }}>
                                  <div style={{ width: `${skill.level}%`, backgroundColor: getProgressColor(skill.level), borderRadius: 'var(--md-sys-shape-corner-full)', height: '100%', transition: 'width 0.3s ease' }} />
                                </div>
                              </div>
                            </div>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <span className="material-symbols-rounded text-4xl" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>inbox</span>
                        <div className="md-typescale-body-large mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>未提取到技能信息</div>
                      </div>
                    )}
                  </SurfaceCard>

                  <SurfaceCard title="证书列表">
                    {profile.certificates && profile.certificates.length > 0 ? (
                      <List
                        dataSource={profile.certificates}
                        renderItem={(cert) => (
                          <List.Item>
                            <div className="flex items-center gap-4">
                              <Tag color="green" className="text-base px-3 py-1">
                                {cert.name}
                              </Tag>
                              <div className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                <span>等级：{cert.level}</span>
                                <span className="mx-2">|</span>
                                <span>获得年份：{cert.year}</span>
                              </div>
                            </div>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <span className="material-symbols-rounded text-4xl" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>inbox</span>
                        <div className="md-typescale-body-large mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>未提取到证书信息</div>
                      </div>
                    )}
                  </SurfaceCard>

                  <SurfaceCard title="实习经历">
                    {profile.internship && profile.internship.length > 0 ? (
                      <List
                        dataSource={profile.internship}
                        renderItem={(item) => (
                          <List.Item>
                            <div className="w-full">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium text-lg" style={{ color: 'var(--md-sys-color-on-surface)' }}>{item.company}</h4>
                                  <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{item.position}</p>
                                </div>
                                <Tag color="purple">{item.duration} 个月</Tag>
                              </div>
                              {item.description && (
                                <p className="text-sm mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{item.description}</p>
                              )}
                            </div>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <span className="material-symbols-rounded text-4xl" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>inbox</span>
                        <div className="md-typescale-body-large mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>未提取到实习经历</div>
                      </div>
                    )}
                  </SurfaceCard>

                  <SurfaceCard title="项目经历">
                    {profile.projects && profile.projects.length > 0 ? (
                      <List
                        dataSource={profile.projects}
                        renderItem={(project) => (
                          <List.Item>
                            <div className="w-full">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-lg" style={{ color: 'var(--md-sys-color-on-surface)' }}>{project.name}</h4>
                                <Tag color="orange">{project.role}</Tag>
                              </div>
                              <p className="text-sm mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{project.description}</p>
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
                      <div className="text-center py-8">
                        <span className="material-symbols-rounded text-4xl" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>inbox</span>
                        <div className="md-typescale-body-large mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>未提取到项目经历</div>
                      </div>
                    )}
                  </SurfaceCard>

                  <SurfaceCard title="评估结果">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="w-full">
                        <div className="flex justify-between mb-1">
                          <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>完整度</span>
                          <span className="md-typescale-label-medium" style={{ color: getProgressColor(profile.completeness ?? 0) }}>{profile.completeness || 0}分</span>
                        </div>
                        <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '8px', overflow: 'hidden' }}>
                          <div style={{ width: `${profile.completeness ?? 0}%`, backgroundColor: getProgressColor(profile.completeness ?? 0), borderRadius: 'var(--md-sys-shape-corner-full)', height: '100%', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                      <div className="w-full">
                        <div className="flex justify-between mb-1">
                          <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>竞争力</span>
                          <span className="md-typescale-label-medium" style={{ color: getProgressColor(profile.competitiveness ?? 0) }}>{profile.competitiveness ?? 0}分</span>
                        </div>
                        <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '8px', overflow: 'hidden' }}>
                          <div style={{ width: `${profile.competitiveness ?? 0}%`, backgroundColor: getProgressColor(profile.competitiveness ?? 0), borderRadius: 'var(--md-sys-shape-corner-full)', height: '100%', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    </div>
                    {profile.resumeContent && (
                      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                        <div className="text-center">
                          <p className="mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>简历内容长度</p>
                          <p className="text-2xl font-bold" style={{ color: 'var(--md-sys-color-primary)' }}>
                            {profile.resumeContent.length.toLocaleString()}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>字符</p>
                        </div>
                      </div>
                    )}
                  </SurfaceCard>

                  {profile.suggestions && profile.suggestions.length > 0 && (
                    <SurfaceCard id="suggestions-section" title="优化建议">
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
                    </SurfaceCard>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-rounded text-4xl" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>inbox</span>
                  <div className="md-typescale-body-large mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>解析结果为空</div>
                </div>
              )}
            </div>
            </>
          )}
        </div>

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
                item.parsedProfile ? (
                  <Button
                    type="link"
                    icon={<ExportOutlined />}
                    onClick={() => {
                      setHistoryVisible(false);
                      navigate('/resume/editor', { state: { profile: item.parsedProfile, historyId: item.id } });
                    }}
                  >
                    优化导出
                  </Button>
                ) : null,
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
                      <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>时间：</span>
                      {formatTime(item.createdAt)}
                    </div>
                    <div>
                      <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>完整度：</span>
                      <div className="inline-block" style={{ width: 120 }}>
                        <div className="flex justify-between mb-1">
                          <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}></span>
                          <span className="md-typescale-label-medium" style={{ color: getProgressColor(item.completenessScore) }}>{item.completenessScore}分</span>
                        </div>
                        <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.completenessScore}%`, backgroundColor: getProgressColor(item.completenessScore), borderRadius: 'var(--md-sys-shape-corner-full)', height: '100%', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                      <span className="ml-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>竞争力：</span>
                      <div className="inline-block" style={{ width: 120 }}>
                        <div className="flex justify-between mb-1">
                          <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}></span>
                          <span className="md-typescale-label-medium" style={{ color: getProgressColor(item.competitivenessScore) }}>{item.competitivenessScore}分</span>
                        </div>
                        <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.competitivenessScore}%`, backgroundColor: getProgressColor(item.competitivenessScore), borderRadius: 'var(--md-sys-shape-corner-full)', height: '100%', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    </div>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

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
            <SurfaceCard title="基本信息">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>文件名：</span>
                  <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{detailRecord.resumeFileName}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>解析时间：</span>
                  <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{formatTime(detailRecord.createdAt)}</span>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard title="评估结果">
              <div className="grid grid-cols-2 gap-6">
                <div className="w-full">
                  <div className="flex justify-between mb-1">
                    <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>完整度</span>
                    <span className="md-typescale-label-medium" style={{ color: getProgressColor(detailRecord.completenessScore) }}>{detailRecord.completenessScore}分</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${detailRecord.completenessScore}%`, backgroundColor: getProgressColor(detailRecord.completenessScore), borderRadius: 'var(--md-sys-shape-corner-full)', height: '100%', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex justify-between mb-1">
                    <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>竞争力</span>
                    <span className="md-typescale-label-medium" style={{ color: getProgressColor(detailRecord.competitivenessScore) }}>{detailRecord.competitivenessScore}分</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${detailRecord.competitivenessScore}%`, backgroundColor: getProgressColor(detailRecord.competitivenessScore), borderRadius: 'var(--md-sys-shape-corner-full)', height: '100%', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              </div>
            </SurfaceCard>

            {detailRecord.suggestions && detailRecord.suggestions.length > 0 && (
              <SurfaceCard title="优化建议">
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
              </SurfaceCard>
            )}

            {detailRecord.parsedProfile && (
              <SurfaceCard title="解析后的档案">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>姓名：</span>
                    <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{detailRecord.parsedProfile.name || '未提取'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>学历：</span>
                    <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{getEducationText(detailRecord.parsedProfile.education)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>专业：</span>
                    <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{detailRecord.parsedProfile.major || '未提取'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>毕业年份：</span>
                    <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{detailRecord.parsedProfile.graduationYear || '未提取'}</span>
                  </div>
                </div>
                {detailRecord.parsedProfile.skills && detailRecord.parsedProfile.skills.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>技能：</div>
                    <Space wrap>
                      {detailRecord.parsedProfile.skills.map((skill, index) => (
                        <Tag key={index} color="blue">
                          {skill.name}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </SurfaceCard>
            )}

            {detailRecord.parsedProfile && (
              <div className="mt-4 flex justify-center">
                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  onClick={() => {
                    setDetailVisible(false);
                    setHistoryVisible(false);
                    navigate('/resume/editor', { state: { profile: detailRecord.parsedProfile, historyId: detailRecord.id } });
                  }}
                >
                  优化并导出简历
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

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