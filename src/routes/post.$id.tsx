import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchArticle, fetchFeed, type FeedItem } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { sourceOriginLabel } from "@/lib/sourceOrigin";
import { useSavedPosts } from "@/lib/savedPosts";
import { useArticleViewer } from "@/lib/articleViewer";
import { useTranslated } from "@/lib/i18n";
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

export const Route = createFileRoute("/post/$id")({
  // Same reasoning as Home's staleTime: this article's own content
  // doesn't change once written, and its "related stories" list doesn't
  // need to reload on every single visit. Caching for a few minutes
  // means tapping back into a story you already opened (from Related, a
  // channel, or search) is instant rather than re-fetching every time.
  staleTime: 5 * 60 * 1000,
  // Runs on the server: fetches the real article by id, plus a handful of
  // same-category stories for "Related", from the live backend — nothing
  // here is looked up from bundled mock data anymore.
  loader: async ({ params }) => {
    const post = await fetchArticle(params.id);
    if (!post) throw notFound();

    let related: FeedItem[] = [];
    try {
      const { items } = await fetchFeed(post.category);
      related = items.filter((p) => p.id !== post.id).slice(0, 3);
    } catch {
      // Related stories are a nice-to-have — an unreachable backend here
      // shouldn't take down the article itself.
    }

    return { post, related };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Story not found · InBits" }, { name: "robots", content: "noindex" }],
      };
    }
    const { post } = loaderData;
    return {
      meta: [
        { title: `${post.title} · InBits` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:image", content: post.image },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
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
  ),
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <AppShell title="Error">
        <div className="px-6 py-16 text-center">
          <h1 className="serif text-2xl font-bold">Something broke</h1>
          <button
            onClick={() => {
              reset();
              router.invalidate();
            }}
            className="mt-6 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </AppShell>
    );
  },
  component: PostPage,
});

function PostPage() {
  const { post, related } = Route.useLoaderData();
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
                    onClick={() =>
                      openArticle({
                        id: p.id,
                        title: p.title,
                        source: p.source,
                        sourceUrl: p.sourceUrl,
                      })
                    }
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
