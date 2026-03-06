"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

import { FILE_SELECT_DELAY_MS, FONT_MONO } from "../constants";
import { BackButton } from "./back-button";
import { StepDescription } from "./step-description";
import { StepHeading } from "./step-heading";

export function UploadStep({
  onBack,
  onFileSelect,
  error,
}: Readonly<{
  onBack: () => void;
  onFileSelect: (file: File) => void;
  error?: string | null;
}>) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (file: File) => {
    setSelectedFile(file);
    setTimeout(() => onFileSelect(file), FILE_SELECT_DELAY_MS);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    acceptFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    acceptFile(file);
  };

  const handleRetry = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  };

  return (
    <>
      <StepHeading>Upload Document</StepHeading>
      <StepDescription>
        Upload your document. We&apos;ll analyze it using our document
        verification API.
      </StepDescription>

      <span
        className="mt-6 text-[11px] font-medium tracking-[0.15em] text-gray-400 uppercase"
        style={{ fontFamily: FONT_MONO }}
      >
        Document
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleChange}
      />

      {error && (
        <button
          type="button"
          onClick={handleRetry}
          className="mt-2 flex h-[165px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 p-8 transition-colors hover:border-red-300 hover:bg-red-100"
        >
          <AlertCircle className="size-10 text-red-500" />
          <p className="mt-1 text-[14px] font-medium text-red-700">{error}</p>
          <span className="text-[12px] font-medium text-red-500">
            Click to try again
          </span>
        </button>
      )}
      {!error && selectedFile && (
        <div className="mt-2 flex h-[165px] flex-col items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 p-8">
          <div className="relative">
            <FileText className="size-10 text-emerald-600" />
            <CheckCircle2 className="absolute -right-1 -top-1 size-4 rounded-full bg-white text-emerald-500" />
          </div>
          <p className="mt-3 text-[14px] font-medium text-gray-900">
            {selectedFile.name}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <CheckCircle2 className="size-3" /> File selected
          </span>
        </div>
      )}
      {!error && !selectedFile && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mt-2 flex h-[165px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed transition-colors ${
            isDragging
              ? "border-brand-700 bg-red-50"
              : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
          }`}
        >
          <Upload className="size-5 text-gray-400" />
          <p className="text-[14px] text-gray-600">
            {isDragging ? "Drop file here" : "Click or drag to upload"}
          </p>
          <p className="text-[12px] text-gray-400">
            PDF, JPG or PNG up to 10MB
          </p>
        </button>
      )}

      <div className="mt-auto pt-4">
        <BackButton onClick={onBack} />
      </div>
    </>
  );
}
