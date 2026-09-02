import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export function MenuPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <AppShell title="Menu">
      <section className="px-4 pt-3">
        <div className="flex items-center gap-2">
          <Link
            to="/menu"
            aria-label="Back to menu"
            className="rounded-full border border-border p-2 hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="serif text-xl font-bold leading-tight">{title}</h1>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </AppShell>
  );
}

export function Row({
  label,
  hint,
  right,
}: {
  label: string;
  hint?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
      {right}
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {children}
    </div>
  );
}

export function Switch({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-primary" : "bg-secondary border border-border"}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-paper shadow transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}
