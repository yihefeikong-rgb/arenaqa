"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface Props {
  content: string;
  streaming?: boolean;
}

export function MarkdownRenderer({ content, streaming }: Props) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
      {streaming && (
        <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse align-text-bottom ml-0.5" />
      )}
    </div>
  );
}
