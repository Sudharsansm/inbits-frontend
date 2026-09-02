import { Link } from "@tanstack/react-router";
import { sideNav } from "@/components/layout/nav-items";

export function Sidebar({ isActive }: { isActive: (to: string) => boolean }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col border-r border-border bg-paper px-2 py-4 text-ink md:flex xl:w-[245px] xl:px-3">
      <Link to="/" className="mb-6 flex items-baseline justify-center gap-1 px-2 xl:justify-start">
        <span className="serif text-2xl font-black tracking-tight">In</span>
        <span className="serif text-2xl font-black tracking-tight text-primary xl:inline">Bits</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {sideNav.map(({ to, label, icon: Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={`flex items-center gap-4 rounded-xl px-3 py-3 transition hover:bg-secondary ${
                active ? "font-bold text-ink" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-6 w-6 shrink-0 ${active ? "stroke-[2.4]" : ""}`} />
              <span className="hidden truncate text-sm xl:inline">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
