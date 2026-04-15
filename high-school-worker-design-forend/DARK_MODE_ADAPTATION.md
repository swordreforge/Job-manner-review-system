# 前端暗色模式适配排查报告

> 排查日期: 2026-04-16  
> 排查范围: 除 /welcome 外的所有页面和组件

---

## 项目暗色模式实现机制

### CSS 变量系统 (Material Design 3)

项目使用 CSS 变量实现暗色模式切换，通过 `[data-theme="dark"]` 选择器覆盖变量值:

```css
/* light mode */
:root {
  --md-sys-color-surface: #FDFCFF;
  --md-sys-color-on-surface: #1B1B1F;
  --md-sys-color-surface-container: #F0EDF2;
  --md-sys-color-on-surface-variant: #44474F;
}

/* dark mode */
[data-theme="dark"] {
  --md-sys-color-surface: #1B1B1F;
  --md-sys-color-on-surface: #E4E1E6;
  --md-sys-color-surface-container: #211F26;
  --md-sys-color-on-surface-variant: #C4C6D0;
}
```

### 正确写法示例

```jsx
// ✅ 正确 - 使用 CSS 变量
<div style={{ 
  backgroundColor: 'var(--md-sys-color-surface-container)',
  color: 'var(--md-sys-color-on-surface)',
}}>

// ✅ 正确 - Ant Design 组件会自动适配（通过 index.css 覆盖）
<Card>

// ❌ 错误 - 硬编码颜色
<div className="bg-white text-gray-800">
```

---

## 已适配页面 (✅)

| 页面 | 状态 |
|------|------|
| Home/index.tsx | 完全使用 MD3 变量 |
| Jobs/index.tsx | 完全使用 MD3 变量 |

---

## 待适配页面清单

### 高优先级

#### 1. Resume/index.tsx

**需要修改的位置:**

| 行号 | 当前代码 | 建议修改 |
|------|----------|----------|
| ~428 | `text-gray-700` | `var(--md-sys-color-on-surface-variant)` |
| ~443 | `hover:bg-gray-50` | `hover:bg-[var(--md-sys-color-surface-container)]` |
| ~469 | `text-gray-500` | `var(--md-sys-color-on-surface-variant)` |
| ~480-488 | `text-green-500/red-500/blue-500/gray-400` | `var(--md-sys-color-success/error/primary/on-surface-variant)` |
| ~549 | `bg-red-50 border-red-200 text-red-600` | 需自定义 CSS 类 |
| ~601 | `Card size="small"` | Ant Design 卡片基本兼容 |

#### 2. Interview/index.tsx

**需要修改的位置:**

| 行号 | 问题 |
|------|------|
| ~760 | `text-gray-600` |
| ~797 | `text-gray-600`, `bg-blue-50` |
| ~838 | `text-gray-500` |
| ~874 | `bg-blue-500` |
| ~879 | `bg-white`, `shadow-sm` |
| ~903 | `from-green-50 to-blue-50` |
| ~1090 | `from-blue-50 to-indigo-50` |

#### 3. Holland/index.tsx

**需要修改的位置:**

| 行号 | 当前代码 | 建议修改 |
|------|----------|----------|
| ~82 | `text-gray-600` | `var(--md-sys-color-on-surface-variant)` |
| ~91 | `bg-white` | `var(--md-sys-color-surface-container)` |
| ~119 | `hover:bg-gray-100` | Ant Design 按钮 |
| ~129 | `text-gray-800` | `var(--md-sys-color-on-surface)` |
| ~142 | `bg-gray-200` | `var(--md-sys-color-surface-container-high)` |
| ~152 | `bg-white`, `shadow-sm` | Ant Design Card |
| ~170-172 | `border-gray-200`, `hover:border-orange-300`, `hover:bg-orange-50/50` | 需自定义 CSS |
| ~244-247 | `bg-green-100 text-green-700`, `bg-gray-100` | 需自定义 CSS |

#### 4. Holland/Result.tsx

**需要修改的位置:**

| 行号 | 问题 |
|------|------|
| ~53, 63, 91, 114, 125, 154, 170 | `text-gray-600/700/800` |
| ~116, 145 | `bg-gray-200` |
| ~168 | `from-orange-50 to-orange-100` |

#### 5. Holland/History.tsx

**需要修改的位置:**

| 行号 | 当前代码 |
|------|----------|
| ~58 | `text-gray-600` |
| ~75-77 | `bg-red-50 border-red-200 text-red-700` |
| ~82-103 | `bg-white`, `text-gray-400` |
| ~109 | `bg-white`, `shadow-sm` |
| ~132 | `text-gray-600` |
| ~133 | `text-gray-500` |

---

### 中优先级

#### 6. Profile/index.tsx

**需要修改的位置:**

| 行号 | 当前代码 | 建议修改 |
|------|----------|----------|
| ~257 | `#FFF8E1` | 警告色需定义变量 |
| ~259 | `#8F5900` | 警告色需定义变量 |
| ~391 | `#8F5900` (图标颜色) | `var(--md-sys-color-warning)` |
| ~476-477 | `#D4EDDA`, `#1B8C3B` | 成功色需使用兼容方式 |
| ~486-488 | `#FFF8E1`, `#8F5900` | 未完成状态色 |

#### 7. Settings/index.tsx

**需要修改的位置:**

| 行号 | 问题 |
|------|------|
| ~504 | `border-gray-100` |
| ~514 | `text-gray-500` |
| ~630 | `bg-white/90`, `border-gray-100` |
| ~686 | `bg-black/5` |

#### 8. Plan/index.tsx

**需要修改的位置:**

| 行号 | 当前代码 |
|------|----------|
| ~304 | `text-gray-500` |
| ~426 | `hover:bg-gray-100` |
| ~428 | `bg-blue-50`, `border-blue-200` |
| ~453-458 | `text-green-600`, `text-blue-600` |
| ~481 | `text-gray-500` |

#### 9. Doc/index.tsx

**需要修改的位置:**

| 行号 | 当前代码 |
|------|----------|
| ~102 | `text-gray-800` |
| ~151 | `bg-gray-50`, `border-gray-200` |
| ~158-162 | `hover:bg-gray-200`, `text-gray-800/600/500` |
| ~282 | `border-slate-200 bg-white` |
| ~294 | `text-slate-800` |
| ~298 | `bg-gray-100` |
| ~306 | `bg-white text-orange-600` |
| ~317 | `bg-slate-100 hover:bg-slate-200` |
| ~332 | `bg-slate-100 hover:bg-slate-200` |
| ~345 | `bg-slate-50 border-slate-200` |
| ~358 | `bg-white text-gray-600 border-gray-200` |
| ~374-376 | `bg-orange-50 text-orange-700` |
| ~389 | `bg-white` |

---

### 低优先级

#### 10. Student/index.tsx

主要使用 Ant Design 组件，基本兼容，需检查:
- Rate 组件的星星颜色
- 表单标签颜色

---

## 需要检查的组件

### GlobalBackground/index.tsx
- 已有暗色模式处理，但需验证

### SidebarNav/index.tsx
- 需检查导航项选中状态颜色

### TableOfContents/index.tsx
- 行 151: `bg-gray-50`, `border-gray-200`

### DocSearch/index.tsx
- 行 ~various: `bg-slate-100`

---

## 建议修复方案

### 方案 1: 增量式修复

按优先级逐页面修复，每次修改后验证暗色模式效果。

### 方案 2: 创建工具类

在 index.css 中添加通用暗色模式兼容类:

```css
/* 暗色模式兼容的颜色类 */
.dark-text-primary { color: var(--md-sys-color-primary); }
.dark-text-secondary { color: var(--md-sys-color-on-surface-variant); }
.dark-bg-surface { background-color: var(--md-sys-color-surface-container); }
.dark-bg-elevated { background-color: var(--md-sys-color-surface-container-high); }
.dark-border { border-color: var(--md-sys-color-outline-variant); }

/* 状态色 */
.dark-success-bg { background-color: var(--md-sys-color-success); }
.dark-warning-bg { background-color: var(--md-sys-color-warning); }
.dark-error-bg { background-color: var(--md-sys-color-error); }
```

---

## 执行检查清单

修复完成后需验证:

- [ ] 切换到暗色模式
- [ ] 检查每个页面的背景色是否正确
- [ ] 检查文字颜色对比度是否足够
- [ ] 检查边框/分隔线是否可见
- [ ] 检查按钮 hover 状态
- [ ] 检查卡片阴影效果
- [ ] 检查 modal/drawer 背景
- [ ] 检查图片和图标是否清晰

---

## 相关文件路径

- CSS 变量定义: `src/index.css`
- 主题 Store: `src/stores/index.ts`
- 主题初始化: `src/App.tsx`
- 布局组件: `src/layouts/MainLayout.tsx`