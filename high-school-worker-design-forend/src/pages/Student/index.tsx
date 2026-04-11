import { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Select, Button, message, Rate, Space, Row, Col, Spin, Collapse } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { studentApi } from '../../api';
import type { Student } from '../../types';

const { TextArea } = Input;

type SkillLike = string | { name?: string; level?: number; years?: number };
type CertificateLike = string | { name?: string; level?: string; year?: number };
type StudentFormValues = {
  name: string;
  education: string;
  major: string;
  graduationYear: number;
  softSkills?: Record<string, unknown>;
  skills?: Array<{ name: string; level?: number; years?: number | string }>;
  certificates?: Array<{ name: string; level?: string; year?: number | string }>;
  internship?: Array<{ company: string; position: string; duration: number | string; description?: string }>;
  projects?: Student['projects'];
};

type InternshipFormItem = { company?: string; position?: string; duration?: number | string; description?: string };
type ProjectFormItem = { name?: string; role?: string; description?: string; technologies?: string[] };
type SkillFormItem = { name?: string; level?: number | string; years?: number | string };
type CertificateFormItem = { name?: string; level?: string; year?: number | string };

const normalizeText = (value?: string) => (value || '').trim().toLowerCase();

const internshipDedupKey = (item: InternshipFormItem) => {
  const duration = parseInt(String(item.duration ?? 0), 10) || 0;
  return [
    normalizeText(item.company),
    normalizeText(item.position),
    String(duration),
    normalizeText(item.description),
  ].join('|');
};

const projectDedupKey = (item: ProjectFormItem) => {
  const technologies = (item.technologies || [])
      .map((tech) => normalizeText(tech))
      .filter((tech) => tech.length > 0)
      .sort()
      .join(',');

  return [
    normalizeText(item.name),
    normalizeText(item.role),
    normalizeText(item.description),
    technologies,
  ].join('|');
};

const skillDedupKey = (item: SkillFormItem) => {
  return normalizeText(item.name);
};

const certificateDedupKey = (item: CertificateFormItem) => {
  return normalizeText(item.name);
};

const findDuplicateIndex = <T,>(items: T[], keyGetter: (item: T) => string): number => {
  const seen = new Map<string, number>();
  for (let i = 0; i < items.length; i++) {
    const key = keyGetter(items[i]);
    if (!key || /^\|*0?\|*$/.test(key)) continue;
    if (seen.has(key)) return i;
    seen.set(key, i);
  }
  return -1;
};

const normalizeSkillItems = (items: unknown): SkillFormItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === 'string') {
      return { name: item, level: 3, years: 1 };
    }
    const value = item as SkillFormItem;
    return {
      name: value.name,
      level: value.level,
      years: value.years,
    };
  });
};

const normalizeCertificateItems = (items: unknown): CertificateFormItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === 'string') {
      return { name: item, level: '初级', year: new Date().getFullYear() };
    }
    const value = item as CertificateFormItem;
    return {
      name: value.name,
      level: value.level,
      year: value.year,
    };
  });
};

export default function StudentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [expandedPanels, setExpandedPanels] = useState<string[]>(['basic']);

  const getSectionClass = (section: string) =>
      activeSection === section ? 'rounded-lg ring-2 ring-orange-400/70 p-2 transition-all' : '';

  const scrollToSection = (section: string) => {
    const sectionIdMap: Record<string, string> = {
      basic: 'student-section-basic',
      skills: 'student-section-skills',
      certificates: 'student-section-certificates',
      internship: 'student-section-internship',
    };
    const sectionId = sectionIdMap[section];
    if (!sectionId) return;

    const target = document.getElementById(sectionId);
    if (!target) return;

    setActiveSection(section);

    // Keep target in the upper-middle area instead of sticking to the page top.
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    const viewportOffset = Math.round(window.innerHeight * 0.22);
    const scrollTop = Math.max(0, targetTop - viewportOffset);
    window.scrollTo({ top: scrollTop, behavior: 'smooth' });

    setTimeout(() => setActiveSection(''), 1800);
  };

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await studentApi.getMe();
      if (response.code === 0 && response.data) {
        const data = response.data;
        setStudentData(data);

        const rawSkills = (data.skills as SkillLike[] | undefined) ?? [];
        const skillsData = rawSkills.map((skill, index) => {
          if (typeof skill === 'string') {
            return { key: index, name: skill, level: 3, years: 1 };
          }
          return {
            key: index,
            name: skill.name || '',
            level: skill.level || 3,
            years: skill.years || 1,
          };
        });

        const rawCertificates = (data.certificates as CertificateLike[] | undefined) ?? [];
        const certificatesData = rawCertificates.map((cert, index) => {
          if (typeof cert === 'string') {
            return { key: index, name: cert, level: '初级', year: new Date().getFullYear() };
          }
          return {
            key: index,
            name: cert.name || '',
            level: cert.level || '初级',
            year: cert.year || new Date().getFullYear(),
          };
        });

        form.setFieldsValue({
          name: data.name,
          education: data.education,
          major: data.major,
          graduationYear: data.graduationYear,
          softSkills: data.softSkills || {},
          skills: skillsData,
          certificates: certificatesData,
          internship: data.internship || [],
          projects: data.projects || [],
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status !== 404) {
        message.error('获取学生资料失败');
      }
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void fetchStudentData();
  }, [fetchStudentData]);

  useEffect(() => {
    if (loading) return;
    const section = searchParams.get('section');
    if (!section) return;

    const sectionPanelMap: Record<string, string> = {
      basic: 'basic',
      skills: 'skills',
      certificates: 'certificates',
      internship: 'internship',
    };
    const panelKey = sectionPanelMap[section];
    if (panelKey) {
      setExpandedPanels((prev) => (prev.includes(panelKey) ? prev : [...prev, panelKey]));
    }

    const timer = window.setTimeout(() => scrollToSection(section), 120);
    return () => window.clearTimeout(timer);
  }, [loading, searchParams]);

  const handleSubmit = async (values: StudentFormValues) => {
    setSubmitting(true);
    try {
      const allValues = form.getFieldsValue(true) as Partial<StudentFormValues>;

      // If a collapsed panel was never mounted, fallback to existing data to avoid accidental clearing.
      const skills = normalizeSkillItems(allValues.skills ?? studentData?.skills);
      const certificates = normalizeCertificateItems(allValues.certificates ?? studentData?.certificates);
      const internships = ((allValues.internship ?? studentData?.internship ?? []) as InternshipFormItem[]);
      const projects = ((allValues.projects ?? studentData?.projects ?? []) as ProjectFormItem[]);

      const duplicateSkillIndex = findDuplicateIndex(skills, skillDedupKey);
      if (duplicateSkillIndex >= 0) {
        message.warning(`第 ${duplicateSkillIndex + 1} 条技能与前面重复，未保存`);
        return;
      }

      const duplicateCertificateIndex = findDuplicateIndex(certificates, certificateDedupKey);
      if (duplicateCertificateIndex >= 0) {
        message.warning(`第 ${duplicateCertificateIndex + 1} 条证书与前面重复，未保存`);
        return;
      }

      const invalidInternshipIndex = internships.findIndex((item) => {
        const duration = parseInt(String(item.duration ?? 0), 10) || 0;
        const hasBasicInfo = normalizeText(item.company) !== '' || normalizeText(item.position) !== '';
        return hasBasicInfo && duration <= 0;
      });
      if (invalidInternshipIndex >= 0) {
        message.warning(`第 ${invalidInternshipIndex + 1} 条实习经历时长必须为正数`);
        return;
      }

      const duplicateInternshipIndex = findDuplicateIndex(internships, internshipDedupKey);
      if (duplicateInternshipIndex >= 0) {
        message.warning(`第 ${duplicateInternshipIndex + 1} 条实习经历与前面重复，未保存`);
        return;
      }

      const duplicateProjectIndex = findDuplicateIndex(projects, projectDedupKey);
      if (duplicateProjectIndex >= 0) {
        message.warning(`第 ${duplicateProjectIndex + 1} 条项目经验与前面重复，未保存`);
        return;
      }

      const preparedSkills: NonNullable<Student['skills']> = skills
          .map((s) => ({
            name: (s.name || '').trim(),
            level: Number(s.level) || 3,
            years: parseInt(String(s.years), 10) || 1,
          }))
          .filter((s) => s.name.length > 0);

      const preparedCertificates: NonNullable<Student['certificates']> = certificates
          .map((c) => ({
            name: (c.name || '').trim(),
            level: c.level || '初级',
            year: parseInt(String(c.year), 10) || new Date().getFullYear(),
          }))
          .filter((c) => c.name.length > 0);

      // 处理实习经历的duration，转换为数字（月数）
      const processedInternship: NonNullable<Student['internship']> = internships.map((item) => ({
        company: (item.company || '').trim(),
        position: (item.position || '').trim(),
        duration: parseInt(String(item.duration), 10) || 0,
        description: (item.description || '').trim(),
      }));

      const preparedProjects: NonNullable<Student['projects']> = projects.map((project) => ({
        name: (project.name || '').trim(),
        role: (project.role || '').trim(),
        description: (project.description || '').trim(),
        technologies: Array.isArray(project.technologies)
            ? project.technologies.map((tech) => (tech || '').trim()).filter((tech) => tech.length > 0)
            : [],
      }));

      const submitData: Partial<Student> = {
        name: values.name,
        education: values.education,
        major: values.major,
        graduationYear: values.graduationYear,
        softSkills: allValues.softSkills,
        skills: preparedSkills,
        certificates: preparedCertificates,
        internship: processedInternship,
        projects: preparedProjects,
      };

      let response;
      if (studentData) {
        // 更新现有资料
        response = await studentApi.update({ ...submitData, id: studentData.id } as Student);
      } else {
        // 创建新资料
        response = await studentApi.create(submitData);
      }

      if (response.code === 0) {
        message.success(studentData ? '学生资料更新成功' : '学生资料创建成功');
        await fetchStudentData();
      } else {
        message.error(response.msg || '操作失败');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { msg?: string } } };
      message.error(err.response?.data?.msg || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen relative z-10 flex items-center justify-center">
          <Spin size="large" />
        </div>
    );
  }

  return (
      <div className="min-h-screen relative z-10 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/profile')}
            >
              返回个人中心
            </Button>
          </div>

          <Card title={studentData ? '编辑学生资料' : '创建学生资料'}>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
                preserve
            >
              <Collapse
                  activeKey={expandedPanels}
                  onChange={(keys) => {
                    const next = Array.isArray(keys) ? keys.map(String) : [String(keys)];
                    setExpandedPanels(next);
                  }}
                  items={[
                    {
                      key: 'basic',
                      label: '基础信息',
                      forceRender: true,
                      children: (
                          <div id="student-section-basic" className={getSectionClass('basic')}>
                            <Row gutter={16}>
                              <Col xs={24} sm={12}>
                                <Form.Item
                                    label="姓名"
                                    name="name"
                                    rules={[{ required: true, message: '请输入姓名' }]}
                                >
                                  <Input placeholder="请输入姓名" />
                                </Form.Item>
                              </Col>
                              <Col xs={24} sm={12}>
                                <Form.Item
                                    label="学历"
                                    name="education"
                                    rules={[{ required: true, message: '请选择学历' }]}
                                >
                                  <Select
                                      placeholder="请选择学历"
                                      options={[
                                        { value: 'high_school', label: '高中' },
                                        { value: 'bachelor', label: '本科' },
                                        { value: 'master', label: '硕士' },
                                        { value: 'phd', label: '博士' },
                                      ]}
                                  />
                                </Form.Item>
                              </Col>
                              <Col xs={24} sm={12}>
                                <Form.Item
                                    label="专业"
                                    name="major"
                                    rules={[{ required: true, message: '请输入专业' }]}
                                >
                                  <Input placeholder="请输入专业" />
                                </Form.Item>
                              </Col>
                              <Col xs={24} sm={12}>
                                <Form.Item
                                    label="毕业年份"
                                    name="graduationYear"
                                    rules={[{ required: true, message: '请选择毕业年份' }]}
                                >
                                  <Select
                                      placeholder="请选择毕业年份"
                                      options={Array.from({ length: 10 }, (_, i) => {
                                        const year = 2023 + i;
                                        return { value: year, label: String(year) };
                                      })}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                          </div>
                      ),
                    },
                    {
                      key: 'skills',
                      label: '技能信息',
                      forceRender: true,
                      children: (
                          <div id="student-section-skills" className={getSectionClass('skills')}>
                            <Form.List name="skills">
                              {(fields, { add, remove }) => (
                                  <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                          <Form.Item
                                              {...restField}
                                              name={[name, 'name']}
                                              rules={[{ required: true, message: '请输入技能名称' }]}
                                              style={{ flex: 2, marginBottom: 0 }}
                                          >
                                            <Input placeholder="技能名称" />
                                          </Form.Item>
                                          <Form.Item
                                              {...restField}
                                              name={[name, 'level']}
                                              label="熟练度"
                                              style={{ flex: 1, marginBottom: 0 }}
                                          >
                                            <Rate count={5} style={{ fontSize: 16 }} />
                                          </Form.Item>
                                          <Form.Item
                                              {...restField}
                                              name={[name, 'years']}
                                              label="年限"
                                              style={{ flex: 1, marginBottom: 0 }}
                                          >
                                            <Input type="number" placeholder="年限" min={0} max={10} />
                                          </Form.Item>
                                          <MinusCircleOutlined onClick={() => remove(name)} />
                                        </Space>
                                    ))}
                                    <Form.Item>
                                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        添加技能
                                      </Button>
                                    </Form.Item>
                                  </>
                              )}
                            </Form.List>
                          </div>
                      ),
                    },
                    {
                      key: 'certificates',
                      label: '证书信息',
                      forceRender: true,
                      children: (
                          <div id="student-section-certificates" className={getSectionClass('certificates')}>
                            <Form.List name="certificates">
                              {(fields, { add, remove }) => (
                                  <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                          <Form.Item
                                              {...restField}
                                              name={[name, 'name']}
                                              rules={[{ required: true, message: '请输入证书名称' }]}
                                              style={{ flex: 2, marginBottom: 0 }}
                                          >
                                            <Input placeholder="证书名称" />
                                          </Form.Item>
                                          <Form.Item
                                              {...restField}
                                              name={[name, 'level']}
                                              label="等级"
                                              style={{ flex: 1, marginBottom: 0 }}
                                          >
                                            <Select
                                                placeholder="等级"
                                                options={[
                                                  { value: '初级', label: '初级' },
                                                  { value: '中级', label: '中级' },
                                                  { value: '高级', label: '高级' },
                                                ]}
                                            />
                                          </Form.Item>
                                          <Form.Item
                                              {...restField}
                                              name={[name, 'year']}
                                              label="年份"
                                              style={{ flex: 1, marginBottom: 0 }}
                                          >
                                            <Input type="number" placeholder="年份" min={2000} max={2030} />
                                          </Form.Item>
                                          <MinusCircleOutlined onClick={() => remove(name)} />
                                        </Space>
                                    ))}
                                    <Form.Item>
                                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        添加证书
                                      </Button>
                                    </Form.Item>
                                  </>
                              )}
                            </Form.List>
                          </div>
                      ),
                    },
                    {
                      key: 'soft-skills',
                      label: '软技能评估',
                      forceRender: true,
                      children: (
                          <Row gutter={16}>
                            <Col xs={24} sm={12}>
                              <Form.Item
                                  label="创新能力"
                                  name={['softSkills', 'innovation']}
                                  initialValue={5}
                              >
                                <Rate count={10} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item
                                  label="学习能力"
                                  name={['softSkills', 'learning']}
                                  initialValue={5}
                              >
                                <Rate count={10} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item
                                  label="抗压能力"
                                  name={['softSkills', 'pressure']}
                                  initialValue={5}
                              >
                                <Rate count={10} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item
                                  label="沟通能力"
                                  name={['softSkills', 'communication']}
                                  initialValue={5}
                              >
                                <Rate count={10} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item
                                  label="团队合作"
                                  name={['softSkills', 'teamwork']}
                                  initialValue={5}
                              >
                                <Rate count={10} />
                              </Form.Item>
                            </Col>
                          </Row>
                      ),
                    },
                    {
                      key: 'internship',
                      label: '实习经历',
                      forceRender: true,
                      children: (
                          <div id="student-section-internship" className={getSectionClass('internship')}>
                            <Form.List name="internship">
                              {(fields, { add, remove }) => (
                                  <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Card key={key} size="small" style={{ marginBottom: 16 }}>
                                          <Row gutter={16}>
                                            <Col xs={24} sm={12}>
                                              <Form.Item
                                                  {...restField}
                                                  name={[name, 'company']}
                                                  label="公司"
                                                  rules={[{ required: true, message: '请输入公司名称' }]}
                                              >
                                                <Input placeholder="公司名称" />
                                              </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                              <Form.Item
                                                  {...restField}
                                                  name={[name, 'position']}
                                                  label="职位"
                                                  rules={[{ required: true, message: '请输入职位' }]}
                                              >
                                                <Input placeholder="职位" />
                                              </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                              <Form.Item
                                                  {...restField}
                                                  name={[name, 'duration']}
                                                  label="时长（月）"
                                                  rules={[{ required: true, message: '请输入时长' }]}
                                              >
                                                <Input type="number" placeholder="例如：3" min={1} />
                                              </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                              <Form.Item
                                                  {...restField}
                                                  name={[name, 'description']}
                                                  label="描述"
                                              >
                                                <TextArea rows={2} placeholder="工作描述" />
                                              </Form.Item>
                                            </Col>
                                          </Row>
                                          <Button type="text" danger onClick={() => remove(name)}>
                                            删除此实习经历
                                          </Button>
                                        </Card>
                                    ))}
                                    <Form.Item>
                                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        添加实习经历
                                      </Button>
                                    </Form.Item>
                                  </>
                              )}
                            </Form.List>
                          </div>
                      ),
                    },
                    {
                      key: 'projects',
                      label: '项目经验',
                      forceRender: true,
                      children: (
                          <div className={getSectionClass('projects')}>
                            <Form.List name="projects">
                              {(fields, { add, remove }) => (
                                  <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Card key={key} size="small" style={{ marginBottom: 16 }}>
                                          <Row gutter={16}>
                                            <Col xs={24} sm={12}>
                                              <Form.Item
                                                  {...restField}
                                                  name={[name, 'name']}
                                                  label="项目名称"
                                                  rules={[{ required: true, message: '请输入项目名称' }]}
                                              >
                                                <Input placeholder="项目名称" />
                                              </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                              <Form.Item
                                                  {...restField}
                                                  name={[name, 'role']}
                                                  label="角色"
                                                  rules={[{ required: true, message: '请输入角色' }]}
                                              >
                                                <Input placeholder="例如：前端开发" />
                                              </Form.Item>
                                            </Col>
                                            <Col xs={24}>
                                              <Form.Item
                                                  {...restField}
                                                  name={[name, 'description']}
                                                  label="项目描述"
                                                  rules={[{ required: true, message: '请输入项目描述' }]}
                                              >
                                                <TextArea rows={3} placeholder="项目描述" />
                                              </Form.Item>
                                            </Col>
                                            <Col xs={24}>
                                              <Form.Item
                                                  {...restField}
                                                  name={[name, 'technologies']}
                                                  label="技术栈"
                                              >
                                                <Select mode="tags" placeholder="技术栈（可多选）" />
                                              </Form.Item>
                                            </Col>
                                          </Row>
                                          <Button type="text" danger onClick={() => remove(name)}>
                                            删除此项目经验
                                          </Button>
                                        </Card>
                                    ))}
                                    <Form.Item>
                                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        添加项目经验
                                      </Button>
                                    </Form.Item>
                                  </>
                              )}
                            </Form.List>
                          </div>
                      ),
                    },
                  ]}
              />

              {/* 提交按钮 */}
              <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    icon={<SaveOutlined />}
                    size="large"
                    block
                >
                  {studentData ? '更新学生资料' : '创建学生资料'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
  );
}