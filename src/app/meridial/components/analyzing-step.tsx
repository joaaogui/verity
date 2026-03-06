"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { STATUS_MESSAGES } from "../constants";
import { StepHeading } from "./step-heading";

const SPINNER_DOT_COUNT = 8;
const SPINNER_RADIUS_PX = 12;
const SPINNER_DOTS = Array.from({ length: SPINNER_DOT_COUNT }, (_, index) => ({
  id: `spinner-dot-${index}`,
  angle: (index / SPINNER_DOT_COUNT) * Math.PI * 2 - Math.PI / 2,
  opacity: 0.2 + (index / SPINNER_DOT_COUNT) * 0.8,
}));

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
      <motion.div
        className="relative mb-4 size-8"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
        aria-hidden="true"
      >
        {SPINNER_DOTS.map((dot) => {
          const x = Math.cos(dot.angle) * SPINNER_RADIUS_PX;
          const y = Math.sin(dot.angle) * SPINNER_RADIUS_PX;

          return (
            <span
              key={dot.id}
              className="absolute block size-1 rounded-full bg-gray-400"
              style={{
                left: `calc(50% + ${x}px - 2px)`,
                top: `calc(50% + ${y}px - 2px)`,
                opacity: dot.opacity,
              }}
            />
          );
        })}
      </motion.div>
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
