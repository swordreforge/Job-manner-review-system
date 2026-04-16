import { Avatar, Button, message, Tag, Modal, Collapse, Input, Card } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, EditOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
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
  const [joinSchoolModalVisible, setJoinSchoolModalVisible] = useState(false);
  const [joinSchoolLoading, setJoinSchoolLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [studentName, setStudentName] = useState('');
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
    <div className="min-h-screen relative z-10 p-3 sm:p-4" style={{ backgroundColor: 'var(--md-sys-color-surface)' }}>
      {/* 用户信息卡片 - MD3 Card */}
      <div 
        className="mb-3 sm:mb-4 p-4 sm:p-5"
        style={{ 
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          boxShadow: 'var(--md-sys-elevation-0)'
        }}
      >
        <div className="flex items-start gap-3 sm:gap-4">
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
                size={56}
                src={avatarSrc}
                icon={<UserOutlined />}
                style={{ 
                  backgroundColor: 'var(--md-sys-color-primary)',
                  boxShadow: 'var(--md-sys-elevation-1)'
                }}
                onError={() => {
                  setAvatarSrc('/default-avatar.svg');
                  return false;
                }}
              />
            </div>
            <Button size="small" type="link" className="px-0 text-xs" onClick={() => navigate('/settings')}>
              更换头像
            </Button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-base sm:text-lg truncate" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {user?.username || '未登录'}
            </div>
            <div className="text-sm truncate" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {user?.email || '暂无邮箱'}
            </div>
<div className="text-xs mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              账户类型: {user?.role === 'admin' ? '管理员' : '用户'}
            </div>
          </div>
        </div>

        {/* 学校信息 */}
        <Card 
          title="学校信息" 
          extra={
            <Button type="link" onClick={() => setJoinSchoolModalVisible(true)}>
              加入学校
            </Button>
          }
          className="mb-3"
        >
          <div className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            点击"加入学校"按钮，使用教师提供的邀请码加入学校
          </div>
        </Card>

        <Modal
          title="加入学校"
          open={joinSchoolModalVisible}
          onCancel={() => setJoinSchoolModalVisible(false)}
          footer={null}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">邀请码</label>
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="请输入教师提供的邀请码"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">姓名</label>
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="请输入您的姓名"
              />
            </div>
            <Button
              type="primary"
              block
              loading={joinSchoolLoading}
              onClick={async () => {
                if (!inviteCode.trim()) {
                  message.error('请输入邀请码');
                  return;
                }
                setJoinSchoolLoading(true);
                try {
                  const result = await studentApi.joinSchool({
                    inviteCode: inviteCode.trim(),
                    name: studentName.trim(),
                  });
                  if (result.code === 0) {
                    message.success(`成功加入 ${result.data.schoolName}`);
                    setJoinSchoolModalVisible(false);
                    setInviteCode('');
                    setStudentName('');
                  } else {
                    message.error(result.msg);
                  }
                } catch (error) {
                  message.error('加入学校失败');
                } finally {
                  setJoinSchoolLoading(false);
                }
              }}
            >
              确定加入
            </Button>
          </div>
        </Modal>
      </div>

      {/* 学生资料信息 - MD3 Card */}
        <div 
          className="mb-3 sm:mb-4"
          style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          boxShadow: 'var(--md-sys-elevation-0)',
          overflow: 'hidden'
        }}
      >
        <div 
          className="px-4 py-3 font-medium text-base"
          style={{ 
            backgroundColor: 'var(--md-sys-color-surface-container)',
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            color: 'var(--md-sys-color-on-surface)'
          }}
        >
          学生资料
        </div>
        {loadingStudent ? (
          <div className="text-center py-8" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>加载中...</div>
        ) : studentData ? (
          <div className="space-y-0">
            <div className="flex justify-between items-center py-3 px-4 border-b" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>姓名</span>
              <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{studentData.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 border-b" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>学历</span>
              <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {studentData.education === 'bachelor' ? '本科' :
                 studentData.education === 'master' ? '硕士' :
                 studentData.education === 'phd' ? '博士' :
                 studentData.education === 'high_school' ? '高中' :
                 studentData.education || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 border-b" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>专业</span>
              <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{studentData.major || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 border-b" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>毕业年份</span>
              <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{studentData.graduationYear || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 border-b" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>技能</span>
              <div className="flex flex-wrap gap-1 max-w-[60%] justify-end">
                {studentData.skills && studentData.skills.length > 0 ? (
                  studentData.skills.map((skill: StudentSkill, index: number) => (
                    <Tag 
                      key={index} 
                      style={{ 
                        backgroundColor: 'var(--md-sys-color-primary-container)',
                        color: 'var(--md-sys-color-on-primary-container)',
                        border: 'none'
                      }}
                    >
                      {skill.name}
                    </Tag>
                  ))
                ) : (
                  <span style={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>暂无</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-3 px-4 border-b" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>证书</span>
              <div className="flex flex-wrap gap-1 max-w-[60%] justify-end">
                {studentData.certificates && studentData.certificates.length > 0 ? (
                  studentData.certificates.map((cert: StudentCert, index: number) => (
                    <Tag 
                      key={index} 
                      style={{ 
                        backgroundColor: 'var(--md-sys-color-secondary-container)',
                        color: 'var(--md-sys-color-on-secondary-container)',
                        border: 'none'
                      }}
                    >
                      {cert.name}
                    </Tag>
                  ))
                ) : (
                  <span style={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>暂无</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-3 px-4 border-b" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>实习经历</span>
              <Button
                type="link"
                size="small"
                className="px-0"
                disabled={(studentData.internship?.length || 0) === 0}
                onClick={() => openExperienceModal('internship')}
              >
                {studentData.internship?.length || 0} 条
              </Button>
            </div>
            <div className="flex justify-between items-center py-3 px-4">
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>项目经验</span>
              <Button
                type="link"
                size="small"
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
            <ExclamationCircleOutlined className="text-3xl mb-2" style={{ color: '#8F5900' }} />
            <div className="mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>您还没有创建学生资料</div>
            <Button 
              type="primary"
              onClick={handleEditStudent}
              style={{ 
                backgroundColor: 'var(--md-sys-color-primary)',
                borderRadius: 'var(--md-sys-shape-corner-full)'
              }}
            >
              立即创建
            </Button>
          </div>
        )}
      </div>

      {/* 完成度明细 - MD3 Card */}
      <div 
        className="mb-3 sm:mb-4"
        style={{ 
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          overflow: 'hidden'
        }}
      >
        <Collapse
          ghost
          items={[
            {
              key: 'completeness',
              label: (
                <div className="flex items-center pr-2">
                  <span className="font-medium text-sm sm:text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    资料完成度明细
                  </span>
                  <span 
                    className="ml-3 text-sm font-semibold"
                    style={{ color: completenessPercent === 100 ? 'var(--md-sys-color-primary)' : '#8F5900' }}
                  >
                    {completenessPercent}%
                  </span>
                </div>
              ),
              children: (
                <div className="px-4 pb-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>当前完成进度</span>
                      <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        {completedCount}/{completenessItems.length}
                      </span>
                    </div>
                    <div 
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}
                    >
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${completenessPercent}%`,
                          backgroundColor: completenessPercent === 100 ? 'var(--md-sys-color-primary)' : '#8F5900'
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-0">
                    {completenessItems.map((item) => (
                      <div
                        key={item.key}
                        className={`flex items-center justify-between py-2.5 border-b last:border-0 px-2 -mx-2 rounded transition-colors ${
                          item.completed ? '' : 'cursor-pointer hover:bg-[var(--md-sys-color-surface-container)]'
                        }`}
                        style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
                        onClick={() => {
                          if (!item.completed) {
                            navigate(`/student?section=${item.targetSection}`);
                          }
                        }}
                      >
                        <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{item.label}</span>
                        {item.completed ? (
                          <Tag 
                            color="success" 
                            style={{ 
                              backgroundColor: '#D4EDDA',
                              color: '#1B8C3B',
                              border: 'none'
                            }}
                          >
                            已完成
                          </Tag>
                        ) : (
                          <Tag 
                            style={{ 
                              backgroundColor: '#FFF8E1',
                              color: '#8F5900',
                              border: 'none'
                            }}
                          >
                            未完成
                          </Tag>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* 功能菜单 - MD3 Card */}
      <div 
        className="mb-3 sm:mb-4"
        style={{ 
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          overflow: 'hidden'
        }}
      >
        <div className="space-y-0">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 sm:gap-4 py-3 px-4 border-b last:border-0 cursor-pointer transition-colors hover:bg-[var(--md-sys-color-surface-container)]"
              style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
              onClick={() => item.path && navigate(item.path)}
            >
              <Avatar 
                size="small" 
                icon={item.icon} 
                style={{ backgroundColor: 'var(--md-sys-color-primary)' }} 
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm sm:text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {item.title}
                </div>
                <div className="text-xs sm:text-sm truncate" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {item.desc}
                </div>
              </div>
              <ArrowRightOutlined className="text-xs sm:text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* 退出登录按钮 */}
      <Button 
        block 
        className="h-10 sm:h-11"
        danger 
        icon={<LogoutOutlined />}
        onClick={handleLogout}
        style={{ 
          borderRadius: 'var(--md-sys-shape-corner-full)',
          fontWeight: 500
        }}
      >
        退出登录
      </Button>

      {/* 完善资料提示模态框 */}
      <Modal
        open={experienceModalOpen}
        onCancel={() => setExperienceModalOpen(false)}
        footer={null}
        title={<span style={{ color: 'var(--md-sys-color-on-surface)' }}>
          {experienceType === 'internship' ? '实习经历详情（仅查看）' : '项目经验详情（仅查看）'}
        </span>}
      >
        {experienceType === 'internship' ? (
          internships.length > 0 ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {internships.map((item: StudentInternship, index: number) => (
                <div
                  key={`${item.company}-${item.position}-${index}`}
                  className="p-4 rounded-xl border"
                  style={{ 
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    borderColor: 'var(--md-sys-color-outline-variant)'
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {index + 1}. {item.company || '未填写公司'}
                    </div>
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
                  </div>
                  <div className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    岗位：{item.position || '-'}
                  </div>
                  <div className="text-sm mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    时长：{item.duration || 0} 个月
                  </div>
                  <div className="text-sm mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    描述：{item.description || '-'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>暂无实习经历</div>
          )
        ) : projects.length > 0 ? (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {projects.map((item: StudentProject, index: number) => (
              <div
                key={`${item.name}-${item.role}-${index}`}
                className="p-4 rounded-xl border"
                style={{ 
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  borderColor: 'var(--md-sys-color-outline-variant)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {index + 1}. {item.name || '未填写项目名'}
                  </div>
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
                </div>
                <div className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>角色：{item.role || '-'}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>描述：{item.description || '-'}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(item.technologies || []).length > 0 ? (
                    (item.technologies || []).map((tech: string, idx: number) => (
                      <Tag 
                        key={`${tech}-${idx}`} 
                        style={{ 
                          backgroundColor: 'var(--md-sys-color-primary-container)',
                          color: 'var(--md-sys-color-on-primary-container)',
                          border: 'none'
                        }}
                      >
                        {tech}
                      </Tag>
                    ))
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>暂无技术栈</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>暂无项目经验</div>
        )}
      </Modal>

      <Modal
        open={showCompleteModal}
        onCancel={() => setShowCompleteModal(false)}
        footer={null}
        centered
        closable={false}
        className="md-modal"
      >
        <div className="text-center p-4 sm:p-6" style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}>
          <div className="text-4xl mb-4">🔔</div>
          <div className="text-lg font-medium mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            完善学生资料，提升求职竞争力！
          </div>
          <div className="mb-6" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
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
              style={{ 
                backgroundColor: 'var(--md-sys-color-primary)',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                height: '44px'
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
              style={{ 
                borderRadius: 'var(--md-sys-shape-corner-full)',
                height: '44px'
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
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
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
        title={<span style={{ color: 'var(--md-sys-color-on-surface)' }}>头像预览</span>}
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
            className={`max-w-full max-h-[70vh] object-contain rounded-xl ${avatarPreviewDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
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
        <div className="text-center text-xs mt-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          鼠标滚轮缩放，按住左键可拖拽移动（50% - 400%）
        </div>
      </Modal>

    </div>
  );
}