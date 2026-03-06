"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { AnalyzingStep } from "./components/analyzing-step";
import { CompleteStep } from "./components/complete-step";
import { CookieBanner } from "./components/cookie-banner";
import type { FluidParams } from "./components/fluid-background";
import { Logo } from "./components/logo";
import { loadParams, ShaderControls } from "./components/shader-controls";
import { StepCard } from "./components/step-card";
import { UploadStep } from "./components/upload-step";
import { VerificationStep } from "./components/verification-step";
import { WelcomeStep } from "./components/welcome-step";
import {
  emptyAddress,
  FONT_BODY,
  FONT_MONO,
  openSans,
  spaceMono,
} from "./constants";
import type { AddressData, Step } from "./types";
import { extractionResponseSchema } from "./types";

const FluidBackground = dynamic(
  () => import("./components/fluid-background").then(mod => ({ default: mod.FluidBackground })),
  { ssr: false },
);

export default function MeridialPage() {
  const [step, setStep] = useState<Step>(1);
  const [showConsent, setShowConsent] = useState(true);
  const [address, setAddress] = useState<AddressData>(emptyAddress);
  const [hadExtractionError, setHadExtractionError] = useState(false);
  const [extractedFields, setExtractedFields] = useState<Set<keyof AddressData>>(new Set());
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [shaderParams, setShaderParams] = useState<FluidParams>(loadParams);

  const handleFileSelect = useCallback(async (file: File) => {
    setStep(3);
    setUploadError(null);
    setHadExtractionError(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/meridial/extract", {
        method: "POST",
        body: formData,
      });

      const body = await res.json();

      if (!res.ok) {
        setUploadError(body?.error ?? "Something went wrong. Please try again.");
        setAddress(emptyAddress);
        setStep(2);
        return;
      }

      const data = extractionResponseSchema.parse(body);
      const hasEmptyRequiredFields =
        !data.streetAddress.trim() ||
        !data.city.trim() ||
        !data.state.trim() ||
        !data.zipCode.trim() ||
        !data.country.trim();
      setHadExtractionError(hasEmptyRequiredFields);
      const filled = new Set<keyof AddressData>();
      for (const key of Object.keys(data) as (keyof AddressData)[]) {
        if (data[key].trim()) filled.add(key);
      }
      setExtractedFields(filled);
      setAddress(data);
      setStep(4);
    } catch {
      setUploadError("Something went wrong. Please try again.");
      setAddress(emptyAddress);
      setStep(2);
    }
  }, []);

  return (
    <div
      className={`relative flex min-h-screen flex-col ${openSans.variable} ${spaceMono.variable}`}
      style={{ fontFamily: FONT_BODY }}
    >
      <FluidBackground params={shaderParams} />
      <ShaderControls params={shaderParams} onChange={setShaderParams} />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-4">
        <div className="w-full max-w-[530px]">
          <div className="mb-4 px-1">
            <Logo />
          </div>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepCard step={1}>
                <WelcomeStep onUpload={() => setStep(2)} />
              </StepCard>
            )}
            {step === 2 && (
              <StepCard step={2}>
                <UploadStep
                  onBack={() => { setUploadError(null); setStep(1); }}
                  error={uploadError}
                  onFileSelect={handleFileSelect}
                />
              </StepCard>
            )}
            {step === 3 && (
              <StepCard step={3}>
                <AnalyzingStep />
              </StepCard>
            )}
            {step === 4 && (
              <StepCard step={4}>
                <VerificationStep
                  address={address}
                  onChange={setAddress}
                  onBack={() => setStep(2)}
                  onContinue={() => setStep(5)}
                  hadExtractionError={hadExtractionError}
                  extractedFields={extractedFields}
                />
              </StepCard>
            )}
            {step === 5 && (
              <StepCard step={5}>
                <CompleteStep />
              </StepCard>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="relative z-10 pb-8 text-center" style={{ fontFamily: FONT_MONO }}>
        <nav className="flex items-center justify-center gap-6 text-[12px] font-medium tracking-[0.15em] text-white/60 uppercase">
          <a href="/meridial/privacy" className="transition-colors hover:text-white">
            Privacy Policy
          </a>
          <a href="/meridial/terms" className="transition-colors hover:text-white">
            Terms of Use
          </a>
        </nav>
        <p className="mt-5 text-[10px] tracking-[0.12em] text-white/60 uppercase">
          All Rights Reserved &middot; Invisible Marketplace
        </p>
      </footer>

      <AnimatePresence>
        {showConsent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 backdrop-blur-md bg-black/10"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConsent && <CookieBanner onAgree={() => setShowConsent(false)} />}
      </AnimatePresence>
    </div>
  );
}
