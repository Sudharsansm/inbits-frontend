import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchArticle, fetchFeed, type FeedItem } from "@/lib/api";
import { articleCache, type ArticleData } from "@/lib/articleCache";
import { formatRelativeTime } from "@/lib/format";
import { sourceOriginLabel } from "@/lib/sourceOrigin";
import { useSavedPosts } from "@/lib/savedPosts";
import { useArticleViewer } from "@/lib/articleViewer";
import { useTranslated } from "@/lib/i18n";
import { ArticleSkeleton } from "@/components/common/FeedSkeleton";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  Share2,
  Twitter,
  Facebook,
  Link2,
  Check,
  Clock,
  ExternalLink,
} from "lucide-react";
import { ShareButton } from "@/components/post/ShareButton";
import { AdSlot } from "@/components/ads/AdSlot";

export const Route = createFileRoute("/post/$id")({
  head: () => ({
    // No loader means no per-article data at the time this runs, so this
    // is a generic fallback rather than the real headline/excerpt. The
    // real title is set on `document.title` client-side once the article
    // loads (see PostPage below) so the browser tab is still correct —
    // the trade-off is that a link shared *before* anyone has visited
    // this exact URL server-side won't carry a story-specific preview
    // card (og:title/og:description) the way it did with a blocking
    // loader. That trade favors the page never feeling stuck "loading"
    // over a richer social-preview card — the same call already made for
    // Home, Search, and Updates.
    meta: [{ title: "Story · InBits" }],
  }),
  // Intentionally no loader. A blocking loader here meant every tap on a
  // headline — the single most common action in the app — sat on a
  // network round-trip (article + a feed snapshot for "Related") before
  // the route would even render, which is exactly the "worst feel" of a
  // page that looks stuck. Now the route renders instantly: for every
  // in-app tap (Home, Updates, Search, Saved, Related, rails), the
  // article the reader tapped was already seeded into the shared cache
  // (see lib/articleCache.ts + lib/articleViewer.tsx) *before* this route
  // even mounted, so real content — headline, image, excerpt — is on
  // screen on the very first frame, with no skeleton at all. The full
  // body and real "Related" list are then filled in silently in the
  // background. Only a genuinely cold visit — a direct/shared link with
  // nothing seeded yet — falls back to fetching from scratch, and shows
  // ArticleSkeleton (shaped like the real layout) while that happens.
  component: PostPage,
});

function PostPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [data, setData] = useState<ArticleData | null>(() => articleCache.get(id) ?? null);
  const [notFound, setNotFound] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setNotFound(false);
    setErrored(false);

    const seeded = articleCache.get(id);
    setData(seeded ?? null);

    // Already have the real thing (fetched in full on a previous visit
    // this session) — nothing left to do.
    if (seeded?.complete) return;

    let cancelled = false;

    // Either nothing is seeded yet (a cold/direct link) or only a thin
    // stand-in is (tapped from a feed/rail). Either way, fetch the real
    // article + related list in the background. When a stand-in is
    // already rendering, this never shows a loading state — the page
    // already has something real-looking on screen, and just gets
    // upgraded in place the moment this resolves.
    Promise.all([
      fetchArticle(id),
      fetchFeed("All").catch(() => ({ items: [] as FeedItem[], total: 0 })),
    ])
      .then(([post, feedSnapshot]) => {
        if (cancelled) return;
        if (!post) {
          // A 404 on the full fetch only matters if we had nothing to
          // show in the first place — a seeded stand-in came from a
          // story that was genuinely live moments ago, so leave it on
          // screen rather than yanking it away for a "not found" page.
          if (!seeded) setNotFound(true);
          return;
        }
        const related = feedSnapshot.items
          .filter((p) => p.id !== post.id && p.category === post.category)
          .slice(0, 3);
        const result: ArticleData = { post, related, complete: true };
        articleCache.set(id, result);
        setData(result);
      })
      .catch(() => {
        if (!cancelled && !seeded) setErrored(true);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (data) document.title = `${data.post.title} · InBits`;
  }, [data]);

  if (notFound) {
    return (
      <AppShell title="Not found">
        <div className="px-6 py-16 text-center">
          <h1 className="serif text-2xl font-bold">Story not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have scrolled out of the live buffer, been moved, or unpublished.
          </p>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        </div>
      </AppShell>
    );
  }

  if (errored) {
    return (
      <AppShell title="Error">
        <div className="px-6 py-16 text-center">
          <h1 className="serif text-2xl font-bold">Something broke</h1>
          <button
            onClick={() => {
              articleCache.delete(id);
              setErrored(false);
              router.invalidate();
            }}
            className="mt-6 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </AppShell>
    );
  }

  if (!data) return <ArticleSkeleton />;

  return <PostArticle post={data.post} related={data.related} />;
}

function PostArticle({ post, related }: { post: FeedItem; related: FeedItem[] }) {
  const [progress, setProgress] = useState(0);
  const { has, toggleSave } = useSavedPosts();
  const { openArticle } = useArticleViewer();
  const saved = has(post.id);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [post.id]);

  const publishedLabel = formatRelativeTime(post.publishedAt);

  // Real article body from the backend's content fetcher, split into
  // paragraphs. Falls back to the RSS excerpt on the rare item where full
  // extraction failed (see app/content_fetcher.py) so the page never
  // renders an empty body — but that fallback is thin, so flag it and
  // link out to the original rather than pretending it's the full story.
  const bodyParagraphs = (post.content || post.excerpt)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const isFullArticleMissing = !post.content || post.content.trim() === post.excerpt.trim();

  // Reads the language chosen in Settings (see routes/menu.settings.tsx)
  // and swaps title/excerpt/body to it in place — shows the original
  // English immediately, then upgrades once translations come back.
  const [translatedTitle, translatedExcerpt, ...translatedParagraphs] = useTranslated([
    post.title,
    post.excerpt,
    ...bodyParagraphs,
  ]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(post.title);
  const share = async (kind: "native" | "twitter" | "facebook" | "copy") => {
    if (kind === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`,
        "_blank",
      );
    } else if (kind === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        "_blank",
      );
    } else if (kind === "copy") {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } else if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: post.title, text: post.excerpt, url: shareUrl });
      } catch {}
    }
  };

  return (
    <AppShell>
      {/* Reading progress */}
      <div className="sticky top-[60px] z-20 h-1 bg-border/60">
        <div
          className="h-full bg-primary transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <article className="px-5 pt-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary">
          <span>{post.category}</span>
          <span className="text-muted-foreground">
            · {post.source} · {publishedLabel}
            {sourceOriginLabel(post.location, post.language) && (
              <> · {sourceOriginLabel(post.location, post.language)}</>
            )}
          </span>
        </div>
        <h1 className="serif mt-3 max-w-3xl text-base font-medium leading-7 text-foreground/75">
          {translatedTitle}
        </h1>
        <p className="serif mt-3 text-base leading-relaxed text-foreground/75">
          {translatedExcerpt}
        </p>

        <div className="mt-4 flex items-center justify-between border-y border-border py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary serif font-bold text-ink">
              {post.author.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-foreground">{post.author}</div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {post.readTime} min read
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLiked((v) => !v)}
              aria-label="Like"
              className="rounded-full p-2 hover:bg-secondary"
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} />
            </button>
            <button
              onClick={() => toggleSave(post.id)}
              aria-label="Save"
              className="rounded-full p-2 hover:bg-secondary"
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>
        </div>

        <img
          src={post.image}
          alt={translatedTitle}
          className="mt-6 h-auto max-h-[520px] w-full rounded-2xl object-cover"
          loading="eager"
        />

        <div className="serif mt-6 max-w-3xl space-y-6 text-justify text-[17px] leading-8 tracking-[0.005em] text-foreground/90 sm:text-[18px]">
          {translatedParagraphs.map((para, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "first-letter:serif first-letter:float-left first-letter:mr-2 first-letter:text-6xl first-letter:font-black first-letter:leading-[0.85] first-letter:text-primary"
                  : undefined
              }
            >
              {para}
            </p>
          ))}
          {isFullArticleMissing && (
            <p className="text-sm not-italic text-muted-foreground">
              ({post.source} didn't publish more than this — that's the complete story as released.)
            </p>
          )}
        </div>

        {/* Same real link as the one near the top, repeated here at the
            natural end of the article — this is the point where a reader
            who wants the original with its full formatting, any embeds,
            and the rest of that site is most likely to look for it. */}
        {post.sourceUrl && (
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-6 flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
          >
            <span>Continue reading on {post.source}</span>
            <ExternalLink className="h-4 w-4 flex-none" />
          </a>
        )}

        {/* Single ad, placed only after the story is fully read — at the
            same natural pause point as the "Continue reading on X" link,
            never mid-paragraph. One placement per article keeps this from
            feeling like it's competing with the reading experience. */}
        <div className="mt-6">
          <AdSlot slot="0000000006" label="Sponsored" />
        </div>

        {/* Share row */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Share this story
              </div>
              <div className="serif mt-1 text-sm font-semibold">Pass it on</div>
            </div>
            <div className="flex items-center gap-1">
              <ShareButton onClick={() => share("twitter")} label="Twitter">
                <Twitter className="h-4 w-4" />
              </ShareButton>
              <ShareButton onClick={() => share("facebook")} label="Facebook">
                <Facebook className="h-4 w-4" />
              </ShareButton>
              <ShareButton onClick={() => share("copy")} label="Copy link">
                {copied ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
              </ShareButton>
              <ShareButton onClick={() => share("native")} label="Share">
                <Share2 className="h-4 w-4" />
              </ShareButton>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-8">
            <h3 className="serif text-lg font-bold">Related stories</h3>
            <ul className="mt-3 space-y-3">
              {related.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => openArticle(p)}
                    className="flex w-full items-start gap-3 rounded-xl bg-card p-3 text-left transition hover:bg-secondary"
                  >
                    <img
                      src={p.image}
                      alt=""
                      className="h-20 w-20 flex-none rounded-lg object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-primary">
                        {p.category}
                      </div>
                      <div className="serif line-clamp-2 font-semibold leading-snug">{p.title}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {p.source} · {p.readTime} min
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="py-10 text-center text-[11px] text-muted-foreground">— End of story —</div>
      </article>
    </AppShell>
  );
}
