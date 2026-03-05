import { Barlow_Condensed, DM_Sans, Open_Sans, Space_Mono } from "next/font/google";

import type { AddressData, Step } from "./types";

export const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-heading",
});

export const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-condensed",
});

export const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-open-sans",
});

export const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";
export const FONT_HEADING = "var(--font-heading), 'Montserrat', sans-serif";
export const FONT_MONO =
  "var(--font-space-mono), 'SF Mono', 'Roboto Mono', monospace";
export const FONT_SPACE_MONO =
  "var(--font-space-mono), 'SF Mono', 'Roboto Mono', monospace";
export const FONT_CONDENSED = "var(--font-condensed), sans-serif";
export const FONT_BANNER = "var(--font-open-sans), sans-serif";

export const STEP_LABELS: Record<Step, string> = {
  1: "GETTING STARTED",
  2: "DOCUMENT UPLOAD",
  3: "DOCUMENT UPLOAD",
  4: "ADDRESS VERIFICATION",
  5: "COMPLETE",
};

export const STATUS_MESSAGES = [
  "Extracting document data",
  "Running OCR analysis",
  "Validating information",
  "Verifying document authenticity",
  "Checking for fraud indicators",
  "Almost done",
];

export const FILE_SELECT_DELAY_MS = 1200;

export const emptyAddress: AddressData = {
  fullName: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
};
