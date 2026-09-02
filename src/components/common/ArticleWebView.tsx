import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, RotateCw } from "lucide-react";
import type { ArticleLink } from "@/lib/articleViewer";

const LOAD_TIMEOUT_MS = 6000;

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Full-screen in-app browser for the real publisher page — this is what
 * opens when you tap a story, instead of an internal reader route. It's
 * an overlay, not a navigation: closing it (back arrow) just unmounts
 * this component, so whatever feed was underneath — Home, Reels, a
 * channel list — is still scrolled to exactly where it was.
 *
 * Some publishers set X-Frame-Options/CSP to block embedding entirely,
 * and there's no reliable cross-origin way for this page to detect that
 * (the iframe's `load` event fires either way). So rather than trying to
 * guess, "Open in browser" is always one tap away, not just offered on
 * failure.
 */
export function ArticleWebView({
  article,
  onClose,
}: {
  article: ArticleLink;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const site = hostname(article.sourceUrl) || article.source;
  const hasUrl = Boolean(article.sourceUrl);

  useEffect(() => {
    setLoaded(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // The iframe's onLoad fires even for a blocked/blank frame, but on a
    // slow connection it can take a moment — stop showing the spinner
    // either way after a few seconds so it never looks stuck forever.
    timeoutRef.current = setTimeout(() => setLoaded(true), LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [reloadKey, article.sourceUrl]);

  // Back-button-style dismissal: Android back / browser back closes the
  // overlay instead of leaving the app, without ever having pushed a
  // real route change.
  useEffect(() => {
    window.history.pushState({ articleWebView: true }, "");
    const onPopState = () => onClose();
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (window.history.state?.articleWebView) window.history.back();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only wire this up once per open article
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper">
      <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
        <button
          onClick={onClose}
          aria-label="Back"
          className="flex-none rounded-full p-2 hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">{article.title}</div>
          <div className="truncate text-[11px] text-muted-foreground">{site}</div>
        </div>
        <button
          onClick={() => {
            setLoaded(false);
            setReloadKey((k) => k + 1);
          }}
          aria-label="Reload"
          disabled={!hasUrl}
          className="flex-none rounded-full p-2 text-muted-foreground hover:bg-secondary disabled:opacity-40"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        {hasUrl && (
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Open in browser"
            className="flex-none rounded-full p-2 text-muted-foreground hover:bg-secondary"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        {!hasUrl ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
            <span className="text-sm">No original link is available for this story.</span>
          </div>
        ) : (
          <>
            {!loaded && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-paper">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs">Loading {site}…</span>
                </div>
              </div>
            )}
            <iframe
              key={reloadKey}
              src={article.sourceUrl}
              title={article.title}
              className="h-full w-full border-0"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
              onLoad={() => setLoaded(true)}
            />
          </>
        )}
      </div>

      {/* Always-available fallback — some publishers block embedding
          outright, and there's no reliable way to detect that from here. */}
      {hasUrl && (
        <div className="flex items-center justify-center gap-1.5 border-t border-border bg-card py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <span className="text-[11px] text-muted-foreground">Not loading right?</span>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary"
          >
            Open in browser <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
