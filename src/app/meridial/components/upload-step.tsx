"use client";

import {
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
}: Readonly<{
  onBack: () => void;
  onFileSelect: (file: File) => void;
}>) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setTimeout(() => onFileSelect(file), FILE_SELECT_DELAY_MS);
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

      {selectedFile ? (
        <div className="mt-2 flex h-[165px] flex-col items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 p-8">
          <div className="relative">
            <FileText className="size-10 text-emerald-600" />
            <CheckCircle2 className="absolute -right-1 -top-1 size-4 rounded-full bg-white text-emerald-500" />
          </div>
          <p className="mt-3 text-[13px] font-medium text-gray-900">
            {selectedFile.name}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <CheckCircle2 className="size-3" /> Verified
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex h-[165px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-gray-300 hover:bg-gray-100"
        >
          <Upload className="size-5 text-gray-400" />
          <p className="text-[14px] text-gray-600">Click to upload</p>
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
