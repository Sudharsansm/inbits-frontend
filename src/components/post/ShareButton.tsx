export function ShareButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-border bg-paper hover:bg-secondary"
    >
      {children}
    </button>
  );
}
