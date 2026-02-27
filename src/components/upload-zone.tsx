"use client";

import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { FileThumbnail } from "@/components/file-thumbnail";

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
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 animate-in fade-in-0 duration-200">
        <FileThumbnail file={file} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(0)} KB
          </p>
        </div>
        {!disabled && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              onFileSelect(null);
              setError(null);
            }}
          >
            <X className="size-4" />
          </Button>
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
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-6 transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-muted-foreground/50"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <Upload className="mb-2 size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop file here or{" "}
          <span className="font-medium text-primary">click to upload</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
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
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
