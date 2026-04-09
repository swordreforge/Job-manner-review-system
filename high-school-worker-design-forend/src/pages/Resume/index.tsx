import { useState } from 'react';
import { Card, Upload, Button, message, Steps, Result, List, Tag, Progress, Empty, Modal, Drawer, Space, Popconfirm } from 'antd';
import { UploadOutlined, FileTextOutlined, CheckCircleOutlined, ReloadOutlined, HistoryOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { studentApi } from '../../api';
import type { Student, ResumeHistoryRecord } from '../../types';

export default function ResumePage() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [profile, setProfile] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 历史记录相关状态
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyList, setHistoryList] = useState<ResumeHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize] = useState(10);

  // 详情抽屉状态
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<ResumeHistoryRecord | null>(null);

  // 加载历史记录
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await studentApi.getResumeHistory({ page: historyPage, pageSize: historyPageSize });
      if (response.code === 0) {
        setHistoryList(response.data.list);
        setHistoryTotal(response.data.total);
      } else {
        message.error(response.msg || '加载历史记录失败');
      }
    } catch (err: any) {
      console.error('Load history error:', err);
      if (err.response?.status === 401) {
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
    loadHistory();
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
    } catch (err: any) {
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
        loadHistory();
      } else {
        message.error(response.msg || '删除失败');
      }
    } catch (err: any) {
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

  // 处理文件上传
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择简历文件');
      return;
    }

    const file = fileList[0].originFileObj;
    if (!file) {
      message.error('文件读取失败');
      return;
    }

    // 验证文件格式
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
      message.error('只支持 PDF 和 DOCX 格式的文件');
      return;
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      message.error('文件大小不能超过 10MB');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. 文件转 base64
      setProgress(20);
      const base64Content = await fileToBase64(file);
      setProgress(40);

      // 2. 调用 API
      setParsing(true);
      const response = await studentApi.uploadResume({
        fileContent: base64Content,
        fileName: file.name,
      });

      setProgress(100);

      // 3. 处理响应
      if (!response) {
        setError('服务器未返回响应，请重试');
        message.error('服务器未返回响应，请重试');
        return;
      }

      if (response.code === 0) {
        setProfile(response.data);
        setParsed(true);
        message.success('简历解析完成');
      } else {
        setError(response.msg || '解析失败，请重试');
        message.error(response.msg || '解析失败，请重试');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      let errorMsg = '上传失败，请检查网络连接';

      if (err.response?.data) {
        errorMsg = err.response.data.msg || err.response.data.message || errorMsg;
      } else if (err.message) {
        errorMsg = err.message;
      }

      // 特殊处理 401 错误
      if (err.response?.status === 401) {
        errorMsg = '请先登录后再上传简历';
        message.error(errorMsg);
        setTimeout(() => {
          window.location.href = '/auth';
        }, 1500);
        setError(errorMsg);
        return;
      }

      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  // 重新上传
  const handleReset = () => {
    setFileList([]);
    setParsed(false);
    setProfile(null);
    setProgress(0);
    setError(null);
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
    <div className="min-h-screen relative z-10 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">简历解析</h1>
        <Button
          icon={<HistoryOutlined />}
          onClick={handleOpenHistory}
        >
          查看历史
        </Button>
      </div>

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
        <Card title="上传简历">
          <Upload
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={() => false}
            accept=".pdf,.docx"
            maxCount={1}
            onRemove={() => setError(null)}
          >
            <Button icon={<UploadOutlined />}>点击选择文件</Button>
          </Upload>
          <p className="text-gray-500 text-sm mt-2">
            支持 PDF、DOCX 格式，文件大小不超过 10MB
          </p>

          {progress > 0 && progress < 100 && (
            <Progress
              percent={progress}
              status="active"
              className="mt-4"
              format={() => parsing ? 'AI 解析中...' : '上传中...'}
            />
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="primary"
            block
            className="mt-4"
            onClick={handleUpload}
            loading={uploading || parsing}
            disabled={fileList.length === 0}
          >
            {parsing ? 'AI 解析中...' : uploading ? '上传中...' : '开始解析'}
          </Button>
        </Card>
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
                      <Button key="compare" onClick={() => message.info('双版本对比功能开发中')}>
                        双版本对比
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
              setHistoryPage(page);
              loadHistory();
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
    </div>
  );
}