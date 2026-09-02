export function ActionBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-white transition active:scale-90"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-black/35 backdrop-blur-md ring-1 ring-white/20">
        {children}
      </span>
      {label && <span className="text-[10px] font-semibold drop-shadow">{label}</span>}
    </button>
  );
}
