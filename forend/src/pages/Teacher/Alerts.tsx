import { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Card, Select, message } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, UndoOutlined } from '@ant-design/icons';
import { teacherApi, type TeacherAlert } from '../../api';
import PageHeader from '../../components/PageHeader';

const { Option } = Select;

export default function TeacherAlerts() {
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<TeacherAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ alertType: '', alertLevel: '', status: '' });

  useEffect(() => {
    fetchAlerts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filters]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await teacherApi.listAlerts({ page, pageSize, ...filters });
      const getData = (r: Record<string, unknown>) => r.data ?? r;
      const unwrapped = getData(res) as Record<string, unknown>;
      setAlerts((unwrapped.list || []) as TeacherAlert[]);
      setTotal((unwrapped.total || 0) as number);
    } catch {
      message.error('获取预警列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await teacherApi.resolveAlert(id);
      message.success('已标记为已解决');
      fetchAlerts();
    } catch {
      message.error('操作失败');
    }
  };

  const handleIgnore = async (id: number) => {
    try {
      await teacherApi.ignoreAlert(id);
      message.success('已忽略');
      fetchAlerts();
    } catch {
      message.error('操作失败');
    }
  };

  const handleUnresolve = async (id: number) => {
    try {
      await teacherApi.unresolveAlert(id);
      message.success('已撤销，现在为待处理状态');
      fetchAlerts();
    } catch {
      message.error('操作失败');
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = { critical: 'red', high: 'orange', medium: 'gold', low: 'green' };
    return colors[level] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { pending: 'orange', resolved: 'green', ignored: 'default' };
    return colors[status] || 'default';
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '学生', dataIndex: 'studentName', key: 'studentName' },
    { title: '班级', dataIndex: 'className', key: 'className' },
    { 
      title: '预警类型', 
      dataIndex: 'alertType', 
      key: 'alertType',
      render: (t: string) => <Tag color="orange">{t}</Tag>
    },
    { 
      title: '级别', 
      dataIndex: 'alertLevel', 
      key: 'alertLevel',
      render: (l: string) => <Tag color={getLevelColor(l)}>{l}</Tag>
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { 
      title: '完成度', 
      dataIndex: 'completionRate', 
      key: 'completionRate',
      render: (_: number, record: TeacherAlert) => `${Math.round(record.completionRate)}% (${record.completedTasks || 0}/${record.totalTasks || 8})`
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (s: string) => <Tag color={getStatusColor(s)}>{s === 'pending' ? '待处理' : s === 'resolved' ? '已解决' : '已忽略'}</Tag>
    },
    { 
      title: '时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (ts: number) => new Date(ts * 1000).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: TeacherAlert) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleResolve(record.id)}>
                解决
              </Button>
              <Button type="link" size="small" icon={<CloseCircleOutlined />} onClick={() => handleIgnore(record.id)}>
                忽略
              </Button>
            </>
          )}
          {(record.status === 'resolved' || record.status === 'ignored') && (
            <Button type="link" size="small" icon={<UndoOutlined />} onClick={() => handleUnresolve(record.id)}>
              撤销
            </Button>
          )}
        </Space>
      )
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="预警中心" icon={<span className="material-symbols-rounded">notification_important</span>}>
        <Button 
          type="primary" 
          icon={<SearchOutlined />}
          loading={loading}
          onClick={async () => {
            try {
const studentsRes = await teacherApi.listStudents({ page: 1, pageSize: 100 });
              const studentsData = (studentsRes as Record<string, unknown>).data ?? studentsRes;
              const list = (studentsData as { list?: { id: number }[] }).list || [];
              for (const student of list) {
                try {
                  await teacherApi.checkAlert(student.id);
                } catch {
                  // intentionally empty
                }
             }
             message.success('预警检查完成');
             fetchAlerts();
           } catch {
             message.error('检查失败');
           }
         }}
        >
          检查所有学生
        </Button>
      </PageHeader>

      <Card className="mb-4">
        <Space wrap>
          <Select 
            placeholder="预警类型" 
            style={{ width: 140 }}
            value={filters.alertType || undefined}
            onChange={v => setFilters({ ...filters, alertType: v || '' })}
          >
            <Option value="low_completion">低完成度</Option>
            <Option value="no_activity">无活动</Option>
            <Option value="deadline_warning">截止提醒</Option>
          </Select>
          <Select 
            placeholder="预警级别" 
            style={{ width: 120 }}
            value={filters.alertLevel || undefined}
            onChange={v => setFilters({ ...filters, alertLevel: v || '' })}
          >
            <Option value="critical">严重</Option>
            <Option value="high">高</Option>
            <Option value="medium">中</Option>
            <Option value="low">低</Option>
          </Select>
          <Select 
            placeholder="状态" 
            style={{ width: 100 }}
            value={filters.status || undefined}
            onChange={v => setFilters({ ...filters, status: v || '' })}
          >
            <Option value="pending">待处理</Option>
            <Option value="resolved">已解决</Option>
            <Option value="ignored">已忽略</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={() => { setPage(1); fetchAlerts(); }}>
            搜索
          </Button>
          <Button onClick={() => { setFilters({ alertType: '', alertLevel: '', status: '' }); setPage(1); }}>
            重置
          </Button>
        </Space>
      </Card>

      <Table 
        dataSource={alerts}
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
    </div>
  );
}