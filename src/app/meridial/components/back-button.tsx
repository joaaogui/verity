import { ArrowLeft } from "lucide-react";

export function BackButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button
      onClick={onClick}
      aria-label="Go back"
      className="flex size-10 items-center justify-center rounded-md border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600"
    >
      <ArrowLeft className="size-4" />
    </button>
  );
}
