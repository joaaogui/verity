import { FONT_HEADING } from "../constants";

export function StepHeading({
  children,
  className = "",
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <h2
      className={`text-[34px] leading-tight font-medium tracking-[-0.04em] text-gray-900 ${className}`.trim()}
      style={{ fontFamily: FONT_HEADING }}
    >
      {children}
    </h2>
  );
}
