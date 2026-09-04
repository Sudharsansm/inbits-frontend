import { createFileRoute } from "@tanstack/react-router";
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { consumeFeedReturnIntent } from "@/lib/feedReturnIntent";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { usePref } from "@/hooks/usePrefs";
import { useSavedPosts } from "@/lib/savedPosts";
import { diversifyBySource } from "@/lib/liveGroups";
import { excludeSeen, markSeen } from "@/lib/seenArticles";
import { hasImage } from "@/lib/postImage";
import { useInterestProfile } from "@/lib/interests";
import { UpdateReel } from "@/components/updates/UpdateReel";
import { AdReel } from "@/components/ads/AdReel";
import { ShareSheet } from "@/components/updates/ShareSheet";

export const Route = createFileRoute("/updates")({
  head: () => ({
    meta: [
      { title: "Updates · InBits" },
      {
        name: "description",
        content: "A reels-style vertical feed of the day's most important updates.",
      },
    ],
  }),
  // No loader — same reasoning as Home. Blocking this route's navigation
  // on a network round-trip is exactly what made opening Updates feel
  // like it was stuck "loading". useLiveFeed's own REST-fallback +
  // WebSocket populate `liveItems` client-side right after mount, and a
  // reel-shaped skeleton (see ReelSkeleton) covers the brief gap so the
  // page never shows a bare spinner or a frozen screen.
  component: Updates,
});

// This reel list scrolls inside its own div rather than the window (it
// needs snap-scrolling one reel at a time), so the router's built-in
// window-based scroll restoration can't see it. Remembered here at module
// scope and restored on mount instead — otherwise leaving to read an
// article and coming back would always drop you back at reel #1.
let savedScrollTop = 0;

/**
 * Ad slots are placed several reels down (see `idx % 4 === 0` below), so
 * they're never the first thing on screen — but `posts.map` still renders
 * every slot in the DOM up front, and `AdReel` fires its AdSense request
 * the instant it mounts. Without this wrapper, opening the page would
 * request/paint every ad slot immediately, which is what made it look
 * like an ad was "showing" right when the page opened even though it
 * wasn't the visible reel yet.
 *
 * This defers mounting the real `AdReel` until its slot actually scrolls
 * close to view — i.e. only once the reader is scrolling toward it — by
 * watching an empty placeholder (same full-reel size, so the snap-scroll
 * rhythm and reel count don't shift) with an IntersectionObserver rooted
 * on the reel list itself. `rootMargin: "200% 0px"` means loading starts
 * about two screens before the slot is reached, giving the ad network
 * time to resolve before the reader actually arrives. The fade-in on
 * mount is a second line of defense for the rare case where the response
 * is still late despite the extra lead time.
 */
function LazyAdReel({
  slot,
  scrollRootRef,
}: {
  slot: string;
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
}) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  // Once AdSense tells us this slot got no fill, drop the wrapper too —
  // otherwise the reel list keeps a blank full-screen snap section where
  // the ad would have been.
  const [unfilled, setUnfilled] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;
    const el = placeholderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          io.disconnect();
        }
      },
      { root: scrollRootRef.current, rootMargin: "200% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scrollRootRef, shouldLoad]);

  if (unfilled) return null;

  if (shouldLoad) {
    // Same footprint as a real reel/ad so the scroll list's height and
    // snap points don't jump once the real ad swaps in.
    return (
      <div className="ad-fade-in h-full w-full snap-start snap-always">
        <AdReel
          slot={slot}
          onStatusChange={(status) => {
            if (status === "unfilled") setUnfilled(true);
          }}
        />
      </div>
    );
  }

  return <div ref={placeholderRef} className="h-full w-full snap-start snap-always" />;
}

function Updates() {
  // useLiveFeed no longer keeps a stored feed to resume from — every
  // mount starts empty and fetches live. This only decides whether
  // Updates also resets the reader's remembered scroll position on this
  // mount (see the layout effects below): if we didn't just arrive here
  // from reading an article (see lib/feedReturnIntent.ts), start
  // scrolled to reel #1 instead of wherever it was left off -- the same
  // way reopening Instagram's Reels tab after visiting another tab
  // starts you from the top with fresh content.
  const [{ resetOnMount, returnToPostId }] = useState(() => {
    const { intent, postId } = consumeFeedReturnIntent();
    return { resetOnMount: intent === "reset", returnToPostId: postId };
  });

  const {
    items: liveItems,
    hasMore,
    loadMore,
    refresh,
  } = useLiveFeed({ category: "All", pageSize: 6, cacheKey: "updates" });

  // Skip anything already shown on Home or Search this session — same
  // shared registry Home writes to. Stands is still the place to find
  // every article regardless of what's been seen here.
  const unseenPool = useMemo(() => excludeSeen(liveItems, "updates", 8), [liveItems]);

  // Same live pool of articles the Home feed draws from, but reordered so
  // Updates doesn't just read as a scrollable copy of Home: round-robin
  // across publishers instead of Home's straight chronological order, so
  // consecutive reels come from different sources. Recomputed only when
  // the underlying item set actually changes, not on every render.
  // Same rule as Home: a reel with no image at all is never shown, and
  // neither is one whose image URL exists but has failed to load
  // (tracked below via ImageCarousel's onUnavailable callback, threaded
  // through UpdateReel). No placeholder/letter stands in for a missing
  // image here -- the whole reel is just not part of the list.
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(() => new Set());
  const markImageBroken = useCallback((id: string) => {
    setBrokenImageIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const posts = useMemo(
    () =>
      diversifyBySource(unseenPool).filter(
        (item) => hasImage(item) && !brokenImageIds.has(item.id),
      ),
    [unseenPool, brokenImageIds],
  );

  useEffect(() => {
    if (posts.length > 0) markSeen(posts.map((p) => p.id), "updates");
  }, [posts]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const { recordLike } = useInterestProfile();
  const { has: isSavedId, toggleSave } = useSavedPosts();
  const [burst, setBurst] = useState<Record<string, number>>({});
  const [shareFor, setShareFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const tapRef = useRef<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const reelRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);
  // Persisted like Instagram's mute toggle: muted by default (autoplay
  // requires it), and your choice carries forward across reels/visits.
  const [muted, setMuted] = usePref<boolean>("reels.muted", true);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const restoredRef = useRef(false);

  // Always-on: track scrollTop as the reader scrolls (used as the
  // fallback below), and handle the reset case immediately -- nothing to
  // restore, so don't let the retrying effect below do anything either.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (resetOnMount) {
      el.scrollTo({ top: 0 });
      savedScrollTop = 0;
      restoredRef.current = true;
    }

    const onScroll = () => {
      savedScrollTop = el.scrollTop;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      savedScrollTop = el.scrollTop;
      el.removeEventListener("scroll", onScroll);
    };
  }, [resetOnMount]);

  // Restore exactly where the user left off. Finding the exact reel by
  // its post id and scrolling straight to it is robust to any shift in
  // the list between leaving and coming back -- an ad slot's lazy mount,
  // a reel dropping out because its image failed, a pull-to-refresh
  // appending new reels -- any of which would make a raw remembered
  // pixel offset land on the wrong reel.
  //
  // This route deliberately has no loader (see the comment at the top of
  // the file), so on a genuine full page reload -- which is what a Back
  // navigation often actually is here, since an open feed WebSocket
  // keeps this page out of the browser's back-forward cache, see
  // lib/feedReturnIntent.ts -- `posts` starts empty and fills in
  // asynchronously from the REST fallback/socket. A restore attempted
  // only once on mount can easily run before the target reel is in the
  // DOM at all and silently find nothing. So this re-runs every time
  // `posts` changes instead, and gives up (via restoredRef) the instant
  // it succeeds, both so it stops looking once satisfied and so it never
  // fights the reader's own scrolling once they've started.
  useLayoutEffect(() => {
    if (restoredRef.current) return;
    const el = scrollRef.current;
    if (!el) return;

    if (!returnToPostId) {
      if (savedScrollTop > 0 && posts.length > 0) {
        el.scrollTop = savedScrollTop;
        restoredRef.current = true;
      }
      return;
    }
    const target = el.querySelector(`[data-post-id="${CSS.escape(returnToPostId)}"]`);
    if (target) {
      (target as HTMLElement).scrollIntoView({ block: "start" });
      restoredRef.current = true;
    }
  }, [posts, returnToPostId]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { root: scrollRef.current, rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  // Which reel is actually on screen right now — only its track plays,
  // same as Instagram Reels never overlapping two audio tracks.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (mostVisible) setActiveId(mostVisible.target.getAttribute("data-post-id"));
      },
      { root, threshold: [0.6, 0.75, 0.9] },
    );
    reelRefs.current.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [posts]);

  // Same swipe-down-to-refresh as the rest of the app: bound to this
  // reel's own scroll container since it scrolls independently of the
  // page. New reels appended after what's already loaded.
  const { pullDistance, refreshing, triggerDistance } = usePullToRefresh({
    onRefresh: refresh,
    scrollRef,
  });

  const toggleLike = (id: string, force?: boolean) => {
    setLiked((s) => {
      const next = force ?? !s[id];
      // Same "count real likes, not every toggle" rule as the Home
      // feed's like button — only the off→on transition feeds the
      // interest profile that drives "Recommended for you".
      if (next && !s[id]) {
        const p = posts.find((post) => post.id === id);
        if (p) recordLike(p.category, p.source);
      }
      return { ...s, [id]: next };
    });
  };

  const triggerLikeBurst = (id: string) => {
    setBurst((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
  };

  const handleDoubleTap = (id: string) => {
    const now = Date.now();
    const last = tapRef.current[id] ?? 0;
    if (now - last < 300) {
      toggleLike(id, true);
      triggerLikeBurst(id);
      tapRef.current[id] = 0;
    } else {
      tapRef.current[id] = now;
    }
  };

  const currentPost = posts.find((p) => p.id === shareFor);

  return (
    <AppShell title="Updates" fullWidth>
      <div
        ref={scrollRef}
        // FIX: TanStack Router's scrollRestoration (see router.tsx) only
        // auto-tracks the window's own scroll unless an element is
        // tagged with this attribute -- without it, the router has no
        // way to know this div (not the window) is what actually
        // scrolls here, so opening a reel's full article and hitting
        // Back reset you to the top of the list instead of the reel you
        // were on. Home doesn't need this because its feed scrolls the
        // window directly.
        data-scroll-restoration-id="updates-reel-scroll"
        className="-mt-0 h-[calc(100vh-129px)] md:h-[calc(100vh-2.5rem)] w-full overflow-y-auto snap-y snap-mandatory scrollbar-none"
      >
        <div
          className="flex items-center justify-center overflow-hidden text-[11px] text-white/70 transition-[height]"
          style={{ height: refreshing ? 32 : Math.min(pullDistance, triggerDistance) }}
        >
          <Loader2
            className={`h-4 w-4 ${refreshing || pullDistance >= triggerDistance ? "animate-spin" : ""}`}
          />
        </div>

        {posts.map((p, idx) => {
          const isLiked = liked[p.id];
          const isSaved = isSavedId(p.id);
          const burstKey = burst[p.id] ?? 0;
          return (
            <Fragment key={p.id}>
              {/* One ad reel every 4 real reels. Never on idx 0 (so the
                  page never opens on an ad), and lazily mounted (see
                  LazyAdReel above) so it doesn't request/show anything
                  until the reader actually scrolls toward it.
                  NOTE: this must be a Fragment, not a wrapping <div> — the
                  scroll container below uses CSS scroll-snap
                  (snap-y snap-mandatory), which only applies to its
                  *direct* children. A wrapping div here would nest the ad
                  slot and the reel card one level too deep and silently
                  break snap-scrolling for every reel. */}
              {idx > 0 && idx % 4 === 0 && (
                <LazyAdReel slot="0000000001" scrollRootRef={scrollRef} />
              )}
              <div
                data-post-id={p.id}
                ref={(el) => {
                  if (el) reelRefs.current.set(p.id, el);
                  else reelRefs.current.delete(p.id);
                }}
                className="reel-card h-full w-full snap-start snap-always"
              >
                <UpdateReel
                  post={p}
                  isLiked={isLiked}
                  isSaved={isSaved}
                  burstKey={burstKey}
                  active={activeId === p.id}
                  muted={muted}
                  onDoubleTap={() => handleDoubleTap(p.id)}
                  onToggleLike={() => toggleLike(p.id)}
                  onToggleSave={() => {
                    toggleSave(p.id);
                    setToast(isSaved ? "Removed from saved" : "Saved");
                  }}
                  onShare={() => setShareFor(p.id)}
                  onToggleMute={() => setMuted(!muted)}
                  onImageUnavailable={() => markImageBroken(p.id)}
                />
              </div>
            </Fragment>
          );
        })}

        <div
          ref={sentinel}
          className="flex h-16 items-center justify-center text-[11px] text-muted-foreground"
        >
          {hasMore && posts.length > 0 && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </div>

      {/* Share sheet */}
      {currentPost && (
        <ShareSheet
          post={currentPost}
          onClose={() => setShareFor(null)}
          onToast={(m) => setToast(m)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center">
          <div className="rounded-full bg-ink/90 px-4 py-2 text-xs font-medium text-paper shadow-lg">
            {toast}
          </div>
        </div>
      )}

      <style>{`
        @keyframes heartBurst {
          0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
          30% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
          70% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
        .heart-burst { animation: heartBurst 900ms ease-out forwards; }
        @keyframes adFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .ad-fade-in { animation: adFadeIn 300ms ease-out; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </AppShell>
  );
}