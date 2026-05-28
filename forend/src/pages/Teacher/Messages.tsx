import MessageCenter from '../../components/MessageCenter';
import PageHeader from '../../components/PageHeader';

export default function TeacherMessagesPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="消息中心" description="查看系统通知和对话消息" icon={<span className="material-symbols-rounded">mail</span>} />
      <MessageCenter role="teacher" />
    </div>
  );
}