import { createContext, useContext, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { FeedItem } from "@/lib/api";
import { seedArticle } from "@/lib/articleCache";
import { markLeavingForArticle } from "@/lib/feedReturnIntent";

// Accepts anything from a thin rail summary (id/title/source/sourceUrl)
// up to a full live `FeedItem` — callers that already have the full
// article in memory (the main feed, Updates, Search, Saved, Related)
// should pass it as-is, since every extra field here is one less thing
// /post/:id has to fetch before it can render for real.
export type ArticleLink = Partial<FeedItem> & {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
};

type ArticleViewerContextValue = {
  openArticle: (article: ArticleLink) => void;
};

const ArticleViewerContext = createContext<ArticleViewerContextValue | null>(null);

/**
 * Wraps the app once (see __root.tsx). Tapping any story anywhere — Home
 * feed, Reels, a channel list, search, related stories — goes through
 * this same `openArticle`, which seeds the shared article cache with
 * whatever's already known about the story (see lib/articleCache.ts) and
 * then takes you to the app's own article page (`/post/:id`, see
 * routes/post.$id.tsx). That seeding is what lets the article page
 * render real content on the very first frame instead of a loading
 * skeleton for every in-app tap — only a cold, direct link to a story
 * (nothing seeded yet) still needs to fetch before it can show anything.
 * The full article — real headline, image, and full text, backed by the
 * live crawler — plus a clearly-marked link to open the original story on
 * the publisher's own site in a new tab.
 *
 * This used to embed the publisher's page directly in an in-app iframe.
 * That doesn't actually work for most real news sites — nearly every
 * major publisher (BBC, NYT, Indian Express, NDTV, and the rest of this
 * app's sources included) sends X-Frame-Options / CSP headers that
 * specifically block being framed by another site, which is exactly why
 * stories were reported as "not opening": the iframe wasn't broken, the
 * sites were refusing to load inside it, silently, with no way for this
 * app to detect that and show a fallback. That's a browser-enforced
 * security restriction, not something fixable from the frontend — so the
 * fix is to not rely on framing at all. A normal `target="_blank"` link,
 * used for "open the original site", is unaffected by X-Frame-Options
 * (it blocks framing, not top-level navigation), which is why that's the
 * mechanism used for the real link instead.
 */
export function ArticleViewerProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const openArticle = (article: ArticleLink) => {
    // Seed *before* navigating — /post/:id's very first render checks
    // this cache, so the reader never sees a loading state for a story
    // the app already had something to show for.
    seedArticle(article);
    // Tell Home/Updates (see lib/feedReturnIntent.ts) that wherever this
    // navigation is coming from, it should preserve its feed/scroll
    // position when the reader comes back -- as opposed to navigating
    // away to some other page (Jobs, Search, ...), which should show
    // fresh content on return instead. Recording the id (not just a
    // pixel offset) is what lets the return trip scroll this exact post
    // back into view even if card heights shifted while we were gone.
    markLeavingForArticle(article.id);
    navigate({
      to: "/post/$id",
      params: { id: article.id },
    });
  };

  return (
    <ArticleViewerContext.Provider value={{ openArticle }}>
      {children}
    </ArticleViewerContext.Provider>
  );
}

export function useArticleViewer() {
  const ctx = useContext(ArticleViewerContext);
  if (!ctx) throw new Error("useArticleViewer must be used within <ArticleViewerProvider>");
  return ctx;
}