import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { usePref } from "@/hooks/usePrefs";
import { useSavedPosts } from "@/lib/savedPosts";
import { diversifyBySource } from "@/lib/liveGroups";
import { excludeSeen, markSeen } from "@/lib/seenArticles";
import { useInterestProfile } from "@/lib/interests";
import { UpdateReel } from "@/components/updates/UpdateReel";
import { ReelSkeleton } from "@/components/common/FeedSkeleton";
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

function Updates() {
  const {
    items: liveItems,
    hasMore,
    loadMore,
    refresh,
    showEmptyState,
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
  const posts = useMemo(() => diversifyBySource(unseenPool), [unseenPool]);

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

  // Restore exactly where the user left off (which reel they were on),
  // and keep saving as they scroll so leaving mid-session — e.g. tapping
  // "Read" on a reel — and coming back lands them right back there
  // instead of resetting to the top. useLayoutEffect so the jump happens
  // before paint, not as a visible snap after the reel list first renders.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (savedScrollTop > 0) el.scrollTop = savedScrollTop;

    const onScroll = () => {
      savedScrollTop = el.scrollTop;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      savedScrollTop = el.scrollTop;
      el.removeEventListener("scroll", onScroll);
    };
    // Only needs to run once per mount — `posts` populating later doesn't
    // require re-binding this.
  }, []);

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

        {posts.length === 0 && !showEmptyState && <ReelSkeleton />}
        {posts.map((p) => {
          const isLiked = liked[p.id];
          const isSaved = isSavedId(p.id);
          const burstKey = burst[p.id] ?? 0;
          return (
            <div
              key={p.id}
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
              />
            </div>
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
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </AppShell>
  );
}
