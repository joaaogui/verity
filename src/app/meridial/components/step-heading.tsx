import { FONT_HEADING } from "../constants";

export function StepHeading({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <h2
      className="text-[36px] leading-tight font-semibold tracking-[-0.04em] text-gray-900"
      style={{ fontFamily: FONT_HEADING }}
    >
      {children}
    </h2>
  );
}
