"use client";

import { FileText, MessageSquare, Zap } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Describe",
    description: "Type what document you expect to receive from the customer.",
  },
  {
    icon: FileText,
    title: "Upload",
    description: "Drop the submitted document — PDF, JPG, or PNG.",
  },
  {
    icon: Zap,
    title: "Validate",
    description: "Get instant classification, field extraction, and a match verdict.",
  },
];

export function EmptyState() {
  return (
    <div className="animate-in fade-in-0 duration-500 mt-10 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10">
      <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
        How it works
      </p>
      <div className="grid grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <div key={step.title} className="text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <step.icon className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              <span className="text-muted-foreground">{i + 1}.</span>{" "}
              {step.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
