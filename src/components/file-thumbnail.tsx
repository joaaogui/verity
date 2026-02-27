"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { FileText, Image as ImageIcon } from "lucide-react";

interface FileThumbnailProps {
  file: File;
}

export function FileThumbnail({ file }: Readonly<FileThumbnailProps>) {
  const isImage = file.type.startsWith("image/");

  const imgSrc = useMemo(() => {
    if (!isImage) return null;
    return URL.createObjectURL(file);
  }, [file, isImage]);

  useEffect(() => {
    return () => {
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
  }, [imgSrc]);

  if (isImage && imgSrc) {
    return (
      <Image
        src={imgSrc}
        alt="Preview"
        width={48}
        height={48}
        unoptimized
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
