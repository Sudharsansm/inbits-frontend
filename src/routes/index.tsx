import { createFileRoute } from "@tanstack/react-router";
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Loader2, WifiOff } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { consumeFeedReturnIntent } from "@/lib/feedReturnIntent";
import { getLastPostId, setLastPostId } from "@/lib/homeReturnPosition";
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
//
// FIX: this used to be a plain module-level `let`, which only survives a
// same-JS-context SPA navigation. This route holds an open feed
// WebSocket (see useLiveFeed), and pages with an open socket are
// excluded from the browser's back-forward cache in every major browser
// -- so a real Back navigation is very often a genuine full page reload,
// which wipes a plain variable before Home ever gets to read it again.
// That's exactly the scenario the *id-based* restore below was already
// hardened against (see homeReturnPosition.ts / feedReturnIntent.ts,
// both sessionStorage-backed) -- but this pixel fallback, which is what
// actually runs when the id-based restore can't find its target, was
// not, so the one path meant to catch that failure was itself wiped by
// the same reload. Backing it with sessionStorage closes that gap, the
// same way the other two stores already do.
const SCROLL_STORAGE_KEY = "inbits:homeScrollY";

function readSavedWindowScrollY(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(SCROLL_STORAGE_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeSavedWindowScrollY(value: number): void {
  savedWindowScrollY = value;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SCROLL_STORAGE_KEY, String(value));
  } catch {
    // ignore (private browsing / storage disabled)
  }
}

let savedWindowScrollY = readSavedWindowScrollY();

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

  // Decides whether Home resets the reader's remembered scroll position
  // on this mount (see the layout effects below). Two sources, checked
  // in order:
  //
  //  1. `feedReturnIntent` -- set the instant the reader taps into an
  //     article (see lib/articleViewer.tsx) -- gives the exact post they
  //     were reading.
  //  2. `homeReturnPosition` -- continuously updated as the reader
  //     scrolls (see the "currently reading" IntersectionObserver
  //     below) -- gives the last post they were on, regardless of *why*
  //     they left: Jobs, Updates, Search, Menu, backgrounding the tab,
  //     all of it.
  //
  // Like Updates (a reels feed), Home should behave like a normal social
  // feed tab: switching away to any other page and back should drop the
  // reader back on the same post, not reset to the top -- only a
  // genuinely fresh session, with nothing recorded by either source yet,
  // starts at the top.
  const [{ resetOnMount, returnToPostId }] = useState(() => {
    const { intent, postId } = consumeFeedReturnIntent();
    if (intent === "preserve") return { resetOnMount: false, returnToPostId: postId };
    const lastPostId = getLastPostId();
    return { resetOnMount: !lastPostId, returnToPostId: lastPostId };
  });

  const { items, hasMore, connected, showEmptyState, loadMore, refresh } = useLiveFeed({
    category: "All",
    pageSize: 10,
    initialItems,
    // Same reasoning as Updates: on a genuinely fresh mount there's no
    // remembered position to protect, so let the socket's first
    // "initial" message reveal anything scraped between the SSR fetch
    // and the socket connecting the same way a real refresh would,
    // instead of merging it in invisibly above content there's nothing
    // to preserve for.
    treatInitialMergeAsFresh: resetOnMount,
  });
  const sentinel = useRef<HTMLDivElement>(null);
  const feedSectionRef = useRef<HTMLDivElement>(null);

  const restoredRef = useRef(false);
  // FIX: the restore effect below (which finds returnToPostId's element
  // and scrolls it into view) used to have no fallback -- if that exact
  // post was ever genuinely unfindable (aged out of the live buffer,
  // filtered out because its image broke, excluded elsewhere, etc.) it
  // just kept re-running on every feedPool change forever, never setting
  // restoredRef, and the page silently sat at scroll 0. That's
  // indistinguishable from "switching tabs and back resets Home to the
  // top" even with the id genuinely remembered correctly. This counter
  // caps how many times the effect is allowed to come up empty before it
  // gives up and falls back to the last known pixel offset (or just
  // accepts the top, if there isn't one) instead of retrying forever.
  const restoreMisses = useRef(0);
  const MAX_RESTORE_ATTEMPTS = 8;

  // Reset case: nothing to restore, go straight to the top and don't let
  // the retrying restore effect below do anything.
  useLayoutEffect(() => {
    if (!resetOnMount) return;
    window.scrollTo({ top: 0 });
    writeSavedWindowScrollY(0);
    restoredRef.current = true;
  }, [resetOnMount]);

  // Keep saving the window scroll position as the reader scrolls, purely
  // as a fallback for the rare case there's no returnToPostId to restore
  // by (see the retrying effect below, after feedPool, for the primary
  // id-based restore).
  useEffect(() => {
    const onScroll = () => {
      writeSavedWindowScrollY(window.scrollY);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      writeSavedWindowScrollY(window.scrollY);
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
  // FIX: once restored (by either path below), briefly re-apply the same
  // scroll target a few more times. An ad slot mounting, or an image
  // finishing loading just below the fold, can shift page layout a beat
  // *after* the initial synchronous restore and visibly nudge the reader
  // before they've had any chance to scroll themselves -- which reads as
  // exactly the "jump to top" this whole mechanism exists to prevent.
  // Self-limiting: stops the instant the reader actually scrolls or
  // touches the screen, and stops for good after ~1s once layout has had
  // time to settle.
  const reassertRestore = useCallback(() => {
    let cancelled = false;
    let userMoved = false;
    const onUserMove = () => {
      userMoved = true;
    };
    window.addEventListener("wheel", onUserMove, { passive: true, once: true });
    window.addEventListener("touchmove", onUserMove, { passive: true, once: true });
    const reapply = () => {
      if (cancelled || userMoved) return;
      if (returnToPostId) {
        const el = document.querySelector(`[data-post-id="${CSS.escape(returnToPostId)}"]`);
        el?.scrollIntoView({ block: "start" });
      } else if (savedWindowScrollY > 0) {
        window.scrollTo({ top: savedWindowScrollY });
      }
    };
    const timers = [120, 400, 1000].map((ms) => setTimeout(reapply, ms));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      window.removeEventListener("wheel", onUserMove);
      window.removeEventListener("touchmove", onUserMove);
    };
  }, [returnToPostId]);

  useLayoutEffect(() => {
    if (restoredRef.current) return;
    if (!returnToPostId) {
      if (savedWindowScrollY > 0 && feedPool.length > 0) {
        window.scrollTo({ top: savedWindowScrollY });
        restoredRef.current = true;
        reassertRestore();
      }
      return;
    }
    const target = document.querySelector(`[data-post-id="${CSS.escape(returnToPostId)}"]`);
    if (target) {
      target.scrollIntoView({ block: "start" });
      restoredRef.current = true;
      reassertRestore();
      return;
    }
    // Not found this pass. If there's genuinely nothing more that could
    // ever bring it in (the feed has stopped growing) or we've already
    // given this enough tries across feedPool updates, stop waiting on
    // it and fall back to the last remembered pixel offset instead of
    // leaving the reader stuck at the top with no restore ever applied.
    restoreMisses.current += 1;
    const giveUp = !hasMore || restoreMisses.current >= MAX_RESTORE_ATTEMPTS;
    if (giveUp) {
      if (savedWindowScrollY > 0) {
        window.scrollTo({ top: savedWindowScrollY });
      }
      restoredRef.current = true;
      reassertRestore();
      return;
    }
    // FIX: this used to just return here and wait for `feedPool` to
    // change on its own -- which only happened once the infinite-scroll
    // sentinel scrolled into view. But the sentinel can never come into
    // view while we're deliberately still sitting at scroll 0 trying to
    // restore -- nothing was driving `loadMore`, so a remembered post
    // that wasn't in the first loaded batch (e.g. after a full reload
    // wiped the in-session feed cache -- see useLiveFeed's `feedCache`)
    // was never found, and the reader was silently stuck at the top
    // forever. Indistinguishable from "Home always resets to the top".
    // Ask for the next page ourselves instead of waiting on scroll
    // position to request it.
    loadMore();
  }, [feedPool, returnToPostId, hasMore, loadMore, reassertRestore]);

  // Which post is actually "the one being read" right now -- the one
  // that's crossed the middle of the viewport -- continuously, as the
  // reader scrolls. This is the source of truth for homeReturnPosition
  // (see the resetOnMount/returnToPostId state above): every time it
  // changes, remember it as where to resume next time Home mounts, from
  // anywhere (Jobs, Updates, Search, Menu, backgrounding the tab, all of
  // it) -- the same way Updates tracks its current reel.
  useEffect(() => {
    const root = feedSectionRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setLastPostId(visible.target.getAttribute("data-post-id"));
        }
      },
      // A band through the middle of the viewport, rather than "any
      // overlap": Home's cards are taller than the screen, so plain
      // intersection would often flag two adjacent cards as both
      // "visible" at once. Narrowing to a horizontal strip around the
      // center means only whichever post is actually centered in view
      // counts as "currently reading".
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    const cards = root.querySelectorAll("[data-post-id]");
    cards.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [feedPool]);

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

  // Swipe-down-to-refresh: new stories scraped while you're browsing
  // wait quietly until you pull down at the top, then they're spliced in
  // at the front and the feed scrolls to show them (see useLiveFeed's
  // `refresh`) — this is one of the only two moments fresh content is
  // allowed to appear (the other being reopening the app after it's
  // been away for a while).
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

      {/* Vertical post feed, backed by the crawler. Freshly-scraped
          articles do NOT appear while you're actively browsing — the
          feed only tops itself up (see useLiveFeed) on an explicit
          pull-to-refresh, or automatically the moment you reopen the
          app after it's actually been closed/backgrounded for a
          while — so scrolling never gets interrupted mid-read. */}
      <section ref={feedSectionRef} className="flex flex-col">
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
              {/* Instagram/Reels-style "line by line" reveal: each card
                  fades/slides in with a small stagger instead of the
                  whole feed popping in at once (see .post-card-enter in
                  styles.css). Capped to the first handful of cards --
                  beyond that a reader is already scrolling through
                  content that loaded moments ago, so a growing delay
                  would just make later posts feel slow to appear. This
                  only plays once per post: the wrapper's key is the
                  post id, so it doesn't replay on re-renders (likes,
                  saves, etc.) — only the first time this post mounts,
                  whether that's on initial load or a fresh post landing
                  at the top of the feed live. */}
              <div
                className="post-card-enter"
                style={{ "--post-card-delay": `${Math.min(index, 10) * 45}ms` } as CSSProperties}
              >
                <PostCard
                  post={item}
                  priority={index === 0}
                  onImageUnavailable={() => markImageBroken(item.id)}
                />
              </div>
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
