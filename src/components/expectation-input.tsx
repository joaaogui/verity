"use client";

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
      <label
        htmlFor="expectation"
        className="block text-sm font-medium text-zinc-300"
      >
        What document do you expect?
      </label>
      <input
        id="expectation"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder='e.g. "A recent electricity bill from ConEd"'
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      />
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => onChange(suggestion)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              value === suggestion
                ? "border-blue-500 bg-blue-500/20 text-blue-300"
                : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
            } disabled:pointer-events-none disabled:opacity-50`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
