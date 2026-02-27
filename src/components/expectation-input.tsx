"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSuggestions } from "@/hooks/use-suggestions";

const QUICK_PICKS = [
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
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { suggestions, isLoading } = useSuggestions(value);

  const ghostText = useMemo(() => {
    if (!focused || value.length < 3 || suggestions.length === 0) return null;
    const first = suggestions[0];
    if (first.toLowerCase().startsWith(value.toLowerCase())) {
      return first;
    }
    return null;
  }, [focused, value, suggestions]);

  const showDropdown = focused && value.length >= 3 && suggestions.length > 0;

  useEffect(() => {
    setHighlightIndex(-1);
  }, [suggestions]);

  const acceptGhost = useCallback(() => {
    if (ghostText) {
      onChange(ghostText);
      setHighlightIndex(-1);
    }
  }, [ghostText, onChange]);

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
      if (e.key === "Tab" && ghostText && !e.shiftKey) {
        e.preventDefault();
        acceptGhost();
        return;
      }

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
    [showDropdown, suggestions, highlightIndex, selectSuggestion, ghostText, acceptGhost]
  );

  const handleFocus = useCallback(() => {
    clearTimeout(blurTimeoutRef.current);
    setFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => setFocused(false), 150);
  }, []);

  const visible = expanded ? QUICK_PICKS : QUICK_PICKS.slice(0, VISIBLE_COUNT);

  return (
    <div className="space-y-3">
      <Label htmlFor="expectation">What document do you expect?</Label>
      <div className="relative">
        {ghostText && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center overflow-hidden"
          >
            <span className="truncate px-3 text-sm text-transparent">
              {value}
            </span>
            <span
              className="truncate text-sm text-muted-foreground/40"
              onClick={acceptGhost}
            >
              {ghostText.slice(value.length)}
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          id="expectation"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder='e.g. "A utility bill with the customer address"'
          autoComplete="off"
          className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
            isLoading && value.length >= 3 ? "pr-9" : ""
          }`}
        />

        {isLoading && value.length >= 3 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {ghostText && focused && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Tab
            </kbd>
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
        {QUICK_PICKS.length > VISIBLE_COUNT && (
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
                +{QUICK_PICKS.length - VISIBLE_COUNT} more{" "}
                <ChevronDown className="size-3" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
