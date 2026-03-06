"use client";

import { ArrowRight } from "lucide-react";

import { PrimaryButton } from "./primary-button";
import { StepDescription } from "./step-description";
import { StepHeading } from "./step-heading";

export function WelcomeStep({ onUpload }: Readonly<{ onUpload: () => void }>) {
  return (
    <>
      <StepHeading className="text-[40px]">Welcome to Invisible Marketplace</StepHeading>
      <StepDescription>
        Verify your address. We need your address to verify you&apos;re a real
        person, to collect your documents.
      </StepDescription>
      <div className="flex-1" />
      <PrimaryButton onClick={onUpload}>
        UPLOAD DOCUMENT
        <ArrowRight className="size-4" />
      </PrimaryButton>
    </>
  );
}
