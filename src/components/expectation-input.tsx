"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const SUGGESTIONS = [
  "A recent electricity or gas utility bill",
  "A bank statement from the last 3 months",
  "A commercial invoice with line items",
  "A government-issued ID (passport or driver's license)",
  "A signed lease or rental agreement",
  "A medical prescription or lab result",
  "A tax return or W-2 form",
  "A payment receipt",
];

interface ExpectationInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ExpectationInput({
  value,
  onChange,
  disabled,
}: ExpectationInputProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor="expectation">What document do you expect?</Label>
      <Input
        id="expectation"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder='e.g. "A recent electricity bill from ConEd"'
      />
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <Badge
            key={suggestion}
            variant={value === suggestion ? "default" : "outline"}
            className="cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50"
            onClick={() => !disabled && onChange(suggestion)}
          >
            {suggestion}
          </Badge>
        ))}
      </div>
    </div>
  );
}
