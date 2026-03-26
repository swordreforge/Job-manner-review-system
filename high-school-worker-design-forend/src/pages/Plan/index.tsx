import { useState } from 'react';
import { Segmented, Card, Progress, Timeline } from 'antd';
import { useUIStore } from '../../stores';

const skillData = {
  bigtech: {
    name: '大厂技术岗',
    skills: [
      { name: '算法与数据结构', level: 60, status: '学习中' },
      { name: '操作系统', level: 40, status: '待学习' },
      { name: '计算机网络', level: 50, status: '学习中' },
      { name: '数据库', level: 70, status: '已掌握' },
      { name: '分布式系统', level: 20, status: '待学习' },
    ],
    timeline: [
      { date: '2024 Q1', title: '完成算法基础', desc: 'LeetCode 200题' },
      { date: '2024 Q2', title: '项目实战', desc: '完成分布式系统项目' },
      { date: '2024 Q3', title: '实习申请', desc: '投递大厂实习' },
      { date: '2024 Q4', title: '秋招准备', desc: '面试冲刺' },
    ],
  },
  gov: {
    name: '国企研发岗',
    skills: [
      { name: '专业基础知识', level: 70, status: '已掌握' },
      { name: '行业规范', level: 50, status: '学习中' },
      { name: '软技能', level: 60, status: '学习中' },
      { name: '项目管理', level: 30, status: '待学习' },
      { name: '公文写作', level: 40, status: '待学习' },
    ],
    timeline: [
      { date: '2024 Q1', title: '夯实基础', desc: '专业知识巩固' },
      { date: '2024 Q2', title: '行业了解', desc: '了解行业动态' },
      { date: '2024 Q3', title: '准备考试', desc: '行测申论准备' },
      { date: '2024 Q4', title: '秋招投递', desc: '国企秋招' },
    ],
  },
};

export default function PlanPage() {
  const { track } = useUIStore();
  const [activeTrack, setActiveTrack] = useState<'bigtech' | 'gov'>(track);

  const data = skillData[activeTrack];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已掌握': return '#52c41a';
      case '学习中': return '#1890ff';
      default: return '#faad14';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mb-4">
        <Segmented
          value={activeTrack}
          onChange={(v) => setActiveTrack(v as 'bigtech' | 'gov')}
          options={[
            { label: '大厂技术岗', value: 'bigtech' },
            { label: '国企研发岗', value: 'gov' },
          ]}
          className="w-full"
        />
      </div>

      <Card title="技能掌握进度" className="mb-4">
        <div className="space-y-4">
          {data.skills.map((skill, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="font-medium">{skill.name}</span>
                <span style={{ color: getStatusColor(skill.status) }}>{skill.status}</span>
              </div>
              <Progress percent={skill.level} strokeColor={getStatusColor(skill.status)} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="学习时间轴">
        <Timeline
          items={data.timeline.map(item => ({
            color: 'blue',
            content: (
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-gray-500 text-sm">{item.desc}</div>
                <div className="text-gray-400 text-xs">{item.date}</div>
              </div>
            ),
          }))}
        />
      </Card>
    </div>
  );
}