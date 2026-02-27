"use client";

import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Pre({ children, ...props }: Readonly<ComponentPropsWithoutRef<"pre">>) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-foreground/5 p-4 text-xs leading-relaxed text-foreground font-mono" style={{ fontFamily: "'Courier New', Courier, monospace" }} {...props}>
      {children}
    </pre>
  );
}

function Code({ className, children, ...props }: Readonly<ComponentPropsWithoutRef<"code">>) {
  const isBlock = className?.includes("language-");
  if (isBlock) {
    return <code className={className} {...props}>{children}</code>;
  }
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...props}>
      {children}
    </code>
  );
}

const markdownComponents = { pre: Pre, code: Code };

export function MarkdownContent({ content }: Readonly<{ content: string }>) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-base prose-table:text-sm prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-pre:bg-foreground/5 prose-pre:text-foreground prose-pre:border prose-pre:border-border prose-pre:overflow-x-auto prose-pre:text-xs prose-pre:leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
