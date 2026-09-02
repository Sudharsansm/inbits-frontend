import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { User, Bookmark, Settings, LogIn, ChevronRight, Bell, Globe, Shield } from "lucide-react";

export const Route = createFileRoute("/menu/")({
  head: () => ({ meta: [{ title: "Menu · InBits" }, { name: "description", content: "Your InBits profile, saved stories, settings, and account." }] }),
  component: Menu,
});

const items = [
  { icon: User, label: "Profile", hint: "Maya · @maya.reads", to: "/menu/profile" },
  { icon: Bookmark, label: "Saved", hint: "Stories you bookmarked", to: "/menu/saved" },
  { icon: Bell, label: "Notification preferences", hint: "Daily digest at 7am", to: "/menu/notifications" },
  { icon: Globe, label: "Sources", hint: "Publishers you follow", to: "/menu/sources" },
  { icon: Shield, label: "Privacy", hint: "No tracking, ever", to: "/menu/privacy" },
  { icon: Settings, label: "Settings", hint: "Theme, language", to: "/menu/settings" },
] as const;

function Menu() {
  return (
    <AppShell title="Menu">
      <section className="px-4 pt-2">
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-xl font-bold text-primary-foreground">M</div>
          <div className="min-w-0 flex-1">
            <div className="serif text-lg font-bold">Maya Iyer</div>
            <div className="text-xs text-muted-foreground">Reader since 2024 · Bengaluru</div>
          </div>
          <Link to="/menu/profile" className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold">Edit</Link>
        </div>

        <ul className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          {items.map(({ icon: Icon, label, hint, to }, i) => (
            <li key={label} className={i > 0 ? "border-t border-border" : ""}>
              <Link to={to} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-[11px] text-muted-foreground">{hint}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>

        <Link to="/menu/login" className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-primary">
          <LogIn className="h-4 w-4" /> Log in / Sign up
        </Link>

        <p className="serif mt-6 text-center text-[11px] italic text-muted-foreground">
          “News scraped from the best of the web — served slowly, like a good morning paper.”
        </p>
      </section>
    </AppShell>
  );
}
