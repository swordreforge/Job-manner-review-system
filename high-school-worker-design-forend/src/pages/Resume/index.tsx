import { useState } from 'react';
import { Card, Upload, Button, message, Steps, Result } from 'antd';
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';

export default function ResumePage() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);

  const handleUpload = () => {
    if (fileList.length === 0) {
      message.warning('请先选择简历文件');
      return;
    }
    setParsing(true);
    setTimeout(() => {
      setParsing(false);
      setParsed(true);
      message.success('简历解析完成');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Steps
        current={parsed ? 2 : parsing ? 1 : 0}
        className="mb-6"
        items={[
          { title: '上传简历', icon: <UploadOutlined /> },
          { title: 'AI 解析', icon: <FileTextOutlined /> },
          { title: '优化建议', icon: <FileTextOutlined /> },
        ]}
      />

      {!parsed ? (
        <Card title="上传简历">
          <Upload
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={() => false}
            accept=".pdf,.doc,.docx"
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>点击选择文件</Button>
          </Upload>
          <p className="text-gray-500 text-sm mt-2">支持 PDF、Word 格式</p>
          
          <Button 
            type="primary" 
            block 
            className="mt-4"
            onClick={handleUpload}
            loading={parsing}
          >
            {parsing ? '解析中...' : '开始解析'}
          </Button>
        </Card>
      ) : (
        <Result
          status="success"
          title="简历解析完成"
          subTitle="AI 已完成简历分析，以下是优化建议"
          extra={[
            <Button type="primary" key="optimize">查看优化建议</Button>,
            <Button key="compare">双版本对比</Button>,
          ]}
        >
          <Card className="text-left">
            <h3 className="font-medium mb-2">分析结果</h3>
            <ul className="list-disc pl-4 space-y-1 text-gray-600">
              <li>基础信息：已提取</li>
              <li>教育背景：已提取</li>
              <li>项目经验：已提取 2 个</li>
              <li>技能证书：已提取 5 项</li>
            </ul>
          </Card>
        </Result>
      )}
    </div>
  );
}