"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";

import { FONT_MONO } from "../constants";

export function CookieBanner({ onAgree }: Readonly<{ onAgree: () => void }>) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      className="fixed bottom-6 left-1/2 z-50 flex w-[90%] max-w-[620px] -translate-x-1/2 items-center gap-4 rounded-full bg-white px-6 py-3 shadow-xl"
    >
      <Shield className="size-5 shrink-0 text-brand-700" />
      <p className="flex-1 text-xs leading-relaxed text-gray-600">
        We use cookies and collect personal information to verify your identity.
        By continuing, you consent to our{" "}
        <a href="/privacy" className="font-medium text-gray-900 underline">
          Privacy Policy
        </a>{" "}
        and{" "}
        <a href="/cookies" className="font-medium text-gray-900 underline">
          Cookie Policy
        </a>.
      </p>
      <button
        onClick={onAgree}
        className="shrink-0 rounded-full bg-brand-900 px-5 py-2 text-[13px] font-semibold tracking-widest text-white uppercase transition-colors hover:bg-brand-800"
        style={{ fontFamily: FONT_MONO }}
      >
        I AGREE
      </button>
    </motion.div>
  );
}
