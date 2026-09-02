export function formatCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

/** Turns a backend ISO timestamp into "2h ago" / "Yesterday" style text.
 * Falls back to returning the raw string if it isn't a parseable date, so
 * a malformed timestamp degrades gracefully instead of crashing a card. */
export function formatRelativeTime(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
