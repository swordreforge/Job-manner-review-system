import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  onHeadingClick?: (id: string) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function TableOfContents({ content, onHeadingClick, onClose, isMobile = false }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [headings, setHeadings] = useState<Heading[]>([]);

  // 解析 Markdown 内容，提取标题
  useEffect(() => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(headingRegex));
    const extractedHeadings = matches.map((match) => {
      const text = match[2].trim();
      // 使用与 MarkdownHeading 相同的 ID 生成逻辑
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return {
        id,
        text,
        level: match[1].length,
      };
    });
    setHeadings(extractedHeadings);
  }, [content]);

  // 监听滚动，高亮当前章节
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -66%',
        threshold: 0,
      }
    );

    // 观察所有标题元素
    const headingElements = headings.map((heading) =>
      document.getElementById(heading.id)
    );

    headingElements.forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headingElements.forEach((element) => {
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  // 过滤掉 h1 标题，只显示 h2-h6
  const visibleHeadings = useMemo(() => {
    return headings.filter((heading) => heading.level > 1);
  }, [headings]);

  if (visibleHeadings.length === 0) {
    return null;
  }

  // 移动端抽屉模式
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">目录</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-73px)] p-4">
            <nav className="space-y-1">
              {visibleHeadings.map((heading, index) => (
                <motion.button
                  key={heading.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // 立即更新 activeId 状态
                    setActiveId(heading.id);
                    const element = document.getElementById(heading.id);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      onHeadingClick?.(heading.id);
                      onClose?.();
                    }
                  }}
                  className={`
                    block w-full text-left text-sm py-2 px-3 rounded-lg transition-colors cursor-pointer
                    ${activeId === heading.id
                      ? 'bg-orange-50 text-orange-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }
                  `}
                  style={{
                    paddingLeft: `${(heading.level - 1) * 0.75 + 0.75}rem`,
                  }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  {heading.text}
                </motion.button>
              ))}
            </nav>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // 桌面端侧边栏模式
  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="hidden xl:block w-56 flex-shrink-0 pl-6"
    >
      <div className="sticky top-6">
        <h4 className="text-sm font-semibold text-slate-800 mb-3">目录</h4>
        <nav className="space-y-1">
          {visibleHeadings.map((heading, index) => (
            <motion.button
              key={heading.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // 立即更新 activeId 状态
                setActiveId(heading.id);
                const element = document.getElementById(heading.id);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  onHeadingClick?.(heading.id);
                }
              }}
              className={`
                block w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors cursor-pointer
                ${activeId === heading.id
                  ? 'bg-orange-50 text-orange-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }
              `}
              style={{
                paddingLeft: `${(heading.level - 1) * 0.75 + 0.5}rem`,
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              {heading.text}
            </motion.button>
          ))}
        </nav>
      </div>
    </motion.aside>
  );
}

// 辅助函数：为 Markdown 内容添加标题 ID
export function addHeadingIds(content: string): string {
  return content.replace(/^(#{1,6})\s+(.+)$/gm, (_match, hashes, text) => {
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${hashes} <span id="${id}">${text}</span>`;
  });
}