"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
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

const HISTORY_KEY = "verity-history";

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [expectation, setExpectation] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const submitRef = useRef<() => void>(null);

  useEffect(() => {
    setHistory(loadHistory());
    setHydrated(true);
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history, hydrated]);

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
  }, [file, expectation, mutation.mutate]);

  submitRef.current = handleSubmit;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submitRef.current?.();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const canSubmit = file && expectation.trim() && !mutation.isPending;
  const hasNoResults = !mutation.data && !mutation.isPending && !mutation.error;
  const hasResults = mutation.data || mutation.isPending || mutation.error;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            Verity
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            AI-powered document validation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/docs"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <ThemeToggle />
        </div>
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

          <div>
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
            <p className="mt-1 text-center text-[10px] text-muted-foreground/40">
              {isMac ? "Cmd" : "Ctrl"}+Enter
            </p>
          </div>

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
