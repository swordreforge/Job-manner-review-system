import { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Progress, Input, Select, Card, Drawer, message, Spin, Descriptions } from 'antd';
import { SearchOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { teacherApi, type TeacherStudent, type TeacherTaskProgress } from '../../api';

const { Option } = Select;

export default function TeacherStudents() {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ className: '', grade: '', status: '' });
  
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudent | null>(null);
  const [studentTasks, setStudentTasks] = useState<TeacherTaskProgress[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [page, pageSize, filters]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await teacherApi.listStudents({ page, pageSize, ...filters });
      // 支持两种响应格式: {total, list} 或 {code, msg, data: {total, list}}
      const data = (res as any).data ?? res;
      setStudents(data.list || []);
      setTotal(data.total || 0);
    } catch (error) {
      message.error('获取学生列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (student: TeacherStudent) => {
    setSelectedStudent(student);
    setDetailVisible(true);
    setTasksLoading(true);
    try {
      const res = await teacherApi.getStudentTasks(student.id);
      setStudentTasks(res.data?.tasks || []);
    } catch (error) {
      message.error('获取学生任务失败');
    } finally {
      setTasksLoading(false);
    }
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'normal';
    return 'exception';
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '班级', dataIndex: 'className', key: 'className' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    { 
      title: '任务完成度', 
      dataIndex: 'taskCompletionRate', 
      key: 'taskCompletionRate',
      render: (rate: number) => (
        <Progress percent={Math.round(rate)} size="small" status={getStatusColor(rate)} />
      )
    },
    { 
      title: '最后活跃', 
      dataIndex: 'lastActivityAt', 
      key: 'lastActivityAt',
      render: (ts: number) => ts ? new Date(ts * 1000).toLocaleDateString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TeacherStudent) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          查看详情
        </Button>
      )
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">学生管理</h1>

      <Card className="mb-4">
        <Space wrap>
          <Input 
            placeholder="班级" 
            style={{ width: 120 }}
            value={filters.className}
            onChange={e => setFilters({ ...filters, className: e.target.value })}
          />
          <Select 
            placeholder="年级" 
            style={{ width: 120 }}
            value={filters.grade || undefined}
            onChange={v => setFilters({ ...filters, grade: v || '' })}
          >
            <Option value="2021">2021级</Option>
            <Option value="2022">2022级</Option>
            <Option value="2023">2023级</Option>
            <Option value="2024">2024级</Option>
            <Option value="2025">2025级</Option>
          </Select>
          <Select 
            placeholder="状态" 
            style={{ width: 120 }}
            value={filters.status || undefined}
            onChange={v => setFilters({ ...filters, status: v || '' })}
          >
            <Option value="active">在读</Option>
            <Option value="graduated">毕业</Option>
            <Option value="transferred">转出</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={() => { setPage(1); fetchStudents(); }}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setFilters({ className: '', grade: '', status: '' }); setPage(1); }}>
            重置
          </Button>
        </Space>
      </Card>

      <Table 
        dataSource={students}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />

      <Drawer
        title="学生详情"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedStudent && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="姓名">{selectedStudent.name}</Descriptions.Item>
            <Descriptions.Item label="用户名">{selectedStudent.username}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{selectedStudent.email}</Descriptions.Item>
            <Descriptions.Item label="班级">{selectedStudent.className || '-'}</Descriptions.Item>
            <Descriptions.Item label="年级">{selectedStudent.grade || '-'}</Descriptions.Item>
            <Descriptions.Item label="任务完成度">
              <Progress percent={Math.round(selectedStudent.taskCompletionRate)} status={getStatusColor(selectedStudent.taskCompletionRate)} />
            </Descriptions.Item>
            <Descriptions.Item label="最后活跃时间">
              {selectedStudent.lastActivityAt ? new Date(selectedStudent.lastActivityAt * 1000).toLocaleString() : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
        
        <h3 className="text-lg font-semibold mt-6 mb-4">任务进度</h3>
        {tasksLoading ? <Spin /> : (
          <Table 
            dataSource={studentTasks}
            columns={[
              { title: '任务', dataIndex: 'taskName', key: 'taskName' },
              { 
                title: '状态', 
                dataIndex: 'status', 
                key: 'status',
                render: (s: string) => {
                  const colors: Record<string, string> = { completed: 'green', in_progress: 'blue', not_started: 'default', skipped: 'orange' };
                  return <Tag color={colors[s] || 'default'}>{s}</Tag>;
                }
              },
              { 
                title: '完成度', 
                dataIndex: 'completionRate', 
                key: 'completionRate',
                render: (r: number) => `${Math.round(r)}%`
              },
              { 
                title: '得分', 
                dataIndex: 'score', 
                key: 'score',
                render: (s: number) => s || '-'
              },
            ]}
            rowKey="taskSeriesId"
            pagination={false}
            size="small"
          />
        )}
      </Drawer>
    </div>
  );
}