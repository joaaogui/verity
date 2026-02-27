"use client";

import { useEffect, useState, useRef } from "react";
import { FileText } from "lucide-react";

interface FileThumbnailProps {
  file: File;
}

export function FileThumbnail({ file }: FileThumbnailProps) {
  const [src, setSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let revoke: (() => void) | null = null;

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setSrc(url);
      revoke = () => URL.revokeObjectURL(url);
    } else if (file.type === "application/pdf") {
      let cancelled = false;

      (async () => {
        try {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

          const data = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data }).promise;
          const page = await pdf.getPage(1);

          if (cancelled) return;

          const scale = 160 / page.getViewport({ scale: 1 }).width;
          const viewport = page.getViewport({ scale });
          const canvas = canvasRef.current;
          if (!canvas) return;

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          if (!cancelled) setSrc(canvas.toDataURL());
        } catch {
          // PDF rendering failed silently -- show fallback icon
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    return () => revoke?.();
  }, [file]);

  if (src) {
    return (
      <img
        src={src}
        alt="Preview"
        className="size-12 rounded-md border border-border object-cover"
      />
    );
  }

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex size-12 items-center justify-center rounded-md border border-border bg-muted">
        <FileText className="size-5 text-muted-foreground" />
      </div>
    </>
  );
}
