"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { FONT_MONO, STEP_LABELS } from "../constants";
import type { Step } from "../types";

export function StepCard({
  step,
  children,
}: Readonly<{
  step: Step;
  children: React.ReactNode;
}>) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex w-full max-w-[540px] min-h-[720px] flex-col rounded-lg bg-white shadow-2xl"
    >
      <div
        className="flex items-center justify-between border-b border-gray-100 px-7 py-2.5"
        style={{ fontFamily: FONT_MONO }}
      >
        <span className="text-[12px] font-medium tracking-[0.15em] text-gray-400 uppercase">
          {STEP_LABELS[step]}
        </span>
        <span className="text-[12px] font-medium tracking-[0.15em] text-gray-400 uppercase">
          STEP {step}/5
        </span>
      </div>
      <div
        ref={contentRef}
        tabIndex={-1}
        className="flex flex-1 flex-col px-7 py-6 outline-none"
      >
        {children}
      </div>
    </motion.div>
  );
}
