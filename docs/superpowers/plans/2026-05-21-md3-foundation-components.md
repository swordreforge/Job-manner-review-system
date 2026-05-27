# MD3 Foundation Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the 6 foundational MD3 components and systems that every page will use — PageHeader, SurfaceCard, StatCard, SkeletonLoader, ApiErrorState, and M3 type scale CSS variables + ECharts theme — so that subsequent page-level redesigns (P1–P4) have consistent building blocks.

**Architecture:** All components live in `src/components/` as React functional components using TypeScript. They consume the M3 CSS custom properties already defined in `src/index.css` (`--md-sys-color-*`, `--md-sys-shape-*`, `--md-sys-elevation-*`). No Ant Design dependencies — these are pure div+CSS MD3 components. The ECharts theme will be a JS object that reads CSS variables at runtime. The M3 type scale will be added as new CSS custom properties in `index.css`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, CSS custom properties (MD3 tokens), ECharts, `material-symbols` font

---

## File Structure

```
src/
├── components/
│   ├── PageHeader/
│   │   └── index.tsx          # NEW — breadcrumb + icon + title + description + actions
│   ├── SurfaceCard/
│   │   └── index.tsx          # NEW — MD3 surface card (elevated/filled/outlined variants)
│   ├── StatCard/
│   │   └── index.tsx          # NEW — icon + value + label tonal stat card
│   ├── SkeletonLoader/
│   │   └── index.tsx          # NEW — MD3 skeleton loader (pulse animation)
│   ├── ApiErrorState/
│   │   └── index.tsx          # NEW — error alert + retry button
│   ├── EChartsM3Theme/
│   │   └── index.ts          # NEW — ECharts theme object reading M3 CSS vars
│   ├── TopAppBar/             # EXISTING — no changes
│   ├── NavigationDrawer/      # EXISTING — no changes
│   └── CommandPalette/        # EXISTING — no changes
├── hooks/
│   └── useBreadcrumbs.ts      # NEW — breadcrumb generation from route path
├── index.css                  # MODIFY — add M3 type scale CSS variables
└── pages/                     # EXISTING — will consume new components later
```

---

### Task 1: M3 Type Scale CSS Variables

**Files:**
- Modify: `src/index.css:10-79` (add after existing `:root` block, before dark theme)

**Why:** All pages currently use arbitrary Tailwind text classes (`text-xl`, `text-2xl`, etc.) with no M3 type scale. Adding CSS custom properties for the MD3 type scale gives every component a single source of truth for typography.

- [ ] **Step 1: Add type scale variables to `:root` in `src/index.css`**

After the `--color-outline` line (line 75) inside the existing `:root` block, add the following type scale variables. These follow the Material Design 3 type scale specification:

```css
  /* Material Design 3 Type Scale */
  --md-sys-typescale-display-large: 500 3.5625rem/1.12 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-display-medium: 500 2.8125rem/1.16 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-display-small: 500 2.25rem/1.22 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-headline-large: 500 2rem/1.25 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-headline-medium: 500 1.75rem/1.29 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-headline-small: 500 1.5rem/1.33 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-title-large: 500 1.375rem/1.36 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-title-medium: 600 1rem/1.5 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-title-small: 600 0.875rem/1.43 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-body-large: 400 1rem/1.5 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-body-medium: 400 0.875rem/1.43 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-body-small: 400 0.75rem/1.33 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-label-large: 600 0.875rem/1.43 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-label-medium: 600 0.75rem/1.33 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
  --md-sys-typescale-label-small: 600 0.6875rem/1.45 'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif;
```

- [ ] **Step 2: Add type scale utility classes after the `.md-card-filled` rule (~line 251)**

```css
.md-typescale-display-large { font: var(--md-sys-typescale-display-large); color: var(--md-sys-color-on-surface); }
.md-typescale-display-medium { font: var(--md-sys-typescale-display-medium); color: var(--md-sys-color-on-surface); }
.md-typescale-display-small { font: var(--md-sys-typescale-display-small); color: var(--md-sys-color-on-surface); }
.md-typescale-headline-large { font: var(--md-sys-typescale-headline-large); color: var(--md-sys-color-on-surface); }
.md-typescale-headline-medium { font: var(--md-sys-typescale-headline-medium); color: var(--md-sys-color-on-surface); }
.md-typescale-headline-small { font: var(--md-sys-typescale-headline-small); color: var(--md-sys-color-on-surface); }
.md-typescale-title-large { font: var(--md-sys-typescale-title-large); color: var(--md-sys-color-on-surface); }
.md-typescale-title-medium { font: var(--md-sys-typescale-title-medium); color: var(--md-sys-color-on-surface); }
.md-typescale-title-small { font: var(--md-sys-typescale-title-small); color: var(--md-sys-color-on-surface); }
.md-typescale-body-large { font: var(--md-sys-typescale-body-large); color: var(--md-sys-color-on-surface); }
.md-typescale-body-medium { font: var(--md-sys-typescale-body-medium); color: var(--md-sys-color-on-surface); }
.md-typescale-body-small { font: var(--md-sys-typescale-body-small); color: var(--md-sys-color-on-surface); }
.md-typescale-label-large { font: var(--md-sys-typescale-label-large); color: var(--md-sys-color-on-surface); }
.md-typescale-label-medium { font: var(--md-sys-typescale-label-medium); color: var(--md-sys-color-on-surface); }
.md-typescale-label-small { font: var(--md-sys-typescale-label-small); color: var(--md-sys-color-on-surface); }
```

- [ ] **Step 3: Verify CSS compiles**

Run: `cd high-school-worker-design-forend && npx tsc --noEmit 2>&1 | head -5` (just check no CSS-related import errors)
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add high-school-worker-design-forend/src/index.css
git commit -m "feat: add M3 type scale CSS variables and utility classes"
```

---

### Task 2: useBreadcrumbs Hook

**Files:**
- Create: `src/hooks/useBreadcrumbs.ts`

**Why:** PageHeader needs breadcrumbs. This hook mirrors the reference project's `useBreadcrumbs` composable, adapted for React Router.

- [ ] **Step 1: Create `src/hooks/useBreadcrumbs.ts`**

```typescript
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
  '/home': { title: '首页' },
  '/jobs': { title: '岗位画像', parent: '/home' },
  '/jobs/graph': { title: '岗位图谱', parent: '/jobs' },
  '/profile': { title: '学生画像', parent: '/home' },
  '/student': { title: '编辑资料', parent: '/profile' },
  '/plan': { title: '报告管理', parent: '/home' },
  '/plan/editor/:id': { title: '编辑报告', parent: '/plan' },
  '/interview': { title: 'AI 面试', parent: '/home' },
  '/holland': { title: '职业兴趣测试', parent: '/home' },
  '/holland/result': { title: '测试结果', parent: '/holland' },
  '/holland/history': { title: '测试历史', parent: '/holland' },
  '/resume': { title: '简历解析', parent: '/home' },
  '/settings': { title: '设置', parent: '/home' },
  '/messages': { title: '消息中心', parent: '/home' },
  '/doc': { title: '帮助文档', parent: '/home' },

  '/teacher/dashboard': { title: '管理面板' },
  '/teacher/students': { title: '学生管理', parent: '/teacher/dashboard' },
  '/teacher/alerts': { title: '预警中心', parent: '/teacher/dashboard' },
  '/teacher/invite-codes': { title: '邀请码管理', parent: '/teacher/dashboard' },
  '/teacher/profile': { title: '个人资料', parent: '/teacher/dashboard' },
  '/teacher/messages': { title: '消息中心', parent: '/teacher/dashboard' },
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

  return useMemo(() => {
    const matched = matchRoute(location.pathname);
    if (!matched) return [];

    const { pattern, params } = matched;
    const items: BreadcrumbItem[] = [];
    let currentPattern: string | undefined = pattern;

    while (currentPattern !== undefined) {
      const config = routeMap[currentPattern];
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd high-school-worker-design-forend && npx tsc --noEmit`
Expected: no new errors related to useBreadcrumbs

- [ ] **Step 3: Commit**

```bash
git add high-school-worker-design-forend/src/hooks/useBreadcrumbs.ts
git commit -m "feat: add useBreadcrumbs hook for MD3 page header breadcrumbs"
```

---

### Task 3: PageHeader Component

**Files:**
- Create: `src/components/PageHeader/index.tsx`

**Why:** Currently, 22 pages each implement their own ad-hoc page header (plain `<h1>`, no breadcrumbs, inconsistent padding). PageHeader provides the consistent MD3 pattern from the reference project: breadcrumbs → icon + title row → description → divider.

- [ ] **Step 1: Create `src/components/PageHeader/index.tsx`**

```tsx
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  breadcrumbTitle?: string;
  hideBreadcrumb?: boolean;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  icon,
  breadcrumbTitle,
  hideBreadcrumb = false,
  children,
}: PageHeaderProps) {
  const breadcrumbs = useBreadcrumbs(breadcrumbTitle);

  const showBreadcrumb = !hideBreadcrumb && breadcrumbs.length > 1;

  return (
    <div className="mb-6">
      {showBreadcrumb && (
        <nav className="flex items-center gap-1 px-0 pt-0 pb-1" aria-label="面包屑导航">
          {breadcrumbs.map((item, idx) => (
            <span key={idx} className="flex items-center gap-1">
              {idx > 0 && (
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }} className="text-sm">
                  /
                </span>
              )}
              {item.path ? (
                <a
                  href={item.path}
                  className="text-sm no-underline transition-colors"
                  style={{ color: 'var(--md-sys-color-primary)' }}
                  onClick={(e) => {
                    if (item.path) {
                      e.preventDefault();
                      window.history.pushState(null, '', item.path);
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                >
                  {item.title}
                </a>
              ) : (
                <span
                  className="text-sm"
                  style={{ color: 'var(--md-sys-color-on-surface)' }}
                >
                  {item.title}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <span style={{ color: 'var(--md-sys-color-primary)' }} className="text-[26px]">
              {icon}
            </span>
          )}
          <h1 className="md-typescale-headline-small">{title}</h1>
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
      {description && (
        <p className="md-typescale-body-medium mt-1 ml-[34px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {description}
        </p>
      )}
      <div
        className="mt-3"
        style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd high-school-worker-design-forend && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add high-school-worker-design-forend/src/components/PageHeader/index.tsx
git commit -m "feat: add PageHeader component with MD3 breadcrumbs"
```

---

### Task 4: SurfaceCard Component

**Files:**
- Create: `src/components/SurfaceCard/index.tsx`

**Why:** Profile and Home pages already use a pattern of `style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid var(--md-sys-color-outline-variant)' }}`. This component encapsulates that pattern to avoid repetition and enable M3-consistent cards everywhere.

- [ ] **Step 1: Create `src/components/SurfaceCard/index.tsx`**

```tsx
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

type SurfaceVariant = 'elevated' | 'filled' | 'outlined';

interface SurfaceCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: SurfaceVariant;
  title?: ReactNode;
  titleIcon?: ReactNode;
  action?: ReactNode;
  padding?: boolean;
  children: ReactNode;
}

const variantStyles: Record<SurfaceVariant, CSSProperties> = {
  elevated: {
    backgroundColor: 'var(--md-sys-color-surface-container-low)',
    borderRadius: 'var(--md-sys-shape-corner-large)',
    boxShadow: 'var(--md-sys-elevation-1)',
    border: '1px solid var(--md-sys-color-outline-variant)',
  },
  filled: {
    backgroundColor: 'var(--md-sys-color-surface-container)',
    borderRadius: 'var(--md-sys-shape-corner-large)',
    boxShadow: 'var(--md-sys-elevation-0)',
    border: 'none',
  },
  outlined: {
    backgroundColor: 'var(--md-sys-color-surface)',
    borderRadius: 'var(--md-sys-shape-corner-large)',
    boxShadow: 'var(--md-sys-elevation-0)',
    border: '1px solid var(--md-sys-color-outline-variant)',
  },
};

export default function SurfaceCard({
  variant = 'elevated',
  title,
  titleIcon,
  action,
  padding = true,
  children,
  className = '',
  style,
  ...rest
}: SurfaceCardProps) {
  const hasHeader = title || action;

  return (
    <div
      className={className}
      style={{ ...variantStyles[variant], overflow: 'hidden', ...style }}
      {...rest}
    >
      {hasHeader && (
        <div
          className="flex items-center justify-between px-4 py-3 font-medium"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center gap-2">
            {titleIcon && (
              <span style={{ color: 'var(--md-sys-color-primary)' }} className="text-lg">
                {titleIcon}
              </span>
            )}
            <span className="md-typescale-title-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {title}
            </span>
          </div>
          {action}
        </div>
      )}
      <div className={padding ? 'p-4' : ''}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd high-school-worker-design-forend && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add high-school-worker-design-forend/src/components/SurfaceCard/index.tsx
git commit -m "feat: add SurfaceCard component (elevated/filled/outlined variants)"
```

---

### Task 5: StatCard Component

**Files:**
- Create: `src/components/StatCard/index.tsx`

**Why:** The reference project uses tonal stat cards everywhere (dashboard, admin, school). Our dashboard and teacher pages need the same pattern: icon + large value + small label, with `variant="tonal"` and semantic color.

- [ ] **Step 1: Create `src/components/StatCard/index.tsx`**

```tsx
import type { CSSProperties, ReactNode } from 'react';

type StatColor = 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'warning' | 'info';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  color?: StatColor;
  className?: string;
  style?: CSSProperties;
}

const tonalColors: Record<StatColor, { bg: string; on: string }> = {
  primary: { bg: 'var(--md-sys-color-primary-container)', on: 'var(--md-sys-color-on-primary-container)' },
  secondary: { bg: 'var(--md-sys-color-secondary-container)', on: 'var(--md-sys-color-on-secondary-container)' },
  tertiary: { bg: 'var(--md-sys-color-tertiary-container)', on: 'var(--md-sys-color-on-tertiary-container)' },
  error: { bg: 'var(--md-sys-color-error-container)', on: 'var(--md-sys-color-on-error-container)' },
  success: { bg: 'var(--md-sys-color-success, #E8F5E9)', on: 'var(--md-sys-color-on-surface)' },
  warning: { bg: 'var(--md-sys-color-warning, #FFF3E0)', on: 'var(--md-sys-color-on-surface)' },
  info: { bg: 'var(--md-sys-color-info, #E3F2FD)', on: 'var(--md-sys-color-on-surface)' },
};

export default function StatCard({ icon, value, label, color = 'primary', className = '', style }: StatCardProps) {
  const colors = tonalColors[color];

  return (
    <div
      className={`text-center ${className}`}
      style={{
        backgroundColor: colors.bg,
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        padding: '1.25rem 1rem',
        ...style,
      }}
    >
      <div className="flex justify-center mb-1" style={{ color: colors.on, fontSize: '1.75rem' }}>
        {icon}
      </div>
      <div className="md-typescale-headline-small" style={{ color: colors.on }}>
        {value}
      </div>
      <div className="md-typescale-label-small" style={{ color: colors.on, opacity: 0.8 }}>
        {label}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd high-school-worker-design-forend && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add high-school-worker-design-forend/src/components/StatCard/index.tsx
git commit -m "feat: add StatCard component for tonal MD3 stat cards"
```

---

### Task 6: SkeletonLoader and ApiErrorState Components

**Files:**
- Create: `src/components/SkeletonLoader/index.tsx`
- Create: `src/components/ApiErrorState/index.tsx`

**Why:** The reference project has `v-skeleton-loader` and `ApiErrorState` in every view. Our pages lack consistent loading and error states — some use Ant `Spin`, some use plain text "加载中...", some have no loading state at all.

- [ ] **Step 1: Create `src/components/SkeletonLoader/index.tsx`**

```tsx
interface SkeletonLoaderProps {
  type?: 'card' | 'card@2' | 'card@3' | 'text' | 'heading' | 'stat' | 'list';
  className?: string;
}

export default function SkeletonLoader({ type = 'card', className = '' }: SkeletonLoaderProps) {
  const pulseBase: React.CSSProperties = {
    backgroundColor: 'var(--md-sys-color-surface-container-high)',
    borderRadius: 'var(--md-sys-shape-corner-small)',
    animation: 'md-pulse 1.5s ease-in-out infinite',
  };

  const configs: Record<string, React.ReactNode> = {
    card: (
      <div style={{ ...pulseBase, height: '200px', borderRadius: 'var(--md-sys-shape-corner-medium)' }} />
    ),
    'card@2': (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div style={{ ...pulseBase, height: '200px', borderRadius: 'var(--md-sys-shape-corner-medium)' }} />
        <div style={{ ...pulseBase, height: '200px', borderRadius: 'var(--md-sys-shape-corner-medium)' }} />
      </div>
    ),
    'card@3': (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div style={{ ...pulseBase, height: '200px', borderRadius: 'var(--md-sys-shape-corner-medium)' }} />
        <div style={{ ...pulseBase, height: '200px', borderRadius: 'var(--md-sys-shape-corner-medium)' }} />
        <div style={{ ...pulseBase, height: '200px', borderRadius: 'var(--md-sys-shape-corner-medium)' }} />
      </div>
    ),
    text: (
      <div className="space-y-2">
        <div style={{ ...pulseBase, height: '1rem', width: '80%' }} />
        <div style={{ ...pulseBase, height: '1rem', width: '60%' }} />
      </div>
    ),
    heading: (
      <div style={{ ...pulseBase, height: '1.5rem', width: '40%', marginBottom: '0.5rem' }} />
    ),
    stat: (
      <div className="text-center p-5" style={{ ...pulseBase, borderRadius: 'var(--md-sys-shape-corner-medium)' }}>
        <div style={{ ...pulseBase, height: '1.75rem', width: '3rem', margin: '0.5rem auto' }} />
        <div style={{ ...pulseBase, height: '0.75rem', width: '4rem', margin: '0 auto' }} />
      </div>
    ),
    list: (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3" style={{
            padding: '0.75rem',
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderRadius: 'var(--md-sys-shape-corner-small)'
          }}>
            <div style={{ ...pulseBase, height: '2.5rem', width: '2.5rem', borderRadius: '50%' }} />
            <div className="flex-1 space-y-1">
              <div style={{ ...pulseBase, height: '0.875rem', width: '60%' }} />
              <div style={{ ...pulseBase, height: '0.75rem', width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <>
      <style>{`
        @keyframes md-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div className={className} role="status" aria-label="加载中">
        {configs[type] || configs.card}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create `src/components/ApiErrorState/index.tsx`**

```tsx
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ApiErrorStateProps {
  error: string;
  title?: string;
  onRetry?: () => void;
}

export default function ApiErrorState({ error, title = '加载失败', onRetry }: ApiErrorStateProps) {
  return (
    <div
      className="my-4 p-4"
      style={{
        backgroundColor: 'var(--md-sys-color-error-container)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        border: '1px solid var(--md-sys-color-error)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <ExclamationCircleOutlined style={{ color: 'var(--md-sys-color-error)', fontSize: '1.25rem' }} />
        <span className="md-typescale-title-medium" style={{ color: 'var(--md-sys-color-on-error-container)' }}>
          {title}
        </span>
      </div>
      <p className="md-typescale-body-medium mb-3" style={{ color: 'var(--md-sys-color-on-error-container)', opacity: 0.85 }}>
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="md-typescale-label-large px-4 py-1.5 transition-colors"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--md-sys-color-error)',
            border: '1px solid var(--md-sys-color-error)',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--md-sys-color-error)';
            e.currentTarget.style.color = 'var(--md-sys-color-on-error)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--md-sys-color-error)';
          }}
        >
          重试
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd high-school-worker-design-forend && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add high-school-worker-design-forend/src/components/SkeletonLoader/index.tsx high-school-worker-design-forend/src/components/ApiErrorState/index.tsx
git commit -m "feat: add SkeletonLoader and ApiErrorState components"
```

---

### Task 7: ECharts M3 Theme

**Files:**
- Create: `src/components/EChartsM3Theme/index.ts`

**Why:** Three pages use ECharts (Jobs, Holland/Result, Teacher/Dashboard) and all hardcode chart colors. By providing a theme object that reads from M3 CSS variables, all future charts automatically match the app theme, including dark mode.

- [ ] **Step 1: Create `src/components/EChartsM3Theme/index.ts`**

```typescript
export function getEChartsM3Theme(): Record<string, unknown> {
  const root = getComputedStyle(document.documentElement);

  const getColor = (prop: string, fallback: string): string => {
    const val = root.getPropertyValue(prop).trim();
    return val || fallback;
  };

  const primary = getColor('--md-sys-color-primary', '#0B57D0');
  const onPrimaryContainer = getColor('--md-sys-color-on-primary-container', '#001B3D');
  const primaryContainer = getColor('--md-sys-color-primary-container', '#D3E4FF');
  const secondary = getColor('--md-sys-color-secondary', '#555F71');
  const secondaryContainer = getColor('--md-sys-color-secondary-container', '#D9E3F8');
  const tertiary = getColor('--md-sys-color-tertiary', '#705575');
  const tertiaryContainer = getColor('--md-sys-color-tertiary-container', '#FAD8FD');
  const error = getColor('--md-sys-color-error', '#BA1A1A');
  const success = getColor('--md-sys-color-success', '#1B8C3B');
  const warning = getColor('--md-sys-color-warning', '#8F5900');
  const onSurface = getColor('--md-sys-color-on-surface', '#1B1B1F');
  const onSurfaceVariant = getColor('--md-sys-color-on-surface-variant', '#44474F');
  const outline = getColor('--md-sys-color-outline', '#74777F');
  const outlineVariant = getColor('--md-sys-color-outline-variant', '#C4C6D0');
  const surface = getColor('--md-sys-color-surface', '#FDFCFF');
  const surfaceContainer = getColor('--md-sys-color-surface-container', '#F0EDF2');
  const surfaceContainerHigh = getColor('--md-sys-color-surface-container-high', '#EBE7ED');

  return {
    color: [primary, secondary, tertiary, success, warning, error, secondaryContainer, tertiaryContainer],
    backgroundColor: 'transparent',
    textStyle: {
      color: onSurface,
      fontFamily: "'Google Sans', 'Noto Sans SC', 'Roboto', system-ui, sans-serif",
    },
    title: {
      textStyle: { color: onSurface, fontSize: 16, fontWeight: 500 },
      subtextStyle: { color: onSurfaceVariant, fontSize: 12 },
    },
    legend: {
      textStyle: { color: onSurfaceVariant },
      pageTextStyle: { color: onSurfaceVariant },
      pageIconColor: outline,
      pageIconInactiveColor: outlineVariant,
    },
    tooltip: {
      backgroundColor: surfaceContainer,
      borderColor: outlineVariant,
      borderWidth: 1,
      textStyle: { color: onSurface },
      extraCssText: `border-radius: var(--md-sys-shape-corner-medium, 12px); box-shadow: var(--md-sys-elevation-2, 0 2px 6px rgba(0,0,0,0.15));`,
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: outlineVariant } },
      axisTick: { lineStyle: { color: outlineVariant } },
      axisLabel: { color: onSurfaceVariant },
      splitLine: { lineStyle: { color: outlineVariant, type: 'dashed' } },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: outlineVariant } },
      axisTick: { lineStyle: { color: outlineVariant } },
      axisLabel: { color: onSurfaceVariant },
      splitLine: { lineStyle: { color: outlineVariant, type: 'dashed' } },
    },
    radar: {
      axisLine: { lineStyle: { color: outlineVariant } },
      splitLine: { lineStyle: { color: outlineVariant } },
      splitArea: { areaStyle: { color: [surfaceContainer, surface] } },
      axisName: { color: onSurfaceVariant },
    },
    gauge: {
      axisLine: { lineStyle: { color: [[1, outlineVariant]] } },
      axisTick: { lineStyle: { color: outlineVariant } },
      axisLabel: { color: onSurfaceVariant },
      detail: { color: onSurface },
      title: { color: onSurfaceVariant },
    },
    pie: {
      itemStyle: { borderColor: surface, borderWidth: 2 },
    },
    series: [
      { type: 'bar', itemStyle: { borderRadius: 4 } },
      { type: 'line', smooth: true, symbolSize: 6 },
      { type: 'radar', areaStyle: { opacity: 0.15 } },
    ],
  };
}

export const M3_CHART_COLORS = [
  'var(--md-sys-color-primary)',
  'var(--md-sys-color-secondary)',
  'var(--md-sys-color-tertiary)',
  'var(--md-sys-color-success)',
  'var(--md-sys-color-warning)',
  'var(--md-sys-color-error)',
  'var(--md-sys-color-primary-container)',
  'var(--md-sys-color-secondary-container)',
];

export function getM3ChartColor(index: number): string {
  const root = getComputedStyle(document.documentElement);
  const props = [
    '--md-sys-color-primary',
    '--md-sys-color-secondary',
    '--md-sys-color-tertiary',
    '--md-sys-color-success',
    '--md-sys-color-warning',
    '--md-sys-color-error',
    '--md-sys-color-primary-container',
    '--md-sys-color-secondary-container',
  ];
  const prop = props[index % props.length];
  return root.getPropertyValue(prop).trim() || '#0B57D0';
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd high-school-worker-design-forend && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add high-school-worker-design-forend/src/components/EChartsM3Theme/index.ts
git commit -m "feat: add EChartsM3Theme that reads MD3 CSS variables at runtime"
```

---

### Task 8: Export Barrel and Lint Check

**Files:**
- Create: `src/components/md3/index.ts` — barrel export for all MD3 components

**Why:** A single import point makes it easy for pages to adopt all M3 foundation components at once: `import { PageHeader, SurfaceCard, ... } from '../../components/md3'`.

- [ ] **Step 1: Create `src/components/md3/index.ts`**

```typescript
export { default as PageHeader } from '../PageHeader';
export { default as SurfaceCard } from '../SurfaceCard';
export { default as StatCard } from '../StatCard';
export { default as SkeletonLoader } from '../SkeletonLoader';
export { default as ApiErrorState } from '../ApiErrorState';
export { getEChartsM3Theme, getM3ChartColor, M3_CHART_COLORS } from '../EChartsM3Theme';
export { useBreadcrumbs } from '../../hooks/useBreadcrumbs';
export type { BreadcrumbItem } from '../../hooks/useBreadcrumbs';
```

- [ ] **Step 2: Run build to verify everything compiles**

Run: `cd high-school-worker-design-forend && npx tsc --noEmit && npm run lint 2>&1 | tail -20`
Expected: TypeScript passes, lint passes for new files (existing lint issues are pre-existing)

- [ ] **Step 3: Commit**

```bash
git add high-school-worker-design-forend/src/components/md3/index.ts
git commit -m "feat: add barrel export for MD3 foundation components"
```

---

## Self-Review

1. **Spec coverage:** Plan covers all 6 P0 items: PageHeader (Task 3), SurfaceCard (Task 4), StatCard (Task 5), SkeletonLoader + ApiErrorState (Task 6), M3 type scale (Task 1), ECharts theme (Task 7). Also includes useBreadcrumbs (Task 2) as a prerequisite for PageHeader, and barrel export (Task 8) for discoverability.

2. **Placeholder scan:** No TBDs, TODOs, or "implement later" patterns. All code is complete.

3. **Type consistency:** `BreadcrumbItem` type is exported from `useBreadcrumbs.ts` and re-exported from barrel. `StatCard` uses `StatColor` union. `SurfaceCard` uses `SurfaceVariant` union. `SkeletonLoader` uses literal string type for `type` prop. All types are consistent across files.

4. **Missing coverage:** The ECharts theme in Task 7 is a JS object (not an ECharts "registerTheme" call). Consumers will pass it via `<ReactECharts option={...} theme={m3Theme} />` or spread it into chart options. This is intentional — ECharts' `registerTheme` is global and can conflict; the JS object approach is safer for our use case where charts are in separate lazy-loaded pages.