# 简历导出功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现"AI解析 → 一键润色 → 富文本编辑 → 导出PDF/DOCX"的完整简历功能链

**Architecture:** 前端使用TipTap富文本编辑器展示和编辑简历内容，后端新增润色API调用AI生成润色后的简历HTML，前端通过html2canvas+jsPDF导出PDF，通过docx库导出DOCX。学生从简历解析页点击"优化并导出"按钮，一键AI润色后在编辑器中自由编辑，最后选择格式下载。

**Tech Stack:** React + Ant Design + TipTap (富文本) + html2canvas + jsPDF + docx (前端) | Go + go-zero + AI Provider (后端)

---

## File Structure

### 新建文件

| 文件 | 职责 |
|------|------|
| `high-school-worker-design-forend/src/pages/ResumeEditor/index.tsx` | 简历编辑器主页面，路由 `/resume/editor` |
| `high-school-worker-design-forend/src/utils/exportResume.ts` | PDF和DOCX导出工具函数 |
| `high-school-worker-design-forend/src/styles/resume-print.css` | 简历打印/导出专用CSS |
| `internal/handler/student/polishresumehandler.go` | 润色接口handler |
| `internal/logic/student/polishresumelogic.go` | 润色逻辑，调用AI生成润色HTML |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `high-school-worker-design-forend/src/pages/Resume/index.tsx` | 解析结果区域添加"优化并导出"按钮，点击跳转到编辑器 |
| `high-school-worker-design-forend/src/api/index.ts` | 新增 `polishResume` API方法 |
| `high-school-worker-design-forend/src/types/index.ts` | 新增 `ResumePolishResult` 类型 |
| `high-school-worker-design-forend/src/App.tsx` | 新增 `/resume/editor` 路由 |
| `high-school-worker-design-forend/package.json` | 添加TipTap、html2canvas、jsPDF、docx依赖 |
| `internal/types/types.go` | 新增 `ResumePolishReq` 和 `ResumePolishResp` 类型 |
| `internal/handler/routes.go` | 注册 `/students/resume/polish` 路由 |
| `common/pkg/ai_provider.go` | 新增 `PolishResume` 方法到AIProvider接口 |

---

## Task 1: 安装前端依赖

**Files:**
- Modify: `high-school-worker-design-forend/package.json`

- [ ] **Step 1: 安装TipTap编辑器及导出相关依赖**

```bash
cd high-school-worker-design-forend && npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-highlight @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-placeholder html2canvas jspdf docx file-saver
```

- [ ] **Step 2: 安装TypeScript类型声明**

```bash
cd high-school-worker-design-forend && npm install -D @types/file-saver
```

- [ ] **Step 3: 验证安装成功**

```bash
cd high-school-worker-design-forend && npm ls @tiptap/react html2canvas jspdf docx
```

Expected: 列出已安装的包及版本号，无报错

- [ ] **Step 4: Commit**

```bash
git add high-school-worker-design-forend/package.json high-school-worker-design-forend/package-lock.json && git commit -m "chore: add tiptap, html2canvas, jspdf, docx dependencies"
```

---

## Task 2: 新增后端类型和AI润色方法

**Files:**
- Modify: `internal/types/types.go`
- Modify: `common/pkg/ai_provider.go`

- [ ] **Step 1: 在 `internal/types/types.go` 末尾添加润色请求和响应类型**

在 `types.go` 文件末尾（最后的 `}` 之前，或最后一个类型定义之后）添加：

```go
type ResumePolishReq struct {
	StudentId int64  `json:"studentId,validate:"required,gt=0"`
	Template  string `json:"template,optional"`
}

type ResumePolishResp struct {
	Code        int    `json:"code"`
	Msg         string `json:"msg"`
	HtmlContent string `json:"htmlContent,optional"`
	PlainText   string `json:"plainText,optional"`
}
```

- [ ] **Step 2: 在 `common/pkg/ai_provider.go` 的 `AIProvider` 接口中添加 `PolishResume` 方法**

在 `AIProvider` 接口定义中（约第17-26行），在 `GenerateTransferTargets` 方法之后添加：

```go
PolishResume(ctx context.Context, profileJSON, suggestions string) (string, error)
```

- [ ] **Step 3: 在 `common/pkg/ai_provider.go` 的 `OpenAIProvider` 结构体上实现 `PolishResume` 方法**

在文件末尾（`GenerateTransferTargets` 方法之后）添加：

```go
func (p *OpenAIProvider) PolishResume(ctx context.Context, profileJSON, suggestions string) (string, error) {
	prompt := `你是一名专业的简历优化师。请根据以下学生档案信息和优化建议，生成一份结构完整、语言专业的中文简历HTML内容。

要求：
1. 使用经典单栏简历格式，适合A4纸打印
2. 根据优化建议补充和改进内容
3. 语言精炼、专业，避免冗余
4. 如实反映已有信息，不编造不存在的内容
5. 使用内联CSS样式，不依赖外部CSS文件
6. 使用以下HTML结构（使用内联样式）：

<div style="max-width:800px;margin:0 auto;padding:40px;font-family:'Microsoft YaHei','SimSun',sans-serif;color:#333;line-height:1.6;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="margin:0;font-size:24px;color:#1a1a1a;">{姓名}</h1>
    <p style="margin:5px 0 0;color:#666;font-size:14px;">{学历} · {专业} · {毕业年份}届</p>
  </div>
  <div style="margin-bottom:20px;">
    <h2 style="font-size:16px;border-bottom:2px solid #1a73e8;padding-bottom:5px;color:#1a73e8;">技能</h2>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      {对每个技能: <span style="background:#e8f0fe;padding:4px 12px;border-radius:4px;font-size:13px;">{技能名} ({level}分)</span>}
    </div>
  </div>
  <div style="margin-bottom:20px;">
    <h2 style="font-size:16px;border-bottom:2px solid #1a73e8;padding-bottom:5px;color:#1a73e8;">证书</h2>
    <ul style="padding-left:20px;">
      {对每个证书: <li style="margin-bottom:4px;">{证书名} · {等级} · {获得年份}年</li>}
    </ul>
  </div>
  <div style="margin-bottom:20px;">
    <h2 style="font-size:16px;border-bottom:2px solid #1a73e8;padding-bottom:5px;color:#1a73e8;">实习经历</h2>
    {对每段实习: <div style="margin-bottom:12px;"><h3 style="margin:0;font-size:14px;">{公司} · {职位}</h3><p style="margin:2px 0;color:#888;font-size:12px;">{时长}个月</p><p style="margin:4px 0;font-size:13px;">{描述}</p></div>}
  </div>
  <div style="margin-bottom:20px;">
    <h2 style="font-size:16px;border-bottom:2px solid #1a73e8;padding-bottom:5px;color:#1a73e8;">项目经历</h2>
    {对每个项目: <div style="margin-bottom:12px;"><h3 style="margin:0;font-size:14px;">{项目名} · {角色}</h3><p style="margin:4px 0;font-size:13px;">{描述}</p><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">{对每个技术: <span style="background:#e8f5e9;padding:2px 8px;border-radius:3px;font-size:12px;">{技术}</span>}</div></div>}
  </div>
</div>

7. 不要包含 ```html 代码块标记，直接返回纯HTML
8. 不要在HTML外部添加任何文字说明
9. 确保中文内容准确、表达专业
10. 如果某些字段为空或null，则跳过该部分不显示

学生档案数据：
%s

优化建议：
%s`

	req := OpenAIRequest{
		Model: p.model,
		Messages: []ChatMessage{
			{Role: "system", Content: "你是一名专业的简历优化师，擅长将结构化数据转化为专业、美观的简历内容。只返回纯HTML，不包含任何其他文字。"},
			{Role: "user", Content: fmt.Sprintf(prompt, profileJSON, suggestions)},
		},
		MaxTokens:   4000,
		Temperature: 0.6,
	}

	content, err := p.callAPI(ctx, req)
	if err != nil {
		logx.Errorf("PolishResume failed: %v", err)
		return "", err
	}

	return content, nil
}
```

- [ ] **Step 4: 编译验证**

```bash
cd /home/swordreforge/projects/high-school-worker-design && go build ./...
```

Expected: 编译成功，无错误

- [ ] **Step 5: Commit**

```bash
git add internal/types/types.go common/pkg/ai_provider.go && git commit -m "feat: add PolishResume AI method and request/response types"
```

---

## Task 3: 新增后端润色API Handler和Logic

**Files:**
- Create: `internal/handler/student/polishresumehandler.go`
- Create: `internal/logic/student/polishresumelogic.go`

- [ ] **Step 1: 创建 `internal/logic/student/polishresumelogic.go`**

```go
package student

import (
	"context"
	"encoding/json"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type PolishResumeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewPolishResumeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *PolishResumeLogic {
	return &PolishResumeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *PolishResumeLogic) PolishResume(req *types.ResumePolishReq) (*types.ResumePolishResp, error) {
	logx.Infof("PolishResume called: studentId=%d", req.StudentId)

	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.ResumePolishResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	student, err := l.svcCtx.StudentModel.FindOneByUserId(l.ctx, userId)
	if err != nil {
		logx.Errorf("Failed to find student: %v", err)
		return &types.ResumePolishResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to find student profile",
		}, nil
	}

	profileJSON, err := json.Marshal(map[string]interface{}{
		"name":            student.Name.String,
		"education":       student.Education.String,
		"major":           student.Major.String,
		"graduationYear":  student.GraduationYear.Int64,
		"skills":          student.Skills.String,
		"certificates":    student.Certificates.String,
		"internship":      student.Internship.String,
		"projects":        student.Projects.String,
		"completeness":    student.CompletenessScore,
		"competitiveness": student.CompetitivenessScore,
	})
	if err != nil {
		logx.Errorf("Failed to marshal profile: %v", err)
		return &types.ResumePolishResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to marshal profile",
		}, nil
	}

	suggestions := "[]"
	if student.Suggestions.Valid && student.Suggestions.String != "" {
		suggestions = student.Suggestions.String
	}

	htmlContent, err := l.svcCtx.AIProvider.PolishResume(l.ctx, string(profileJSON), suggestions)
	if err != nil {
		logx.Errorf("PolishResume AI call failed: %v", err)
		return &types.ResumePolishResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to polish resume",
		}, nil
	}

	cleanHTML := htmlContent
	if len(cleanHTML) > 7 && cleanHTML[:7] == "```html" {
		endIdx := len(cleanHTML) - 3
		if endIdx > 7 {
			cleanHTML = cleanHTML[7:endIdx]
		}
	} else if len(cleanHTML) > 3 && cleanHTML[:3] == "```" {
		startIdx := 3
		endIdx := len(cleanHTML) - 3
		if endIdx > startIdx {
			cleanHTML = cleanHTML[startIdx:endIdx]
		}
	}

	plainText := stripHTMLTags(cleanHTML)

	return &types.ResumePolishResp{
		Code:        0,
		Msg:         "success",
		HtmlContent: cleanHTML,
		PlainText:   plainText,
	}, nil
}

func stripHTMLTags(html string) string {
	var result []rune
	inTag := false
	for _, r := range html {
		if r == '<' {
			inTag = true
			continue
		}
		if r == '>' {
			inTag = false
			continue
		}
		if !inTag {
			result = append(result, r)
		}
	}
	return string(result)
}
```

- [ ] **Step 2: 创建 `internal/handler/student/polishresumehandler.go`**

```go
package student

import (
	"net/http"

	"career-api/internal/logic/student"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func PolishResumeHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ResumePolishReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := student.NewPolishResumeLogic(r.Context(), svcCtx)
		resp, err := l.PolishResume(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
```

- [ ] **Step 3: 在 `internal/handler/routes.go` 的 students 路由组中注册新路由**

在学生路由组中（`Path: "/students/schools"` 之后），添加：

```go
			{
				// Polish resume with AI
				Method:  http.MethodPost,
				Path:    "/students/resume/polish",
				Handler: student.PolishResumeHandler(serverCtx),
			},
```

注意：此路由应放在需要认证的路由组中（现有的 `rest.WithPrefix("/api/v1")` 内）。

- [ ] **Step 4: 编译验证**

```bash
cd /home/swordreforge/projects/high-school-worker-design && go build ./...
```

Expected: 编译成功，无错误

- [ ] **Step 5: Commit**

```bash
git add internal/handler/student/polishresumehandler.go internal/logic/student/polishresumelogic.go internal/handler/routes.go && git commit -m "feat: add resume polish API endpoint and handler"
```

---

## Task 4: 新增前端类型和API方法

**Files:**
- Modify: `high-school-worker-design-forend/src/types/index.ts`
- Modify: `high-school-worker-design-forend/src/api/index.ts`

- [ ] **Step 1: 在 `high-school-worker-design-forend/src/types/index.ts` 末尾添加润色相关类型**

在文件最后一个类型定义之后（文件末尾）添加：

```typescript
export interface ResumePolishResult {
  htmlContent: string;
  plainText: string;
}

export interface ResumeExportOptions {
  format: 'pdf' | 'docx';
  template: 'classic';
}
```

- [ ] **Step 2: 在 `high-school-worker-design-forend/src/api/index.ts` 的 `studentApi` 对象中添加 `polishResume` 方法**

在 `studentApi` 对象中 `deleteResumeHistory` 方法之后（约117行）添加：

```typescript
  polishResume: (data: { studentId: number }) =>
    api.post<{ code: number; msg: string; htmlContent?: string; plainText?: string }>('/students/resume/polish', data, { timeout: 60000 }),
```

- [ ] **Step 3: Commit**

```bash
git add high-school-worker-design-forend/src/types/index.ts high-school-worker-design-forend/src/api/index.ts && git commit -m "feat: add polishResume API method and types"
```

---

## Task 5: 创建简历编辑器页面

**Files:**
- Create: `high-school-worker-design-forend/src/pages/ResumeEditor/index.tsx`
- Create: `high-school-worker-design-forend/src/styles/resume-print.css`

- [ ] **Step 1: 创建 `high-school-worker-design-forend/src/styles/resume-print.css`**

```css
@media print {
  body * {
    visibility: hidden;
  }
  .resume-export-area,
  .resume-export-area * {
    visibility: visible;
  }
  .resume-export-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}

.resume-export-container {
  font-family: 'Microsoft YaHei', 'SimSun', 'PingFang SC', sans-serif;
  color: #333;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  background: white;
}

.resume-export-container h1 {
  font-size: 24px;
  color: #1a1a1a;
  margin: 0 0 4px;
  text-align: center;
}

.resume-export-container h2 {
  font-size: 16px;
  color: #1a73e8;
  border-bottom: 2px solid #1a73e8;
  padding-bottom: 5px;
  margin-bottom: 12px;
}

.resume-export-container h3 {
  font-size: 14px;
  color: #1a1a1a;
  margin: 0;
}

.resume-export-container p {
  margin: 4px 0;
  font-size: 13px;
}

.resume-export-container ul {
  padding-left: 20px;
  margin: 4px 0;
}

.resume-export-container li {
  margin-bottom: 4px;
  font-size: 13px;
}

.resume-export-area {
  background: white;
}
```

- [ ] **Step 2: 创建 `high-school-worker-design-forend/src/pages/ResumeEditor/index.tsx`**

这是核心文件，包含TipTap编辑器、AI润色按钮、导出按钮。完整代码如下：

```tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, message, Spin, Card, Space, Modal } from 'antd';
import { ArrowLeft, RobotOutlined, FilePdfOutlined, FileWordOutlined, EditOutlined } from '@ant-design/icons';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { studentApi } from '../../api';
import { exportResumeToPDF, exportResumeToDOCX } from '../../utils/exportResume';
import '../../styles/resume-print.css';

type EditorState = 'loading' | 'editing' | 'polishing' | 'ready';

export default function ResumeEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = (location.state as any)?.profile;
  const [editorState, setEditorState] = useState<EditorState>(profile ? 'editing' : 'loading');
  const [polishLoading, setPolishLoading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: '点击 "AI润色简历" 生成简历内容，或直接编辑...',
      }),
    ],
    content: '',
    editable: true,
  });

  useEffect(() => {
    if (!profile) {
      message.error('请先上传简历');
      navigate('/resume');
      return;
    }
  }, [profile, navigate]);

  const handlePolish = useCallback(async () => {
    if (!profile) return;
    setPolishLoading(true);
    setEditorState('polishing');
    try {
      const userIdStr = localStorage.getItem('userId');
      const studentId = userIdStr ? parseInt(userIdStr, 10) : 0;
      const response = await studentApi.polishResume({ studentId: studentId || profile.id || 0 });
      if (response.code === 0 && response.htmlContent) {
        editor?.commands.setContent(response.htmlContent);
        setEditorState('ready');
        message.success('简历润色完成');
      } else {
        message.error(response.msg || '润色失败');
        setEditorState('editing');
      }
    } catch (err: any) {
      console.error('Polish error:', err);
      if (err?.response?.status === 401) {
        message.error('请先登录');
        setTimeout(() => navigate('/auth'), 1500);
        return;
      }
      message.error('AI润色失败，请重试');
      setEditorState('editing');
    } finally {
      setPolishLoading(false);
    }
  }, [editor, profile, navigate]);

  const handleExportPDF = useCallback(() => {
    if (!editor) return;
    const htmlContent = editor.getHTML();
    exportResumeToPDF(htmlContent);
  }, [editor]);

  const handleExportDOCX = useCallback(() => {
    if (!editor) return;
    const profileData = profile;
    exportResumeToDOCX(profileData, editor.getHTML());
  }, [editor, profile]);

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface-container)] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Button
            icon={<ArrowLeft />}
            onClick={() => navigate('/resume')}
          >
            返回
          </Button>
          <h1 className="text-xl font-bold">简历优化编辑器</h1>
          <Space>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              loading={polishLoading}
              onClick={handlePolish}
            >
              {polishLoading ? 'AI润色中...' : editorState === 'ready' ? '重新润色' : 'AI润色简历'}
            </Button>
          </Space>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <Card
              styles={{
                header: {
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                },
                body: {
                  backgroundColor: 'white',
                  padding: '0',
                },
              }}
            >
              <div className="p-4">
                <div className="flex gap-2 mb-3 border-b pb-2">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    type={editor?.isActive('bold') ? 'primary' : 'default'}
                  >
                    粗体
                  </Button>
                  <Button
                    size="small"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    type={editor?.isActive('italic') ? 'primary' : 'default'}
                  >
                    斜体
                  </Button>
                  <Button
                    size="small"
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    type={editor?.isActive('underline') ? 'primary' : 'default'}
                  >
                    下划线
                  </Button>
                  <Button
                    size="small"
                    onClick={() => editor?.chain().focus().toggleHighlight().run()}
                    type={editor?.isActive('highlight') ? 'primary' : 'default'}
                  >
                    高亮
                  </Button>
                  <Button
                    size="small"
                    onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                  >
                    左对齐
                  </Button>
                  <Button
                    size="small"
                    onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                  >
                    居中
                  </Button>
                  <Button
                    size="small"
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    type={editor?.isActive('bulletList') ? 'primary' : 'default'}
                  >
                    列表
                  </Button>
                  <Button
                    size="small"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    type={editor?.isActive('heading', { level: 2 }) ? 'primary' : 'default'}
                  >
                    标题2
                  </Button>
                  <Button
                    size="small"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    type={editor?.isActive('heading', { level: 3 }) ? 'primary' : 'default'}
                  >
                    标题3
                  </Button>
                </div>

                <div className="resume-export-area">
                  {editorState === 'polishing' || (editorState === 'loading' && !profile) ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Spin size="large" />
                      <p className="mt-4 text-gray-500">
                        {editorState === 'polishing' ? 'AI正在优化您的简历...' : '加载中...'}
                      </p>
                    </div>
                  ) : (
                    <EditorContent editor={editor} className="resume-editor" />
                  )}
                </div>
              </div>
            </Card>

            <div className="flex justify-center gap-4 mt-4">
              <Button
                type="primary"
                size="large"
                icon={<FilePdfOutlined />}
                onClick={handleExportPDF}
                disabled={editorState === 'polishing' || !editor?.getText()}
              >
                导出PDF
              </Button>
              <Button
                size="large"
                icon={<FileWordOutlined />}
                onClick={handleExportDOCX}
                disabled={editorState === 'polishing' || !editor?.getText()}
              >
                导出DOCX
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add high-school-worker-design-forend/src/pages/ResumeEditor/index.tsx high-school-worker-design-forend/src/styles/resume-print.css && git commit -m "feat: create ResumeEditor page with TipTap editor and polish button"
```

---

## Task 6: 创建导出工具函数

**Files:**
- Create: `high-school-worker-design-forend/src/utils/exportResume.ts`

- [ ] **Step 1: 创建 `high-school-worker-design-forend/src/utils/exportResume.ts`**

```typescript
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import type { Student } from '../types';

export async function exportResumeToPDF(htmlContent: string): Promise<void> {
  const container = document.createElement('div');
  container.className = 'resume-export-container';
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.background = 'white';
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    const xOffset = (pdfWidth - scaledWidth) / 2;

    let heightLeft = scaledHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', xOffset, position, scaledWidth, scaledHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - scaledHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', xOffset, position, scaledWidth, scaledHeight);
      heightLeft -= pdfHeight;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    pdf.save(`简历_${timestamp}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

export async function exportResumeToDOCX(profile: Student | null, htmlContent: string): Promise<void> {
  const sections: Paragraph[] = [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const name = doc.querySelector('h1')?.textContent || profile?.name || '未命名';
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: name, bold: true, size: 48 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  const subtitle = doc.querySelector('h1 + p')?.textContent || '';
  if (subtitle) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: subtitle, size: 24, color: '666666' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  const h2Elements = doc.querySelectorAll('h2');
  h2Elements.forEach((h2) => {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: h2.textContent || '', bold: true, size: 32, color: '1a73e8' })],
        spacing: { before: 200, after: 100 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: '1a73e8' },
        },
      })
    );

    let sibling = h2.nextElementSibling;
    while (sibling && sibling.tagName !== 'H2') {
      if (sibling.tagName === 'P' || sibling.tagName === 'H3') {
        const isH3 = sibling.tagName === 'H3';
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sibling.textContent || '',
                bold: isH3,
                size: isH3 ? 28 : 24,
              }),
            ],
            spacing: { before: isH3 ? 100 : 40, after: 40 },
          })
        );
      } else if (sibling.tagName === 'UL' || sibling.tagName === 'OL') {
        const items = sibling.querySelectorAll('li');
        items.forEach((li) => {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${li.textContent || ''}`, size: 24 })],
              spacing: { before: 20, after: 20 },
              indent: { left: 400 },
            })
          );
        });
      } else if (sibling.tagName === 'DIV') {
        const h3 = sibling.querySelector('h3');
        if (h3) {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: h3.textContent || '', bold: true, size: 28 })],
              spacing: { before: 100, after: 40 },
            })
          );
        }
        const ps = sibling.querySelectorAll('p');
        ps.forEach((p) => {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: p.textContent || '', size: 24 })],
              spacing: { before: 20, after: 20 },
            })
          );
        });
        const spans = sibling.querySelectorAll('span');
        if (spans.length > 0 && !h3) {
          const spanTexts = Array.from(spans).map(s => s.textContent || '').filter(t => t.trim());
          if (spanTexts.length > 0) {
            sections.push(
              new Paragraph({
                children: [new TextRun({ text: spanTexts.join(' | '), size: 24 })],
                spacing: { before: 40, after: 40 },
              })
            );
          }
        }
      }

      sibling = sibling.nextElementSibling;
    }
  });

  if (profile) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: '', size: 24 })],
        spacing: { before: 200 },
      })
    );

    if (profile.suggestions && profile.suggestions.length > 0) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: '优化建议', bold: true, size: 32, color: '1a73e8' })],
          spacing: { before: 200, after: 100 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '1a73e8' },
          },
        })
      );
      profile.suggestions.forEach((suggestion) => {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${suggestion}`, size: 24 })],
            spacing: { before: 20, after: 20 },
            indent: { left: 400 },
          })
        );
      });
    }
  }

  const docxDoc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: sections,
    }],
  });

  const blob = await Packer.toBlob(docxDoc);
  const timestamp = new Date().toISOString().slice(0, 10);
  saveAs(blob, `简历_${timestamp}.docx`);
}
```

- [ ] **Step 2: Commit**

```bash
git add high-school-worker-design-forend/src/utils/exportResume.ts && git commit -m "feat: add PDF/DOCX export utility functions"
```

---

## Task 7: 注册路由并在简历解析页添加入口

**Files:**
- Modify: `high-school-worker-design-forend/src/App.tsx`
- Modify: `high-school-worker-design-forend/src/pages/Resume/index.tsx`

- [ ] **Step 1: 在 `high-school-worker-design-forend/src/App.tsx` 中添加 ResumeEditor 路由**

在现有的 lazy import 区域（约第15行附近，`const ResumePage = lazy(...)` 之后）添加：

```typescript
const ResumeEditorPage = lazy(() => import('./pages/ResumeEditor'));
```

在路由区域中，`/resume` 路由之后添加：

```tsx
              <Route
                path="resume/editor"
                element={
                  <ProtectedRoute>
                    <ResumeEditorPage />
                  </ProtectedRoute>
                }
              />
```

- [ ] **Step 2: 在 `high-school-worker-design-forend/src/pages/Resume/index.tsx` 中添加"优化并导出"按钮**

在解析成功后的 `Result` 组件的 `extra` 数组中（约第663行），在现有的 `<Button type="primary" key="optimize"...>` 之后添加一个导出按钮。找到这段代码：

```tsx
                      <Button
                        type="primary"
                        key="optimize"
                        onClick={() => {
                          const element = document.getElementById('suggestions-section');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                      >
                        查看优化建议
                      </Button>,
                      <Button key="reset" icon={<ReloadOutlined />} onClick={handleReset}>
                        重新上传
                      </Button>,
```

替换为：

```tsx
                      <Button
                        type="primary"
                        key="optimize"
                        onClick={() => {
                          const element = document.getElementById('suggestions-section');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                      >
                        查看优化建议
                      </Button>,
                      <Button
                        key="export"
                        onClick={() => navigate('/resume/editor', { state: { profile } })}
                      >
                        优化并导出简历
                      </Button>,
                      <Button key="reset" icon={<ReloadOutlined />} onClick={handleReset}>
                        重新上传
                      </Button>,
```

同时在文件顶部添加 `useNavigate` 导入（在已有的 `import { useState, useEffect } from 'react';` 行中添加 `useNavigate`）：

将：
```tsx
import { useState, useEffect } from 'react';
```
改为：
```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
```

并在组件函数开头添加：
```tsx
  const navigate = useNavigate();
```

在 `const [fileList, setFileList] = useState<UploadFile[]>([]);` 之前添加即可。

- [ ] **Step 3: 验证前端编译**

```bash
cd high-school-worker-design-forend && npx tsc --noEmit 2>&1 | head -20
```

Expected: 无类型错误（可能有少量警告可忽略）

- [ ] **Step 4: Commit**

```bash
git add high-school-worker-design-forend/src/App.tsx high-school-worker-design-forend/src/pages/Resume/index.tsx && git commit -m "feat: add ResumeEditor route and export button on Resume page"
```

---

## Task 8: 添加TipTap编辑器样式

**Files:**
- Modify: `high-school-worker-design-forend/src/styles/resume-print.css` (已在Task 5中创建)
- Create: `high-school-worker-design-forend/src/styles/tiptap-editor.css`

- [ ] **Step 1: 创建 `high-school-worker-design-forend/src/styles/tiptap-editor.css`**

```css
.resume-editor .tiptap {
  outline: none;
  min-height: 400px;
  padding: 16px;
  font-family: 'Microsoft YaHei', 'SimSun', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #333;
}

.resume-editor .tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

.resume-editor .tiptap h1 {
  font-size: 24px;
  font-weight: bold;
  color: #1a1a1a;
  text-align: center;
  margin: 0 0 4px;
}

.resume-editor .tiptap h2 {
  font-size: 16px;
  color: #1a73e8;
  border-bottom: 2px solid #1a73e8;
  padding-bottom: 5px;
  margin-bottom: 12px;
}

.resume-editor .tiptap h3 {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 600;
  margin: 8px 0 4px;
}

.resume-editor .tiptap ul {
  padding-left: 20px;
  list-style-type: disc;
}

.resume-editor .tiptap ol {
  padding-left: 20px;
  list-style-type: decimal;
}

.resume-editor .tiptap li {
  margin-bottom: 4px;
}

.resume-editor .tiptap p {
  margin: 4px 0;
}

.resume-editor .tiptap mark {
  background-color: #fef08a;
  padding: 0 2px;
  border-radius: 2px;
}

.resume-editor .tiptap div {
  margin-bottom: 8px;
}

.resume-editor .tiptap span {
  font-size: 13px;
}

.resume-editor .tiptap a {
  color: #1a73e8;
  text-decoration: underline;
}

.resume-editor .tiptap strong {
  font-weight: 600;
}

.resume-editor .tiptap em {
  font-style: italic;
}

.resume-editor .tiptap u {
  text-decoration: underline;
}
```

- [ ] **Step 2: 在 ResumeEditor 页面中导入样式**

在 `high-school-worker-design-forend/src/pages/ResumeEditor/index.tsx` 已有的导入部分末尾，已有：
```tsx
import '../../styles/resume-print.css';
```

在其后添加：
```tsx
import '../../styles/tiptap-editor.css';
```

- [ ] **Step 3: Commit**

```bash
git add high-school-worker-design-forend/src/styles/tiptap-editor.css high-school-worker-design-forend/src/pages/ResumeEditor/index.tsx && git commit -m "feat: add TipTap editor styles"
```

---

## Task 9: 集成测试和验证

**Files:**
- No new files

- [ ] **Step 1: 启动后端服务**

```bash
cd /home/swordreforge/projects/high-school-worker-design && go build -o career-api-test career.go 2>&1 | head -20
```

Expected: 编译成功

- [ ] **Step 2: 启动前端开发服务器**

```bash
cd high-school-worker-design-forend && npm run build 2>&1 | tail -10
```

Expected: 构建成功，无致命错误

- [ ] **Step 3: 验证新增路由**

确认以下路由存在：
- `/resume/editor` - 简历编辑器页面
- `POST /api/v1/students/resume/polish` - 后端润色API

- [ ] **Step 4: 验证AI润色接口逻辑**

检查 `polishresumelogic.go` 中：
1. 从数据库查询学生档案 ✓
2. 序列化profile为JSON ✓
3. 获取suggestions ✓
4. 调用AI Provider的PolishResume方法 ✓
5. 清理返回的HTML（移除markdown标记） ✓
6. 返回htmlContent和plainText ✓

- [ ] **Step 5: 验证前端编辑器流程**

检查 ResumeEditor 页面：
1. 从简历页跳转并通过location.state传入profile数据 ✓
2. 无profile数据时重定向回/resume ✓
3. TipTap编辑器正确渲染 ✓
4. AI润色按钮调用API ✓
5. PDF导出按钮创建临时容器渲染HTML ✓
6. DOCX导出按钮解析HTML并构建文档 ✓

- [ ] **Step 6: 最终Commit**

```bash
git add -A && git commit -m "feat: resume editor with AI polish and PDF/DOCX export - complete"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- ✅ AI润色 API（后端） → Task 2, 3
- ✅ 富文本编辑器（前端TipTap）→ Task 5
- ✅ PDF导出 → Task 6
- ✅ DOCX导出 → Task 6
- ✅ 简历解析页添加入口 → Task 7
- ✅ 经典单栏模板 → AI Prompt中定义
- ✅ 一键AI润色 → Task 2, 3, 5

**2. Placeholder scan:**
- 无TBD/TODO
- 无"implement later"
- 所有步骤都有完整代码

**3. Type consistency:**
- `ResumePolishReq/ResumePolishResp` (Go) ↔ `polishResume` API (TS) ↔ `ResumePolishResult` (TS) - 字段名一致：`studentId`, `htmlContent`, `plainText`
- `Student` type used consistently for profile data
- Route `/students/resume/polish` matched in both routes.go and api/index.ts