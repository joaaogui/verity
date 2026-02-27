"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/schemas";

interface UploadZoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export function UploadZone({ file, onFileSelect, disabled }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSet = useCallback(
    (f: File) => {
      setError(null);
      if (!ACCEPTED_FILE_TYPES.includes(f.type as (typeof ACCEPTED_FILE_TYPES)[number])) {
        setError("Please upload a PDF, JPG, PNG, or WebP file.");
        return;
      }
      if (f.size > MAX_FILE_SIZE_BYTES) {
        setError(`File exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        return;
      }
      onFileSelect(f);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f) validateAndSet(f);
    },
    [disabled, validateAndSet]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) validateAndSet(f);
    },
    [validateAndSet]
  );

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3">
        <FileText className="h-5 w-5 shrink-0 text-blue-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-200">
            {file.name}
          </p>
          <p className="text-xs text-zinc-500">
            {(file.size / 1024).toFixed(0)} KB
          </p>
        </div>
        {!disabled && (
          <button
            onClick={() => {
              onFileSelect(null);
              setError(null);
            }}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-500/10"
            : "border-zinc-700 bg-zinc-800/30 hover:border-zinc-500"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <Upload className="mb-3 h-8 w-8 text-zinc-500" />
        <p className="text-sm text-zinc-400">
          Drop file here or{" "}
          <span className="font-medium text-blue-400">click to upload</span>
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          PDF, JPG, PNG, WebP &middot; Max {MAX_FILE_SIZE_MB}MB
        </p>
        <input
          type="file"
          accept={ACCEPTED_FILE_TYPES.join(",")}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
