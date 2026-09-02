import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { fetchJobs, type RemoteJob } from "@/lib/api";
import type { Channel, ShowcasePanel } from "@/lib/content";
import { useArticleViewer } from "@/lib/articleViewer";

/** Desktop-only right column: channels to tune into + trending news,
 * Instagram-style — fed by the same live groupings Home computes for its
 * in-feed rails (see routes/index.tsx), so there's one live dataset
 * behind every "channels"/"trending" surface, not a separate mock one. */
export function SuggestionsSidebar({
  showcase,
  channels,
}: {
  showcase: ShowcasePanel[];
  channels: Channel[];
}) {
  const { openArticle } = useArticleViewer();
  const news = showcase
    .flatMap((p) => p.stories.map((s) => ({ ...s, publisher: p.publisher })))
    .slice(0, 6);
  const [jobs, setJobs] = useState<RemoteJob[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchJobs()
      .then(({ items }) => {
        if (!cancelled) setJobs(items.slice(0, 3));
      })
      .catch(() => {
        /* sidebar jobs are a nice-to-have — fail quietly */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-7 pr-2">
      {channels.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Channels for you</h3>
            <Link
              to="/stands"
              search={{ tab: "channels" }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              See all
            </Link>
          </div>
          <ul className="space-y-3">
            {channels.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link
                  to="/channel/$slug"
                  params={{ slug: c.slug }}
                  className="flex items-center gap-3 group"
                >
                  <img
                    src={c.cover}
                    alt=""
                    loading="lazy"
                    className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-primary/50"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink group-hover:underline">
                      {c.name}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {c.stories.length} stories · Live
                    </div>
                  </div>
                  <Radio className="h-4 w-4 shrink-0 text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {news.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Trending news</h3>
            <Link to="/stands" className="text-xs font-semibold text-primary hover:underline">
              See all
            </Link>
          </div>
          <ul className="space-y-3">
            {news.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() =>
                    openArticle({
                      id: s.id,
                      title: s.title,
                      source: s.publisher,
                      sourceUrl: s.sourceUrl ?? "",
                    })
                  }
                  className="group flex w-full items-start gap-3 text-left"
                >
                  <img
                    src={s.image}
                    alt=""
                    loading="lazy"
                    className="h-14 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {s.publisher}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-ink group-hover:underline">
                      {s.title}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {jobs.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Jobs for you</h3>
            <Link to="/jobs" className="text-xs font-semibold text-primary hover:underline">
              See all
            </Link>
          </div>
          <ul className="space-y-2.5">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link to="/job/$id" params={{ id: j.id }} className="flex items-center gap-3 group">
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
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
                    <div className="truncate text-[13px] font-semibold text-ink group-hover:underline">
                      {j.title}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {j.company} · {j.location}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="pb-8 text-[11px] leading-relaxed text-muted-foreground">
        InBits · News & Updates worth your time
      </p>
    </div>
  );
}
