import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, message, Spin, Card, Space } from 'antd';
import { ArrowLeftOutlined, RobotOutlined, FilePdfOutlined, FileWordOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined, HighlightOutlined, AlignLeftOutlined, AlignCenterOutlined, UnorderedListOutlined, OrderedListOutlined } from '@ant-design/icons';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { studentApi } from '../../api';
import { exportResumeToPDF, exportResumeToDOCX } from '../../utils/exportResume';
import type { Student } from '../../types';
import '../../styles/resume-print.css';
import '../../styles/tiptap-editor.css';

type EditorState = 'loading' | 'editing' | 'polishing' | 'ready';

export default function ResumeEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = (location.state as any)?.profile as Student | null;
  const historyId = (location.state as any)?.historyId as number | undefined;
  const [editorState, setEditorState] = useState<EditorState>(profile || historyId ? 'editing' : 'loading');
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
    if (!profile && !historyId) {
      message.error('请先上传简历');
      navigate('/resume');
      return;
    }
  }, [profile, historyId, navigate]);

  const handlePolish = useCallback(async () => {
    if (!profile) return;
    setPolishLoading(true);
    setEditorState('polishing');
    try {
      const userIdStr = localStorage.getItem('userId');
      const studentId = userIdStr ? parseInt(userIdStr, 10) : (profile?.id || 0);
      const response = await studentApi.polishResume({ studentId, historyId });
      if (response.code === 0 && response.htmlContent) {
        editor?.commands.setContent(response.htmlContent);
        setEditorState('ready');
        message.success('简历润色完成');
      } else {
        message.error(response.msg || '润色失败');
        setEditorState('editing');
      }
    } catch (err: unknown) {
      type ApiError = { response?: { status?: number } };
      const apiErr = err as ApiError;
      console.error('Polish error:', err);
      if (apiErr.response?.status === 401) {
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
    if (!editor || !profile) return;
    exportResumeToDOCX(profile, editor.getHTML());
  }, [editor, profile]);

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface-container)] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/resume')}>
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

        <Card
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <div className="p-3 border-b flex flex-wrap gap-2">
            <Button
              size="small"
              icon={<BoldOutlined />}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              type={editor?.isActive('bold') ? 'primary' : 'default'}
            >
              粗体
            </Button>
            <Button
              size="small"
              icon={<ItalicOutlined />}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              type={editor?.isActive('italic') ? 'primary' : 'default'}
            >
              斜体
            </Button>
            <Button
              size="small"
              icon={<UnderlineOutlined />}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              type={editor?.isActive('underline') ? 'primary' : 'default'}
            >
              下划线
            </Button>
            <Button
              size="small"
              icon={<HighlightOutlined />}
              onClick={() => editor?.chain().focus().toggleHighlight().run()}
              type={editor?.isActive('highlight') ? 'primary' : 'default'}
            >
              高亮
            </Button>
            <Button
              size="small"
              icon={<AlignLeftOutlined />}
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            >
              左对齐
            </Button>
            <Button
              size="small"
              icon={<AlignCenterOutlined />}
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            >
              居中
            </Button>
            <Button
              size="small"
              icon={<UnorderedListOutlined />}
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
            {editorState === 'polishing' ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Spin size="large" />
                <p className="mt-4 text-gray-500">AI正在优化您的简历...</p>
              </div>
            ) : (
              <div className="p-4" style={{ minHeight: 400 }}>
                <EditorContent editor={editor} className="resume-editor" />
              </div>
            )}
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
  );
}