import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MenuPage } from "@/components/menu/MenuPage";
import { fetchFeed } from "@/lib/api";
import { groupChannelsFromFeed } from "@/lib/liveGroups";
import { useToggleSet } from "@/hooks/usePrefs";

export const Route = createFileRoute("/menu/sources")({
  head: () => ({
    meta: [
      { title: "Sources · InBits" },
      {
        name: "description",
        content: "Follow or mute the publishers that feed your InBits reading list.",
      },
      { property: "og:title", content: "Sources · InBits" },
      {
        property: "og:description",
        content: "Follow or mute the publishers that feed your InBits reading list.",
      },
    ],
  }),
  // Same live buffer everything else reads from — the publisher list here
  // is exactly whoever's actually been crawled recently, not a fixed roster.
  // Cached so opening Sources repeatedly doesn't re-fetch every time.
  staleTime: Infinity,
  loader: async () => {
    try {
      const { items } = await fetchFeed("All");
      return { channels: groupChannelsFromFeed(items) };
    } catch {
      return { channels: [] };
    }
  },
  component: SourcesPage,
});

function SourcesPage() {
  const { channels } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const { list, has, toggle } = useToggleSet(
    "sources.followed",
    channels.map((c) => c.slug),
  );
  const shown = channels.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <MenuPage title="Sources" subtitle={`${list.length} of ${channels.length} publishers followed`}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search publishers"
        className="mb-3 w-full rounded-full border border-border bg-card px-4 py-2 text-sm"
      />
      <ul className="space-y-2">
        {shown.map((c) => (
          <li
            key={c.slug}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <img
              src={c.cover}
              alt=""
              loading="lazy"
              className="h-10 w-10 rounded-full object-cover"
            />
            <Link to="/channel/$slug" params={{ slug: c.slug }} className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{c.description}</div>
            </Link>
            <button
              onClick={() => toggle(c.slug)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                has(c.slug)
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {has(c.slug) ? "Following" : "Follow"}
            </button>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No publishers match “{q}”.
          </li>
        )}
      </ul>
    </MenuPage>
  );
}
