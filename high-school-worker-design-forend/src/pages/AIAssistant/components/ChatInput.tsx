import { useState } from 'react';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled = false, placeholder = '输入你的求职问题...' }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <div className="flex gap-2 p-4 border-t border-[var(--color-border)] bg-[var(--surface-container)]">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={handleSend}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
        size="large"
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        size="large"
      />
    </div>
  );
}