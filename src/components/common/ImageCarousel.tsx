import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Two real, common causes of an image failing to load even though the
 * article genuinely has one:
 *
 * 1. Mixed content: a chunk of crawled sources still hand back plain
 *    `http://` image URLs. On a site served over `https://` (any real
 *    deployment), browsers silently block those as mixed content -- the
 *    <img> just fails to load, which looks identical to a dead link.
 *    Rewriting to `https://` fixes this for the very large majority of
 *    hosts, which support https even when the scraped URL didn't use it.
 * 2. Hotlink protection: many news sites reject image requests whose
 *    Referer header is a different site (i.e. us). `referrerPolicy="no-referrer"`
 *    on the <img> itself (applied below) stops the browser from sending
 *    that header at all -- the same technique this app already uses for
 *    the article iframe in ArticleWebView.tsx, just not previously
 *    applied to thumbnails.
 */
function normalizeImageUrl(src: string | undefined | null): string {
  const trimmed = src?.trim() ?? "";
  if (!trimmed) return "";
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    trimmed.startsWith("http://")
  ) {
    return `https://${trimmed.slice("http://".length)}`;
  }
  return trimmed;
}

// A failed image load is retried this many times, with increasing delay
// between attempts, before it's treated as permanently unavailable. This
// matters most on a slow/flaky connection: a single failed request there
// is very often a transient timeout, not a dead image -- retrying first
// means real content doesn't get wrongly removed over a one-off blip.
// Delays are 700ms, then 1400ms (attempt number * BASE_DELAY_MS).
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 700;

/**
 * Instagram-style swipeable image set: horizontal snap-scroll with dot
 * indicators. Used wherever a post has more than one photo (see
 * FeedItem.images) — falls back to a single plain <img> everywhere else.
 *
 * IMPORTANT: this component never shows a placeholder box, icon, or
 * letter in place of a missing/broken image — per product requirement,
 * a post with no working image should not be shown at all, not shown
 * with a stand-in graphic. So:
 *  - Every failed image gets up to MAX_RETRIES retries (with backoff)
 *    before being given up on — see the retry scheduling below.
 *  - If none of `images` resolves to a usable URL (empty to begin with),
 *    or every one of them has exhausted its retries, this component
 *    renders nothing (`null`) and calls `onUnavailable` once so the
 *    *parent* can remove the whole post — see PostCard.tsx /
 *    UpdateReel.tsx, and the Home/Updates routes that actually filter
 *    the post out.
 *  - A multi-image post that permanently loses some (not all) of its
 *    photos just quietly drops those from the swipeable set.
 */
export function ImageCarousel({
  images,
  alt = "",
  className = "",
  imgClassName = "",
  priority = false,
  onUnavailable,
}: {
  images: string[];
  alt?: string;
  className?: string;
  imgClassName?: string;
  /** Pass true for the post(s) rendered above the fold (e.g. the first
   * item in Home's feed) so its image loads eagerly/high-priority
   * instead of lazily. */
  priority?: boolean;
  /** Called once (not on every re-render) when there is genuinely no
   * image left to show — either `images` had nothing usable to begin
   * with, or every candidate has exhausted its retries. The parent is
   * responsible for actually removing the post when this fires. */
  onUnavailable?: () => void;
}) {
  const [active, setActive] = useState(0);
  // Permanently gave up on this index after MAX_RETRIES failed attempts.
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  // Currently sitting in the gap between a failed attempt and its
  // scheduled retry -- hidden meanwhile so the browser's broken-image
  // glyph never flashes on screen while we're about to try again.
  const [pending, setPending] = useState<Set<number>>(() => new Set());
  // Bumped per-index to force the <img> to remount (via `key`) on retry
  // -- changing `key` is what makes the browser actually re-request the
  // URL instead of leaving the old failed image element sitting there.
  const [retryTick, setRetryTick] = useState<Record<number, number>>({});

  const trackRef = useRef<HTMLDivElement>(null);
  const reportedRef = useRef(false);
  const attemptsRef = useRef<Record<number, number>>({});
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // How many of the images actually have a URL worth trying in the
  // first place -- used below to know when EVERY real candidate has
  // truly been exhausted, vs. there simply being nothing to begin with.
  const totalWithUrl = useMemo(
    () => images.filter((src) => !!normalizeImageUrl(src)).length,
    [images],
  );

  useEffect(() => {
    // Cancel any in-flight retry timers when this post unmounts (e.g.
    // scrolled out and removed) so we never call setState after the
    // component is gone.
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const scheduleRetry = (index: number) => {
    const attempts = (attemptsRef.current[index] ?? 0) + 1;
    attemptsRef.current[index] = attempts;

    if (attempts > MAX_RETRIES) {
      setPending((prev) => {
        if (!prev.has(index)) return prev;
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      setFailed((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
      return;
    }

    setPending((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
    timersRef.current[index] = setTimeout(() => {
      setPending((prev) => {
        if (!prev.has(index)) return prev;
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      setRetryTick((prev) => ({ ...prev, [index]: (prev[index] ?? 0) + 1 }));
    }, RETRY_BASE_DELAY_MS * attempts);
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== active) setActive(index);
  };

  const visible = images
    .map((src, i) => ({ src: normalizeImageUrl(src), i }))
    .filter(({ src, i }) => src && !failed.has(i) && !pending.has(i));

  useEffect(() => {
    // Don't give up while any image is still mid-retry -- only once
    // every real candidate has permanently failed (or there was never
    // one to begin with) do we tell the parent this post is unshowable.
    if (pending.size > 0) return;
    if (failed.size >= totalWithUrl && !reportedRef.current) {
      reportedRef.current = true;
      onUnavailable?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed.size, pending.size, totalWithUrl]);

  if (visible.length === 0) return null;

  if (visible.length === 1) {
    const { src, i } = visible[0];
    return (
      <img
        key={`${i}-${retryTick[i] ?? 0}`}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        referrerPolicy="no-referrer"
        draggable={false}
        className={`w-full ${imgClassName}`}
        onError={() => scheduleRetry(i)}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="scrollbar-none flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {visible.map(({ src, i }) => (
          <img
            key={`${i}-${retryTick[i] ?? 0}`}
            src={src}
            alt={alt}
            loading={i === 0 ? "eager" : "lazy"}
            decoding={i === 0 && priority ? "sync" : "async"}
            fetchPriority={i === 0 && priority ? "high" : "auto"}
            referrerPolicy="no-referrer"
            draggable={false}
            className={`w-full flex-none snap-center ${imgClassName}`}
            onError={() => scheduleRetry(i)}
          />
        ))}
      </div>

      {/* Position pill, Instagram-style */}
      <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
        {Math.min(active + 1, visible.length)}/{visible.length}
      </span>

      {/* Dot indicators */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
        {visible.map(({ i }, dotIndex) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              dotIndex === active ? "w-3 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}