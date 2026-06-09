"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface Props {
  content: string;
  streaming?: boolean;
}

export const MarkdownRenderer = React.memo(function MarkdownRenderer({ content, streaming }: Props) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert overflow-x-auto [&_pre]:overflow-x-auto [&_table]:block [&_table]:overflow-x-auto">
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
});

export default MarkdownRenderer;
