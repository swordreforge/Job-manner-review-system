import React, { useState, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  FileTextOutlined,
  RightOutlined,
  LoadingOutlined,
  SearchOutlined,
  MenuOutlined,
  HomeOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import DocSearch from '../../components/DocSearch';
import GraduationCapLogo from '../../components/GraduationCapLogo';
import { useAuthStore } from '../../stores';

type DocConfig = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path?: string;
  expanded?: boolean;
  children?: DocConfig[];
  category?: string;
};

interface DocStore {
  docs: DocConfig[];
  activeDocId: string | null;
  docContents: Record<string, string>;
  setActiveDocId: (id: string) => void;
  setDocs: (docs: DocConfig[]) => void;
  setDocContent: (id: string, content: string) => void;
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
}));

interface Tab {
  id: string;
  title: string;
  docIds: string[];
}

const tabs: Tab[] = [
  { id: 'guide', title: '使用指南', docIds: ['welcome', 'quick-start', 'holland-test', 'resume-guide', 'plan-guide', 'interview-guide'] },
  { id: 'faq', title: '常见问题', docIds: ['faq'] },
];

interface Heading {
  level: number;
  text: string;
  id: string;
}

function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '');
      headings.push({ level, text, id });
    }
  }
  
  return headings;
}

function MarkdownHeading({ level, children, id }: { level: number; children: React.ReactNode; id?: string }) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const levelClasses = {
    1: 'text-3xl font-bold mb-6',
    2: 'text-2xl font-semibold mb-4 mt-8',
    3: 'text-xl font-medium mb-3 mt-6',
    4: 'text-lg font-medium mb-2 mt-4',
    5: 'text-base font-medium mb-2 mt-3',
    6: 'text-sm font-medium mb-2 mt-2',
  };

  return React.createElement(
    Tag,
    {
      id,
      className: `scroll-mt-20 text-gray-800 ${levelClasses[level as keyof typeof levelClasses] || ''}`
    },
    children
  );
}

function DocContent({ content }: { content: string }) {
  const headings = useMemo(() => extractHeadings(content), [content]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '');
                return <MarkdownHeading level={1} id={id}>{children}</MarkdownHeading>;
              },
              h2: ({ children }) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '');
                return <MarkdownHeading level={2} id={id}>{children}</MarkdownHeading>;
              },
              h3: ({ children }) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '');
                return <MarkdownHeading level={3} id={id}>{children}</MarkdownHeading>;
              },
              h4: ({ children }) => <MarkdownHeading level={4}>{children}</MarkdownHeading>,
              h5: ({ children }) => <MarkdownHeading level={5}>{children}</MarkdownHeading>,
              h6: ({ children }) => <MarkdownHeading level={6}>{children}</MarkdownHeading>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {headings.length > 0 && (
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">目录</h4>
            <nav className="space-y-1">
              {headings.filter(h => h.level <= 3).map((heading, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToHeading(heading.id)}
                  className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors hover:bg-gray-200 ${
                    heading.level === 1 ? 'font-medium text-gray-800' :
                    heading.level === 2 ? 'text-gray-600 pl-4' :
                    'text-gray-500 pl-8'
                  }`}
                >
                  {heading.text}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}

export default function DocPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { docs, setDocs, setActiveDocId, activeDocId, docContents, setDocContent } = useDocStore();

  const activeTabId = searchParams.get('tab') || 'guide';
  const activeDocParam = searchParams.get('doc');

  const allDocs = useMemo(() => {
    const flatten = (items: DocConfig[]): DocConfig[] => {
      const result: DocConfig[] = [];
      for (const item of items) {
        if (item.type === 'file' && item.path) {
          result.push(item);
        }
        if (item.children) {
          result.push(...flatten(item.children));
        }
      }
      return result;
    };
    return flatten(docs);
  }, [docs]);

  const currentTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const currentTabDocs = allDocs.filter(d => currentTab.docIds.includes(d.id));

  useEffect(() => {
    fetch('/docs/doc-config.json')
      .then(res => res.json())
      .then(config => {
        setDocs(config.docs || []);
      })
      .catch(console.error);
  }, [setDocs]);

  useEffect(() => {
    if (allDocs.length === 0) return;
    
    if (activeDocParam) {
      const doc = allDocs.find(d => d.id === activeDocParam);
      if (doc && doc.id !== activeDocId) {
        setActiveDocId(doc.id);
      }
    } else if (!activeDocId && currentTabDocs.length > 0) {
      setActiveDocId(currentTabDocs[0].id);
    }
  }, [activeDocParam, allDocs, currentTabDocs, activeDocId, setActiveDocId]);

  useEffect(() => {
    if (!activeDocId) return;
    const doc = allDocs.find(d => d.id === activeDocId);
    if (!doc?.path || docContents[activeDocId]) return;

    fetch(doc.path)
      .then(res => res.text())
      .then(content => setDocContent(activeDocId, content))
      .catch(console.error);
  }, [activeDocId, allDocs, docContents, setDocContent]);

  const handleTabChange = (tabId: string) => {
    const newTab = tabs.find(t => t.id === tabId);
    if (newTab && newTab.docIds.length > 0) {
      setSearchParams({ tab: tabId, doc: newTab.docIds[0] });
      setActiveDocId(newTab.docIds[0]);
    }
  };

  const handleDocSelect = (docId: string) => {
    setSearchParams({ tab: activeTabId, doc: docId });
    setActiveDocId(docId);
    setSidebarOpen(false);
  };

  const content = activeDocId ? docContents[activeDocId] : null;
  const loading = activeDocId && !content;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === '/' && !isEditingContent(e)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };

    function isEditingContent(event: KeyboardEvent): boolean {
      const element = event.target as HTMLElement;
      return element.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const sidebarContent = (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTabId === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {currentTabDocs.map((doc) => (
          <motion.button
            key={doc.id}
            type="button"
            onClick={() => handleDocSelect(doc.id)}
            className={`w-full flex items-center gap-2 rounded-lg p-2.5 text-left text-sm transition-all ${
              activeDocId === doc.id
                ? 'bg-indigo-50 text-indigo-700 font-medium border-l-2 border-indigo-500'
                : 'text-slate-600 hover:bg-gray-50 hover:shadow-sm'
            }`}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.15 }}
          >
            <FileTextOutlined className={activeDocId === doc.id ? 'text-indigo-500' : 'text-slate-400'} />
            <span className="flex-1">{doc.name}</span>
            {activeDocId === doc.id && <RightOutlined className="text-xs text-indigo-400" />}
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-[100vh] flex-col bg-white">
      {/* Header bar */}
      <motion.div
        className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-4 md:px-6 py-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <MenuOutlined className="text-gray-600" />
          </button>
          <Button
            type="text"
            icon={<HomeOutlined />}
            onClick={() => navigate(isAuthenticated ? '/start' : '/welcome')}
            className="text-gray-600 hover:text-indigo-600"
          />
          <h1 className="text-lg font-semibold text-gray-800">使用文档</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop tabs */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTabId === tab.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>

          <motion.button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <SearchOutlined />
            <span className="hidden sm:inline">搜索</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">
              Ctrl K
            </kbd>
          </motion.button>
        </div>
      </motion.div>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <motion.aside
          className="hidden lg:block w-64 flex-shrink-0 overflow-y-auto border-r border-gray-100 bg-gray-50/50"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {sidebarContent}
        </motion.aside>

        {/* Main content */}
        <motion.main
          className="flex-1 overflow-y-auto bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {!activeDocId ? (
            <div className="flex h-full items-center justify-center text-slate-400">
              <div className="text-center">
                <FileTextOutlined className="mb-3 text-4xl" />
                <p>选择一个文档开始阅读</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-32 text-slate-400">
              <LoadingOutlined className="mr-2 text-xl" />
              <span>加载中...</span>
            </div>
          ) : content ? (
            <DocContent content={content} />
          ) : null}
        </motion.main>
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <GraduationCapLogo className="w-7 h-7" />
                  <span className="font-semibold text-gray-900">文档目录</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <CloseOutlined className="text-gray-500" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(100vh-56px)]">
                {sidebarContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DocSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}