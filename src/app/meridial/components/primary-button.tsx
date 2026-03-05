import { FONT_MONO } from "../constants";

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = "w-full",
}: Readonly<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between rounded-md bg-brand-900 px-5 py-3.5 text-[13px] font-normal tracking-[0.08em] text-[#FFF0F0] uppercase transition-colors hover:bg-brand-800 disabled:opacity-40 ${className}`}
      style={{ fontFamily: FONT_MONO }}
    >
      {children}
    </button>
  );
}
