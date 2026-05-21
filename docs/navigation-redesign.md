# 导航架构改造要点：Google Material Design 3 风格

> 目标：将鉴权后界面从"可折叠侧边栏 + 移动端底部 TabBar"改造为参考项目 `frontend-for-reference` 中的 Google M3 导航抽屉模式。
> 参考文件：`frontend-for-reference/src/layouts/MainLayout.vue`

---

## 一、当前架构 vs 目标架构

| 维度 | 当前（SidebarNav + TabBar） | 目标（App Bar + Navigation Drawer） |
|---|---|---|
| 桌面端导航 | 固定左侧可折叠侧边栏（64px/220px） | 顶部应用栏 + 导航抽屉（320px，不可折叠） |
| 移动端导航 | antd-mobile TabBar（底部固定） | 临时导航抽屉（288px，汉堡菜单触发） |
| 导航项结构 | 图标 + 标题 | 图标 + 标题 + 描述文字 |
| 导航分组 | 无分组，扁平列表 | 按功能分组（如"常用"、"职业发展"等） |
| 快捷搜索 | 无 | 命令面板（Ctrl/⌘+K），全局搜索跳转 |
| 用户信息区 | 底部头像 + 用户名 + 角色 | 抽屉顶部用户卡片 + 底部快捷入口 chip |
| 状态感知 | 无 | 底部可嵌入状态卡片（如队列状态） |

---

## 二、核心改动清单

### 2.1 移除组件

- [ ] **删除 `SidebarNav` 组件** — `src/components/SidebarNav/index.tsx` 整体移除
- [ ] **移除 `antd-mobile TabBar`** — `MainLayout.tsx` 中移动端底部导航移除
- [ ] **移除折叠逻辑** — `isSidebarCollapsed`、`handleToggleSidebar`、`sidebarWidth` 等状态和计算

### 2.2 新增组件

- [ ] **`TopAppBar` 组件** — 顶部应用栏，包含：
  - 汉堡菜单按钮（仅移动端/平板显示，切换抽屉）
  - Logo + "职业规划助手" 标题
  - 角色标签 chip（学生/教师）
  - 命令面板触发按钮（"快速导航" + `Ctrl+K` 提示）
  - 帮助文档按钮
  - 主题切换按钮
  - 退出登录按钮
- [ ] **`NavigationDrawer` 组件** — 导航抽屉，包含：
  - 顶部：用户名 + 描述文字 + "打开命令面板" 按钮
  - 中部：分组导航列表（`v-list` 风格的 Ant Design 实现）
  - 底部：快捷入口 chip 区域
- [ ] **`CommandPalette` 组件** — 命令面板对话框：
  - 搜索输入框
  - 匹配结果列表（标题 + 描述 + 分组标签）
  - 键盘快捷键 `Ctrl/⌘+K` 全局监听

### 2.3 数据结构改造

- [ ] **导航项增加 `description` 字段**
  ```typescript
  interface NavItem {
    key: string;
    title: string;
    description: string;  // 新增
    icon: React.ReactNode;
    path: string;
    matchPaths?: string[];
  }
  ```

- [ ] **引入导航分组概念**
  ```typescript
  interface NavGroup {
    title: string;
    items: NavItem[];
  }
  ```

- [ ] **学生端分组示例**
  | 分组 | 导航项 |
  |---|---|
  | 常用 | 首页、岗位搜索、消息中心 |
  | 职业发展 | 职业规划、简历优化 |
  | 个人中心 | 个人资料、设置 |

- [ ] **教师端分组示例**
  | 分组 | 导航项 |
  |---|---|
  | 常用 | 工作台、学生管理 |
  | 管理 | 邀请码、预警管理 |
  | 其他 | 消息中心、个人中心 |

### 2.4 MainLayout 重构

- [ ] 移除 `SidebarNav` 引入和 `sidebarWidth` 相关逻辑
- [ ] 移除 `antd-mobile TabBar` 和 `shouldFixTabBar` 逻辑
- [ ] 新增 `drawerOpen` 状态，响应式控制（桌面端默认打开，移动端默认关闭）
- [ ] 新增 `commandOpen` 状态，控制命令面板
- [ ] 新增 `Ctrl/⌘+K` 全局键盘监听
- [ ] 布局结构改为：
  ```
  <TopAppBar />
  <NavigationDrawer />
  <main>
    <Outlet />
  </main>
  <CommandPalette />
  ```

### 2.5 响应式行为

| 屏幕宽度 | 抽屉行为 | 应用栏 |
|---|---|---|
| ≥ 1024px（桌面） | 固定显示，内容区 `margin-left: 320px` | 隐藏汉堡按钮，显示完整工具栏 |
| < 1024px（移动/平板） | 临时弹出（遮罩层），宽度 288px | 显示汉堡按钮，触发抽屉 |

---

## 三、设计语言对齐

### 3.1 颜色系统

全部使用已定义的 MD3 CSS 变量，禁止硬编码颜色：

| 元素 | CSS 变量 |
|---|---|
| 抽屉背景 | `--md-sys-color-surface-container` |
| 导航项激活背景 | `--md-sys-color-secondary-container` |
| 导航项激活文字 | `--md-sys-color-on-secondary-container` |
| 导航项默认文字 | `--md-sys-color-on-surface-variant` |
| 应用栏背景 | `--md-sys-color-surface` |
| 分割线 | `--md-sys-color-outline-variant` |

### 3.2 形状系统

| 元素 | CSS 变量 |
|---|---|
| 导航项圆角 | `--md-sys-shape-corner-small` (8px) |
| 按钮圆角 | `--md-sys-shape-corner-full` (pill) |
| 命令面板圆角 | `--md-sys-shape-corner-extra-large` (28px) |
| Chip 圆角 | `--md-sys-shape-corner-small` (8px) |

### 3.3 与参考项目的差异处理

| 差异点 | 处理方式 |
|---|---|
| 参考用 Vuetify，我们用 Ant Design | 用 Ant Design 组件模拟 M3 效果（`Drawer`、`List`、`Modal`、`Input`） |
| 参考用 `v-navigation-drawer` 的 `app` prop | 手动实现 `position: fixed` + 内容区 `margin-left` |
| 参考用 `v-app-bar` | 用自定义 div + `position: sticky` 实现 |
| 参考用 `v-list` 的 `nav` 模式 | 用 Ant Design `List` 或自定义 `ul/li` + MD3 样式 |

---

## 四、文件变更清单

| 操作 | 文件路径 | 说明 |
|---|---|---|
| 删除 | `src/components/SidebarNav/index.tsx` | 移除旧侧边栏 |
| 删除 | `src/components/SidebarNav/` 目录 | 清理整个目录 |
| 新增 | `src/components/TopAppBar/index.tsx` | 顶部应用栏 |
| 新增 | `src/components/NavigationDrawer/index.tsx` | 导航抽屉 |
| 新增 | `src/components/CommandPalette/index.tsx` | 命令面板 |
| 新增 | `src/composables/useNavItems.ts` | 导航项数据 + 分组逻辑 |
| 重构 | `src/layouts/MainLayout.tsx` | 核心布局重构 |
| 更新 | `src/index.css` | 新增导航相关 MD3 样式覆盖 |
| 更新 | `package.json` | 移除 `antd-mobile` 依赖（如不再使用） |

---

## 五、风险与注意事项

1. **`antd-mobile` 依赖** — 移除 TabBar 后需评估是否还有其他组件使用 `antd-mobile`，若无则可从 `package.json` 移除
2. **移动端触摸体验** — 临时抽屉在移动端需要良好的手势支持（滑动打开/关闭）
3. **路由匹配逻辑** — 当前的 `matchPaths` 逻辑需迁移到新的 `useNavItems` composable
4. **任务中断弹窗** — 现有 `handleTabChange` 中的任务中断确认逻辑需迁移到导航项点击处理中
5. **教师/学生角色切换** — 导航分组需根据 `role` 动态切换
6. **深色模式** — 所有新增组件必须完整适配 `[data-theme="dark"]`

---

## 六、验收标准

- [ ] 桌面端：固定 320px 导航抽屉 + 顶部应用栏，无折叠功能
- [ ] 移动端：汉堡菜单触发 288px 临时抽屉，无底部 TabBar
- [ ] 导航项包含图标 + 标题 + 描述三要素
- [ ] 导航项按分组展示
- [ ] `Ctrl/⌘+K` 可打开命令面板，支持关键词搜索
- [ ] 所有颜色使用 MD3 CSS 变量，无硬编码
- [ ] 深色模式完整适配
- [ ] 角色切换时导航项正确更新
- [ ] 任务中断确认逻辑正常工作
- [ ] `antd-mobile` 依赖已清理（如无其他用途）
