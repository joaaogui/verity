"use client";

import { CalendarClock, CheckCircle2, FileText } from "lucide-react";
import { useState } from "react";

import { StepHeading } from "./step-heading";

export function CompleteStep() {
  const [saveToBeltic, setSaveToBeltic] = useState(false);
  const [reminder, setReminder] = useState(false);

  return (
    <>
      <CheckCircle2 className="size-7 text-gray-700" />
      <div className="mt-3">
        <StepHeading>Verification Complete</StepHeading>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
        Your address has been verified and your document has been analyzed. Your
        information has been saved to our database.
      </p>

      <div className="mt-6 flex items-start gap-3 border-b border-gray-100 pb-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-gray-400" />
        <div>
          <p className="text-[14px] font-medium text-gray-900">
            Address Verified
          </p>
          <p className="text-[12px] text-gray-400">
            Document analyzed and saved
          </p>
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 border-b border-gray-100 pb-5">
        <input
          type="checkbox"
          checked={saveToBeltic}
          onChange={(e) => setSaveToBeltic(e.target.checked)}
          className="mt-1 size-4 shrink-0 cursor-pointer rounded border-gray-300 accent-brand-900"
        />
        <FileText className="mt-0.5 size-4 shrink-0 text-gray-400" />
        <div>
          <p className="text-[14px] font-medium text-gray-900">
            Save information to Beltic
          </p>
          <p className="text-[12px] text-gray-400">
            Store your verification data securely in your Beltic account for
            easy access
          </p>
        </div>
      </label>

      <label className="mt-5 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={reminder}
          onChange={(e) => setReminder(e.target.checked)}
          className="mt-1 size-4 shrink-0 cursor-pointer rounded border-gray-300 accent-brand-900"
        />
        <CalendarClock className="mt-0.5 size-4 shrink-0 text-gray-400" />
        <div>
          <p className="text-[14px] font-medium text-gray-900">
            Set reminder for reverification
          </p>
          <p className="text-[12px] text-gray-400">
            Get notified in 6 months to update your verification documents
          </p>
        </div>
      </label>
    </>
  );
}
