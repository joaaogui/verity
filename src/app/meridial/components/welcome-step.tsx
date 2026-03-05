"use client";

import { ArrowRight } from "lucide-react";

import { PrimaryButton } from "./primary-button";
import { StepHeading } from "./step-heading";

export function WelcomeStep({ onUpload }: Readonly<{ onUpload: () => void }>) {
  return (
    <>
      <StepHeading>Welcome to Invisible Marketplace</StepHeading>
      <p className="mt-5 text-[16px] font-medium leading-relaxed tracking-[-0.01em] text-gray-400">
        Verify your address. We need your address to verify you&apos;re a real
        person, to collect your documents.
      </p>
      <div className="flex-1" />
      <PrimaryButton onClick={onUpload}>
        UPLOAD DOCUMENT
        <ArrowRight className="size-4" />
      </PrimaryButton>
    </>
  );
}
