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
}

export default function TableOfContents({ content, onHeadingClick }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [headings, setHeadings] = useState<Heading[]>([]);

  // 解析 Markdown 内容，提取标题
  useEffect(() => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(headingRegex));
    const extractedHeadings = matches.map((match) => {
      const text = match[2].trim();
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
              onClick={() => {
                const element = document.getElementById(heading.id);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  onHeadingClick?.(heading.id);
                }
              }}
              className={`
                block w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors
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
  return content.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, text) => {
    const level = hashes.length;
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${hashes} <span id="${id}">${text}</span>`;
  });
}