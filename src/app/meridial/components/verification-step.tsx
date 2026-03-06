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
  filter,
  extracted,
}: Readonly<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  filter?: "digits" | "letters";
  extracted?: boolean;
}>) {
  const handleChange = (raw: string) => {
    if (filter === "digits") onChange(raw.replaceAll(/[^\d]/g, ""));
    else if (filter === "letters") onChange(raw.replaceAll(/[^a-zA-ZÀ-ÿ\s'-]/g, ""));
    else onChange(raw);
  };

  return (
    <fieldset
      className={`rounded-md border px-3 pb-3 pt-1 transition-colors focus-within:border-gray-400 ${
        extracted
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-gray-200"
      }`}
    >
      <legend
        className="flex items-center gap-1.5 px-1 text-[10px] font-medium tracking-[0.15em] uppercase"
        style={{ fontFamily: FONT_MONO }}
      >
        <span className={extracted ? "text-emerald-500" : "text-gray-400"}>
          {label}
        </span>
        {extracted && (
          <span className="rounded-full bg-emerald-100 px-1.5 py-px text-[8px] tracking-widest text-emerald-600">
            AUTO-FILLED
          </span>
        )}
      </legend>
      <input
        type="text"
        inputMode={filter === "digits" ? "numeric" : undefined}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
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
  extractedFields = new Set(),
}: Readonly<{
  address: AddressData;
  onChange: (a: AddressData) => void;
  onBack: () => void;
  onContinue: () => void;
  hadExtractionError?: boolean;
  extractedFields?: ReadonlySet<keyof AddressData>;
}>) {
  const isValid =
    address.streetAddress.trim().length > 0 &&
    address.city.trim().length > 0 &&
    address.state.trim().length > 0 &&
    address.zipCode.trim().length > 0 &&
    address.country.trim().length > 0;

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid) onContinue();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <StepHeading>Confirm your details</StepHeading>
      <StepDescription>
        We&apos;ve extracted your address information from the document. Please
        take a moment to review and confirm that these details are correct.
      </StepDescription>

      {hadExtractionError ? (
        <div className="mt-4 rounded-md bg-amber-50 px-4 py-3">
          <p className="text-[14px] text-amber-700">
            <span className="mr-1">&#9888;</span> We couldn&apos;t extract
            information automatically. Please fill in your details manually.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-md bg-emerald-50 px-4 py-3">
          <p className="text-[14px] text-emerald-700">
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
          extracted={extractedFields.has("streetAddress")}
        />
        <div className="grid grid-cols-2 gap-5">
          <AddressField
            label="City"
            value={address.city}
            onChange={(v) => onChange({ ...address, city: v })}
            extracted={extractedFields.has("city")}
          />
          <AddressField
            label="State"
            value={address.state}
            onChange={(v) => onChange({ ...address, state: v })}
            filter="letters"
            extracted={extractedFields.has("state")}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <AddressField
            label="Zip Code"
            value={address.zipCode}
            onChange={(v) => onChange({ ...address, zipCode: v })}
            filter="digits"
            extracted={extractedFields.has("zipCode")}
          />
          <AddressField
            label="Country"
            value={address.country}
            onChange={(v) => onChange({ ...address, country: v })}
            filter="letters"
            extracted={extractedFields.has("country")}
          />
        </div>
      </div>

      <div className="mt-auto flex items-center gap-3 pt-6">
        <BackButton onClick={onBack} />
        <PrimaryButton disabled={!isValid} className="flex-1">
          CONTINUE
          <ArrowRight className="size-4" />
        </PrimaryButton>
      </div>
    </form>
  );
}
