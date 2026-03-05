import { DM_Sans, IBM_Plex_Mono } from "next/font/google";

import type { AddressData, Step } from "./types";

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-accent",
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-heading",
});

export const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";
export const FONT_HEADING = "var(--font-heading), 'Montserrat', sans-serif";
export const FONT_MONO =
  "var(--font-mono-accent), 'SF Mono', 'Roboto Mono', monospace";

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

export const emptyAddress: AddressData = {
  fullName: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
};
