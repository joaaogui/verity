"use client";

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
    <div className="space-y-2">
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
    </div>
  );
}
