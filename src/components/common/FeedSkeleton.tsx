// The "Instagram formula" referenced in feedback: never show a bare
// spinner or a blank page while real content is still in flight — show
// placeholder shapes for the content that's coming instead, so the page
// reads as "already here, filling in" rather than "loading". These are
// swapped out for real cards the moment the first batch of live items
// arrives (usually the WebSocket's "initial" message, or the REST
// fallback if the socket is slow to connect — see useLiveFeed).

/** Home's vertical post-card feed. */
export function PostCardSkeleton() {
  return (
    <div className="animate-pulse space-y-2 border-b border-border px-4 py-4">
      <div className="flex items-center gap-2">
        <div className="h-3 w-16 rounded bg-secondary" />
        <div className="h-3 w-10 rounded bg-secondary" />
      </div>
      <div className="h-4 w-11/12 rounded bg-secondary" />
      <div className="h-4 w-2/3 rounded bg-secondary" />
      <div className="h-40 w-full rounded-xl bg-secondary" />
    </div>
  );
}

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Updates' full-bleed reel view. */
export function ReelSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-secondary/40 px-8">
      <div className="h-full w-full animate-pulse rounded-2xl bg-secondary" />
    </div>
  );
}

/** Full article read page — mirrors the real layout (back link, meta row,
 * hero image, body lines) so the swap to real content doesn't jump the
 * page around. */
export function ArticleSkeleton() {
  return (
    <div className="animate-pulse px-5 pt-4">
      <div className="h-3 w-16 rounded bg-secondary" />
      <div className="mt-4 h-3 w-40 rounded bg-secondary" />
      <div className="mt-3 h-5 w-11/12 rounded bg-secondary" />
      <div className="mt-2 h-5 w-2/3 rounded bg-secondary" />
      <div className="mt-4 h-16 w-full rounded bg-secondary" />
      <div className="mt-6 h-64 w-full rounded-2xl bg-secondary" />
      <div className="mt-6 space-y-3">
        <div className="h-4 w-full rounded bg-secondary" />
        <div className="h-4 w-full rounded bg-secondary" />
        <div className="h-4 w-5/6 rounded bg-secondary" />
        <div className="h-4 w-full rounded bg-secondary" />
        <div className="h-4 w-3/4 rounded bg-secondary" />
      </div>
    </div>
  );
}

/** Search's Pinterest-style discover grid. */
export function DiscoverGridSkeleton({ count = 8 }: { count?: number }) {
  const heights = [180, 140, 200, 150, 170, 130, 190, 160];
  return (
    <div className="columns-2 gap-2 px-3 [column-fill:_balance]">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="mb-2 w-full animate-pulse break-inside-avoid rounded-xl bg-secondary"
          style={{ height: heights[i % heights.length] }}
        />
      ))}
    </div>
  );
}
