"use client";

import { CheckCircle, XCircle, AlertTriangle, Target, Clock } from "lucide-react";
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
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" title="Confidence">
              <Target className="size-3" />
              {Math.round(result.confidence * 100)}%
            </span>
            <span className="flex items-center gap-1 tabular-nums" title="Processing time">
              <Clock className="size-3" />
              {(result.processingTimeMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
            Why
          </h4>
          <p className="text-sm leading-relaxed text-foreground">
            {result.matchExplanation}
          </p>
        </div>

        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
            Summary
          </h4>
          <p className="text-sm leading-relaxed text-foreground/80">
            {result.summary}
          </p>
        </div>

        {fieldEntries.length > 0 && (
          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
              Extracted Fields
            </h4>
            <div className="grid grid-cols-1 gap-x-6 gap-y-0.5 sm:grid-cols-2">
              {fieldEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="border-b border-border/40 py-2 last:border-0"
                >
                  <span className="block text-[11px] capitalize text-foreground/40">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="block text-sm text-foreground">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.truncated && (
          <p className="text-xs text-amber-600">
            Note: Only the first 3 pages were analyzed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
