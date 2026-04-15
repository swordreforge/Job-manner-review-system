import { Card, Avatar, Button, message, Tag, Modal, Progress, Collapse } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, EditOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores';
import { userApi, studentApi } from '../../api';
import type { Student, StudentSkill, StudentCert, Internship as StudentInternship, Project as StudentProject } from '../../types';

const menuItems = [
  { icon: <SettingOutlined />, title: '设置', desc: '应用偏好设置', path: '/settings' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [experienceType, setExperienceType] = useState<'internship' | 'project'>('internship');
  const [avatarSrc, setAvatarSrc] = useState('/default-avatar.svg');
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [avatarPreviewScale, setAvatarPreviewScale] = useState(1);
  const [avatarPreviewOffset, setAvatarPreviewOffset] = useState({ x: 0, y: 0 });
  const [avatarPreviewDragging, setAvatarPreviewDragging] = useState(false);
  const [avatarPreviewDragStart, setAvatarPreviewDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setAvatarSrc(user?.avatar || '/default-avatar.svg');
  }, [user?.avatar]);

  useEffect(() => {
    // 如果用户信息为空，重新获取
    if (!user) {
      const fetchUserInfo = async () => {
        try {
          const userInfo = await userApi.getInfo();
          if (userInfo && userInfo.data) {
            setUser(userInfo.data);
          }
        } catch (error) {
          console.error('Failed to fetch user info:', error);
        }
      };
      fetchUserInfo();
    }
  }, [user, setUser]);

  useEffect(() => {
    // 获取学生资料
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoadingStudent(true);
    try {
      const response = await studentApi.getMe();
      if (response.code === 0 && response.data) {
        setStudentData(response.data);
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        setStudentData(null);
      } else {
        console.error('Failed to fetch student data:', error);
      }
    } finally {
      setLoadingStudent(false);
    }
  };

  useEffect(() => {
    if (!user?.id || loadingStudent) return;
    
    const modalKey = `profile_complete_modal_shown_${user.id}`;
    const hasSeenModal = localStorage.getItem(modalKey);
    if (studentData === null && !hasSeenModal) {
      setShowCompleteModal(true);
    }
  }, [user?.id, studentData, loadingStudent]);

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/welcome');
  };

  const handleEditStudent = () => {
    navigate('/student');
  };

  const openExperienceModal = (type: 'internship' | 'project') => {
    setExperienceType(type);
    setExperienceModalOpen(true);
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${label}已复制`);
    } catch {
      message.error(`复制${label}失败`);
    }
  };

  const exportTextFile = (text: string, fileName: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const internshipToText = (item: StudentInternship, index: number) => {
    return [
      `实习经历 ${index + 1}`,
      `公司：${item.company || '-'}`,
      `岗位：${item.position || '-'}`,
      `时长：${item.duration || 0} 个月`,
      `描述：${item.description || '-'}`,
    ].join('\n');
  };

  const projectToText = (item: StudentProject, index: number) => {
    return [
      `项目经验 ${index + 1}`,
      `项目名：${item.name || '-'}`,
      `角色：${item.role || '-'}`,
      `描述：${item.description || '-'}`,
      `技术栈：${(item.technologies || []).join(', ') || '-'}`,
    ].join('\n');
  };


  const calculateCompleteness = (student: Student | null): number => {
    if (!student) return 0;
    let score = 0;
    const totalFields = 8;
    
    if (student.name) score++;
    if (student.education) score++;
    if (student.major) score++;
    if (student.graduationYear) score++;
    if (student.skills && student.skills.length > 0) score++;
    if (student.certificates && student.certificates.length > 0) score++;
    if (student.internship && student.internship.length > 0) score++;
    if (student.projects && student.projects.length > 0) score++;
    
    return Math.round((score / totalFields) * 100);
  };

  const getCompletenessItems = (student: Student | null) => {
    return [
      { key: 'name', label: '姓名', completed: !!student?.name, targetSection: 'basic' },
      { key: 'education', label: '学历', completed: !!student?.education, targetSection: 'basic' },
      { key: 'major', label: '专业', completed: !!student?.major, targetSection: 'basic' },
      { key: 'graduationYear', label: '毕业年份', completed: !!student?.graduationYear, targetSection: 'basic' },
      { key: 'skills', label: '技能信息', completed: !!student?.skills?.length, targetSection: 'skills' },
      { key: 'certificates', label: '证书信息', completed: !!student?.certificates?.length, targetSection: 'certificates' },
      { key: 'internship', label: '实习经历', completed: !!student?.internship?.length, targetSection: 'internship' },
      { key: 'projects', label: '项目经验', completed: !!student?.projects?.length, targetSection: 'projects' },
    ];
  };

  const completenessItems = getCompletenessItems(studentData);
  const completedCount = completenessItems.filter((item) => item.completed).length;
  const completenessPercent = calculateCompleteness(studentData);
  const internships: StudentInternship[] = studentData?.internship || [];
  const projects: StudentProject[] = studentData?.projects || [];

  return (
    <div className="min-h-screen relative z-10 p-4">
      {/* 用户信息卡片 */}
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <div
              className="cursor-pointer"
              title="点击查看大图"
              onClick={() => {
                setAvatarPreviewScale(1);
                setAvatarPreviewOffset({ x: 0, y: 0 });
                setAvatarPreviewOpen(true);
              }}
            >
              <Avatar
                size={64}
                src={avatarSrc}
                icon={<UserOutlined />}
                className="bg-blue-500"
                onError={() => {
                  setAvatarSrc('/default-avatar.svg');
                  return false;
                }}
              />
            </div>
            <Button size="small" type="link" className="px-0" onClick={() => navigate('/settings')}>
              更换头像
            </Button>
          </div>
          <div className="flex-1">
            <div className="font-medium text-lg">{user?.username || '未登录'}</div>
            <div className="text-gray-500 text-sm">{user?.email || '暂无邮箱'}</div>
            <div className="text-gray-400 text-xs mt-1">
              账户类型: {user?.role === 'admin' ? '管理员' : '用户'}
            </div>
          </div>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={handleEditStudent}
          >
            编辑学生资料
          </Button>
        </div>
        {/* 学生资料状态 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {studentData ? (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  已创建学生资料
                </Tag>
              ) : (
                <Tag icon={<ExclamationCircleOutlined />} color="warning">
                  未创建学生资料
                </Tag>
              )}
              {studentData && (
                <span className="text-sm text-gray-500">
                  完成度: {calculateCompleteness(studentData)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 学生资料信息 */}
      <Card 
        title="学生资料"
        className="mb-4"
      >
        {loadingStudent ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : studentData ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">姓名</span>
              <span className="font-medium">{studentData.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">学历</span>
              <span className="font-medium">
                {studentData.education === 'bachelor' ? '本科' :
                 studentData.education === 'master' ? '硕士' :
                 studentData.education === 'phd' ? '博士' :
                 studentData.education === 'high_school' ? '高中' :
                 studentData.education || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">专业</span>
              <span className="font-medium">{studentData.major || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">毕业年份</span>
              <span className="font-medium">{studentData.graduationYear || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">技能</span>
              <div className="flex flex-wrap gap-1">
                {studentData.skills && studentData.skills.length > 0 ? (
                  studentData.skills.map((skill: StudentSkill, index: number) => (
                    <Tag key={index} color="blue">{skill.name}</Tag>
                  ))
                ) : (
                  <span className="text-gray-400">暂无</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">证书</span>
              <div className="flex flex-wrap gap-1">
                {studentData.certificates && studentData.certificates.length > 0 ? (
                  studentData.certificates.map((cert: StudentCert, index: number) => (
                    <Tag key={index} color="green">{cert.name}</Tag>
                  ))
                ) : (
                  <span className="text-gray-400">暂无</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">实习经历</span>
              <Button
                type="link"
                className="px-0"
                disabled={(studentData.internship?.length || 0) === 0}
                onClick={() => openExperienceModal('internship')}
              >
                {studentData.internship?.length || 0} 条
              </Button>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">项目经验</span>
              <Button
                type="link"
                className="px-0"
                disabled={(studentData.projects?.length || 0) === 0}
                onClick={() => openExperienceModal('project')}
              >
                {studentData.projects?.length || 0} 条
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <ExclamationCircleOutlined className="text-4xl text-yellow-500 mb-2" />
            <div className="text-gray-500 mb-4">您还没有创建学生资料</div>
            <Button type="primary" onClick={handleEditStudent}>
              立即创建
            </Button>
          </div>
        )}
      </Card>

      <Card className="mb-4" bodyStyle={{ padding: 0 }}>
        <Collapse
          ghost
          items={[
            {
              key: 'completeness',
              label: (
                <div className="flex items-center pr-4">
                  <span className="font-medium">资料完成度明细</span>
                  <span className="ml-4 text-sm font-semibold text-green-600">{completenessPercent}%</span>
                </div>
              ),
              children: (
                <div className="px-4 pb-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">当前完成进度</span>
                      <span className="font-medium">{completedCount}/{completenessItems.length}</span>
                    </div>
                    <Progress percent={completenessPercent} status={completenessPercent === 100 ? 'success' : 'active'} />
                  </div>
                  <div className="space-y-2">
                    {completenessItems.map((item) => (
                      <div
                        key={item.key}
                        className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-0 ${item.completed ? '' : 'cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded'}`}
                        onClick={() => {
                          if (!item.completed) {
                            navigate(`/student?section=${item.targetSection}`);
                          }
                        }}
                      >
                        <span className="text-gray-700">{item.label}</span>
                        {item.completed ? (
                          <Tag color="success">已完成</Tag>
                        ) : (
                          <Tag color="warning">未完成</Tag>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 功能菜单 */}
      <Card>
        <div className="space-y-0">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50"
              onClick={() => item.path && navigate(item.path)}
            >
              <Avatar size="small" icon={item.icon} className="bg-blue-500" />
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-gray-500 text-sm">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 退出登录按钮 */}
      <Button 
        block 
        className="mt-4" 
        danger 
        icon={<LogoutOutlined />}
        onClick={handleLogout}
      >
        退出登录
      </Button>

      {/* 完善资料提示模态框 */}
      <Modal
        open={experienceModalOpen}
        onCancel={() => setExperienceModalOpen(false)}
        footer={null}
        title={experienceType === 'internship' ? '实习经历详情（仅查看）' : '项目经验详情（仅查看）'}
      >
        {experienceType === 'internship' ? (
          internships.length > 0 ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {internships.map((item: StudentInternship, index: number) => (
                <Card
                  key={`${item.company}-${item.position}-${index}`}
                  size="small"
                  title={`${index + 1}. ${item.company || '未填写公司'}`}
                  extra={
                    <div className="flex items-center gap-2">
                      <Button
                        size="small"
                        onClick={() => {
                          void copyText(internshipToText(item, index), '实习经历');
                        }}
                      >
                        复制
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          exportTextFile(internshipToText(item, index), `internship-${index + 1}.txt`);
                        }}
                      >
                        导出
                      </Button>
                    </div>
                  }
                >
                  <div className="text-sm text-gray-700">岗位：{item.position || '-'}</div>
                  <div className="text-sm text-gray-700 mt-1">时长：{item.duration || 0} 个月</div>
                  <div className="text-sm text-gray-700 mt-1">描述：{item.description || '-'}</div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-6">暂无实习经历</div>
          )
        ) : projects.length > 0 ? (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {projects.map((item: StudentProject, index: number) => (
              <Card
                key={`${item.name}-${item.role}-${index}`}
                size="small"
                title={`${index + 1}. ${item.name || '未填写项目名'}`}
                extra={
                  <div className="flex items-center gap-2">
                    <Button
                      size="small"
                      onClick={() => {
                        void copyText(projectToText(item, index), '项目经验');
                      }}
                    >
                      复制
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        exportTextFile(projectToText(item, index), `project-${index + 1}.txt`);
                      }}
                    >
                      导出
                    </Button>
                  </div>
                }
              >
                <div className="text-sm text-gray-700">角色：{item.role || '-'}</div>
                <div className="text-sm text-gray-700 mt-1">描述：{item.description || '-'}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(item.technologies || []).length > 0 ? (
                    (item.technologies || []).map((tech: string, idx: number) => (
                      <Tag key={`${tech}-${idx}`} color="blue">{tech}</Tag>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">暂无技术栈</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-6">暂无项目经验</div>
        )}
      </Modal>

      <Modal
        open={showCompleteModal}
        onCancel={() => setShowCompleteModal(false)}
        footer={null}
        centered
        closable={false}
      >
        <div className="text-center p-4">
          <div className="text-4xl mb-4">🔔</div>
          <div className="text-lg font-medium mb-2">完善学生资料，提升求职竞争力！</div>
          <div className="text-gray-500 mb-6">
            您可以通过上传简历快速完善学生资料，AI将自动解析并填充信息。
          </div>
          <div className="flex flex-col gap-3">
            <Button 
              type="primary" 
              block
              onClick={() => {
                setShowCompleteModal(false);
                navigate('/resume');
              }}
            >
              📄 上传简历快速完善资料
            </Button>
            <Button 
              block
              onClick={() => {
                setShowCompleteModal(false);
                navigate('/student');
              }}
            >
              ✏️ 手动编辑资料
            </Button>
            <Button 
              type="text" 
              block
              onClick={() => {
                setShowCompleteModal(false);
                const modalKey = `profile_complete_modal_shown_${user?.id}`;
                localStorage.setItem(modalKey, 'true');
              }}
            >
              暂时不需要
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={avatarPreviewOpen}
        footer={null}
        centered
        onCancel={() => {
          setAvatarPreviewOpen(false);
          setAvatarPreviewScale(1);
          setAvatarPreviewOffset({ x: 0, y: 0 });
          setAvatarPreviewDragging(false);
          setAvatarPreviewDragStart({ x: 0, y: 0 });
        }}
        title="头像预览"
      >
        <div
          className="flex justify-center overflow-hidden select-none"
          onWheel={(e) => {
            e.preventDefault();
            const nextScale = e.deltaY > 0 ? avatarPreviewScale - 0.1 : avatarPreviewScale + 0.1;
            setAvatarPreviewScale(Math.min(4, Math.max(0.5, Number(nextScale.toFixed(2)))));
          }}
          onMouseMove={(e) => {
            if (!avatarPreviewDragging) return;
            setAvatarPreviewOffset({
              x: e.clientX - avatarPreviewDragStart.x,
              y: e.clientY - avatarPreviewDragStart.y,
            });
          }}
          onMouseUp={() => setAvatarPreviewDragging(false)}
          onMouseLeave={() => setAvatarPreviewDragging(false)}
        >
          <img
            src={avatarSrc || '/default-avatar.svg'}
            alt="头像预览"
            className={`max-w-full max-h-[70vh] object-contain rounded-lg ${avatarPreviewDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              transform: `translate(${avatarPreviewOffset.x}px, ${avatarPreviewOffset.y}px) scale(${avatarPreviewScale})`,
              transition: avatarPreviewDragging ? 'none' : 'transform 0.08s linear',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              setAvatarPreviewDragging(true);
              setAvatarPreviewDragStart({
                x: e.clientX - avatarPreviewOffset.x,
                y: e.clientY - avatarPreviewOffset.y,
              });
            }}
          />
        </div>
        <div className="text-center text-xs text-gray-500 mt-3">鼠标滚轮缩放，按住左键可拖拽移动（50% - 400%）</div>
      </Modal>

    </div>
  );
}