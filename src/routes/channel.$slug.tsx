import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { fetchFeed } from "@/lib/api";
import { groupChannelsFromFeed } from "@/lib/liveGroups";
import { useArticleViewer } from "@/lib/articleViewer";
import { ChannelAvatar } from "@/components/common/ChannelAvatar";
import { sourceOriginLabel } from "@/lib/sourceOrigin";
import { ArrowLeft, Headphones } from "lucide-react";

export const Route = createFileRoute("/channel/$slug")({
  // Was 60s, which meant re-fetching the entire live feed just to filter
  // one channel out of it on almost every visit. 5 minutes is still fresh
  // enough for a channel page and cuts that down a lot.
  staleTime: 5 * 60 * 1000,
  // Grouped live from whatever's currently in the crawler's buffer —
  // there's no separate channel directory to keep in sync.
  loader: async ({ params }) => {
    const { items } = await fetchFeed("All");
    const channel = groupChannelsFromFeed(items).find((c) => c.slug === params.slug);
    if (!channel) throw notFound();
    return { channel };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Channel not found · InBits" }, { name: "robots", content: "noindex" }],
      };
    }
    const { channel } = loaderData;
    const description = `${channel.description} Read the latest ${channel.name} stories on InBits.`;
    return {
      meta: [
        { title: `${channel.name} · Channels · InBits` },
        { name: "description", content: description },
        { property: "og:title", content: `${channel.name} on InBits` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: ChannelNotFound,
  component: ChannelPage,
});

function ChannelNotFound() {
  return (
    <AppShell title="Channel">
      <div className="px-4 py-10 text-center">
        <h1 className="serif text-2xl font-bold">Channel not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This channel is no longer available.</p>
        <Link to="/stands" className="mt-4 inline-block text-sm font-semibold text-primary">
          Back to Stands
        </Link>
      </div>
    </AppShell>
  );
}

function ChannelPage() {
  const { channel } = Route.useLoaderData();
  const { openArticle } = useArticleViewer();

  return (
    <AppShell title={channel.name}>
      <div className="px-4 pt-3">
        <Link
          to="/stands"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> All channels
        </Link>

        <div className="relative mt-3 overflow-hidden rounded-2xl">
          <img src={channel.cover} alt="" className="h-36 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
              <Headphones className="h-3 w-3" /> Channel
            </span>
            <div className="mt-2 flex items-center gap-2.5">
              <ChannelAvatar
                source={channel.name}
                sampleUrl={channel.stories[0]?.sourceUrl}
                className="h-10 w-10 ring-2 ring-white/80"
              />
              <h1 className="serif text-2xl font-bold leading-tight text-white">{channel.name}</h1>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-white/80">{channel.description}</p>
            {sourceOriginLabel(channel.location, channel.language) && (
              <p className="mt-1 text-[11px] font-semibold text-white/90">
                {sourceOriginLabel(channel.location, channel.language)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <h2 className="serif text-lg font-bold">Latest stories</h2>
          <span className="text-[11px] uppercase tracking-[0.14em] text-primary">
            {channel.stories.length} stories
          </span>
        </div>

        <ul className="mt-3 space-y-3">
          {channel.stories.map((s) => (
            <li key={s.id}>
              <button
                onClick={() =>
                  openArticle({
                    id: s.id,
                    title: s.title,
                    source: channel.name,
                    sourceUrl: s.sourceUrl ?? "",
                    image: s.image,
                    excerpt: s.summary,
                    category: s.category,
                    readTime: s.readTime,
                  })
                }
                className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition hover:bg-secondary"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                    {s.category}
                  </div>
                  <h3 className="serif mt-1 line-clamp-2 text-base font-bold leading-snug">
                    {s.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {s.summary}
                  </p>
                  <div className="mt-1.5 text-[11px] text-muted-foreground">
                    {s.publishedAt} · {s.readTime} min read
                  </div>
                </div>
                <img
                  src={s.image}
                  alt=""
                  loading="lazy"
                  className="h-20 w-20 flex-none rounded-xl object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
