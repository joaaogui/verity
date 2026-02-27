"use client";

import { CheckCircle, XCircle } from "lucide-react";
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
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-3 text-sm font-medium text-zinc-400">
        History (this session)
      </h3>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-3 py-2"
          >
            {entry.result.matchesExpectation ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
              {entry.fileName}
            </span>
            <span className="text-xs text-zinc-500">
              {entry.result.categoryLabel}
            </span>
            <span className="text-xs text-zinc-600">
              {(entry.result.processingTimeMs / 1000).toFixed(1)}s
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
