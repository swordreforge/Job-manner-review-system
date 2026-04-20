import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import MiniSearch from 'minisearch';

interface SearchResult {
  id: string;
  title: string;
  score: number;
  text?: string;
  match?: Record<string, any>;
  terms?: string[];
}

interface DocSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOCUMENTS = [
  { id: 'welcome', title: '欢迎使用职业规划助手', path: '/docs/welcome.md' },
  { id: 'quick-start', title: '快速开始指南', path: '/docs/quick-start.md' },
  { id: 'holland-test', title: '霍兰德职业倾向测试', path: '/docs/holland-test.md' },
  { id: 'interview-guide', title: '面试指南', path: '/docs/interview-guide.md' },
  { id: 'plan-guide', title: '成长规划指南', path: '/docs/plan-guide.md' },
  { id: 'resume-guide', title: '简历优化指南', path: '/docs/resume-guide.md' },
  { id: 'faq', title: '常见问题', path: '/docs/faq.md' },
];

export default function DocSearch({ isOpen, onClose }: DocSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const searchIndexRef = useRef<MiniSearch | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);

  // 初始化搜索索引
  useEffect(() => {
    async function initSearchIndex() {
      setIsLoading(true);
      const documents = await Promise.all(
        DOCUMENTS.map(async (doc) => {
          try {
            const response = await fetch(doc.path);
            const content = await response.text();
            return {
              id: doc.id,
              title: doc.title,
              text: content,
            };
          } catch (error) {
            console.error(`Failed to load document: ${doc.path}`, error);
            return null;
          }
        })
      );

      const validDocuments = documents.filter((doc): doc is NonNullable<typeof doc> => doc !== null);

      searchIndexRef.current = new MiniSearch({
        fields: ['title', 'text'],
        storeFields: ['title', 'text'],
        searchOptions: {
          fuzzy: 0.2,
          prefix: true,
          boost: { title: 4, text: 2 },
        },
      });

      searchIndexRef.current.addAll(validDocuments);
      setIsLoading(false);
    }

    if (isOpen && !searchIndexRef.current) {
      initSearchIndex();
    }
  }, [isOpen]);

  // 执行搜索
  useEffect(() => {
    if (!searchIndexRef.current || !searchQuery.trim()) {
      setSearchResults([]);
      setSelectedIndex(0);
      return;
    }

    const results = searchIndexRef.current.search(searchQuery) as unknown as SearchResult[];

    // 限制结果数量为 10
    setSearchResults(results.slice(0, 10));
    setSelectedIndex(0);
  }, [searchQuery]);

  // 键盘事件处理
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults.length > 0 && selectedIndex >= 0) {
            handleResultClick(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, onClose]);

  // 自动滚动到选中的结果
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  function handleResultClick(result: SearchResult) {
    const docId = result.id;
    onClose();
    // 触发打开文档的事件
    window.dispatchEvent(new CustomEvent('openDoc', { detail: { docId } }));
  }

  function highlightText(text: string, query: string) {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-orange-200 text-orange-900 px-1 rounded">$1</mark>');
  }

  function getExcerpt(text: string, query: string, maxLength = 150) {
    if (!query.trim()) return text.slice(0, maxLength);
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return text.slice(0, maxLength);
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    let excerpt = text.slice(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';
    
    return excerpt;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* 搜索弹窗 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* 搜索输入框 */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200">
              <SearchOutlined className="text-slate-400 text-lg" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文档..."
                className="flex-1 text-base outline-none bg-transparent text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <CloseOutlined className="text-slate-400 hover:text-slate-600" />
                </button>
              )}
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">ESC</kbd>
                <span>关闭</span>
              </div>
            </div>

            {/* 搜索结果 */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-orange-500 mb-3" />
                    <p>加载文档中...</p>
                  </div>
                </div>
              ) : searchQuery.trim() === '' ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <SearchOutlined className="text-4xl mb-3 text-slate-300" />
                  <p className="text-base">输入关键词搜索文档</p>
                  <p className="text-sm mt-1">支持快捷键</p>
                  <div className="flex gap-2 mt-2">
                    <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">Ctrl</kbd>
                    <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">K</kbd>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <FileTextOutlined className="text-4xl mb-3 text-slate-300" />
                  <p className="text-base">未找到相关文档</p>
                  <p className="text-sm mt-1">尝试使用不同的关键词</p>
                </div>
              ) : (
                <ul ref={resultsRef} className="py-2">
                  {searchResults.map((result, index) => (
                    <motion.li
                      key={result.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.05 }}
                    >
                      <button
                        onClick={() => handleResultClick(result)}
                        className={`w-full px-4 py-3 text-left transition-colors ${
                          index === selectedIndex
                            ? 'bg-orange-50 border-l-4 border-orange-500'
                            : 'hover:bg-slate-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <FileTextOutlined
                            className={`mt-0.5 flex-shrink-0 ${
                              index === selectedIndex ? 'text-orange-500' : 'text-slate-400'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-medium text-slate-800 mb-1 truncate"
                              dangerouslySetInnerHTML={{
                                __html: highlightText(result.title, searchQuery),
                              }}
                            />
                            {result.text && (
                              <p
                                className="text-sm text-slate-600 line-clamp-2"
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(
                                    getExcerpt(result.text, searchQuery),
                                    searchQuery
                                  ),
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* 底部提示 */}
            {searchResults.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="flex gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↓</kbd>
                  </div>
                  <span>导航</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Enter</kbd>
                  <span>选择</span>
                </div>
                <span className="text-xs text-slate-400">
                  找到 {searchResults.length} 个结果
                </span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}