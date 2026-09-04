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
import { Loader2, WifiOff } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useLiveFeed, clearFeedCache } from "@/hooks/useLiveFeed";
import { consumeFeedReturnIntent } from "@/lib/feedReturnIntent";
import { loadFeedForRoute } from "@/lib/feedLoader";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useInterestProfile } from "@/lib/interests";
import { browserLanguage, pickForYou } from "@/lib/recommend";
import { excludeSeen, markSeen } from "@/lib/seenArticles";
import { hasImage } from "@/lib/postImage";
import {
  groupChannelsFromFeed,
  groupJournalFromFeed,
  groupShowcaseFromFeed,
} from "@/lib/liveGroups";
import { PostCard } from "@/components/home/PostCard";
import { SuggestionsSidebar } from "@/components/home/SuggestionsSidebar";
import { StandsRail } from "@/components/home/StandsRail";
import { JournalRail } from "@/components/home/JournalRail";
import { ChannelsRail } from "@/components/home/ChannelsRail";
import { JobsRail } from "@/components/home/JobsRail";
import { RecommendedRail } from "@/components/home/RecommendedRail";
import { NativeHomeAd } from "@/components/ads/NativeHomeAd";

// FIX: with router-level scrollRestoration now off (see router.tsx), Home
// has to remember its own window scroll position across a route unmount
// the same way Updates already does for its reel list -- otherwise
// leaving to read an article and hitting Back always dropped you back at
// the top of the feed instead of the post you were on. Module scope so it
// survives Home unmounting while you're on /post/:id.
let savedWindowScrollY = 0;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InBits" },
      {
        name: "description",
        content:
          "A calm, book-readable feed of news, gossip, and jobs. Scraped from the best sources, served like a magazine.",
      },
      { property: "og:title", content: "InBits — News & Updates" },
      {
        property: "og:description",
        content: "A calm, book-readable feed of news, gossip, and jobs.",
      },
    ],
  }),
  // A short, timeout-bounded loader (see lib/feedLoader.ts) — this is
  // what makes a cold visit (fresh tab, hard refresh, a shared link)
  // render real articles on the very first frame instead of the
  // skeleton, on both the server-rendered HTML and the client. It's safe
  // to have this run on every navigation now: the backend response it
  // hits is nginx-microcached (see deploy/nginx/nginx.conf) and short
  // `Cache-Control`'d, so it's cheap even under heavy traffic, and it can
  // never block the route for more than ~1.2s even if the backend is
  // completely unreachable — at which point the route still renders
  // immediately with nothing, and useLiveFeed's own REST-fallback +
  // WebSocket take over exactly as before. `staleTime`
  // means returning to Home within 30s of the last load reuses that data
  // instead of refetching, so it doesn't slow down normal in-app nav.
  loader: () => loadFeedForRoute("All"),
  staleTime: 30_000,
  component: Home,
});

function Home() {
  const initialItems = Route.useLoaderData();

  // Home's cacheKey defaults to its category ("All" — see the
  // `cacheKey ?? category` fallback in useLiveFeed.ts). Consumed exactly
  // once per mount, before useLiveFeed reads that cache: if we didn't
  // just arrive here from reading an article (see
  // lib/feedReturnIntent.ts), clear it so the feed starts fresh from the
  // loader's data instead of resuming wherever it was left off — the
  // same way reopening Instagram's Home tab after visiting another tab
  // shows fresh content from the top rather than your old scroll spot.
  const [{ resetOnMount, returnToPostId }] = useState(() => {
    const { intent, postId } = consumeFeedReturnIntent();
    const reset = intent === "reset";
    if (reset) clearFeedCache("All");
    return { resetOnMount: reset, returnToPostId: postId };
  });

  const { items, hasMore, connected, showEmptyState, loadMore, refresh } = useLiveFeed({
    category: "All",
    pageSize: 10,
    initialItems,
  });
  const sentinel = useRef<HTMLDivElement>(null);

  const restoredRef = useRef(false);

  // Reset case: nothing to restore, go straight to the top and don't let
  // the retrying restore effect below do anything.
  useLayoutEffect(() => {
    if (!resetOnMount) return;
    window.scrollTo({ top: 0 });
    savedWindowScrollY = 0;
    restoredRef.current = true;
  }, [resetOnMount]);

  // Keep saving the window scroll position as the reader scrolls, purely
  // as a fallback for the rare case there's no returnToPostId to restore
  // by (see the retrying effect below, after feedPool, for the primary
  // id-based restore).
  useEffect(() => {
    const onScroll = () => {
      savedWindowScrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      savedWindowScrollY = window.scrollY;
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Never show a headline the reader has already seen on Updates or
  // Search in this session — those get pushed onto Stands instead, which
  // is the one page meant to hold everything regardless of what's been
  // seen. Falls back to the full pool if there isn't enough unseen
  // content yet (e.g. first page opened this session).
  // Posts with no image at all are never shown -- and neither is a post
  // whose image URL exists but has failed to load (tracked below via
  // ImageCarousel's onUnavailable callback). This app shows a real image
  // or it doesn't show the post; there's no placeholder in between.
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(() => new Set());
  const markImageBroken = useCallback((id: string) => {
    setBrokenImageIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const feedPool = useMemo(
    () =>
      excludeSeen(items, "home", 10).filter(
        (item) => hasImage(item) && !brokenImageIds.has(item.id),
      ),
    [items, brokenImageIds],
  );

  // Restore exactly where the reader left off. Scrolling the exact post
  // (by id) back into view is robust to layout shifts that happen while
  // you're away -- an ad slot mounting, an image finishing loading and
  // changing a card's height, a pull-to-refresh appending new items --
  // any of which would make a raw remembered pixel offset land on the
  // wrong card.
  //
  // This route has no client-side cache to fall back on the moment a
  // Back navigation turns out to be a genuine full page reload rather
  // than an in-app pop (see lib/feedReturnIntent.ts for why that
  // happens) -- `items` starts as whatever the loader/SSR pass produced,
  // and the exact post might land on a later page/socket push rather
  // than the first one. A single restore attempt on mount can easily run
  // before that post is even in the DOM yet and silently do nothing. So
  // this re-runs every time feedPool changes instead of only once, and
  // gives up (via restoredRef) the moment it succeeds -- both so it
  // stops looking once there's nothing left to find, and so it never
  // overrides the reader's own scrolling once they've started.
  useLayoutEffect(() => {
    if (restoredRef.current) return;
    if (!returnToPostId) {
      if (savedWindowScrollY > 0 && feedPool.length > 0) {
        window.scrollTo({ top: savedWindowScrollY });
        restoredRef.current = true;
      }
      return;
    }
    const target = document.querySelector(`[data-post-id="${CSS.escape(returnToPostId)}"]`);
    if (target) {
      target.scrollIntoView({ block: "start" });
      restoredRef.current = true;
    }
  }, [feedPool, returnToPostId]);

  // Articles already sitting in the main feed's visible window — used to
  // keep every in-feed suggestion rail from just echoing headlines the
  // reader has already scrolled past a moment earlier.
  const visibleIds = useMemo(() => new Set(feedPool.slice(0, 24).map((i) => i.id)), [feedPool]);
  // Same live buffer, grouped into the Stands/Journal/Channels shapes for
  // the in-feed suggestion rails — so tapping one lands on the exact same
  // article/category/channel the Stands page itself would show, instead
  // of a separate mock dataset with its own (mismatched) ids. Built from
  // the pool *excluding* what's already visible above, so these rails
  // read as genuinely different stories rather than a repeat of the feed
  // the reader just passed — falling back to the full pool only if
  // excluding leaves too little live content to group from.
  const railPool = useMemo(() => {
    const rest = feedPool.filter((i) => !visibleIds.has(i.id));
    return rest.length >= 6 ? rest : items;
  }, [feedPool, items, visibleIds]);
  const showcase = useMemo(() => groupShowcaseFromFeed(railPool), [railPool]);
  const journal = useMemo(() => groupJournalFromFeed(railPool), [railPool]);
  const channels = useMemo(() => groupChannelsFromFeed(railPool), [railPool]);

  // "Recommended for you" — ranked from what this reader actually likes
  // (see lib/interests.ts), their browser language, and recency. Only
  // recomputed when the underlying pool or the profile itself changes,
  // not on every render.
  const { profile } = useInterestProfile();
  const language = useMemo(() => browserLanguage(), []);
  const recommended = useMemo(() => {
    return pickForYou(feedPool, profile, language, visibleIds, 8);
  }, [feedPool, profile, language, visibleIds]);

  // Mark whatever the main feed is actually displaying as "seen" so
  // Updates/Search know to show something else.
  useEffect(() => {
    if (feedPool.length > 0)
      markSeen(
        feedPool.slice(0, 24).map((i) => i.id),
        "home",
      );
  }, [feedPool]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  // Swipe-down-to-refresh, exactly like Instagram/Twitter: new stories
  // scraped while you're browsing wait quietly until you pull down at
  // the top, then they're appended after what you've already got —
  // continuing the feed rather than jumping the queue.
  const { pullDistance, refreshing, triggerDistance } = usePullToRefresh({ onRefresh: refresh });

  // Only surface the "reconnecting" notice for a *real* drop — a brief
  // instant of `connected === false` on every normal page visit (while
  // the socket handshakes) isn't a problem worth telling anyone about.
  const [showReconnecting, setShowReconnecting] = useState(false);
  useEffect(() => {
    if (connected) {
      setShowReconnecting(false);
      return;
    }
    const t = setTimeout(() => setShowReconnecting(true), 2500);
    return () => clearTimeout(t);
  }, [connected]);

  return (
    <AppShell aside={<SuggestionsSidebar showcase={showcase} channels={channels} />}>
      <div
        className="flex items-center justify-center overflow-hidden text-[11px] text-muted-foreground transition-[height]"
        style={{ height: refreshing ? 40 : Math.min(pullDistance, triggerDistance) }}
      >
        <Loader2
          className={`h-4 w-4 ${refreshing || pullDistance >= triggerDistance ? "animate-spin" : ""}`}
        />
      </div>

      {/* Instagram-style vertical post feed, backed live by the crawler. */}
      <section className="flex flex-col">
        {/* FIX: home used to show a skeleton placeholder for as long as
            feedPool was empty. Removed so the page never shows a loading
            state — it renders nothing until real posts are ready (which,
            thanks to the loader in Route above, is normally instant),
            and only falls back to the "no stories yet" message once
            showEmptyState genuinely confirms there's nothing to show. */}
        {feedPool.length === 0 && showEmptyState && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No stories yet — check back in a moment.
          </p>
        )}
        {feedPool.map((item, index) => {
          const slot = index % 8;
          return (
            <Fragment key={item.id}>
              {/* FIX: only the first card is above the fold on a cold
                  open -- that's the one whose image should load eagerly
                  (see ImageCarousel's `priority` prop). Every other card
                  keeps the existing lazy behavior. */}
              <PostCard
                post={item}
                priority={index === 0}
                onImageUnavailable={() => markImageBroken(item.id)}
              />
              {slot === 1 && <StandsRail showcase={showcase} />}
              {slot === 3 && <JournalRail journal={journal} />}
              {/* One AdSense unit per 8-post cycle — same cadence as the
                  other rails, so it reads as part of the feed's normal
                  rhythm rather than an interruption. Swap the slot ID for
                  the ad unit you create in the AdSense dashboard. */}
              {slot === 4 && <NativeHomeAd slot="0000000000" />}
              {slot === 5 && <ChannelsRail channels={channels} />}
              {slot === 6 && <RecommendedRail picks={recommended} />}
              {slot === 7 && <JobsRail />}
            </Fragment>
          );
        })}
      </section>

      <div
        ref={sentinel}
        className="flex items-center justify-center gap-2 px-4 pb-2 pt-6 text-[11px] text-muted-foreground"
      >
        {hasMore && feedPool.length > 0 ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more bits…
          </>
        ) : feedPool.length > 0 ? (
          <span>You're all caught up.</span>
        ) : null}
      </div>

      {showReconnecting && (
        <div className="flex items-center justify-center gap-1.5 pb-6 text-[11px] text-muted-foreground">
          <WifiOff className="h-3.5 w-3.5" /> Reconnecting to live feed…
        </div>
      )}
    </AppShell>
  );
}