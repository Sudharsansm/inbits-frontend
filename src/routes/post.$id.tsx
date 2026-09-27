
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchArticle, fetchFeed, type FeedItem } from "@/lib/api";
import {
  articleCache,
  getArticle,
  setArticle,
  type ArticleData,
} from "@/lib/articleCache";
import { RelativeTime } from "@/components/common/RelativeTime";
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
    meta: [{ title: "Story · InBits" }],
  }),
  component: PostPage,
});

function PostPage() {
  const { id } = Route.useParams();
  const router = useRouter();

  const [data, setData] = useState<ArticleData | null>(
    () => getArticle(id) ?? null
  );

  const [notFound, setNotFound] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setNotFound(false);
    setErrored(false);

    const seeded = getArticle(id);
    setData(seeded ?? null);

    // Already have the complete article.
    if (seeded?.complete) return;

    let cancelled = false;

    // Fetch the article and related stories in the background.
    Promise.all([
      fetchArticle(id),
      fetchFeed("All").catch(() => ({
        items: [] as FeedItem[],
        total: 0,
      })),
    ])
      .then(([post, feedSnapshot]) => {
        if (cancelled) return;

        if (!post) {
          if (!seeded) {
            setNotFound(true);
          }
          return;
        }

        const related = feedSnapshot.items
          .filter(
            (p) => p.id !== post.id && p.category === post.category
          )
          .slice(0, 3);

        const result: ArticleData = {
          post,
          related,
          complete: true,
        };

        setArticle(id, result);
        setData(result);
      })
      .catch(() => {
        if (!cancelled && !seeded) {
          setErrored(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Update the browser tab title when the article loads.
  useEffect(() => {
    if (data) {
      document.title = `${data.post.title} · InBits`;
    }
  }, [data]);

  // Story not found.
  if (notFound) {
    return (
      <AppShell title="Not found">
        <div className="px-6 py-16 text-center">
          <h1 className="serif text-2xl font-bold">
            Story not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            It may have scrolled out of the live buffer, been moved,
            or unpublished.
          </p>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>
      </AppShell>
    );
  }

  // Article loading error.
  if (errored) {
    return (
      <AppShell title="Error">
        <div className="px-6 py-16 text-center">
          <h1 className="serif text-2xl font-bold">
            Something broke
          </h1>

          <button
            type="button"
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

  // Show skeleton only when no cached content is available.
  if (!data) {
    return <ArticleSkeleton />;
  }

  return (
    <PostArticle
      post={data.post}
      related={data.related}
    />
  );
}

function PostArticle({
  post,
  related,
}: {
  post: FeedItem;
  related: FeedItem[];
}) {
  const [progress, setProgress] = useState(0);

  const { has, toggleSave } = useSavedPosts();
  const { openArticle } = useArticleViewer();

  const saved = has(post.id);

  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reading progress indicator.
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;

      setProgress(
        max > 0
          ? Math.min(100, (h.scrollTop / max) * 100)
          : 0
      );
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [post.id]);

  // Limit the displayed article content to a short teaser.
  const MAX_TEASER_PARAGRAPHS = 3;

  const bodyParagraphs = (post.content || post.excerpt)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, MAX_TEASER_PARAGRAPHS);

  const isFullArticleMissing =
    !post.content ||
    post.content.trim() === post.excerpt.trim();

  // Translate the headline, excerpt, and teaser paragraphs.
  const [
    translatedTitle,
    translatedExcerpt,
    ...translatedParagraphs
  ] = useTranslated([
    post.title,
    post.excerpt,
    ...bodyParagraphs,
  ]);

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : "";

  const shareText = encodeURIComponent(post.title);

  // Share article.
  const share = async (
    kind: "native" | "twitter" | "facebook" | "copy"
  ) => {
    if (kind === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(
          shareUrl
        )}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else if (kind === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else if (kind === "copy") {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 1600);
      } catch (err) {
        console.error("Copy link failed:", err);
      }
    } else if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: shareUrl,
        });
      } catch (err) {
        if (
          err instanceof Error &&
          err.name !== "AbortError"
        ) {
          console.error("Native share failed:", err);
        }
      }
    } else {
      // Fallback for browsers without native sharing.
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 1600);
      } catch (err) {
        console.error("Share failed:", err);
      }
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
        {/* Back button */}
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        {/* Article category and source */}
        <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary">
          <span>{post.category}</span>

          <span className="text-muted-foreground">
            · {post.source} ·{" "}
            <RelativeTime iso={post.publishedAt} />

            {sourceOriginLabel(
              post.location,
              post.language
            ) && (
              <>
                {" "}
                ·{" "}
                {sourceOriginLabel(
                  post.location,
                  post.language
                )}
              </>
            )}
          </span>
        </div>

        {/* Headline */}
        <h1 className="serif mt-3 max-w-3xl text-base font-medium leading-7 text-foreground/75">
          {translatedTitle}
        </h1>

        {/* Introduction */}
        <p className="serif mt-3 text-base leading-relaxed text-foreground/75">
          {translatedExcerpt}
        </p>

        {/* Author, read time, like and save */}
        <div className="mt-4 flex items-center justify-between border-y border-border py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary serif font-bold text-ink">
              {post.author.charAt(0)}
            </div>

            <div>
              <div className="font-semibold text-foreground">
                {post.author}
              </div>

              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readTime} min read
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setLiked((v) => !v)}
              aria-label="Like"
              aria-pressed={liked}
              className="rounded-full p-2 hover:bg-secondary"
            >
              <Heart
                className={`h-4 w-4 ${
                  liked
                    ? "fill-primary text-primary"
                    : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => toggleSave(post.id)}
              aria-label="Save"
              aria-pressed={saved}
              className="rounded-full p-2 hover:bg-secondary"
            >
              <Bookmark
                className={`h-4 w-4 ${
                  saved
                    ? "fill-primary text-primary"
                    : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Article image */}
        {post.image && (
          <img
            src={post.image}
            alt={translatedTitle}
            className="mt-6 h-auto max-h-[520px] w-full rounded-2xl object-cover"
            loading="eager"
          />
        )}

        {/* Article teaser */}
        <div className="relative">
          <div className="serif mt-6 max-w-3xl space-y-6 text-justify text-[17px] leading-8 tracking-[0.005em] text-foreground/90 sm:text-[18px]">
            {translatedParagraphs.map((para, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "first-letter:float-left first-letter:mr-2 first-letter:text-6xl first-letter:font-black first-letter:leading-[0.85] first-letter:text-primary"
                    : undefined
                }
              >
                {para}
              </p>
            ))}

            {isFullArticleMissing && (
              <p className="text-sm not-italic text-muted-foreground">
                ({post.source} didn't publish more than this —
                that's the complete story as released.)
              </p>
            )}
          </div>

          {/* Fade at the end of the teaser */}
          {!isFullArticleMissing && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>

        {/* Read full story on publisher website */}
        {post.sourceUrl && !isFullArticleMissing && (
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-primary px-5 py-4 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <span>
              Read the full story on {post.source}
            </span>

            <ExternalLink className="h-5 w-5 flex-none" />
          </a>
        )}

        {/* View original when there is no additional content */}
        {post.sourceUrl && isFullArticleMissing && (
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-6 flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
          >
            <span>
              View original on {post.source}
            </span>

            <ExternalLink className="h-4 w-4 flex-none" />
          </a>
        )}

        {/* Advertisement */}
        <div className="mt-6">
          <AdSlot
            slot="4019651928"
            label="Sponsored"
          />
        </div>

        {/* Share section */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Share this story
              </div>

              <div className="serif mt-1 text-sm font-semibold">
                Pass it on
              </div>
            </div>

            <div className="flex items-center gap-1">
              <ShareButton
                onClick={() => share("twitter")}
                label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </ShareButton>

              <ShareButton
                onClick={() => share("facebook")}
                label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </ShareButton>

              <ShareButton
                onClick={() => share("copy")}
                label="Copy link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
              </ShareButton>

              <ShareButton
                onClick={() => share("native")}
                label="Share"
              >
                <Share2 className="h-4 w-4" />
              </ShareButton>
            </div>
          </div>
        </div>

        {/* Related stories */}
        {related.length > 0 && (
          <section className="mt-8">
            <h3 className="serif text-lg font-bold">
              Related stories
            </h3>

            <ul className="mt-3 space-y-3">
              {related.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => openArticle(p)}
                    className="flex w-full items-start gap-3 rounded-xl bg-card p-3 text-left transition hover:bg-secondary"
                  >
                    {p.image && (
                      <img
                        src={p.image}
                        alt=""
                        className="h-20 w-20 flex-none rounded-lg object-cover"
                        loading="lazy"
                      />
                    )}

                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-primary">
                        {p.category}
                      </div>

                      <div className="serif line-clamp-2 font-semibold leading-snug">
                        {p.title}
                      </div>

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

        {/* End of story */}
        <div className="py-10 text-center text-[11px] text-muted-foreground">
          — End of story —
        </div>
      </article>
    </AppShell>
  );
}