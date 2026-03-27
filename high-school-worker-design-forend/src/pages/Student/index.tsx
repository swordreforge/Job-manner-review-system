import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, message, Rate, Space, Row, Col, Divider, Spin } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { studentApi } from '../../api';
import type { Student, Internship, Project } from '../../types';

const { TextArea } = Input;
const { Option } = Select;

export default function StudentPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [studentData, setStudentData] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const response = await studentApi.getMe();
      if (response.code === 0 && response.data) {
        const data = response.data;
        setStudentData(data);
        
        // 转换数据格式以适应表单
        form.setFieldsValue({
          name: data.name,
          education: data.education,
          major: data.major,
          graduationYear: data.graduationYear,
          softSkills: data.softSkills || {},
          skills: (data.skills || []).map((skill: string, index: number) => ({
            key: index,
            name: skill,
            level: 3,
            years: 1,
          })),
          certificates: (data.certificates || []).map((cert: string, index: number) => ({
            key: index,
            name: cert,
            level: 3,
            year: new Date().getFullYear(),
          })),
          internship: data.internship || [],
          projects: data.projects || [],
        });
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // 没有学生资料，不显示错误，让用户创建
      } else {
        message.error('获取学生资料失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const submitData: Partial<Student> = {
        name: values.name,
        education: values.education,
        major: values.major,
        graduationYear: values.graduationYear,
        softSkills: values.softSkills,
        skills: values.skills?.map((s: any) => s.name) || [],
        certificates: values.certificates?.map((c: any) => c.name) || [],
        internship: values.internship || [],
        projects: values.projects || [],
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
    } catch (error: any) {
      message.error(error.response?.data?.msg || '操作失败');
    } finally {
      setSubmitting(false);
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
          >
            {/* 基础信息 */}
            <Divider orientation="left">基础信息</Divider>
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
                  <Select placeholder="请选择学历">
                    <Option value="high_school">高中</Option>
                    <Option value="bachelor">本科</Option>
                    <Option value="master">硕士</Option>
                    <Option value="phd">博士</Option>
                  </Select>
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
                  <Select placeholder="请选择毕业年份">
                    {Array.from({ length: 10 }, (_, i) => 2023 + i).map(year => (
                      <Option key={year} value={year}>{year}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* 技能信息 */}
            <Divider orientation="left">技能信息</Divider>
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

            {/* 证书信息 */}
            <Divider orientation="left">证书信息</Divider>
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
                        <Select placeholder="等级">
                          <Option value="初级">初级</Option>
                          <Option value="中级">中级</Option>
                          <Option value="高级">高级</Option>
                        </Select>
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

            {/* 软技能 */}
            <Divider orientation="left">软技能评估</Divider>
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

            {/* 实习经历 */}
            <Divider orientation="left">实习经历</Divider>
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
                            label="时长"
                            rules={[{ required: true, message: '请输入时长' }]}
                          >
                            <Input placeholder="例如：3个月" />
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

            {/* 项目经验 */}
            <Divider orientation="left">项目经验</Divider>
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