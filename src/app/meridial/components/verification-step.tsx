"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { FONT_HEADING, FONT_MONO } from "../constants";
import type { AddressData } from "../types";

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
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[11px] font-medium tracking-[0.15em] text-gray-400 uppercase"
        style={{ fontFamily: FONT_MONO }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b border-gray-200 bg-transparent pb-2 text-[14px] text-gray-900 outline-none transition-colors focus:border-[#5c0e0e]"
      />
    </div>
  );
}

export function VerificationStep({
  address,
  onChange,
  onBack,
  onContinue,
}: Readonly<{
  address: AddressData;
  onChange: (a: AddressData) => void;
  onBack: () => void;
  onContinue: () => void;
}>) {
  const isValid = address.streetAddress.trim().length > 0;

  return (
    <>
      <h2 className="text-[36px] leading-tight font-semibold tracking-[-0.04em] text-gray-900" style={{ fontFamily: FONT_HEADING }}>
        Confirm your details{address.fullName ? `, ${address.fullName}` : ""}
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
        We&apos;ve extracted your address information from the document. Please
        take a moment to review and confirm that these details are correct.
      </p>

      <div className="mt-4 rounded-md bg-emerald-50 px-4 py-3">
        <p className="text-[13px] text-emerald-700">
          <span className="mr-1">&#10003;</span> Address information
          successfully extracted from your document
        </p>
      </div>

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

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex size-10 items-center justify-center rounded-md border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600"
        >
          <ArrowLeft className="size-4" />
        </button>
        <button
          onClick={onContinue}
          disabled={!isValid}
          className="flex flex-1 items-center justify-between rounded-md bg-[#5c0e0e] px-5 py-3.5 text-[13px] font-semibold tracking-[0.15em] text-white uppercase transition-colors hover:bg-[#7a1616] disabled:opacity-40"
          style={{ fontFamily: FONT_MONO }}
        >
          CONTINUE
          <ArrowRight className="size-4" />
        </button>
      </div>
    </>
  );
}
