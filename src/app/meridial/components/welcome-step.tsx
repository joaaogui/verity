"use client";

import { ArrowRight } from "lucide-react";

import { FONT_HEADING, FONT_MONO } from "../constants";

export function WelcomeStep({ onUpload }: Readonly<{ onUpload: () => void }>) {
  return (
    <>
      <h2 className="text-[36px] leading-tight font-semibold tracking-[-0.04em] text-gray-900" style={{ fontFamily: FONT_HEADING }}>
        Welcome to Invisible Marketplace
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
        Verify your address. We need your address to verify you&apos;re a real
        person, to collect your documents.
      </p>
      <div className="flex-1" />
      <button
        onClick={onUpload}
        className="flex w-full items-center justify-between rounded-md bg-[#5c0e0e] px-5 py-3.5 text-[13px] font-semibold tracking-[0.15em] text-white uppercase transition-colors hover:bg-[#7a1616]"
        style={{ fontFamily: FONT_MONO }}
      >
        UPLOAD DOCUMENT
        <ArrowRight className="size-4" />
      </button>
    </>
  );
}
