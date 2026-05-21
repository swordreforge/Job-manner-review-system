import {
  HomeOutlined,
  BankOutlined,
  MessageOutlined,
  BulbOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  FileAddOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { createElement, useMemo } from 'react';

export interface NavItem {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  matchPaths?: string[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const studentNavGroups: NavGroup[] = [
  {
    title: '常用',
    items: [
      { key: 'home', title: '首页', description: '回到工作台首页', icon: createElement(HomeOutlined), path: '/start', matchPaths: ['/start', '/'] },
      { key: 'jobs', title: '岗位搜索', description: '浏览岗位数据库，查看发展路径', icon: createElement(BankOutlined), path: '/jobs', matchPaths: ['/jobs'] },
      { key: 'messages', title: '消息中心', description: '查看与教师的沟通消息', icon: createElement(MessageOutlined), path: '/messages', matchPaths: ['/messages'] },
    ],
  },
  {
    title: '职业发展',
    items: [
      { key: 'plan', title: '职业规划', description: '生成专属成长路线与技能分析', icon: createElement(BulbOutlined), path: '/plan', matchPaths: ['/plan', '/holland'] },
      { key: 'resume', title: '简历优化', description: '智能诊断并优化你的简历', icon: createElement(FileTextOutlined), path: '/resume', matchPaths: ['/resume'] },
    ],
  },
  {
    title: '个人中心',
    items: [
      { key: 'profile', title: '个人资料', description: '管理个人信息与设置', icon: createElement(UserOutlined), path: '/profile', matchPaths: ['/profile', '/settings', '/student'] },
    ],
  },
];

const teacherNavGroups: NavGroup[] = [
  {
    title: '常用',
    items: [
      { key: 'dashboard', title: '工作台', description: '教师工作台总览', icon: createElement(HomeOutlined), path: '/teacher/index', matchPaths: ['/teacher/index'] },
      { key: 'students', title: '学生管理', description: '管理你的学生列表', icon: createElement(TeamOutlined), path: '/teacher/students', matchPaths: ['/teacher/students'] },
    ],
  },
  {
    title: '管理',
    items: [
      { key: 'invite', title: '邀请码', description: '生成和管理学生邀请码', icon: createElement(FileAddOutlined), path: '/teacher/invite-codes', matchPaths: ['/teacher/invite-codes'] },
      { key: 'alerts', title: '预警管理', description: '查看学生预警信息', icon: createElement(AlertOutlined), path: '/teacher/alerts', matchPaths: ['/teacher/alerts'] },
    ],
  },
  {
    title: '其他',
    items: [
      { key: 'messages', title: '消息中心', description: '查看与学生的沟通消息', icon: createElement(MessageOutlined), path: '/teacher/messages', matchPaths: ['/teacher/messages'] },
      { key: 'profile', title: '个人中心', description: '管理个人信息与设置', icon: createElement(UserOutlined), path: '/teacher/profile', matchPaths: ['/teacher/profile'] },
    ],
  },
];

function flattenNavGroups(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((group) => group.items);
}

const studentFlatNavItems = flattenNavGroups(studentNavGroups);
const teacherFlatNavItems = flattenNavGroups(teacherNavGroups);

export function useNavItems(role: 'student' | 'teacher') {
  return useMemo(() => {
    const navGroups = role === 'teacher' ? teacherNavGroups : studentNavGroups;
    const flatNavItems = role === 'teacher' ? teacherFlatNavItems : studentFlatNavItems;
    return { navGroups, flatNavItems };
  }, [role]);
}

export function findNavItemByPath(path: string, role?: 'student' | 'teacher'): NavItem | undefined {
  const items = role === 'teacher'
    ? teacherFlatNavItems
    : role === 'student'
      ? studentFlatNavItems
      : [...studentFlatNavItems, ...teacherFlatNavItems];

  return items.find((item) => {
    if (item.matchPaths) {
      return item.matchPaths.includes(path);
    }
    return item.path === path;
  });
}
