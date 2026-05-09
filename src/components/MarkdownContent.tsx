"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Components } from "react-markdown";

interface MarkdownContentProps {
  content: string;
  className?: string;
  /** compact removes extra vertical margin — good for chat bubbles */
  compact?: boolean;
}

export default function MarkdownContent({
  content,
  className = "",
  compact = false,
}: MarkdownContentProps) {
  const spacing = compact ? "space-y-1.5" : "space-y-3";

  const components: Components = {
    // Headings
    h1: ({ children }) => (
      <h1 className="text-base font-bold text-white mt-3 mb-1">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-sm font-bold text-white mt-3 mb-1">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-sm font-semibold text-gray-100 mt-2 mb-0.5">{children}</h3>
    ),

    // Paragraph
    p: ({ children }) => (
      <p className="text-gray-300 leading-relaxed">{children}</p>
    ),

    // Bold / italic
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-100">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-300">{children}</em>
    ),

    // Unordered list
    ul: ({ children }) => (
      <ul className="list-disc list-outside pl-4 space-y-1 text-gray-300">{children}</ul>
    ),

    // Ordered list
    ol: ({ children }) => (
      <ol className="list-decimal list-outside pl-4 space-y-1 text-gray-300">{children}</ol>
    ),

    li: ({ children }) => (
      <li className="leading-relaxed">{children}</li>
    ),

    // Inline code
    code: ({ children, className: langClass }) => {
      const isBlock = langClass?.startsWith("language-");
      if (isBlock) {
        return (
          <code className="block text-xs font-mono bg-[#0d0d14] text-emerald-300 rounded-lg px-4 py-3 overflow-x-auto whitespace-pre">
            {children}
          </code>
        );
      }
      return (
        <code className="text-xs font-mono bg-white/[0.08] text-emerald-300 rounded px-1.5 py-0.5">
          {children}
        </code>
      );
    },

    // Fenced code block wrapper
    pre: ({ children }) => (
      <pre className="bg-[#0d0d14] border border-white/[0.06] rounded-lg overflow-x-auto my-2">
        {children}
      </pre>
    ),

    // Blockquote
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-blue-500/50 pl-3 text-gray-400 italic">
        {children}
      </blockquote>
    ),

    // Horizontal rule
    hr: () => <hr className="border-white/10 my-2" />,

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors"
      >
        {children}
      </a>
    ),
  };

  return (
    <div className={`${spacing} ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
