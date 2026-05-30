import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  title: string;
  path?: string;
}

interface RouteConfig {
  title: string;
  parent?: string;
}

const routeMap: Record<string, RouteConfig> = {
  '/start': { title: '首页' },
  '/jobs': { title: '岗位画像', parent: '/start' },
  '/jobs/graph': { title: '岗位图谱', parent: '/jobs' },
  '/profile': { title: '学生画像', parent: '/start' },
  '/student': { title: '编辑资料', parent: '/profile' },
  '/plan': { title: '报告管理', parent: '/start' },
  '/plan/editor/:id': { title: '编辑报告', parent: '/plan' },
  '/interview': { title: 'AI 面试', parent: '/start' },
  '/holland': { title: '职业兴趣测试', parent: '/start' },
  '/holland/result': { title: '测试结果', parent: '/holland' },
  '/holland/history': { title: '测试历史', parent: '/holland' },
  '/resume': { title: '简历解析', parent: '/start' },
  '/resume/editor': { title: '简历编辑器', parent: '/resume' },
  '/settings': { title: '设置', parent: '/start' },
  '/messages': { title: '消息中心', parent: '/start' },
  '/assistant': { title: 'AI 助手', parent: '/start' },
  '/doc': { title: '帮助文档', parent: '/start' },

  '/teacher/index': { title: '管理面板' },
  '/teacher/students': { title: '学生管理', parent: '/teacher/index' },
  '/teacher/alerts': { title: '预警中心', parent: '/teacher/index' },
  '/teacher/invite-codes': { title: '邀请码管理', parent: '/teacher/index' },
  '/teacher/profile': { title: '个人资料', parent: '/teacher/index' },
  '/teacher/messages': { title: '消息中心', parent: '/teacher/index' },
  '/teacher/settings': { title: '设置', parent: '/teacher/index' },
};

function matchRoute(pathname: string): { pattern: string; params: Record<string, string> } | null {
  for (const pattern of Object.keys(routeMap)) {
    const paramNames: string[] = [];
    const regexStr = pattern.replace(/:([^/]+)/g, (_match, name: string) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const regex = new RegExp(`^${regexStr}$`);
    const m = pathname.match(regex);
    if (m) {
      const params: Record<string, string> = {};
      paramNames.forEach((name, i) => {
        const val = m[i + 1];
        if (val !== undefined) params[name] = val;
      });
      return { pattern, params };
    }
  }
  return null;
}

function fillParams(pattern: string, params: Record<string, string>): string {
  return pattern.replace(/:([^/]+)/g, (_match, name: string) => params[name] ?? `:${name}`);
}

export function useBreadcrumbs(overrideTitle?: string): BreadcrumbItem[] {
  const location = useLocation();

  return useMemo((): BreadcrumbItem[] => {
    const matched = matchRoute(location.pathname);
    if (!matched) return [];

    const { pattern, params } = matched;
    const items: BreadcrumbItem[] = [];
    let currentPattern: string | undefined = pattern;

    while (currentPattern !== undefined) {
      const config: RouteConfig | undefined = routeMap[currentPattern];
      if (!config) break;
      const actualPath = fillParams(currentPattern, params);
      items.unshift({ title: config.title, path: actualPath });
      currentPattern = config.parent;
    }

    const last = items[items.length - 1];
    if (last) {
      last.path = undefined;
      if (overrideTitle) last.title = overrideTitle;
    }

    return items;
  }, [location.pathname, overrideTitle]);
}