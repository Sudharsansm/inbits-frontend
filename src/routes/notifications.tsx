import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchFeed, fetchJobs, type FeedItem, type RemoteJob } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { Briefcase, Newspaper } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · InBits" },
      { name: "description", content: "New stories and job postings, as they come in." },
    ],
  }),
  // There's no account/social-graph system behind this app, so rather than
  // invent fake "so-and-so followed you" activity, notifications are just
  // the real things that actually change: new live articles and new job
  // postings — both fetched live, nothing sampled.
  // A short staleTime keeps this feeling live without blocking every single
  // page visit on a fresh round-trip the way an unset (0) staleTime would.
  staleTime: 60 * 1000,
  loader: async () => {
    const [feed, jobs] = await Promise.all([
      fetchFeed("All").catch(() => ({ items: [] as FeedItem[] })),
      fetchJobs().catch(() => ({ items: [] as RemoteJob[] })),
    ]);
    return { articles: feed.items.slice(0, 20), jobs: jobs.items.slice(0, 10) };
  },
  component: NotificationsPage,
});

const tabs = ["All", "Updates", "Jobs"] as const;

function NotificationsPage() {
  const { articles, jobs } = Route.useLoaderData();
  const [active, setActive] = useState<(typeof tabs)[number]>("All");

  const items = [
    ...articles.map((a) => ({
      kind: "update" as const,
      id: a.id,
      time: a.publishedAt,
      icon: Newspaper,
      text: (
        <>
          <span className="font-semibold">{a.source}</span>{" "}
          <span className="text-foreground/80">published “{a.title}”</span>
        </>
      ),
      link: { to: "/post/$id" as const, params: { id: a.id } },
    })),
    ...jobs.map((j) => ({
      kind: "job" as const,
      id: j.id,
      time: j.posted,
      icon: Briefcase,
      text: (
        <>
          <span className="font-semibold">{j.company}</span>{" "}
          <span className="text-foreground/80">is hiring for “{j.title}”</span>
        </>
      ),
      link: { to: "/job/$id" as const, params: { id: j.id } },
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const filtered = items.filter((n) => {
    if (active === "All") return true;
    if (active === "Updates") return n.kind === "update";
    if (active === "Jobs") return n.kind === "job";
    return true;
  });

  return (
    <AppShell title="Notifications">
      <div className="scrollbar-none sticky top-[60px] z-20 flex gap-2 overflow-x-auto bg-paper/90 px-4 py-3 backdrop-blur">
        {tabs.map((t) => {
          const on = t === active;
          return (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`flex-none rounded-full border px-3 py-1 text-xs font-medium transition ${
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <ul className="divide-y divide-border px-4">
          {filtered.map((n) => {
            const Icon = n.icon;
            return (
              <li key={`${n.kind}-${n.id}`}>
                <Link {...n.link} className="flex items-start gap-3 py-4 active:bg-secondary/50">
                  <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{n.text}</p>
                    <span className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(n.time)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
