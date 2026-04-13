import { useState, useEffect, useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  FolderOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  RightOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  LoadingOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import LaserGradient from '../../components/LaserGradient';
import LaserRay from '../../components/LaserRay';
import DocSearch from '../../components/DocSearch';
import TableOfContents from '../../components/TableOfContents';

type DocConfig = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path?: string;
  expanded?: boolean;
  children?: DocConfig[];
};

interface DocStore {
  docs: DocConfig[];
  activeDocId: string | null;
  docContents: Record<string, string>;
  setActiveDocId: (id: string) => void;
  setDocs: (docs: DocConfig[]) => void;
  setDocContent: (id: string, content: string) => void;
  toggleFolder: (id: string) => void;
}

const useDocStore = create<DocStore>((set) => ({
  docs: [],
  activeDocId: null,
  docContents: {},
  setActiveDocId: (id) => set({ activeDocId: id }),
  setDocs: (docs) => set({ docs }),
  setDocContent: (id, content) =>
    set((state) => ({
      docContents: { ...state.docContents, [id]: content },
    })),
  toggleFolder: (id) =>
    set((state) => ({
      docs: toggleFolderInTree(state.docs, id),
    })),
}));

function toggleFolderInTree(items: DocConfig[], id: string): DocConfig[] {
  return items.map((item) => {
    if (item.id === id && item.type === 'folder') {
      return { ...item, expanded: !item.expanded };
    }
    if (item.children) {
      return { ...item, children: toggleFolderInTree(item.children, id) };
    }
    return item;
  });
}

function DocTree({ items, level = 0 }: { items: DocConfig[]; level?: number }) {
  const { activeDocId, setActiveDocId, toggleFolder } = useDocStore();

  return (
    <motion.ul
      className={level > 0 ? 'ml-4' : ''}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: level * 0.1 }}
    >
      {items.map((item, idx) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 + level * 0.1 }}
        >
          {item.type === 'folder' ? (
            <>
              <motion.button
                type="button"
                onClick={() => toggleFolder(item.id)}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm text-slate-700"
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(249, 115, 22, 0.1)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                {item.expanded ? (
                  <FolderOpenOutlined className="text-orange-500" />
                ) : (
                  <FolderOutlined className="text-orange-500" />
                )}
                <span className="flex-1 font-medium">{item.name}</span>
                <motion.div
                  animate={{ rotate: item.expanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <RightOutlined className="text-xs text-slate-400" />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {item.expanded && item.children && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <DocTree items={item.children} level={level + 1} />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <motion.button
              type="button"
              onClick={() => setActiveDocId(item.id)}
              className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm ${
                activeDocId === item.id
                  ? 'bg-orange-50 text-orange-700 font-medium'
                  : 'text-slate-600'
              }`}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(249, 115, 22, 0.1)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <FileTextOutlined
                className={activeDocId === item.id ? 'text-orange-500' : 'text-slate-400'}
              />
              <span>{item.name}</span>
            </motion.button>
          )}
        </motion.li>
      ))}
    </motion.ul>
  );
}

// 自定义 Markdown 渲染器，为标题添加 ID
function MarkdownHeading({ level, children }: { level: number; children: React.ReactNode }) {
  const text = typeof children === 'string' ? children : '';
  const id = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag id={id} className={`scroll-mt-20 ${level === 1 ? 'text-3xl font-bold' : level === 2 ? 'text-2xl font-semibold' : level === 3 ? 'text-xl font-medium' : 'text-lg font-medium'}`}>
      {children}
    </Tag>
  );
}

function DocContent() {
  const { docs, activeDocId, setActiveDocId, docContents, setDocContent } = useDocStore();

  const flattenDocs = (items: DocConfig[]): DocConfig[] => {
    const result: DocConfig[] = [];
    for (const item of items) {
      if (item.type === 'file' && item.path) {
        result.push(item);
      }
      if (item.children) {
        result.push(...flattenDocs(item.children));
      }
    }
    return result;
  };

  useEffect(() => {
    if (!activeDocId) return;
    const doc = flattenDocs(docs).find(d => d.id === activeDocId);
    if (!doc?.path || docContents[activeDocId]) return;

    fetch(doc.path)
      .then(res => res.text())
      .then(content => setDocContent(activeDocId, content))
      .catch(console.error);
  }, [activeDocId]);

  const allDocs = flattenDocs(docs);
  const currentIndex = allDocs.findIndex(d => d.id === activeDocId);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  const content = activeDocId ? docContents[activeDocId] : null;
  const loading = activeDocId && !content;

  if (!activeDocId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-full items-center justify-center text-slate-400"
      >
        <div className="text-center">
          <FileTextOutlined className="mb-3 text-4xl" />
          <p>选择左侧文档查看内容</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
      className="flex flex-col h-full"
    >
      <div className="flex flex-1 overflow-hidden">
        {/* 主要内容区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-slate-400">
              <LoadingOutlined className="mr-2 text-xl" />
              <span>加载中...</span>
            </div>
          ) : content ? (
            <div className="prose prose-slate max-w-3xl">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <MarkdownHeading level={1}>{children}</MarkdownHeading>,
                  h2: ({ children }) => <MarkdownHeading level={2}>{children}</MarkdownHeading>,
                  h3: ({ children }) => <MarkdownHeading level={3}>{children}</MarkdownHeading>,
                  h4: ({ children }) => <MarkdownHeading level={4}>{children}</MarkdownHeading>,
                  h5: ({ children }) => <MarkdownHeading level={5}>{children}</MarkdownHeading>,
                  h6: ({ children }) => <MarkdownHeading level={6}>{children}</MarkdownHeading>,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>

        {/* 右侧目录 */}
        {content && (
          <TableOfContents content={content} />
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 bg-slate-50">
        <motion.button
          type="button"
          onClick={() => prevDoc && setActiveDocId(prevDoc.id)}
          disabled={!prevDoc}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            prevDoc
              ? 'text-slate-700 hover:bg-slate-100'
              : 'text-slate-300 cursor-not-allowed'
          }`}
          whileHover={prevDoc ? { scale: 1.02 } : {}}
          whileTap={prevDoc ? { scale: 0.98 } : {}}
        >
          <ArrowLeftOutlined />
          <span>{prevDoc?.name || '已是第一篇'}</span>
        </motion.button>
        <span className="text-sm text-slate-400">
          {currentIndex + 1} / {allDocs.length}
        </span>
        <motion.button
          type="button"
          onClick={() => nextDoc && setActiveDocId(nextDoc.id)}
          disabled={!nextDoc}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            nextDoc
              ? 'text-slate-700 hover:bg-slate-100'
              : 'text-slate-300 cursor-not-allowed'
          }`}
          whileHover={nextDoc ? { scale: 1.02 } : {}}
          whileTap={nextDoc ? { scale: 0.98 } : {}}
        >
          <span>{nextDoc?.name || '已是最后一篇'}</span>
          <ArrowRightOutlined />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function DocPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const { docs, setDocs, setActiveDocId } = useDocStore();

  // 加载文档配置
  useEffect(() => {
    fetch('/docs/doc-config.json')
      .then(res => res.json())
      .then(config => {
        setDocs(config.docs || []);
        if (config.docs?.[0]?.children?.[0]) {
          setActiveDocId(config.docs[0].children[0].id);
        }
      })
      .catch(console.error);
  }, [setDocs, setActiveDocId]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K 或 Cmd+K 打开搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      // / 键打开搜索（当不在输入框中时）
      if (e.key === '/' && !isEditingContent(e)) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      // ESC 关闭搜索
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };

    function isEditingContent(event: KeyboardEvent): boolean {
      const element = event.target as HTMLElement;
      const tagName = element.tagName;

      return (
        element.isContentEditable ||
        tagName === 'INPUT' ||
        tagName === 'SELECT' ||
        tagName === 'TEXTAREA'
      );
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // 处理搜索结果点击
  const handleOpenDoc = useCallback((event: CustomEvent) => {
    const { docId } = event.detail;
    setActiveDocId(docId);
  }, [setActiveDocId]);

  useEffect(() => {
    window.addEventListener('openDoc', handleOpenDoc as EventListener);
    return () => window.removeEventListener('openDoc', handleOpenDoc as EventListener);
  }, [handleOpenDoc]);

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] flex-col">
      {/* 镭射效果背景 */}
      <LaserGradient />
      <LaserRay />

      <motion.div
        className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="lg:hidden"
          />
          <h1 className="text-lg font-semibold text-slate-800">使用文档</h1>
        </div>
        <motion.button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <SearchOutlined />
          <span className="hidden sm:inline">搜索</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">
            Ctrl K
          </kbd>
        </motion.button>
      </motion.div>

      <div className="flex flex-1 overflow-hidden">
        <motion.aside
          className={`w-64 flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-4 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:p-0 lg:opacity-0'
          }`}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className={sidebarOpen ? '' : 'hidden lg:block'}>
            <DocTree items={docs} />
          </div>
        </motion.aside>

        <motion.main
          className="flex-1 overflow-y-auto bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <DocContent />
        </motion.main>
      </div>

      {/* 搜索弹窗 */}
      <DocSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}