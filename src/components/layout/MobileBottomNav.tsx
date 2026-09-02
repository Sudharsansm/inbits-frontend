import { Link } from "@tanstack/react-router";
import { bottomNav } from "@/components/layout/nav-items";

export function MobileBottomNav({ isActive }: { isActive: (to: string) => boolean }) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[440px] -translate-x-1/2 border-t border-border bg-paper/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {bottomNav.map(({ to, label, icon: Icon }) => {
          const active = isActive(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
                <span>{label}</span>
                <span className={`h-0.5 w-6 rounded-full ${active ? "bg-primary" : "bg-transparent"}`} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
