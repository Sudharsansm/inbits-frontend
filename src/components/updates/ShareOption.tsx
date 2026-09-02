export function ShareOption({
  children,
  label,
  color,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 text-center">
      <span
        className="grid h-14 w-14 place-items-center rounded-2xl shadow-md transition active:scale-95"
        style={{ background: color }}
      >
        {children}
      </span>
      <span className="text-[11px] font-medium text-ink">{label}</span>
    </button>
  );
}
