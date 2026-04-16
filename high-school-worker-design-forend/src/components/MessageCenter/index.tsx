import { useCallback, useEffect, useState } from 'react';
import { Avatar, Button, Card, Drawer, Empty, Form, Input, List, Modal, Select, Space, Tag, message } from 'antd';
import { MessageOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { teacherApi, studentMessageApi } from '../../api';
import type { InboxMessage } from '../../types';

const { TextArea } = Input;

type MessageCenterRole = 'teacher' | 'student';

type StudentOption = {
  id: number;
  name?: string;
  username?: string;
};

function unwrap<T>(response: any): T {
  return response?.data ?? response;
}

function formatTime(ts?: number) {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleString();
}

export default function MessageCenter({ role }: { role: MessageCenterRole }) {
  const isTeacher = role === 'teacher';
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([]);
  const [selectedInbox, setSelectedInbox] = useState<InboxMessage | null>(null);
  const [inboxDrawerOpen, setInboxDrawerOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeForm] = Form.useForm();
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [studentOptionsLoading, setStudentOptionsLoading] = useState(false);

  const loadInbox = useCallback(async () => {
    setInboxLoading(true);
    try {
      const response = isTeacher
        ? await teacherApi.listMessages({ page: 1, pageSize: 100 })
        : await studentMessageApi.listMessages({ page: 1, pageSize: 100 });
      const data = unwrap<{ total: number; list: InboxMessage[] }>(response);
      setInboxMessages(data.list || []);
    } catch (error) {
      message.error('加载站内信失败');
    } finally {
      setInboxLoading(false);
    }
  }, [isTeacher]);

  const loadStudentOptions = useCallback(async () => {
    if (!isTeacher) return;
    setStudentOptionsLoading(true);
    try {
      const response = await teacherApi.listStudents({ page: 1, pageSize: 200 });
      const data = unwrap<{ total: number; list: StudentOption[] }>(response);
      setStudentOptions((data.list || []).map((item) => ({ id: item.id, name: item.name, username: item.username })));
    } catch (error) {
      message.error('加载学生列表失败');
    } finally {
      setStudentOptionsLoading(false);
    }
  }, [isTeacher]);

  useEffect(() => {
    void loadInbox();
    void loadStudentOptions();
  }, [loadInbox, loadStudentOptions]);

  const handleInboxOpen = async (item: InboxMessage) => {
    setSelectedInbox(item);
    setInboxDrawerOpen(true);
    if (!item.isRead && !isTeacher) {
      try {
        await studentMessageApi.markAsRead(item.id);
        await loadInbox();
      } catch (error) {
        message.error('标记已读失败');
      }
    }
  };

  const handleCompose = async () => {
    try {
      const values = await composeForm.validateFields();
      await teacherApi.sendMessage({
        receiverId: values.receiverId,
        title: values.title,
        content: values.content,
      });
      message.success('站内信已发送');
      setComposeOpen(false);
      composeForm.resetFields();
      await loadInbox();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title={isTeacher ? '教师消息中心' : '学生消息中心'}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void loadInbox()}>
              刷新
            </Button>
            {isTeacher && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setComposeOpen(true)}>
                发送站内信
              </Button>
            )}
          </Space>
        }
      >
        <div className="space-y-4">
          <Card>
            <List
              loading={inboxLoading}
              dataSource={inboxMessages}
              locale={{ emptyText: <Empty description="暂无站内信" /> }}
              renderItem={(item) => (
                <List.Item className="cursor-pointer" onClick={() => void handleInboxOpen(item)}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<MessageOutlined />} />}
                    title={<div className="flex items-center gap-2"><span>{item.title || '未命名消息'}</span>{!item.isRead && <Tag color="orange">未读</Tag>}</div>}
                    description={<div className="space-y-1"><div className="line-clamp-2">{item.content}</div><div className="text-xs text-slate-500">{isTeacher ? `收件人：${item.receiverName}` : `发件人：${item.senderName}`} · {formatTime(item.createdAt)}</div></div>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
      </Card>

      <Drawer
        open={inboxDrawerOpen}
        onClose={() => setInboxDrawerOpen(false)}
        width={520}
        title={selectedInbox?.title || '站内信详情'}
      >
        {selectedInbox ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-[var(--md-sys-color-surface-container-low)] p-4">
              <div className="mb-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                {isTeacher ? `收件人：${selectedInbox.receiverName}` : `发件人：${selectedInbox.senderName}`}
              </div>
              <div className="whitespace-pre-wrap text-sm leading-6">{selectedInbox.content}</div>
            </div>
            <div className="text-xs text-slate-500">发送时间：{formatTime(selectedInbox.createdAt)}</div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={composeOpen}
        onCancel={() => setComposeOpen(false)}
        onOk={() => void handleCompose()}
        okText="发送"
        title="发送站内信"
        destroyOnClose
      >
        <Form form={composeForm} layout="vertical">
          <Form.Item name="receiverId" label="接收学生" rules={[{ required: true, message: '请选择接收学生' }]}>
            <Select
              showSearch
              loading={studentOptionsLoading}
              placeholder="选择接收学生"
              optionFilterProp="label"
              options={studentOptions.map((item) => ({
                value: item.id,
                label: item.name ? `${item.name} (${item.username || item.id})` : `${item.username || item.id}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={5} placeholder="请输入内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
