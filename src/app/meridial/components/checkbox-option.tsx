export function CheckboxOption({
  icon,
  title,
  description,
  checked,
  onChange,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}>) {
  return (
    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 px-4 py-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 shrink-0 cursor-pointer rounded border-gray-300 accent-brand-900"
      />
      {icon}
      <div>
        <p className="text-[14px] font-medium text-gray-900">{title}</p>
        <p className="mt-0.5 text-[12px] text-gray-400">{description}</p>
      </div>
    </label>
  );
}
