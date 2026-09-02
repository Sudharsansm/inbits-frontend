import { AppShell } from "@/components/layout/AppShell";

// Shown by the router while a route's loader is still in flight. The goal
// is "frontend first, backend after": the nav, header, and page frame
// paint immediately (all local, no network needed), and only the content
// area shows a placeholder until the loader's data arrives. Without this,
// the router shows nothing at all during a first-time navigation, which
// reads as the whole page freezing rather than something loading.
export function RoutePendingSkeleton() {
  return (
    <AppShell>
      <div className="animate-pulse space-y-4 px-4 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-16 w-16 flex-none rounded-lg bg-secondary" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-3/4 rounded bg-secondary" />
              <div className="h-3 w-1/2 rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
