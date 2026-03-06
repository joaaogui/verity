"use client";

import { CalendarClock, CheckCircle2, FileText } from "lucide-react";
import { useState } from "react";

import { CheckboxOption } from "./checkbox-option";
import { StepDescription } from "./step-description";
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
      <StepDescription>
        Your address has been verified and your document has been analyzed. Your
        information has been saved to our database.
      </StepDescription>

      <div className="mt-6 flex items-start gap-3 rounded-lg bg-gray-50 px-4 py-4">
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

      <CheckboxOption
        icon={<FileText className="mt-0.5 size-4 shrink-0 text-gray-400" />}
        title="Save information to Beltic"
        description="Store your verification data securely in your Beltic account for easy access"
        checked={saveToBeltic}
        onChange={setSaveToBeltic}
      />

      <CheckboxOption
        icon={<CalendarClock className="mt-0.5 size-4 shrink-0 text-gray-400" />}
        title="Set reminder for reverification"
        description="Get notified in 6 months to update your verification documents"
        checked={reminder}
        onChange={setReminder}
      />
    </>
  );
}
