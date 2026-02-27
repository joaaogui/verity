"use client";

import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { ValidateResult } from "@/lib/api-client";

interface ResultCardProps {
  result: ValidateResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const isMatch = result.matchesExpectation;
  const isLowConfidence = result.confidence < 0.7;

  let borderColor = "border-emerald-500/50";
  let bgColor = "bg-emerald-500/5";
  let Icon = CheckCircle;
  let iconColor = "text-emerald-400";
  let statusText = "Match";

  if (!isMatch) {
    borderColor = "border-red-500/50";
    bgColor = "bg-red-500/5";
    Icon = XCircle;
    iconColor = "text-red-400";
    statusText = "No Match";
  } else if (isLowConfidence) {
    borderColor = "border-amber-500/50";
    bgColor = "bg-amber-500/5";
    Icon = AlertTriangle;
    iconColor = "text-amber-400";
    statusText = "Uncertain Match";
  }

  const fieldEntries = Object.entries(result.extractedFields);

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-6`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`h-6 w-6 ${iconColor}`} />
          <div>
            <span className={`text-lg font-semibold ${iconColor}`}>
              {statusText}
            </span>
            <span className="mx-2 text-zinc-600">&middot;</span>
            <span className="text-zinc-300">{result.categoryLabel}</span>
            <span className="mx-2 text-zinc-600">&middot;</span>
            <span className="text-zinc-400">
              {Math.round(result.confidence * 100)}%
            </span>
          </div>
        </div>
        <span className="text-sm text-zinc-500">
          {(result.processingTimeMs / 1000).toFixed(1)}s
        </span>
      </div>

      <div className="mb-4">
        <h4 className="mb-1 text-sm font-medium text-zinc-400">Summary</h4>
        <p className="text-sm text-zinc-300">{result.summary}</p>
      </div>

      {fieldEntries.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium text-zinc-400">
            Extracted Fields
          </h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {fieldEntries.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2 py-1">
                <span className="text-sm text-zinc-500 capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-medium text-zinc-200 text-right">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="mb-1 text-sm font-medium text-zinc-400">
          Match Explanation
        </h4>
        <p className="text-sm text-zinc-400 italic">
          {result.matchExplanation}
        </p>
      </div>

      {result.truncated && (
        <p className="mt-3 text-xs text-amber-400">
          Note: Only the first 3 pages were analyzed.
        </p>
      )}
    </div>
  );
}
