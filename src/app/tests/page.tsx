"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Play, CheckCircle, XCircle, AlertCircle, Loader2, Clock, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TEST_CASES, type TestCase } from "./test-cases";
import { runTestCase, type TestResult } from "./actions";

type TestStatus = "idle" | "running" | "passed" | "failed" | "error";

interface TestRow {
  testCase: TestCase;
  status: TestStatus;
  result?: TestResult;
}

export default function TestSuitePage() {
  const [rows, setRows] = useState<TestRow[]>(
    TEST_CASES.map((tc) => ({ testCase: tc, status: "idle" }))
  );
  const [running, setRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const runAll = useCallback(async () => {
    setRunning(true);
    setRows(TEST_CASES.map((tc) => ({ testCase: tc, status: "idle" })));

    for (let i = 0; i < TEST_CASES.length; i++) {
      setCurrentIndex(i);
      setRows((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r))
      );

      const tc = TEST_CASES[i];
      const result = await runTestCase(tc.id, tc.file, tc.expectation);

      const passed = result.error
        ? false
        : result.matchesExpectation === tc.expectedMatch;

      setRows((prev) =>
        prev.map((r, idx) =>
          idx === i
            ? {
                ...r,
                status: result.error ? "error" : passed ? "passed" : "failed",
                result,
              }
            : r
        )
      );
    }

    setCurrentIndex(-1);
    setRunning(false);
  }, []);

  const completedRows = rows.filter((r) => r.status !== "idle" && r.status !== "running");
  const passedCount = rows.filter((r) => r.status === "passed").length;
  const failedCount = rows.filter((r) => r.status === "failed").length;
  const errorCount = rows.filter((r) => r.status === "error").length;
  const avgTime =
    completedRows.length > 0
      ? completedRows.reduce((sum, r) => sum + (r.result?.processingTimeMs ?? 0), 0) / completedRows.length
      : 0;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Verity
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            Test Suite
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {TEST_CASES.length} test cases against real documents
          </p>
        </div>
        <Button onClick={runAll} disabled={running} size="lg">
          {running ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Running ({currentIndex + 1}/{TEST_CASES.length})
            </>
          ) : (
            <>
              <Play className="size-4" />
              Run All
            </>
          )}
        </Button>
      </div>

      {completedRows.length > 0 && (
        <div className="mb-6 flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span className="text-success">{passedCount} passed</span>
            {failedCount > 0 && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-destructive">{failedCount} failed</span>
              </>
            )}
            {errorCount > 0 && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-warning">{errorCount} errors</span>
              </>
            )}
            <span className="text-muted-foreground">
              of {TEST_CASES.length}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            avg {(avgTime / 1000).toFixed(1)}s
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Test Cases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {rows.map((row, i) => (
            <div
              key={row.testCase.id}
              className={`rounded-md px-3 py-2.5 transition-colors ${
                row.status === "running" ? "bg-primary/5" : "bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={row.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {row.testCase.label}
                    </span>
                    <Badge variant={row.testCase.expectedMatch ? "secondary" : "outline"} className="text-[10px]">
                      expect {row.testCase.expectedMatch ? "match" : "no match"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    &ldquo;{row.testCase.expectation}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {row.result && !row.result.error && (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {row.result.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Target className="size-3" />
                        {Math.round(row.result.confidence * 100)}%
                      </span>
                      <span className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                        <Clock className="size-3" />
                        {(row.result.processingTimeMs / 1000).toFixed(1)}s
                      </span>
                    </>
                  )}
                  {row.result?.error && (
                    <span className="text-xs text-destructive truncate max-w-48">
                      {row.result.error}
                    </span>
                  )}
                </div>
              </div>
              {row.result && !row.result.error && (
                <p className="mt-1.5 pl-8 text-xs text-muted-foreground">
                  {row.result.matchExplanation}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}

function StatusIcon({ status }: { status: TestStatus }) {
  switch (status) {
    case "running":
      return <Loader2 className="size-4 shrink-0 animate-spin text-primary" />;
    case "passed":
      return <CheckCircle className="size-4 shrink-0 text-success" />;
    case "failed":
      return <XCircle className="size-4 shrink-0 text-destructive" />;
    case "error":
      return <AlertCircle className="size-4 shrink-0 text-warning" />;
    default:
      return <div className="size-4 shrink-0 rounded-full border-2 border-muted-foreground/20" />;
  }
}
