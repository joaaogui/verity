"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-base prose-table:text-sm prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:overflow-x-auto prose-pre:text-xs prose-pre:leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children, ...props }) => (
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 text-xs leading-relaxed" {...props}>
              {children}
            </pre>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return <code className={className} {...props}>{children}</code>;
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
