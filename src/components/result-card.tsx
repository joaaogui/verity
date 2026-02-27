"use client";

import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ValidateResult } from "@/lib/api-client";

interface ResultCardProps {
  result: ValidateResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const isMatch = result.matchesExpectation;
  const isLowConfidence = result.confidence < 0.7;

  let Icon = CheckCircle;
  let iconColor = "text-emerald-600";
  let statusText = "Match";
  let statusClass = "bg-emerald-50 text-emerald-700 border-emerald-200";

  if (!isMatch) {
    Icon = XCircle;
    iconColor = "text-destructive";
    statusText = "No Match";
    statusClass = "bg-red-50 text-red-700 border-red-200";
  } else if (isLowConfidence) {
    Icon = AlertTriangle;
    iconColor = "text-amber-600";
    statusText = "Uncertain Match";
    statusClass = "bg-amber-50 text-amber-700 border-amber-200";
  }

  const fieldEntries = Object.entries(result.extractedFields);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`size-5 ${iconColor}`} />
            <Badge variant="outline" className={statusClass}>
              {statusText}
            </Badge>
            <Badge variant="secondary">{result.categoryLabel}</Badge>
            <span className="text-sm text-muted-foreground">
              {Math.round(result.confidence * 100)}%
            </span>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {(result.processingTimeMs / 1000).toFixed(1)}s
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Summary
          </h4>
          <p className="text-sm leading-relaxed text-foreground">
            {result.summary}
          </p>
        </div>

        {fieldEntries.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Extracted Fields
            </h4>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-x-8">
              {fieldEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between gap-2 border-b border-border/50 py-1.5 last:border-0"
                >
                  <span className="shrink-0 text-xs capitalize text-muted-foreground">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-right text-sm font-medium text-foreground">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Match Explanation
          </h4>
          <p className="text-sm italic leading-relaxed text-muted-foreground">
            {result.matchExplanation}
          </p>
        </div>

        {result.truncated && (
          <p className="text-xs text-amber-600">
            Note: Only the first 3 pages were analyzed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
