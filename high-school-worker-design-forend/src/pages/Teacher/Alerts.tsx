import { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Card, Select, message } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { teacherApi, type TeacherAlert } from '../../api';

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
  }, [page, pageSize, filters]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await teacherApi.listAlerts({ page, pageSize, ...filters });
      setAlerts(res.data?.list || []);
      setTotal(res.data?.total || 0);
    } catch (error) {
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
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleIgnore = async (id: number) => {
    try {
      await teacherApi.ignoreAlert(id);
      message.success('已忽略');
      fetchAlerts();
    } catch (error) {
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
      render: (_: any, record: TeacherAlert) => (
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
        </Space>
      )
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">预警管理</h1>
        <Button 
          type="primary" 
          icon={<SearchOutlined />}
          loading={loading}
          onClick={async () => {
            try {
              const studentsRes = await teacherApi.listStudents({ page: 1, pageSize: 100 });
              const list = (studentsRes as any).data?.list || (studentsRes as any).list || [];
              for (const student of list) {
                try {
                  await teacherApi.checkAlert(student.id);
                } catch (e) {}
              }
              message.success('预警检查完成');
              fetchAlerts();
            } catch (error) {
              message.error('检查失败');
            }
          }}
        >
          检查所有学生
        </Button>
      </div>

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