import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MarkdownContent } from "./markdown-content";

export const metadata: Metadata = {
  title: "Verity — Design Document",
  description: "Architecture, tech stack, and design decisions for Verity",
};

export default function DocsPage() {
  const filePath = path.join(process.cwd(), "docs", "design.md");
  const content = fs.readFileSync(filePath, "utf-8");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Verity
      </Link>
      <MarkdownContent content={content} />
    </main>
  );
}
