"use client";

import { ArrowRight } from "lucide-react";

import { FONT_MONO } from "../constants";
import type { AddressData } from "../types";
import { BackButton } from "./back-button";
import { PrimaryButton } from "./primary-button";
import { StepDescription } from "./step-description";
import { StepHeading } from "./step-heading";

function AddressField({
  label,
  value,
  onChange,
}: Readonly<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}>) {
  return (
    <fieldset className="rounded-md border border-gray-200 px-3 pb-3 pt-1 transition-colors focus-within:border-gray-400">
      <legend
        className="px-1 text-[10px] font-medium tracking-[0.15em] text-gray-400 uppercase"
        style={{ fontFamily: FONT_MONO }}
      >
        {label}
      </legend>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[14px] text-gray-900 outline-none"
      />
    </fieldset>
  );
}

export function VerificationStep({
  address,
  onChange,
  onBack,
  onContinue,
  hadExtractionError = false,
}: Readonly<{
  address: AddressData;
  onChange: (a: AddressData) => void;
  onBack: () => void;
  onContinue: () => void;
  hadExtractionError?: boolean;
}>) {
  const isValid = address.streetAddress.trim().length > 0;

  return (
    <>
      <StepHeading>
        Confirm your details{address.fullName ? `, ${address.fullName}` : ""}
      </StepHeading>
      <StepDescription>
        We&apos;ve extracted your address information from the document. Please
        take a moment to review and confirm that these details are correct.
      </StepDescription>

      {hadExtractionError ? (
        <div className="mt-4 rounded-md bg-amber-50 px-4 py-3">
          <p className="text-[13px] text-amber-700">
            <span className="mr-1">&#9888;</span> We couldn&apos;t extract
            information automatically. Please fill in your details manually.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-md bg-emerald-50 px-4 py-3">
          <p className="text-[13px] text-emerald-700">
            <span className="mr-1">&#10003;</span> Address information
            successfully extracted from your document
          </p>
        </div>
      )}

      <div className="mt-6 space-y-5">
        <AddressField
          label="Street Address"
          value={address.streetAddress}
          onChange={(v) => onChange({ ...address, streetAddress: v })}
        />
        <div className="grid grid-cols-2 gap-5">
          <AddressField
            label="City"
            value={address.city}
            onChange={(v) => onChange({ ...address, city: v })}
          />
          <AddressField
            label="State"
            value={address.state}
            onChange={(v) => onChange({ ...address, state: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <AddressField
            label="Zip Code"
            value={address.zipCode}
            onChange={(v) => onChange({ ...address, zipCode: v })}
          />
          <AddressField
            label="Country"
            value={address.country}
            onChange={(v) => onChange({ ...address, country: v })}
          />
        </div>
      </div>

      <div className="mt-auto flex items-center gap-3 pt-6">
        <BackButton onClick={onBack} />
        <PrimaryButton onClick={onContinue} disabled={!isValid} className="flex-1">
          CONTINUE
          <ArrowRight className="size-4" />
        </PrimaryButton>
      </div>
    </>
  );
}
