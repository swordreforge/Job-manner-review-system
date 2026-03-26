import { useState } from 'react';
import { Card, Button, Segmented, Input, Avatar, Tag } from 'antd';
import { SendOutlined, RobotOutlined } from '@ant-design/icons';

const mockMessages: { role: 'ai' | 'user'; content: string; score: number | null }[] = [
  { role: 'ai', content: '你好！我是面试模拟助手。请选择面试模式开始练习。', score: null },
];

export default function InterviewPage() {
  const [mode, setMode] = useState<'bigtech' | 'gov'>('bigtech');
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState('');
  const [started, setStarted] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input, score: null }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: '这是一个示例回答。根据你的情况，我建议从项目经验入手展开。', 
        score: 75 
      }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {!started ? (
        <Card title="选择面试模式">
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as 'bigtech' | 'gov')}
            options={[
              { label: '大厂技术面', value: 'bigtech' },
              { label: '国企综合面', value: 'gov' },
            ]}
            className="w-full mb-4"
          />
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="font-medium mb-2">大厂技术面</div>
              <div className="text-gray-500 text-sm">算法题、项目深挖、系统设计</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="font-medium mb-2">国企综合面</div>
              <div className="text-gray-500 text-sm">行测、申论、综合素养</div>
            </div>
          </div>
          <Button type="primary" block className="mt-4" onClick={() => setStarted(true)}>
            开始模拟面试
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col h-[calc(100vh-180px)]">
          <div className="flex-1 overflow-auto mb-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role === 'ai' && <Avatar size="small" icon={<RobotOutlined />} />}
                    <span className="text-sm">{msg.role === 'ai' ? '面试官' : '你'}</span>
                  </div>
                  <div>{msg.content}</div>
                  {msg.score !== null && (
                    <Tag color="green" className="mt-2">评分: {msg.score}</Tag>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Input.Search
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onSearch={handleSend}
            placeholder="输入你的回答..."
            enterButton={<SendOutlined />}
            className="fixed bottom-16 left-4 right-4"
          />
        </div>
      )}
    </div>
  );
}