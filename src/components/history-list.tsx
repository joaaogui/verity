"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ValidateResult } from "@/lib/api-client";

export interface HistoryEntry {
  id: string;
  fileName: string;
  result: ValidateResult;
  timestamp: number;
}

interface HistoryListProps {
  entries: HistoryEntry[];
}

export function HistoryList({ entries }: HistoryListProps) {
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
          <div
            key={entry.id}
            className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2"
          >
            {entry.result.matchesExpectation ? (
              <CheckCircle className="size-4 shrink-0 text-emerald-600" />
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
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
