"use client";

import { useState, useCallback } from "react";
import { Loader2, FileSearch } from "lucide-react";
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
          <FileSearch className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold tracking-tight">DocValidator</h1>
        </div>
        <p className="text-zinc-500">
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

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Validate Document"
          )}
        </button>
      </div>

      {mutation.error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {mutation.error.message}
        </div>
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
