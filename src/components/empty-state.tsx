"use client";

import { FileText, MessageSquare, Zap } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Describe",
    description: "Type what document you expect.",
  },
  {
    icon: FileText,
    title: "Upload",
    description: "Drop the submitted file.",
  },
  {
    icon: Zap,
    title: "Validate",
    description: "Get instant classification and verdict.",
  },
];

export function EmptyState() {
  return (
    <div className="animate-in fade-in-0 duration-500 rounded-md border border-dashed border-border px-4 py-5">
      <p className="mb-3 text-center text-xs font-medium text-muted-foreground">
        How it works
      </p>
      <div className="grid grid-cols-3 gap-4">
        {steps.map((step, i) => (
          <div key={step.title} className="text-center">
            <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <step.icon className="size-4" />
            </div>
            <p className="text-xs font-medium text-foreground">
              <span className="text-muted-foreground">{i + 1}.</span>{" "}
              {step.title}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
