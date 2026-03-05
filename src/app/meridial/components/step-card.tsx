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
      className="flex w-full max-w-[530px] min-h-[710px] flex-col rounded-sm bg-white shadow-2xl"
    >
      <div
        className="relative flex items-center justify-between px-4 py-4"
        style={{ fontFamily: FONT_MONO }}
      >
        <span className="text-[12px] font-medium tracking-[0.15em] text-gray-400 uppercase">
          {STEP_LABELS[step]}
        </span>
        <span className="text-[12px] font-medium tracking-[0.15em] text-gray-400 uppercase">
          STEP {step}/5
        </span>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-px">
          {/* Track */}
          <div className="absolute inset-x-0 top-0 h-px bg-gray-200" />
          {/* Progress */}
          <motion.div
            className="absolute left-0 top-0 h-px bg-[#5E1710]"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>
      <div
        ref={contentRef}
        tabIndex={-1}
        className="flex flex-1 flex-col px-4 py-4 pt-8 outline-none"
      >
        {children}
      </div>
    </motion.div>
  );
}
