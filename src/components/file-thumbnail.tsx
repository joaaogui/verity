"use client";

import { useEffect, useState } from "react";
import { FileText, Image as ImageIcon } from "lucide-react";

interface FileThumbnailProps {
  file: File;
}

export function FileThumbnail({ file }: FileThumbnailProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  if (isImage && imgSrc) {
    return (
      <img
        src={imgSrc}
        alt="Preview"
        className="size-12 rounded-md border border-border object-cover"
      />
    );
  }

  const ext = file.name.split(".").pop()?.toUpperCase() ?? "";
  const Icon = isImage ? ImageIcon : FileText;

  return (
    <div className="relative flex size-12 items-center justify-center rounded-md border border-border bg-muted">
      <Icon className="size-5 text-muted-foreground" />
      {ext && (
        <span className="absolute -bottom-1 -right-1 rounded bg-primary px-1 py-px text-[8px] font-bold text-primary-foreground">
          {ext}
        </span>
      )}
    </div>
  );
}
