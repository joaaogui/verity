"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

import { FONT_BANNER, FONT_MONO } from "../constants";

export function CookieBanner({ onAgree }: Readonly<{ onAgree: () => void }>) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      className="fixed bottom-6 left-1/2 z-50 flex w-[90%] max-w-[755px] -translate-x-1/2 items-center gap-4 rounded-full bg-white px-4 py-3 shadow-xl"
    >
      <ShieldCheck className="size-5 shrink-0 text-[#5E1710]" />
      <p className="flex-1 text-sm font-medium leading-tight text-[#515151]" style={{ fontFamily: FONT_BANNER }}>
        We use cookies and collect personal information to verify your identity.
        By continuing, you consent to our{" "}
        <a href="/meridial/privacy" className="font-bold text-[#5E1710]">
          Privacy Policy
        </a>{" "}
        and{" "}
        <a href="/meridial/terms" className="font-bold text-[#5E1710]">
          Terms of Use
        </a>.
      </p>
      <button
        onClick={onAgree}
        className="shrink-0 rounded-full bg-[#5E1710] px-5 py-2 text-[14px] font-normal tracking-[0.08em] text-[#FFF0F0] uppercase transition-colors hover:bg-[#48120C]"
        style={{ fontFamily: FONT_MONO }}
      >
        I AGREE
      </button>
    </motion.div>
  );
}
