import { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, Form, InputNumber, Select, message } from 'antd';
import { PlusOutlined, CopyOutlined } from '@ant-design/icons';
import { teacherApi, type TeacherInviteCode } from '../../api';

const { Option } = Select;

export default function TeacherInviteCodes() {
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState<TeacherInviteCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCodes();
  }, [page, pageSize]);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await teacherApi.listInviteCodes({ page, pageSize });
      setCodes(res.data?.list || []);
      setTotal(res.data?.total || 0);
    } catch (error) {
      message.error('获取邀请码列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreateLoading(true);
      await teacherApi.createInviteCode(values);
      message.success('邀请码生成成功');
      setCreateModalVisible(false);
      form.resetFields();
      fetchCodes();
    } catch (error: any) {
      message.error(error?.response?.data?.msg || '生成失败');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    try {
      await teacherApi.revokeInviteCode(id);
      message.success('撤销成功');
      fetchCodes();
    } catch (error) {
      message.error('撤销失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await teacherApi.deleteInviteCode(id);
      message.success('删除成功');
      fetchCodes();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success('已复制到剪贴板');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { active: 'green', expired: 'red', revoked: 'orange' };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = { active: '有效', expired: '已过期', revoked: '已撤销' };
    return texts[status] || status;
  };

  const columns = [
    { title: '邀请码', dataIndex: 'code', key: 'code' },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (t: string) => t === 'student' ? '学生' : '教师'
    },
    { title: '最大使用', dataIndex: 'maxUses', key: 'maxUses' },
    { title: '已使用', dataIndex: 'usedCount', key: 'usedCount' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (s: string) => <Tag color={getStatusColor(s)}>{getStatusText(s)}</Tag>
    },
    { 
      title: '过期时间', 
      dataIndex: 'expiresAt', 
      key: 'expiresAt',
      render: (ts: number) => ts ? new Date(ts * 1000).toLocaleDateString() : '永不过期'
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (ts: number) => new Date(ts * 1000).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TeacherInviteCode) => (
        <Space>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record.code)}>
            复制
          </Button>
          {record.status === 'active' && (
            <Button type="link" size="small" onClick={() => handleRevoke(record.id)}>
              撤销
            </Button>
          )}
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      )
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">邀请码管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
          生成邀请码
        </Button>
      </div>

      <Table 
        dataSource={codes}
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

      <Modal
        title="生成邀请码"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => { setCreateModalVisible(false); form.resetFields(); }}
        confirmLoading={createLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="类型" initialValue="student">
            <Select>
              <Option value="student">学生邀请码</Option>
              <Option value="teacher">教师邀请码</Option>
            </Select>
          </Form.Item>
          <Form.Item name="maxUses" label="最大使用次数" initialValue={100} rules={[{ required: true }]}>
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expiresIn" label="有效期(天)" initialValue={30}>
            <InputNumber min={1} max={365} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}