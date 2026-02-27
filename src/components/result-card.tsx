"use client";

import { CheckCircle, XCircle, AlertTriangle, Target, Clock } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { ValidateResult } from "@/lib/api-client";

interface ResultCardProps {
  result: ValidateResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const isMatch = result.matchesExpectation;
  const isLowConfidence = result.confidence < 0.7;

  let Icon = CheckCircle;
  let iconColor = "text-success";
  let statusText = "Match";
  let statusClass = "bg-success/10 text-success border-success/30";
  let whyBorder = "border-l-success";

  if (!isMatch) {
    Icon = XCircle;
    iconColor = "text-destructive";
    statusText = "No Match";
    statusClass = "bg-destructive/10 text-destructive border-destructive/30";
    whyBorder = "border-l-destructive";
  } else if (isLowConfidence) {
    Icon = AlertTriangle;
    iconColor = "text-warning";
    statusText = "Uncertain Match";
    statusClass = "bg-warning/10 text-warning border-warning/30";
    whyBorder = "border-l-warning";
  }

  const fieldEntries = Object.entries(result.extractedFields);

  return (
    <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Icon className={`size-5 ${iconColor}`} />
          <Badge variant="outline" className={statusClass}>
            {statusText}
          </Badge>
          <Badge variant="secondary">{result.categoryLabel}</Badge>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1">
                  <Target className="size-3" />
                  {Math.round(result.confidence * 100)}%
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Confidence score for the document classification</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 tabular-nums">
                  <Clock className="size-3" />
                  {(result.processingTimeMs / 1000).toFixed(1)}s
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total processing time including upload and AI analysis</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className={`border-l-2 ${whyBorder} pl-3`}>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
            Why
          </h4>
          <p className="text-sm leading-relaxed text-foreground">
            {result.matchExplanation}
          </p>
        </div>

        <div className="rounded-md bg-muted/50 px-3 py-3">
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
          <p className="text-xs text-warning">
            Note: Only the first 3 pages were analyzed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
