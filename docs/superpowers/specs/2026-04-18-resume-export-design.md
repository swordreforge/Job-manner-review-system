# 简历导出功能设计文档

## 目标

实现"AI解析 → 一键润色 → 在线编辑 → 导出PDF/DOCX"的完整简历功能链。

## 背景

当前简历功能已实现：
- 简历上传（PDF/DOCX）→ AI解析 → 结构化StudentProfile
- 优化建议生成
- 历史记录查看
- 智能合并去重

缺失的核心功能：
1. 根据优化建议自动润色简历
2. 在线编辑简历内容
3. 导出为可投递的简历文档

## 架构

整体流程：`AI解析结果 + 优化建议` → `一键AI润色(后端)` → `富文本简历内容` → `用户在线编辑` → `导出PDF/DOCX(前端)`

### 前端架构

```
Resume/index.tsx (现有)
  ├── 解析结果展示 (现有)
  └── "优化并导出" 按钮 (新增)
        ↓
ResumeEditor/index.tsx (新增)
  ├── AI润色状态 (loading/success/error)
  ├── 富文本编辑器 (TipTap)
  ├── 实时预览面板
  └── 导出按钮 (PDF/DOCX)
        ├── exportResumeToPDF() → html2canvas + jsPDF
        └── exportResumeToDOCX() → docx库
```

### 后端架构

```
新增API: POST /api/v1/students/resume/polish
  请求: { studentId: int64 }
  处理:
    1. 查询StudentProfile
    2. 查询优化建议
    3. 调用AI生成润色后的简历内容(富文本HTML)
  响应: { code: 0, data: { htmlContent: string, plainText: string } }
```

## 技术选型

| 功能 | 技术 | 理由 |
|------|------|------|
| 富文本编辑 | TipTap (ProseMirror) | React生态最成熟的富文本编辑器，扩展性强，中文支持好 |
| PDF导出 | html2canvas + jsPDF | 前端纯浏览器导出，不需后端依赖 |
| DOCX导出 | docx (npm包) | 纯JS生成DOCX，不依赖后端 |
| 打印样式 | @media print CSS | 支持浏览器原生打印 |
| AI润色 | 后端调用AI Provider | 已有DeepSeek/OpenAI集成，复用现有架构 |

## 数据模型

### 新增类型

```typescript
// 前端
interface ResumePolishResult {
  htmlContent: string;    // 润色后的简历HTML内容
  plainText: string;      // 纯文本版本（用于DOCX生成）
}

interface ResumeExportOptions {
  format: 'pdf' | 'docx';
  includeSuggestions: boolean;  // 是否包含优化建议
  template: 'classic';         // 模板类型，先只支持经典单栏
}
```

```go
// 后端
type ResumePolishReq struct {
    StudentId  int64  `json:"studentId,validate:"required,gt=0"`
    Template   string `json:"template,optional"`  // 模板类型，默认"classic"
}

type ResumePolishResp struct {
    Code        int    `json:"code"`
    Msg         string `json:"msg"`
    HtmlContent string `json:"htmlContent,optional"`
    PlainText   string `json:"plainText,optional"`
}
```

### AI Prompt设计（润色简历）

```
你是一名专业的简历优化师。请根据以下学生档案信息和优化建议，生成一份结构完整、语言专业的中文简历。

要求：
1. 使用经典单栏简历格式
2. 根据优化建议补充和改进内容
3. 语言精炼、专业，避免冗余
4. 如实反映已有信息，不编造不存在的内容
5. 返回HTML格式，使用内联样式，适合直接渲染和导出
6. 使用以下HTML结构：

<html>
<body>
<h1>姓名</h1>
<p>联系方式 | 邮箱 | 电话</p>
<h2>教育背景</h2>
<p>...</p>
<h2>技能</h2>
<ul><li>...</li></ul>
<h2>证书</h2>
<ul><li>...</li></ul>
<h2>实习经历</h2>
<div>...</div>
<h2>项目经历</h2>
<div>...</div>
</body>
</html>

学生档案：
{profileJSON}

优化建议：
{suggestions}
```

## 新增文件

| 文件路径 | 职责 |
|---------|------|
| `src/pages/ResumeEditor/index.tsx` | 简历编辑器页面（主页面） |
| `src/pages/ResumeEditor/EditorToolbar.tsx` | 编辑器工具栏（加粗/斜体等） |
| `src/pages/ResumeEditor/ExportPanel.tsx` | 导出面板（选择格式、导出按钮） |
| `src/utils/exportResume.ts` | PDF/DOCX导出工具函数 |
| `src/styles/resume-print.css` | 简历打印/导出专用CSS |
| `internal/handler/student/polishresumehandler.go` | 润色接口handler |
| `internal/logic/student/polishresumelogic.go` | 润色逻辑 |

## 修改文件

| 文件路径 | 修改内容 |
|---------|---------|
| `src/pages/Resume/index.tsx` | 解析结果区添加"优化并导出"按钮，跳转到编辑器 |
| `src/api/index.ts` | 新增 `polishResume` API 方法 |
| `src/types/index.ts` | 新增 `ResumePolishResult`, `ResumeExportOptions` 类型 |
| `internal/types/types.go` | 新增 `ResumePolishReq`, `ResumePolishResp` 类型 |
| `internal/handler/routes.go` | 注册 `/students/resume/polish` 路由 |
| `internal/svc/servicecontext.go` | 注册润色逻辑（如需） |
| `package.json` | 添加 `@tiptap/react`, `@tiptap/starter-kit`, `html2canvas`, `jspdf`, `docx` 依赖 |

## 交互流程

### 1. 解析结果页（现有页面修改）

在解析成功后的结果卡片中，新增按钮：
- "优化并导出简历" → 导航到 `/resume/editor`
- 需要将当前 StudentProfile 数据传递到编辑器页面

### 2. 简历编辑器页面（新增）

```
┌─────────────────────────────────────────────┐
│  ← 返回    简历优化编辑器     [导出PDF] [导出DOCX] │
├─────────────────────────────────────────────┤
│ 🤖 一键AI润色                                │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │                                        │  │
│ │  [富文本编辑器 - TipTap]               │  │
│ │                                        │  │
│ │  姓名：张三                             │  │
│ │  ──────────                            │  │
│ │  教育背景                               │  │
│ │  本科 · 计算机科学 · 2025届             │  │
│ │                                        │  │
│ │  技能                                   │  │
│ │  Python(80分) | Java(70分) | ...       │  │
│ │                                        │  │
│ │  实习经历                               │  │
│ │  某某公司 · 后端开发实习生 · 3个月       │  │
│ │  - 负责后端API开发...                   │  │
│ │                                        │  │
│ │  项目经历                               │  │
│ │  ...                                   │  │
│ └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 3. 导出流程

- **PDF**: 创建隐藏的渲染容器 → 渲染TipTap的HTML → html2canvas截图(scale=2) → jsPDF添加图片 → 下载
- **DOCX**: 从TipTap编辑器提取结构化数据 → docx库构建段落/表格 → 下载

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| AI润色失败 | 提示"润色失败，请重试"，仍可手动编辑导出 |
| 导出PDF失败 | 提示"导出失败，请尝试使用浏览器打印功能" |
| 导出DOCX失败 | 提示"导出失败，请尝试PDF格式" |
| 学生档案为空 | 跳转回简历上传页 |

## 分阶段实现

### 阶段1：基础框架（2天）
- 安装TipTap、html2canvas、jsPDF、docx依赖
- 创建 ResumeEditor 页面框架
- 实现基础富文本编辑器（查看/编辑模式）
- 实现从解析结果页跳转到编辑器

### 阶段2：AI润色（1-2天）
- 后端新增 `/students/resume/polish` 接口
- 实现AI润色Prompt和逻辑
- 前端调用润色API并展示结果

### 阶段3：PDF导出（1-2天）
- 创建简历打印CSS样式
- 实现html2canvas + jsPDF导出
- 导出前预览功能

### 阶段4：DOCX导出（1天）
- 实现docx库生成DOCX
- 结构化数据映射到DOCX段落

### 阶段5：集成优化（1天）
- 编辑器工具栏完善
- 导出质量测试
- 错误处理完善

## 开放问题

1. TipTap编辑器中的内容如何与结构化StudentProfile数据双向同步？（建议：润色后的内容作为纯富文本，不再同步回结构化数据）
2. 是否需要将润色后的内容保存到后端？（建议：暂不保存，导出即下载本地文件；后续可增加"保存草稿"功能）