import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/format";

/**
 * Renders `formatRelativeTime(iso)` — "12m ago", "2h ago", etc. — without
 * the hydration mismatch that calling it straight in JSX causes.
 *
 * FIX: `formatRelativeTime` reads `Date.now()`, so it's exactly the kind
 * of "variable input" React's hydration docs warn about — the server
 * renders it once at request time, and by the time the client hydrates a
 * moment later (a slower connection, the SW's network-first navigation
 * fetch, or just normal page-load time) enough real time can have passed
 * to tip the value over a minute/hour boundary ("30m ago" on the server,
 * "31m ago" on the client). React has no way to reconcile that itself:
 * it logs a hydration-mismatch error and throws away and re-renders the
 * *entire* tree from that point down on the client, which is a lot more
 * disruptive than the one-word label that actually differs.
 *
 * The fix: compute the label the same way on both server and first
 * client render (so it's usually identical, and even when it isn't,
 * `suppressHydrationWarning` tells React this one text node is expected
 * to occasionally differ and to just take the client's value quietly
 * instead of tearing down everything below it) — then, once mounted,
 * recompute it immediately and keep refreshing it every minute so the
 * timestamp keeps ticking forward on its own the way Instagram/Twitter's
 * do, instead of staying frozen at whatever it said on first load.
 */
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const [label, setLabel] = useState(() => formatRelativeTime(iso));

  useEffect(() => {
    setLabel(formatRelativeTime(iso));
    const id = setInterval(() => setLabel(formatRelativeTime(iso)), 60_000);
    return () => clearInterval(id);
  }, [iso]);

  return (
    <span suppressHydrationWarning className={className}>
      {label}
    </span>
  );
}
