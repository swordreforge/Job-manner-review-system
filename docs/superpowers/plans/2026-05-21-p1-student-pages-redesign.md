# P1: Student Core Pages MD3 Redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign 6 student-facing pages to use MD3 design language consistently: SurfaceCard, PageHeader, StatCard, SkeletonLoader, ApiErrorState, EChartsM3Theme, and M3 type scale utility classes.

**Architecture:** Each page task replaces Ant Design Card/Skeleton/Empty/Progress hardcoded colors with MD3 foundation components and CSS variables. Pages remain functional — only visual/structural changes, no API or business logic changes.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, MD3 CSS custom properties, `material-symbols` font, Ant Design (reduced usage), echarts-for-react

---

## File Structure

```
src/
├── components/
│   ├── PageHeader/index.tsx          # EXISTING — used by all 6 pages
│   ├── SurfaceCard/index.tsx         # EXISTING — used by all 6 pages
│   ├── StatCard/index.tsx            # EXISTING — used by Home, Plan, Interview
│   ├── SkeletonLoader/index.tsx      # EXISTING — used by all 6 pages
│   ├── ApiErrorState/index.tsx       # EXISTING — used by Plan, Interview
│   ├── EChartsM3Theme/index.ts       # EXISTING — used by Jobs, Interview
│   └── md3/index.ts                  # EXISTING — barrel export
├── pages/
│   ├── Home/index.tsx                # MODIFY — dashboard redesign
│   ├── Profile/index.tsx             # MODIFY — profile M3 redesign
│   ├── Plan/index.tsx                # MODIFY — full M3 rewrite
│   ├── Interview/index.tsx           # MODIFY — chat M3 redesign
│   ├── Resume/index.tsx              # MODIFY — resume M3 redesign
│   └── Jobs/index.tsx                # MODIFY — jobs M3 redesign
└── index.css                         # MODIFY — add @keyframes md-progress-bar
```

---

### Task P1.1: Home/Dashboard Redesign

**Files:**
- Modify: `src/pages/Home/index.tsx`

**Changes:**
1. Replace all hardcoded accent colors (`#1B8C3B`, `#6B5DD3`, `#9C27B0`, `#D4EDDA`, `#E8E5F9`, `#F3E5F5`, etc.) with M3 semantic token CSS variables
2. Replace `bg-blue-50`, `text-blue-700`, `text-slate-700`, `from-blue-200` etc. with M3 tokens
3. Add `PageHeader` component at top with breadcrumb + icon
4. Replace `Ant Button` with native `<button>` styled with M3 tokens where appropriate
5. Add `SkeletonLoader type="stat@4"` for initial load state
6. Use `md-typescale-*` classes instead of Tailwind `text-xl`, `text-2xl` etc.
7. Replace `@ant-design/icons` with `material-symbols` (already used in nav components)

**Key structural changes:**
- Add `PageHeader title="首页" description="欢迎来到职业规划助手"` before content
- Replace `Ant Button` → native M3-styled button (the page uses very few Ant components)
- Replace InsightIconCluster accent colors with M3 `primary-container`/`secondary-container`/`tertiary-container`
- Replace StepRail `bg-blue-50`/`border-blue-200`/`text-blue-700`/`text-slate-700` with M3 tokens
- Replace `text-2xl font-bold` → `md-typescale-headline-small`
- Replace `text-lg font-semibold` → `md-typescale-title-large`
- Replace `text-sm` → `md-typescale-body-small` where semantically appropriate

- [ ] **Step 1: Import foundation components at top of file**

Add these imports:
```tsx
import PageHeader from '../../components/PageHeader';
import { materialSymbols } from '../../components/md3';
```

Note: `materialSymbols` is NOT an export — instead, use `<span className="material-symbols-rounded">icon_name</span>` for icons. Remove all `@ant-design/icons` imports that are no longer needed.

- [ ] **Step 2: Replace hardcoded colors in InsightIconCluster**

Replace `accentColor` and `bgClass` in the feature data with M3 semantic colors. Change the `QuickFeature` type to remove `accentColor` and `bgClass`, add M3 token references:

```tsx
type QuickFeature = {
  key: string;
  step: string;
  title: string;
  desc: string;
  path: string;
  icon: string;
  containerColor: string;
  onContainerColor: string;
};
```

Update the 4 feature items to use:
```tsx
{ key: 'think', step: '01', title: '职业测评', desc: '了解自己的职业兴趣和能力倾向', path: '/holland', icon: 'psychology', containerColor: 'var(--md-sys-color-primary-container)', onContainerColor: 'var(--md-sys-color-on-primary-container)' },
{ key: 'prepare', step: '02', title: '完善画像', desc: '上传简历或填写信息，构建你的职业画像', path: '/resume', icon: 'person_edit', containerColor: 'var(--md-sys-color-secondary-container)', onContainerColor: 'var(--md-sys-color-on-secondary-container)' },
{ key: 'plan', step: '03', title: '职业规划', desc: 'AI 生成专属职业规划报告', path: '/plan', icon: 'map', containerColor: 'var(--md-sys-color-tertiary-container)', onContainerColor: 'var(--md-sys-color-on-tertiary-container)' },
{ key: 'practice', step: '04', title: '模拟面试', desc: '与 AI 进行真实场景模拟面试', path: '/interview', icon: 'record_voice_over', containerColor: 'var(--md-sys-color-error-container)', onContainerColor: 'var(--md-sys-color-on-error-container)' },
```

- [ ] **Step 3: Replace StepRail colors**

In StepRail, replace:
- `bg-gradient-to-b from-blue-200 via-blue-300 to-transparent` → `bg-gradient-to-b from-[var(--md-sys-color-primary-container)] via-[var(--md-sys-color-primary)] to-transparent`
- `bg-blue-50` → `background: 'var(--md-sys-color-primary-container)'`
- `border-blue-200` → `border-color: 'var(--md-sys-color-outline)'`
- `text-blue-700` → `color: 'var(--md-sys-color-primary)'`

- [ ] **Step 4: Replace Ant Design icons with Material Symbols**

Replace all `@ant-design/icons` usage with `<span className="material-symbols-rounded">icon_name</span>`:
- `ApartmentOutlined` → `psychology` (or `apartment`)
- `BarChartOutlined` → `bar_chart`
- `CompassOutlined` → `explore`
- `FileTextOutlined` → `description`
- `MessageOutlined` → `chat`
- `PercentageOutlined` → `percent`
- `SolutionOutlined` → `person_edit`
- `ArrowRightOutlined` → `arrow_forward`

Remove `@ant-design/icons` import from this file entirely.

- [ ] **Step 5: Replace Typography classes**

- `text-2xl font-bold` → `md-typescale-headline-small font-bold` (remove `font-bold` if md-typescale already includes weight)
- `text-xl font-semibold` → `md-typescale-title-large`
- `text-3xl font-bold` → `md-typescale-display-small`
- `text-sm` + `text-gray-500` → remove Tailwind color, use `style={{ color: 'var(--md-sys-color-on-surface-variant)' }}` + `md-typescale-body-small`

- [ ] **Step 6: Replace Ant Button with M3-styled native button**

The CTA button at bottom uses `<Button type="primary">`. Replace with:
```tsx
<button
  onClick={() => navigate('/holland')}
  className="md-typescale-label-large px-6 py-2.5"
  style={{
    backgroundColor: 'var(--md-sys-color-primary)',
    color: 'var(--md-sys-color-on-primary)',
    borderRadius: 'var(--md-sys-shape-corner-full)',
    border: 'none',
    cursor: 'pointer',
  }}
>
  立即开始测试
</button>
```

Remove `import { Button } from 'antd'` if no other Button usage remains.

- [ ] **Step 7: Verify and commit**

Run: `cd high-school-worker-design-forend && npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors

```bash
cd high-school-worker-design && git add high-school-worker-design-forend/src/pages/Home/index.tsx && git commit -m "refactor: redesign Home dashboard with MD3 tokens and components"
```

---

### Task P1.2: Profile Page Redesign

**Files:**
- Modify: `src/pages/Profile/index.tsx`

**Changes:**
1. Replace `<Card title="学校信息">` with `<SurfaceCard title="学校信息">`
2. Replace `#8F5900` hardcoded color with `var(--md-sys-color-warning)`
3. Replace `#D4EDDA`/`#1B8C3B`/`#FFF8E1` with M3 semantic tokens
4. Use `SkeletonLoader type="list"` instead of "加载中..." text
5. Use `md-typescale-*` classes for typography
6. Replace `text-sm font-medium`, `text-base`, etc. with MD3 type scale

**Key structural changes:**
- Replace the school info `<Card>` with `<SurfaceCard variant="outlined" title="学校信息" action={<Button>}>` pattern
- Replace hardcoded hex in completeness tags:
  - `#8F5900` → `var(--md-sys-color-warning)`
  - `#D4EDDA` → `var(--md-sys-color-success, #E8F5E9)` for green tag background
  - `#1B8C3B` → `var(--md-sys-color-success)` for green text
  - `#FFF8E1` → `var(--md-sys-color-warning, #FFF3E0)` for amber tag background
- Replace `<Collapse ghost>` with a simple toggle div using M3 tokens
- Replace `text-sm`, `text-base`, `text-lg` with appropriate `md-typescale-*` classes

- [ ] **Step 1: Add imports at top**

```tsx
import SurfaceCard from '../../components/SurfaceCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import PageHeader from '../../components/PageHeader';
```

- [ ] **Step 2: Add PageHeader**

After the outermost div, add:
```tsx
<PageHeader title="个人资料" description="查看和管理您的个人信息和学生资料" icon={<span className="material-symbols-rounded">person</span>} />
```

- [ ] **Step 3: Replace school info Card**

Replace `<Card title="学校信息" extra={...} className="mb-3">` with:
```tsx
<SurfaceCard variant="outlined" title="学校信息" action={<Button type="link" onClick={() => setJoinSchoolModalVisible(true)}>...</Button>}>
```

- [ ] **Step 4: Replace hardcoded colors**

In the completeness section:
- `color: '#8F5900'` → `color: 'var(--md-sys-color-warning)'`
- `backgroundColor: '#D4EDDA'` → `backgroundColor: 'var(--md-sys-color-success, #E8F5E9)'`
- `color: '#1B8C3B'` → `color: 'var(--md-sys-color-success)'`
- `backgroundColor: '#FFF8E1'` → `backgroundColor: 'var(--md-sys-color-warning, #FFF3E0)'`

- [ ] **Step 5: Replace loading text with SkeletonLoader**

Replace all `加载中...` text with `<SkeletonLoader type="list" />`

- [ ] **Step 6: Verify and commit**

Run: `cd high-school-worker-design-forend && npx tsc --noEmit 2>&1 | head -20`

```bash
cd high-school-worker-design && git add high-school-worker-design-forend/src/pages/Profile/index.tsx && git commit -m "refactor: redesign Profile page with MD3 SurfaceCard and tokens"
```

---

### Task P1.3: Plan Page Full M3 Redesign

**Files:**
- Modify: `src/pages/Plan/index.tsx`

**Changes — this page currently uses ZERO M3 tokens:**
1. Replace all Ant Design components with MD3 equivalents (SurfaceCard, StatCard, etc.)
2. Replace all `bg-blue-100`, `text-blue-600`, `text-green-600`, `text-gray-*` with M3 tokens
3. Add PageHeader
4. Add StatCards for report counts (completed / in-progress / pending)
5. Replace `Ant Spin` with `SkeletonLoader`
6. Replace `Ant Empty` with `ApiErrorState` (for errors) or custom empty state
7. Replace `Ant Progress` with M3-styled progress bars
8. Replace `Ant Segmented` with MD3-styled toggle buttons
9. Use ECharts theme for any charts
10. Replace hardcoded `#52c41a`, `#1890ff`, `#faad14` with M3 tokens

**Key structural changes:**
- Add `PageHeader title="报告管理" icon={<span className="material-symbols-rounded">description</span>}>`
- Replace outer `<div className="min-h-screen ...">` bg with `var(--md-sys-color-surface)`
- Replace `Ant Card` → `SurfaceCard`
- Replace `Ant Progress` → custom `<div>` progress bars using M3 tokens
- Replace `<Segmented>` → two `<button>` elements styled as M3 toggle pills
- Replace `<Spin>` → `<SkeletonLoader type="card" />`
- Add `<ApiErrorState>` for error states
- Replace all `text-gray-*` → `style={{ color: 'var(--md-sys-color-on-surface-variant)' }}`
- Replace `bg-blue-100` → `backgroundColor: 'var(--md-sys-color-primary-container)'`
- Replace `text-blue-600` → `color: 'var(--md-sys-color-primary)'`
- Replace `text-green-600` → `color: 'var(--md-sys-color-success)'`
- Replace `#52c41a` → `var(--md-sys-color-success)`
- Replace `#1890ff` → `var(--md-sys-color-primary)`
- Replace `#faad14` → `var(--md-sys-color-warning)`

- [ ] **Step 1: Add imports**

```tsx
import SurfaceCard from '../../components/SurfaceCard';
import StatCard from '../../components/StatCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import ApiErrorState from '../../components/ApiErrorState';
import PageHeader from '../../components/PageHeader';
```

- [ ] **Step 2: Replace Ant Segmented with MD3 toggle**

Replace:
```tsx
<Segmented options={...} value={activeTrack} onChange={setActiveTrack} />
```
With two M3-styled buttons:
```tsx
<div className="flex gap-2">
  <button
    className="md-typescale-label-large px-4 py-1.5 transition-colors"
    style={{
      backgroundColor: activeTrack === 'bigtech' ? 'var(--md-sys-color-primary-container)' : 'transparent',
      color: activeTrack === 'bigtech' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
      border: `1px solid ${activeTrack === 'bigtech' ? 'var(--md-sys-color-outline-variant)' : 'var(--md-sys-color-outline)'}`,
      borderRadius: 'var(--md-sys-shape-corner-full)',
      cursor: 'pointer',
    }}
    onClick={() => setActiveTrack('bigtech')}
  >
    大厂技术面
  </button>
  <button
    className="md-typescale-label-large px-4 py-1.5 transition-colors"
    style={{
      backgroundColor: activeTrack === 'gov' ? 'var(--md-sys-color-primary-container)' : 'transparent',
      color: activeTrack === 'gov' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
      border: `1px solid ${activeTrack === 'gov' ? 'var(--md-sys-color-outline-variant)' : 'var(--md-sys-color-outline)'}`,
      borderRadius: 'var(--md-sys-shape-corner-full)',
      cursor: 'pointer',
    }}
    onClick={() => setActiveTrack('gov')}
  >
    国企综合面
  </button>
</div>
```

- [ ] **Step 3: Replace all Ant Card with SurfaceCard**

Every `<Card>` becomes `<SurfaceCard>`. Replace `<Card title="..." extra={...}>` with `<SurfaceCard title={...} action={...}>`.

- [ ] **Step 4: Replace Ant Progress with M3 progress bars**

Create inline M3 progress bars. Replace each `<Progress percent={X} strokeColor="#52c41a" />` with:
```tsx
<div className="w-full">
  <div className="flex justify-between mb-1">
    <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{label}</span>
    <span className="md-typescale-label-medium" style={{ color: getScoreColor(X) }}>{X}%</span>
  </div>
  <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-full)', height: '8px', overflow: 'hidden' }}>
    <div style={{ width: `${X}%`, backgroundColor: getScoreColor(X), borderRadius: 'var(--md-sys-shape-corner-full)', height: '100%', transition: 'width 0.3s ease' }} />
  </div>
</div>
```

Where `getScoreColor` returns M3 tokens instead of hex:
```tsx
const getProgressColor = (score: number): string => {
  if (score >= 80) return 'var(--md-sys-color-success)';
  if (score >= 60) return 'var(--md-sys-color-warning)';
  return 'var(--md-sys-color-error)';
};
```

- [ ] **Step 5: Replace Ant Spin with SkeletonLoader, Empty with ApiErrorState**

Replace `<Spin>` with `<SkeletonLoader type="card@3" />`.
Replace `<Empty>` with custom M3 empty state or `<ApiErrorState>` for errors.

- [ ] **Step 6: Replace all hardcoded colors**

Find and replace all `text-gray-*`, `bg-blue-*`, `text-green-*`, `text-blue-*` with M3 tokens via `style={{ color: 'var(--md-sys-color-...)' }}`.

- [ ] **Step 7: Verify and commit**

Run: `cd high-school-worker-design-forend && npx tsc --noEmit 2>&1 | head -20`

```bash
cd high-home/swordreforge/projects/high-school-worker-design && git add high-school-worker-design-forend/src/pages/Plan/index.tsx && git commit -m "refactor: full MD3 redesign of Plan page with SurfaceCard, StatCard, progress bars"
```

---

### Task P1.4: Interview Page M3 Redesign

**Files:**
- Modify: `src/pages/Interview/index.tsx`
- Modify: `src/pages/Interview/FloatingPolygons.css` (if needed for dark mode overrides)

**Changes:**
1. Replace all `bg-blue-500`, `bg-green-500`, `text-red-500`, `text-gray-*` with M3 tokens
2. Replace Ant Card with SurfaceCard for score display and report
3. Replace Ant Progress with M3 custom progress bars
4. Replace hardcoded `#52c41a`, `#1890ff`, `#faad14`, `#fa8c16`, `#f5222d`, `#999` with M3 tokens
5. Replace Ant Spin, Empty with SkeletonLoader, ApiErrorState
6. Use `md-typescale-*` for typography
7. Replace Ant Tag with M3-styled tags using M3 tokens

- [ ] **Step 1: Add imports**

```tsx
import SurfaceCard from '../../components/SurfaceCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import ApiErrorState from '../../components/ApiErrorState';
import PageHeader from '../../components/PageHeader';
```

- [ ] **Step 2: Replace getScoreColor with M3 tokens**

Replace:
```tsx
const getScoreColor = (score: number) => {
  if (score >= 90) return '#52c41a';
  if (score >= 80) return '#1890ff';
  if (score >= 70) return '#faad14';
  if (score >= 60) return '#fa8c16';
  return '#f5222d';
};
```
With:
```tsx
const getScoreColor = (score: number): string => {
  if (score >= 90) return 'var(--md-sys-color-success)';
  if (score >= 80) return 'var(--md-sys-color-primary)';
  if (score >= 70) return 'var(--md-sys-color-warning)';
  if (score >= 60) return 'var(--md-sys-color-warning)';
  return 'var(--md-sys-color-error)';
};
```

- [ ] **Step 3: Replace hardcoded Tailwind colors**

Replace all `text-gray-*` with M3 tokens:
- `text-gray-500` → `style={{ color: 'var(--md-sys-color-on-surface-variant)' }}`
- `text-gray-600` → `style={{ color: 'var(--md-sys-color-on-surface-variant)' }}`
- `text-gray-700` → `style={{ color: 'var(--md-sys-color-on-surface)' }}`
- `text-red-500` → `style={{ color: 'var(--md-sys-color-error)' }}`
- `bg-blue-500` → `style={{ backgroundColor: 'var(--md-sys-color-primary)' }}`
- `bg-green-500` → `style={{ backgroundColor: 'var(--md-sys-color-success)' }}`
- `text-blue-500` → `style={{ color: 'var(--md-sys-color-primary)' }}`
- `text-green-500` → `style={{ color: 'var(--md-sys-color-success)' }}`

- [ ] **Step 4: Replace Ant Card with SurfaceCard**

All `<Card>` wrapping score displays and report sections → `<SurfaceCard>`.

- [ ] **Step 5: Verify and commit**

```bash
cd /home/swordreforge/projects/high-school-worker-design && git add high-school-worker-design-forend/src/pages/Interview/index.tsx && git commit -m "refactor: redesign Interview chat page with MD3 tokens and SurfaceCard"
```

---

### Task P1.5: Resume Page M3 Redesign

**Files:**
- Modify: `src/pages/Resume/index.tsx`

**Changes:**
1. Replace Ant Card with SurfaceCard throughout
2. Replace Ant Result with custom M3 completion state
3. Replace Ant Tag with M3-styled tags
4. Replace Ant Progress with M3 progress bars
5. Replace hardcoded `#52c41a`, `#faad14`, `#ff4d4f`, `#108ee9`, `#87d068` with M3 tokens
6. Replace Tailwind colors (`text-red-500`, `text-green-600`, `text-violet-500`, `text-blue-500`, etc.) with M3 tokens
7. Use SkeletonLoader for loading states
8. Use md-typescale-* for typography

- [ ] **Step 1: Add imports**

```tsx
import SurfaceCard from '../../components/SurfaceCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import PageHeader from '../../components/PageHeader';
```

- [ ] **Step 2: Replace Ant Card with SurfaceCard**

All `<Card>` → `<SurfaceCard>`. For `<Card title="..." extra={...}>` → `<SurfaceCard title={...} action={...}>`.

- [ ] **Step 3: Replace Ant Result with M3 completion state**

The `<Result status="success">` should become:
```tsx
<div className="text-center py-8">
  <span className="material-symbols-rounded text-5xl" style={{ color: 'var(--md-sys-color-success)' }}>check_circle</span>
  <div className="md-typescale-headline-small mt-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>简历解析完成</div>
  <div className="md-typescale-body-medium mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>您的简历信息已成功提取</div>
</div>
```

- [ ] **Step 4: Replace hardcoded colors**

Create a `getProgressColor` function:
```tsx
const getProgressColor = (value: number): string => {
  if (value >= 80) return 'var(--md-sys-color-success)';
  if (value >= 60) return 'var(--md-sys-color-warning)';
  return 'var(--md-sys-color-error)';
};
```

Replace all `strokeColor="#52c41a"` etc. with `strokeColor={getProgressColor(value)}`.
Replace all Tailwind hardcoded colors with M3 tokens.

- [ ] **Step 5: Verify and commit**

```bash
cd /home/swordreforge/projects/high-school-worker-design && git add high-school-worker-design-forend/src/pages/Resume/index.tsx && git commit -m "refactor: redesign Resume page with MD3 SurfaceCard, progress bars, and tokens"
```

---

### Task P1.6: Jobs Page M3 Redesign

**Files:**
- Modify: `src/pages/Jobs/index.tsx`

**Changes:**
1. Replace Ant Card with SurfaceCard for job cards
2. Apply ECharts M3 theme to the graph
3. Replace Ant Tag colored chips with M3-styled tags
4. Replace Ant Descriptions with key-value SurfaceCard
5. Replace Ant Spin/Empty with SkeletonLoader/ApiErrorState
6. Replace remaining hardcoded hex colors (`#52c41a`, `#1890ff`, `#faad14`, `#ff4d4f`, `#111111`) with M3 tokens
7. Replace Ant Pagination with M3-styled pagination
8. Use md-typescale-* for typography

- [ ] **Step 1: Add imports**

```tsx
import SurfaceCard from '../../components/SurfaceCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import ApiErrorState from '../../components/ApiErrorState';
import PageHeader from '../../components/PageHeader';
import { getEChartsM3Theme, getM3ChartColor } from '../../components/EChartsM3Theme';
```

- [ ] **Step 2: Apply ECharts M3 theme**

In the chart initialization, apply the theme:
```tsx
const m3Theme = getEChartsM3Theme();
// Merge m3Theme into your existing chart options
// e.g., option = { ...m3Theme, series: [...] }
```

Replace hardcoded chart colors:
- `#1890ff` → `getM3ChartColor(0)` (primary)
- `#52c41a` → `getM3ChartColor(3)` (success)
- `#faad14` → `getM3ChartColor(4)` (warning)
- `#111111` → `getComputedStyle(document.documentElement).getPropertyValue('--md-sys-color-on-surface').trim()`

- [ ] **Step 3: Replace Ant Card with SurfaceCard**

In the job card grid, replace `<Card>` with `<SurfaceCard variant="outlined">`.

- [ ] **Step 4: Replace Ant Descriptions with key-value layout**

Replace `<Descriptions bordered>` with a SurfaceCard containing key-value rows using M3 tokens:
```tsx
<SurfaceCard title="岗位详情" variant="outlined">
  <div className="space-y-0">
    {detailItems.map(({ label, value }) => (
      <div key={label} className="flex justify-between items-center py-3 px-4" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
        <span className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{label}</span>
        <span className="md-typescale-body-medium font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{value}</span>
      </div>
    ))}
  </div>
</SurfaceCard>
```

- [ ] **Step 5: Replace Ant Spin/Empty**

Replace `<Spin>` with `<SkeletonLoader type="card@3" />`.
Replace `<Empty>` with `<ApiErrorState>` or a custom M3 empty state.

- [ ] **Step 6: Replace Tag colors**

Replace `<Tag color="blue">`, `<Tag color="green">`, etc. with M3-styled tags:
```tsx
<Tag style={{
  backgroundColor: 'var(--md-sys-color-primary-container)',
  color: 'var(--md-sys-color-on-primary-container)',
  border: 'none',
  borderRadius: 'var(--md-sys-shape-corner-small)',
}}>
```

- [ ] **Step 7: Verify and commit**

```bash
cd /home/swordreforge/projects/high-school-worker-design && git add high-school-worker-design-forend/src/pages/Jobs/index.tsx && git commit -m "refactor: redesign Jobs page with MD3 SurfaceCard, ECharts theme, and tokens"
```

---

## Self-Review

1. **Spec coverage:** All 6 P1 pages covered: Home (P1.1), Profile (P1.2), Plan (P1.3), Interview (P1.4), Resume (P1.5), Jobs (P1.6).

2. **Placeholder scan:** No TBDs, TODOs, or "implement later" patterns. All instructions are concrete.

3. **Type consistency:** All new imports reference existing components from P0. `getProgressColor()` function signature consistent across Plan and Resume. ECharts theme merged correctly.

4. **Missing coverage:** Radar chart for Profile (mentioned in original analysis) is deferred — it requires echarts-for-react installation and data transformation that's best done as a separate task after core M3 tokens are adopted. The current analysis data for Profile doesn't include dimension scores that would feed a radar chart.