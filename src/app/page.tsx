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
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Font comparison</p>
          <ThemeToggle />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Lora", cls: "font-lora", category: "Authoritative Serif" },
            { name: "Merriweather", cls: "font-merriweather", category: "Authoritative Serif" },
            { name: "Playfair Display", cls: "font-playfair", category: "Editorial Serif" },
            { name: "Space Grotesk", cls: "font-space-grotesk", category: "AI / Futuristic" },
            { name: "Outfit", cls: "font-outfit", category: "AI / Geometric" },
          ].map((f) => (
            <div key={f.name} className="rounded-lg border border-border bg-card p-4">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{f.category}</p>
              <p className={`${f.cls} text-3xl font-bold tracking-tight text-foreground`}>Verity</p>
              <p className={`${f.cls} mt-1 text-lg text-foreground/70`}>Verity</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{f.name}</p>
            </div>
          ))}
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
