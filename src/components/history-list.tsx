"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResultCard } from "@/components/result-card";
import type { VerdictResult } from "@/lib/api-client";

export interface HistoryEntry {
  id: string;
  fileName: string;
  result: VerdictResult & { extractedFields?: Record<string, string>; summary?: string };
  timestamp: number;
}

interface HistoryListProps {
  entries: HistoryEntry[];
}

export function HistoryList({ entries }: Readonly<HistoryListProps>) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          History (this session)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {entries.map((entry) => (
          <div key={entry.id}>
            <button
              type="button"
              aria-expanded={expandedId === entry.id}
              onClick={() =>
                setExpandedId(expandedId === entry.id ? null : entry.id)
              }
              className="flex w-full items-center gap-3 rounded-md bg-muted/50 px-3 py-2 text-left transition-colors hover:bg-muted"
            >
              {entry.result.matchesExpectation ? (
                <CheckCircle className="size-4 shrink-0 text-success" />
              ) : (
                <XCircle className="size-4 shrink-0 text-destructive" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {entry.fileName}
              </span>
              <span className="text-xs text-muted-foreground">
                {entry.result.categoryLabel}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground/60">
                {(entry.result.processingTimeMs / 1000).toFixed(1)}s
              </span>
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform ${
                  expandedId === entry.id ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedId === entry.id && (
              <div className="mt-2 mb-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <ResultCard
                  verdict={entry.result}
                  fields={entry.result.extractedFields && entry.result.summary ? {
                    extractedFields: entry.result.extractedFields,
                    summary: entry.result.summary,
                    processingTimeMs: entry.result.processingTimeMs,
                  } : null}
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
