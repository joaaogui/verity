export function StepDescription({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="mt-4 text-[16px] font-medium leading-relaxed text-gray-400">
      {children}
    </p>
  );
}
