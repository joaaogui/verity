"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ChevronDown, History } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [open, setOpen] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="xl:hidden mb-2 gap-2"
      >
        <History className="size-4" />
        History ({entries.length})
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      <div className={`xl:block ${open ? "block" : "hidden"}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              History (this session)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {entries.map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                isExpanded={expandedId === entry.id}
                onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HistoryRow({
  entry,
  isExpanded,
  onToggle,
}: Readonly<{
  entry: HistoryEntry;
  isExpanded: boolean;
  onToggle: () => void;
}>) {
  return (
    <div>
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={onToggle}
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
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {isExpanded && (
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
  );
}
