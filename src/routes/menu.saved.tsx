import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Briefcase } from "lucide-react";
import { MenuPage } from "@/components/menu/MenuPage";
import { fetchArticle, fetchJob, type FeedItem, type RemoteJob } from "@/lib/api";
import { useSavedPosts } from "@/lib/savedPosts";
import { useArticleViewer } from "@/lib/articleViewer";
import { useToggleSet } from "@/hooks/usePrefs";

export const Route = createFileRoute("/menu/saved")({
  head: () => ({
    meta: [
      { title: "Saved · InBits" },
      {
        name: "description",
        content: "Every story and job you bookmarked on InBits, ready to revisit.",
      },
      { property: "og:title", content: "Saved · InBits" },
      {
        property: "og:description",
        content: "Every story and job you bookmarked on InBits, ready to revisit.",
      },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  // Same saved-post list the bookmark button everywhere else in the app
  // writes to (Home, Reels, article page) — this page just reads it back.
  const { savedIds, has, toggleSave } = useSavedPosts();
  const { openArticle } = useArticleViewer();
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [missingCount, setMissingCount] = useState(0);

  const { list: savedJobIds, has: hasJob, toggle: toggleJob } = useToggleSet("savedJobs");
  const [jobs, setJobs] = useState<RemoteJob[]>([]);
  const [missingJobCount, setMissingJobCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all(savedIds.map((id) => fetchArticle(id))).then((results) => {
      if (cancelled) return;
      setPosts(results.filter((p): p is FeedItem => p !== null));
      setMissingCount(results.filter((p) => p === null).length);
    });
    return () => {
      cancelled = true;
    };
  }, [savedIds]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(savedJobIds.map((id) => fetchJob(id))).then((results) => {
      if (cancelled) return;
      setJobs(results.filter((j): j is RemoteJob => j !== null));
      setMissingJobCount(results.filter((j) => j === null).length);
    });
    return () => {
      cancelled = true;
    };
  }, [savedJobIds]);

  return (
    <MenuPage
      title="Saved"
      subtitle={`${savedIds.length} stories · ${savedJobIds.length} jobs bookmarked`}
    >
      {savedIds.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Bookmark className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing saved yet. Tap the bookmark on any story.
          </p>
          <Link
            to="/"
            className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            Browse the feed
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {posts.map((p) => (
              <li key={p.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                <button
                  onClick={() =>
                    openArticle({
                      id: p.id,
                      title: p.title,
                      source: p.source,
                      sourceUrl: p.sourceUrl,
                    })
                  }
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="text-[10px] uppercase tracking-[0.16em] text-primary">
                    {p.category}
                  </div>
                  <div className="serif mt-1 text-sm font-bold leading-snug">{p.title}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {p.source} · {p.readTime} min read
                  </div>
                </button>
                <img
                  src={p.image}
                  alt=""
                  loading="lazy"
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
                <button
                  aria-label={has(p.id) ? "Remove bookmark" : "Save story"}
                  onClick={() => toggleSave(p.id)}
                  className="self-start rounded-full p-1.5 hover:bg-secondary"
                >
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                </button>
              </li>
            ))}
          </ul>
          {missingCount > 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {missingCount} saved {missingCount === 1 ? "story has" : "stories have"} rolled out of
              the live buffer and can't be shown anymore.
            </p>
          )}
        </>
      )}

      <div className="mt-8 flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-muted-foreground" />
        <h3 className="serif text-sm font-bold">Saved jobs</h3>
      </div>

      {savedJobIds.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-border bg-card p-6 text-center">
          <Briefcase className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No jobs saved yet. Tap save on any listing.
          </p>
          <Link
            to="/jobs"
            className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            Browse jobs
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-3 space-y-3">
            {jobs.map((j) => (
              <li key={j.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                <Link
                  to="/job/$id"
                  params={{ id: j.id }}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-lg bg-secondary text-xs font-bold text-secondary-foreground">
                    {j.logoUrl ? (
                      <img
                        src={j.logoUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      j.logo
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="serif text-sm font-bold leading-snug">{j.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {j.company} · {j.location}
                    </div>
                  </div>
                </Link>
                <button
                  aria-label={hasJob(j.id) ? "Remove from saved jobs" : "Save job"}
                  onClick={() => toggleJob(j.id)}
                  className="self-start rounded-full p-1.5 hover:bg-secondary"
                >
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                </button>
              </li>
            ))}
          </ul>
          {missingJobCount > 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {missingJobCount} saved {missingJobCount === 1 ? "job has" : "jobs have"} since closed
              or been removed.
            </p>
          )}
        </>
      )}
    </MenuPage>
  );
}
