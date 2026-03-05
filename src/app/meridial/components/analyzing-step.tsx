"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { STATUS_MESSAGES } from "../constants";
import { StepHeading } from "./step-heading";

export function AnalyzingStep() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="mb-4">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
      <StepHeading>Analyzing document</StepHeading>
      <div className="flex-1" />
      <AnimatePresence mode="wait">
        <motion.p
          key={statusIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="text-center text-[13px] text-gray-400"
        >
          {STATUS_MESSAGES[statusIndex]}
        </motion.p>
      </AnimatePresence>
    </>
  );
}
