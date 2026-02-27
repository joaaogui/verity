"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSuggestions } from "@/hooks/use-suggestions";

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
  const [focused, setFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { suggestions, isLoading } = useSuggestions(value);
  const showDropdown = focused && value.length >= 3 && suggestions.length > 0;

  useEffect(() => {
    setHighlightIndex(-1);
  }, [suggestions]);

  const selectSuggestion = useCallback(
    (s: string) => {
      onChange(s);
      setFocused(false);
      setHighlightIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
      } else if (e.key === "Enter" && highlightIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[highlightIndex]);
      } else if (e.key === "Escape") {
        setFocused(false);
      }
    },
    [showDropdown, suggestions, highlightIndex, selectSuggestion]
  );

  const handleFocus = useCallback(() => {
    clearTimeout(blurTimeoutRef.current);
    setFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => setFocused(false), 150);
  }, []);

  const visible = expanded ? SUGGESTIONS : SUGGESTIONS.slice(0, VISIBLE_COUNT);

  return (
    <div className="space-y-3" ref={containerRef}>
      <Label htmlFor="expectation">What document do you expect?</Label>
      <div className="relative">
        <Input
          id="expectation"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder='e.g. "A recent electricity bill from ConEd"'
          autoComplete="off"
          className={isLoading && value.length >= 3 ? "pr-9" : ""}
        />
        {isLoading && value.length >= 3 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {showDropdown && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
            {suggestions.map((s, i) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(s);
                }}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  i === highlightIndex
                    ? "bg-accent text-accent-foreground"
                    : "text-popover-foreground hover:bg-accent/50"
                } ${i === 0 ? "rounded-t-md" : ""} ${
                  i === suggestions.length - 1 ? "rounded-b-md" : ""
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
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
                +{SUGGESTIONS.length - VISIBLE_COUNT} more{" "}
                <ChevronDown className="size-3" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
