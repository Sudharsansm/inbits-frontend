import { Link } from "@tanstack/react-router";
import { Search, Bell, MoreVertical } from "lucide-react";
import type { ReactNode } from "react";

export function MobileHeader({ title, action }: { title?: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-paper/85 px-4 py-3 backdrop-blur md:hidden">
      <Link to="/" className="flex items-baseline gap-1">
        <span className="serif text-2xl font-black tracking-tight">In</span>
        <span className="serif text-2xl font-black tracking-tight text-primary">Bits</span>
        {title && (
          <span className="ml-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </span>
        )}
      </Link>
      <nav className="flex items-center gap-1">
        {action}
        <Link to="/search" aria-label="Search" className="rounded-full p-2 hover:bg-secondary">
          <Search className="h-5 w-5" />
        </Link>
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="relative rounded-full p-2 hover:bg-secondary"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Link>
        <Link to="/menu" aria-label="Menu" className="rounded-full p-2 hover:bg-secondary">
          <MoreVertical className="h-5 w-5" />
        </Link>
      </nav>
    </header>
  );
}
