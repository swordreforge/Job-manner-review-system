import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, Progress } from 'antd';
import { WarningOutlined, CheckCircleOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import { teacherApi, type TeacherStudent, type TeacherAlert } from '../../api';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  pendingAlerts: number;
  avgCompletionRate: number;
}

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    pendingAlerts: 0,
    avgCompletionRate: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<TeacherAlert[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, alertsRes] = await Promise.all([
        teacherApi.listStudents({ page: 1, pageSize: 100 }),
        teacherApi.listAlerts({ page: 1, pageSize: 5, status: 'pending' }),
      ]);

      // 支持两种响应格式
      const getData = (res: any) => res.data ?? res;
      const studentList = getData(studentsRes).list || [];
      const alertList = getData(alertsRes).list || [];

      const totalRate = studentList.reduce((sum: number, s: TeacherStudent) => sum + (s.taskCompletionRate || 0), 0);
      const avgRate = studentList.length > 0 ? totalRate / studentList.length : 0;

      setStats({
        totalStudents: getData(studentsRes).total || 0,
        activeStudents: studentList.filter((s: TeacherStudent) => s.lastActivityAt && Date.now() - s.lastActivityAt * 1000 < 7 * 24 * 60 * 60 * 1000).length,
        pendingAlerts: getData(alertsRes).total || 0,
        avgCompletionRate: Math.round(avgRate),
      });

      setStudents(studentList.slice(0, 5));
      setRecentAlerts(alertList);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      critical: 'red',
      high: 'orange',
      medium: 'gold',
      low: 'green',
    };
    return colors[level] || 'default';
  };

  const studentColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '班级', dataIndex: 'className', key: 'className' },
    { title: '完成度', dataIndex: 'taskCompletionRate', key: 'taskCompletionRate', 
      render: (rate: number) => (
        <Progress percent={Math.round(rate)} size="small" status={rate < 60 ? 'exception' : 'success'} />
      )
    },
  ];

  const alertColumns = [
    { title: '学生', dataIndex: 'studentName', key: 'studentName' },
    { title: '类型', dataIndex: 'alertType', key: 'alertType', 
      render: (type: string) => <Tag color="orange">{type}</Tag>
    },
    { title: '级别', dataIndex: 'alertLevel', key: 'alertLevel',
      render: (level: string) => <Tag color={getAlertLevelColor(level)}>{level}</Tag>
    },
    { title: '完成度', dataIndex: 'completionRate', key: 'completionRate',
      render: (rate: number) => `${Math.round(rate)}%`
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">教师工作台</h1>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="学生总数" 
              value={stats.totalStudents} 
              prefix={<TeamOutlined />} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="活跃学生" 
              value={stats.activeStudents} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="待处理预警" 
              value={stats.pendingAlerts} 
              prefix={<WarningOutlined />} 
              valueStyle={{ color: stats.pendingAlerts > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="平均完成度" 
              value={stats.avgCompletionRate} 
              suffix="%" 
              prefix={<FileTextOutlined />} 
              valueStyle={{ color: stats.avgCompletionRate < 60 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近学生" className="mb-4">
            <Table 
              dataSource={students} 
              columns={studentColumns} 
              rowKey="id" 
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近预警" className="mb-4">
            <Table 
              dataSource={recentAlerts} 
              columns={alertColumns} 
              rowKey="id" 
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}