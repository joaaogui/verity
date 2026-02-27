"use client";

import { useState, useCallback } from "react";
import { Loader2, FileSearch, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadZone } from "@/components/upload-zone";
import { ExpectationInput } from "@/components/expectation-input";
import { ResultCard } from "@/components/result-card";
import { HistoryList, type HistoryEntry } from "@/components/history-list";
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

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-10 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <FileSearch className="size-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            DocValidator
          </h1>
        </div>
        <p className="text-muted-foreground">
          Upload a document, describe what you expect, get instant verification.
        </p>
      </div>

      <div className="space-y-4">
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
      </div>

      {mutation.error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="size-4" />
          <AlertDescription>{mutation.error.message}</AlertDescription>
        </Alert>
      )}

      {mutation.data && (
        <div className="mt-6">
          <ResultCard result={mutation.data} />
        </div>
      )}

      <div className="mt-8">
        <HistoryList entries={history} />
      </div>
    </main>
  );
}
