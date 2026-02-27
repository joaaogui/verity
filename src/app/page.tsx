"use client";

import { useState, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadZone } from "@/components/upload-zone";
import { ExpectationInput } from "@/components/expectation-input";
import { ResultCard } from "@/components/result-card";
import { ResultSkeleton } from "@/components/result-skeleton";
import { EmptyState } from "@/components/empty-state";
import { HistoryList, type HistoryEntry } from "@/components/history-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { useValidate } from "@/hooks/use-validate";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [expectation, setExpectation] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const mutation = useValidate();

  const handleSubmit = useCallback(() => {
    if (!file || !expectation.trim()) return;

    mutation.mutate(
      { file, expectation: expectation.trim() },
      {
        onSuccess: (result) => {
          setHistory((prev) => [
            {
              id: crypto.randomUUID(),
              fileName: file.name,
              result,
              timestamp: Date.now(),
            },
            ...prev,
          ]);
        },
      }
    );
  }, [file, expectation, mutation]);

  const canSubmit = file && expectation.trim() && !mutation.isPending;
  const hasNoResults = !mutation.data && !mutation.isPending && !mutation.error;
  const hasResults = mutation.data || mutation.isPending || mutation.error;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              Verity
            </h1>
            <span className="text-[10px] font-medium text-muted-foreground/50">
              {process.env.NEXT_PUBLIC_APP_VERSION}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            AI-powered document validation
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className={`gap-6 ${hasResults ? "xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" : ""}`}>
        <div className="space-y-3">
          <ExpectationInput
            value={expectation}
            onChange={setExpectation}
            disabled={mutation.isPending}
          />

          <UploadZone
            file={file}
            onFileSelect={setFile}
            disabled={mutation.isPending}
          />

          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Validate Document"
            )}
          </Button>

          {hasNoResults && history.length === 0 && <EmptyState />}

          <HistoryList entries={history} />
        </div>

        <div className="mt-4 xl:mt-0">
          {mutation.error && (
            <div className="animate-in fade-in-0 duration-200">
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{mutation.error.message}</AlertDescription>
              </Alert>
            </div>
          )}

          {mutation.isPending && <ResultSkeleton />}

          {mutation.data && !mutation.isPending && (
            <ResultCard result={mutation.data} />
          )}
        </div>
      </div>
    </main>
  );
}
