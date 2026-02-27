"use client";

import { useState, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
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
const emptySubscribe = () => () => {};
const getIsMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);
const getFalse = () => false;

function loadHistory(): HistoryEntry[] {
  if (globalThis.window === undefined) return [];
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
  const didInit = useRef(false);
  const submitRef = useRef<() => void>(null);

  const isMac = useSyncExternalStore(emptySubscribe, getIsMac, getFalse);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const stored = loadHistory();
    if (stored.length > 0) setHistory(stored);
  }, []);

  useEffect(() => {
    if (!didInit.current) return;
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const { verdict, fields, isPending, isExtractingFields, error, mutate } = useValidate();

  const handleSubmit = useCallback(() => {
    if (!file || !expectation.trim()) return;

    mutate(
      { file, expectation: expectation.trim() },
      {
        onSuccess: (verdictResult) => {
          setHistory((prev) => [
            {
              id: crypto.randomUUID(),
              fileName: file.name,
              result: {
                ...verdictResult,
                extractedFields: {},
                summary: "",
              },
              timestamp: Date.now(),
            },
            ...prev,
          ]);
        },
      }
    );
  }, [file, expectation, mutate]);

  useEffect(() => {
    submitRef.current = handleSubmit;
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submitRef.current?.();
      }
    }
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, []);

  const canSubmit = file && expectation.trim() && !isPending;
  const hasVerdict = verdict != null;
  const hasNoResults = !hasVerdict && !isPending && !error;
  const hasResults = hasVerdict || isPending || error != null;

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
            How was this built?
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className={`gap-6 ${hasResults ? "xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" : ""}`}>
        <div className="space-y-3">
          <ExpectationInput
            value={expectation}
            onChange={setExpectation}
            disabled={isPending}
          />

          <UploadZone
            file={file}
            onFileSelect={setFile}
            disabled={isPending}
          />

          <div>
            <Button
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {isPending ? (
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
          {error && (
            <div className="animate-in fade-in-0 duration-200">
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            </div>
          )}

          {isPending && <ResultSkeleton />}

          {verdict && !isPending && (
            <ResultCard
              verdict={verdict}
              fields={fields}
              isExtractingFields={isExtractingFields}
            />
          )}
        </div>
      </div>
    </main>
  );
}
