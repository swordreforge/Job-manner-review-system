# Landing Page 浅色主题优化设计

## 概述

将 `Landing.tsx` 落地页从深色主题切换为浅色主题，保留弹幕评论和横向轮播功能，整体布局贴近参考设计 `HomeView.vue`，同时大幅增加排版呼吸感。

## 设计原则

1. **浅色为主**：背景 `#fafbfe` 浅色渐变，白色卡片，深色文字
2. **保留功能**：弹幕评论（BarrageCanvas）、横向轮播（feature gallery）、ScrollStack 详情卡全部保留
3. **宽松排版**：全面增加行高、字间距、区块间距
4. **品牌延续**：保留毕业帽图标 + 彩虹文字 + badge 三元素

## 页面结构

从上到下共 8 个区块：

1. **导航栏** — 白色毛玻璃 + 细边框
2. **Hero** — badge + 图标 + 彩虹标题 + 副标题 + CTA 按钮
3. **核心功能轮播** — 浅色卡片横向轮播
4. **ScrollStack 详情卡** — 白色渐变卡片
5. **产品对比表格** — 白色背景 + 浅色边框
6. **弹幕评论** — 浅灰渐变背景容器
7. **CTA** — 深色渐变卡片（保留对比感）
8. **Footer** — 浅色边框分隔

## 具体改动

### 1. 全局背景
- 当前：`linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%)`
- 优化后：`linear-gradient(160deg, #eef2ff 0%, #e0e7ff 20%, #ede9fe 40%, #e0f2fe 60%, #f0fdf4 80%, #fefce8 100%)`
- 移除 `text-white` 全局类

### 2. 导航栏
- 背景：`bg-white/75 backdrop-blur-xl border-b border-gray-200/60`
- 文档按钮：`bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700`
- 登录按钮保留渐变 `from-blue-500 to-cyan-500`

### 3. Hero 区域
- 浮动图标颜色：`text-indigo-400/50`
- Badge：独立行，`rgba(99,102,241,0.1)` 背景 + `1px solid rgba(99,102,241,0.2)` 边框
- Badge → Icon gap：`32px`（独立 div spacer）
- Icon → Title gap：`48px`
- Title → Subtitle gap：`32px`
- Subtitle → Buttons gap：`48px`
- Button 间距：`20px`
- 副标题：`text-gray-600`，`line-height: 1.9`，`font-size: 18px`
- "了解更多"按钮：`border-gray-300 text-gray-700 hover:bg-gray-100`

### 4. 功能轮播（Feature Gallery）
- 卡片背景：`bg-white border-gray-200 shadow-lg`
- 卡片渐变遮罩：`from-black/60 via-black/10 to-transparent`（减轻遮罩强度）
- 指示器容器：`border-gray-300 bg-white/80 shadow-sm`
- 指示点：非激活 `bg-gray-400`，激活 `bg-indigo-600`
- 播放按钮：`bg-indigo-100 border-indigo-300 text-indigo-600`

### 5. ScrollStack 详情卡
- 卡片背景：`from-white to-gray-50 border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.08)]`
- 顶部装饰线：`rgba(249,115,22,0.6)`
- 光晕：`bg-orange-200/20` 和 `bg-blue-200/20`
- 图标背景：`from-white/10 to-transparent` → 改为 `from-gray-100 to-transparent`
- 标题文字：`from-white to-gray-400` → 改为 `from-gray-900 to-gray-600`
- 描述文字：`text-gray-400` → `text-gray-600`
- 分隔线：`via-white/15` → `via-gray-200`
- 场景标签：`bg-white/5 border-white/10` → `bg-gray-50 border-gray-200`
- 效果数据卡片：`bg-white/5 border-white/10` → `bg-gray-50 border-gray-200`

### 6. 产品对比表格
- 容器：`bg-white/50 border-gray-200`
- 标题：`text-gray-900`，"产品对比"用 `text-orange-500`
- 副标题：`text-gray-600`
- 表格行 hover：`hover:bg-gray-50`
- 勾选图标：保持 `text-orange-500`

### 7. 弹幕评论
- 容器背景：`from-gray-100 via-gray-50 to-gray-100 border-gray-200`
- 标题：`text-gray-900`，"真实评价"用 `text-orange-500`
- 副标题：`text-gray-600`
- 脉冲点颜色：`bg-orange-500`、`bg-purple-500`、`bg-blue-500`
- **BarrageCanvas 组件本身不做修改**，仅改容器样式

### 8. CTA 区域
- 保持深色背景 `from-slate-800 to-slate-700`（与参考设计一致）
- 按钮：`from-orange-500 to-pink-500`

### 9. Footer
- 边框：`border-gray-200`
- 文字：`text-gray-500`

## Typography 参数

| 元素 | 属性 | 值 |
|---|---|---|
| 标题 | line-height | 1.3 |
| 标题 | letter-spacing | -1px |
| 标题 | font-weight | 800 |
| 副标题 | line-height | 1.9 |
| 副标题 | font-size | 18px (text-lg→text-xl) |
| 副标题 | color | text-gray-600 |
| 描述文字 | line-height | 1.8 |
| 描述文字 | font-size | 15px |
| 场景标签 | padding | 6px 14px |
| 场景标签 | border-radius | 999px (full) |
| 场景标签 | gap | 10px |

## 文件

- 源文件：`high-school-worker-design-forend/src/pages/Home/Landing.tsx`
- 备份文件：`high-school-worker-design-forend/src/pages/Home/Landing.tsx.bak`
- 不修改组件：`BarrageCanvas`、`ScrollStack`、`LaserRay`、`LaserGradient`（仅调整使用方式）
