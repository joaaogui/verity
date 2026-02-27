"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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

const VISIBLE_COUNT = 4;

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
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? SUGGESTIONS : SUGGESTIONS.slice(0, VISIBLE_COUNT);

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
      <div className="flex flex-wrap items-center gap-2">
        {visible.map((suggestion) => (
          <Badge
            key={suggestion}
            variant={value === suggestion ? "default" : "outline"}
            className="select-none"
            onClick={() => !disabled && onChange(suggestion)}
          >
            {suggestion}
          </Badge>
        ))}
        {SUGGESTIONS.length > VISIBLE_COUNT && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>
                Less <ChevronUp className="size-3" />
              </>
            ) : (
              <>
                +{SUGGESTIONS.length - VISIBLE_COUNT} more <ChevronDown className="size-3" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
