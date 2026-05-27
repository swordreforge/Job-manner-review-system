# Landing Page 浅色主题优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Landing.tsx 落地页从深色主题切换为浅色主题，保留弹幕评论和横向轮播功能，整体布局贴近参考设计，同时大幅增加排版呼吸感。

**Architecture:** 单文件样式优化。仅修改 `Landing.tsx` 中的 className 和 style 属性，不改动组件逻辑、数据结构或子组件。所有改动通过 Tailwind CSS 类和 inline style 完成。

**Tech Stack:** React 19, Tailwind CSS v4, Framer Motion, Ant Design v6

---

## File Map

| 文件 | 操作 | 说明 |
|---|---|---|
| `high-school-worker-design-forend/src/pages/Home/Landing.tsx` | 修改 | 唯一需要修改的文件，所有样式改动集中于此 |
| `high-school-worker-design-forend/src/pages/Home/Landing.tsx.bak` | 已存在 | 备份文件，不修改 |

## 任务分解

### Task 1: 全局背景 + 导航栏浅色化

**Files:**
- Modify: `high-school-worker-design-forend/src/pages/Home/Landing.tsx:507-576`

- [ ] **Step 1: 修改全局背景容器**

将第 507-510 行的深色背景改为浅色渐变，移除 `text-white`：

```tsx
// 修改前 (line 507-510):
<motion.div
    className="min-h-screen text-white"
    style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%)' }}
>

// 修改后:
<motion.div
    className="min-h-screen"
    style={{ background: 'linear-gradient(160deg, #eef2ff 0%, #e0e7ff 20%, #ede9fe 40%, #e0f2fe 60%, #f0fdf4 80%, #fefce8 100%)' }}
>
```

- [ ] **Step 2: 修改导航栏背景**

将第 515 行导航栏改为白色毛玻璃：

```tsx
// 修改前 (line 515):
className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10"

// 修改后:
className="fixed top-0 left-0 right-0 z-50 bg-white/75 backdrop-blur-xl border-b border-gray-200/60 shadow-sm"
```

- [ ] **Step 3: 修改文档按钮样式**

将第 536 行文档按钮改为浅色：

```tsx
// 修改前 (line 536):
className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300"

// 修改后:
className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 transition-all duration-300"
```

- [ ] **Step 4: 修改浮动图标颜色**

将第 589 行浮动图标颜色改为 indigo：

```tsx
// 修改前 (line 589):
className="absolute text-purple-400/40"

// 修改后:
className="absolute text-indigo-400/50"
```

- [ ] **Step 5: 验证**

```bash
cd high-school-worker-design-forend && npm run lint
```

Expected: 无错误

- [ ] **Step 6: Commit**

```bash
git add high-school-worker-design-forend/src/pages/Home/Landing.tsx
git commit -m "style(landing): convert global background and navbar to light theme"
```

---

### Task 2: Hero 区域布局优化 + 宽松间距

**Files:**
- Modify: `high-school-worker-design-forend/src/pages/Home/Landing.tsx:578-666`

- [ ] **Step 1: 修改 Hero 容器和背景层**

将第 578-581 行 Hero 容器和背景层调整：

```tsx
// 修改前 (line 578-581):
<div className="relative min-h-screen flex flex-col items-center justify-center px-8 text-center overflow-hidden">
  <LaserGradient />
  <LaserRay />
  <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 -z-10" />

// 修改后:
<div className="relative min-h-screen flex flex-col items-center justify-center px-8 text-center overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 -z-10" />
```

移除 `<LaserGradient />` 和 `<LaserRay />` 两个组件调用（浅色主题下镭射效果不协调）。

- [ ] **Step 2: 修改 Hero 内容区 — 添加 Badge + 调整间距**

将第 601-665 行 Hero 内容区替换为宽松布局：

```tsx
// 修改前 (line 601-665):
<div className="relative z-10">
  <motion.div
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 15, stiffness: 200, duration: 0.8 }}
      className="inline-flex items-center justify-center w-36 h-36 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 mb-16 shadow-lg shadow-orange-500/30"
  >
    <motion.div
        animate={isShaking ? { rotate: [0, 15, -15, 10, -10, 5, -5, 0] } : { rotate: 0 }}
        transition={isShaking ? { duration: 0.6 } : { duration: 0 }}
        onClick={handleShakeClick}
        className="cursor-pointer"
    >
      <GraduationCapIcon className="w-20 h-20 text-white" />
    </motion.div>
  </motion.div>

  <motion.h1
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="text-6xl md:text-7xl font-bold mb-12"
  >
    你的私人<span className="rainbow-text">AI</span><br /><span className="rainbow-text">职业规划</span>助手
  </motion.h1>

  <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="text-2xl text-gray-400 max-w-3xl mx-auto mb-16 leading-relaxed"
  >
    AI驱动的职业发展解决方案，助你找到理想工作
    <br />
    <span className="text-gray-500">从职业测试到入职offer，一站式服务</span>
  </motion.p>

  <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="flex flex-col sm:flex-row gap-10 justify-center"
  >
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400 }}>
      <Button
          type="primary"
          size="large"
          icon={<RightOutlined />}
          onClick={() => navigate('/auth')}
          className="landing-cta-btn bg-gradient-to-r from-cyan-500 to-blue-500 border-0 hover:from-cyan-600 hover:to-blue-600 h-16 px-12 text-xl rounded-full shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300"
      >
        立即开始
      </Button>
    </motion.div>
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400 }}>
      <Button
          size="large"
          onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          className="border-gray-600 text-white hover:bg-gray-800 h-16 px-12 text-xl rounded-full shadow-lg hover:shadow-gray-500/30 transition-all duration-300"
      >
        了解更多
      </Button>
    </motion.div>
  </motion.div>
</div>

// 修改后:
<div className="relative z-10">
  {/* Badge - 顶部独立一行 */}
  <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-sm font-medium text-indigo-600 mb-8 backdrop-blur-sm"
  >
    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
    AI 驱动 · 免费使用
  </motion.div>

  {/* 独立行 gap */}
  <div className="h-8" />

  {/* Graduation Cap Icon - 下方独立一行 */}
  <motion.div
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 15, stiffness: 200, duration: 0.8 }}
      className="inline-flex items-center justify-center w-36 h-36 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 mb-12 shadow-lg shadow-orange-500/30"
  >
    <motion.div
        animate={isShaking ? { rotate: [0, 15, -15, 10, -10, 5, -5, 0] } : { rotate: 0 }}
        transition={isShaking ? { duration: 0.6 } : { duration: 0 }}
        onClick={handleShakeClick}
        className="cursor-pointer"
    >
      <GraduationCapIcon className="w-20 h-20 text-white" />
    </motion.div>
  </motion.div>

  {/* Title */}
  <motion.h1
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="text-6xl md:text-7xl font-bold mb-8"
      style={{ letterSpacing: '-1px', lineHeight: '1.3' }}
  >
    你的私人<span className="rainbow-text">AI</span><br /><span className="rainbow-text">职业规划</span>助手
  </motion.h1>

  {/* Subtitle */}
  <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="text-xl text-gray-600 max-w-3xl mx-auto mb-12"
      style={{ lineHeight: '1.9' }}
  >
    AI驱动的职业发展解决方案，助你找到理想工作
    <br />
    <span className="text-gray-500">从职业测试到入职offer，一站式服务</span>
  </motion.p>

  {/* CTA Buttons */}
  <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="flex flex-col sm:flex-row gap-5 justify-center"
  >
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400 }}>
      <Button
          type="primary"
          size="large"
          icon={<RightOutlined />}
          onClick={() => navigate('/auth')}
          className="landing-cta-btn bg-gradient-to-r from-cyan-500 to-blue-500 border-0 hover:from-cyan-600 hover:to-blue-600 h-16 px-12 text-xl rounded-full shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300"
      >
        立即开始
      </Button>
    </motion.div>
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400 }}>
      <Button
          size="large"
          onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          className="border-gray-300 text-gray-700 hover:bg-gray-100 h-16 px-12 text-xl rounded-full shadow-md hover:shadow-gray-300/50 transition-all duration-300"
      >
        了解更多
      </Button>
    </motion.div>
  </motion.div>
</div>
```

- [ ] **Step 3: 验证**

```bash
cd high-school-worker-design-forend && npm run lint
```

Expected: 无错误

- [ ] **Step 4: Commit**

```bash
git add high-school-worker-design-forend/src/pages/Home/Landing.tsx
git commit -m "style(landing): add badge, increase hero spacing, convert to light theme"
```

---

### Task 3: 功能轮播 + 指示器浅色化

**Files:**
- Modify: `high-school-worker-design-forend/src/pages/Home/Landing.tsx:668-789`

- [ ] **Step 1: 修改功能标题颜色**

```tsx
// 修改前 (line 675-678):
<h2 className="text-4xl font-bold mb-4">
  核心<span className="text-orange-400">功能</span>
</h2>
<p className="text-gray-400">全方位助你职业成长</p>

// 修改后:
<h2 className="text-4xl font-bold mb-4" style={{ color: '#0f172a' }}>
  核心<span className="text-orange-500">功能</span>
</h2>
<p className="text-gray-600">全方位助你职业成长</p>
```

- [ ] **Step 2: 修改轮播卡片为浅色**

```tsx
// 修改前 (line 715):
className="relative aspect-[16/9] shrink-0 overflow-hidden rounded-xl md:rounded-2xl border border-white/15 bg-[#11131a]"

// 修改后:
className="relative aspect-[16/9] shrink-0 overflow-hidden rounded-xl md:rounded-2xl border border-gray-200 bg-white shadow-lg"
```

- [ ] **Step 3: 修改卡片渐变遮罩**

```tsx
// 修改前 (line 734):
<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

// 修改后:
<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
```

- [ ] **Step 4: 修改指示器容器**

```tsx
// 修改前 (line 749):
<div className="inline-flex min-w-[320px] md:min-w-[44px] items-center justify-between gap-3 rounded-full border border-white/45 bg-white/15 px-6 py-2 backdrop-blur-md">

// 修改后:
<div className="inline-flex min-w-[320px] md:min-w-[44px] items-center justify-between gap-3 rounded-full border border-gray-300 bg-white/80 px-6 py-2 backdrop-blur-md shadow-sm">
```

- [ ] **Step 5: 修改指示点颜色**

```tsx
// 修改前 (line 756-757):
className={`h-2.5 rounded-full transition-all duration-300 ${
    idx === hoveredFeatureIndex ? 'relative w-16 overflow-hidden bg-white/30' : 'w-2.5 bg-white/60'
}`}

// 修改后:
className={`h-2.5 rounded-full transition-all duration-300 ${
    idx === hoveredFeatureIndex ? 'relative w-16 overflow-hidden bg-gray-300' : 'w-2.5 bg-gray-400'
}`}
```

- [ ] **Step 6: 修改指示点进度条颜色**

```tsx
// 修改前 (line 765):
className="feature-dot-progress absolute inset-y-0 left-0 rounded-full bg-white/95"

// 修改后:
className="feature-dot-progress absolute inset-y-0 left-0 rounded-full bg-indigo-600"
```

- [ ] **Step 7: 修改播放/暂停按钮**

```tsx
// 修改前 (line 779-781):
className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
    isFeatureAutoPlay ? 'bg-white/35 border-white/90 text-white' : 'bg-white/20 border-white/60 text-white/90'
}`}

// 修改后:
className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
    isFeatureAutoPlay ? 'bg-indigo-100 border-indigo-300 text-indigo-600' : 'bg-gray-100 border-gray-300 text-gray-600'
}`}
```

- [ ] **Step 8: 验证**

```bash
cd high-school-worker-design-forend && npm run lint
```

Expected: 无错误

- [ ] **Step 9: Commit**

```bash
git add high-school-worker-design-forend/src/pages/Home/Landing.tsx
git commit -m "style(landing): convert feature carousel and indicators to light theme"
```

---

### Task 4: ScrollStack 详情卡浅色化

**Files:**
- Modify: `high-school-worker-design-forend/src/pages/Home/Landing.tsx:791-876`

- [ ] **Step 1: 修改 ScrollStackItem 卡片背景**

```tsx
// 修改前 (line 805):
itemClassName="max-w-full mx-auto !bg-gradient-to-br !from-[#1a1d2c] !to-[#11131a] !border !border-white/10 !rounded-[2.5rem] !p-6 md:!p-10 !shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] !h-[55vh] min-h-[480px] w-full flex flex-col justify-start relative overflow-hidden"

// 修改后:
itemClassName="max-w-full mx-auto !bg-gradient-to-br !from-white !to-gray-50 !border !border-gray-200 !rounded-[2.5rem] !p-6 md:!p-10 !shadow-[0_8px_30px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] !h-[55vh] min-h-[480px] w-full flex flex-col justify-start relative overflow-hidden"
```

- [ ] **Step 2: 修改顶部装饰线和光晕**

```tsx
// 修改前 (line 808-813):
<div
    className="absolute top-0 inset-x-0 h-1.5 pointer-events-none opacity-80"
    style={{ background: "linear-gradient(90deg, transparent, rgba(251,146,60,0.8), transparent)" }}
/>

<div className="absolute -top-20 -left-20 w-64 h-64 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />
<div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

// 修改后:
<div
    className="absolute top-0 inset-x-0 h-1.5 pointer-events-none opacity-80"
    style={{ background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.6), transparent)" }}
/>

<div className="absolute -top-20 -left-20 w-64 h-64 bg-orange-200/20 blur-3xl rounded-full pointer-events-none" />
<div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-200/20 blur-3xl rounded-full pointer-events-none" />
```

- [ ] **Step 3: 修改图标背景**

```tsx
// 修改前 (line 817):
<div className="text-4xl md:text-5xl bg-gradient-to-br from-white/10 to-transparent p-4 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center shrink-0">

// 修改后:
<div className="text-4xl md:text-5xl bg-gradient-to-br from-gray-100 to-transparent p-4 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
```

- [ ] **Step 4: 修改标题和描述文字颜色**

```tsx
// 修改前 (line 821-822):
<h3 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">{item.title}</h3>
<p className="text-gray-400/90 text-base md:text-lg leading-snug">{item.desc}</p>

// 修改后:
<h3 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">{item.title}</h3>
<p className="text-gray-600 text-base md:text-lg leading-snug">{item.desc}</p>
```

- [ ] **Step 5: 修改分隔线**

```tsx
// 修改前 (line 826 和 832):
<div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent mb-5 shrink-0" />

// 修改后:
<div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5 shrink-0" />
```

- [ ] **Step 6: 修改描述文字**

```tsx
// 修改前 (line 829):
<p className="text-gray-300 text-base md:text-lg leading-relaxed font-light">{item.detailDesc}</p>

// 修改后:
<p className="text-gray-600 text-base md:text-lg leading-relaxed" style={{ lineHeight: '1.8' }}>{item.detailDesc}</p>
```

- [ ] **Step 7: 修改场景标签**

```tsx
// 修改前 (line 843-844):
className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md cursor-default"

// 修改后:
className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600 cursor-default"
```

- [ ] **Step 8: 修改效果数据卡片**

```tsx
// 修改前 (line 860-861):
className="text-center p-3 bg-white/5 border border-white/10 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm"

// 修改后:
className="text-center p-3 bg-gray-50 border border-gray-200 rounded-2xl"
```

- [ ] **Step 9: 验证**

```bash
cd high-school-worker-design-forend && npm run lint
```

Expected: 无错误

- [ ] **Step 10: Commit**

```bash
git add high-school-worker-design-forend/src/pages/Home/Landing.tsx
git commit -m "style(landing): convert ScrollStack detail cards to light theme"
```

---

### Task 5: 对比表格 + 弹幕评论 + CTA + Footer 浅色化

**Files:**
- Modify: `high-school-worker-design-forend/src/pages/Home/Landing.tsx:878-999`

- [ ] **Step 1: 修改对比表格标题**

```tsx
// 修改前 (line 886-889):
<h2 className="text-4xl font-bold mb-4">
  与市面<span className="text-orange-400">产品对比</span>
</h2>
<p className="text-gray-400">功能全面领先，让求职更简单</p>

// 修改后:
<h2 className="text-4xl font-bold mb-4" style={{ color: '#0f172a' }}>
  与市面<span className="text-orange-500">产品对比</span>
</h2>
<p className="text-gray-600">功能全面领先，让求职更简单</p>
```

- [ ] **Step 2: 修改对比表格容器**

```tsx
// 修改前 (line 897):
className="space-y-0 bg-[#11131a]/50 p-6 md:p-10 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-sm"

// 修改后:
className="space-y-0 bg-white/50 p-6 md:p-10 rounded-3xl border border-gray-200 shadow-xl"
```

- [ ] **Step 3: 修改表格头部边框和文字**

```tsx
// 修改前 (line 903):
className="grid grid-cols-4 gap-4 pb-5 border-b border-gray-700/80 text-sm md:text-base font-bold tracking-wide"

// 修改后:
className="grid grid-cols-4 gap-4 pb-5 border-b border-gray-200 text-sm md:text-base font-bold tracking-wide"
```

```tsx
// 修改前 (line 905):
<div className="text-left text-gray-400">功能对比</div>

// 修改后:
<div className="text-left text-gray-500">功能对比</div>
```

- [ ] **Step 4: 修改表格行样式**

```tsx
// 修改前 (line 916):
className="grid grid-cols-4 gap-4 py-5 border-b border-gray-800/80 items-center hover:bg-white/[0.02] transition-colors rounded-lg px-2 -mx-2"

// 修改后:
className="grid grid-cols-4 gap-4 py-5 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2"
```

```tsx
// 修改前 (line 918):
<div className="text-left font-medium text-gray-200">{row.feature}</div>

// 修改后:
<div className="text-left font-medium text-gray-700">{row.feature}</div>
```

- [ ] **Step 5: 修改弹幕评论标题**

```tsx
// 修改前 (line 935-938):
<h2 className="text-3xl font-bold mb-3">
  用户<span className="text-orange-400">真实评价</span>
</h2>
<p className="text-gray-400">听听他们的使用体验</p>

// 修改后:
<h2 className="text-3xl font-bold mb-3" style={{ color: '#0f172a' }}>
  用户<span className="text-orange-500">真实评价</span>
</h2>
<p className="text-gray-600">听听他们的使用体验</p>
```

- [ ] **Step 6: 修改弹幕容器**

```tsx
// 修改前 (line 941):
<div className="relative h-96 bg-gradient-to-r from-gray-800/30 via-gray-700/30 to-gray-800/30 rounded-xl overflow-hidden backdrop-blur-sm border border-gray-700/50">

// 修改后:
<div className="relative h-96 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
```

- [ ] **Step 7: 修改弹幕脉冲点颜色**

```tsx
// 修改前 (line 943-945):
<div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
<div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
<div className="absolute bottom-2 left-1/2 w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '1s' }}></div>

// 修改后:
<div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
<div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
<div className="absolute bottom-2 left-1/2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '1s' }}></div>
```

- [ ] **Step 8: 修改 CTA 标题和描述**

```tsx
// 修改前 (line 960):
className="text-3xl font-bold mb-6"

// 修改后:
className="text-3xl font-bold mb-6 text-white"
```

```tsx
// 修改前 (line 968):
className="text-gray-400 mb-8"

// 修改后:
className="text-gray-300 mb-8"
```

- [ ] **Step 9: 修改 Footer**

```tsx
// 修改前 (line 995):
className="px-6 py-8 border-t border-gray-800 text-center text-gray-500"

// 修改后:
className="px-6 py-8 border-t border-gray-200 text-center text-gray-500"
```

- [ ] **Step 10: 验证**

```bash
cd high-school-worker-design-forend && npm run lint
```

Expected: 无错误

- [ ] **Step 11: Commit**

```bash
git add high-school-worker-design-forend/src/pages/Home/Landing.tsx
git commit -m "style(landing): convert comparison table, barrage, CTA, footer to light theme"
```

---

### Task 6: 图片预览弹窗浅色化

**Files:**
- Modify: `high-school-worker-design-forend/src/pages/Home/Landing.tsx:1003-1037`

- [ ] **Step 1: 修改预览弹窗关闭按钮**

```tsx
// 修改前 (line 1023):
className="absolute -top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"

// 修改后:
className="absolute -top-4 right-4 w-10 h-10 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-all"
```

- [ ] **Step 2: 验证**

```bash
cd high-school-worker-design-forend && npm run lint
```

Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add high-school-worker-design-forend/src/pages/Home/Landing.tsx
git commit -m "style(landing): convert image preview modal button to light theme compatible"
```

---

### Task 7: 最终验证

- [ ] **Step 1: 运行 lint**

```bash
cd high-school-worker-design-forend && npm run lint
```

Expected: 无错误

- [ ] **Step 2: 运行 TypeScript 检查**

```bash
cd high-school-worker-design-forend && npx tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 3: 构建验证**

```bash
cd high-school-worker-design-forend && npm run build
```

Expected: 构建成功

- [ ] **Step 4: 最终 Commit（如有遗漏）**

```bash
git status
```
