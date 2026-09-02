import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Newspaper, BookOpen, Radio } from "lucide-react";
import { TrendingCarousel } from "@/components/stands/TrendingCarousel";
import { StandsTab } from "@/components/stands/StandsTab";
import { JournalTab } from "@/components/stands/JournalTab";
import { ChannelsTab } from "@/components/stands/ChannelsTab";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import {
  groupChannelsFromFeed,
  groupJournalFromFeed,
  groupShowcaseFromFeed,
} from "@/lib/liveGroups";

export const Route = createFileRoute("/stands/")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: "stands" | "journal" | "channels"; cat?: string } => ({
    tab:
      search.tab === "journal" || search.tab === "channels" || search.tab === "stands"
        ? (search.tab as "stands" | "journal" | "channels")
        : undefined,
    cat: typeof search.cat === "string" ? search.cat : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Stands · InBits" },
      {
        name: "description",
        content: "Video and audio stands — podcasts, shorts and playlists from across the web.",
      },
    ],
  }),
  component: Stands,
});

const TABS = [
  { k: "stands" as const, label: "Stands", icon: Newspaper },
  { k: "journal" as const, label: "Journal", icon: BookOpen },
  { k: "channels" as const, label: "Channels", icon: Radio },
];

function Stands() {
  const { tab: tabParam, cat } = Route.useSearch();
  const [tab, setTab] = useState<"stands" | "journal" | "channels">(tabParam ?? "stands");
  const [openId, setOpenId] = useState<string | null>(cat ?? null);

  // The whole tab is backed by whatever's live in the buffer right now —
  // grouped client-side into the same panel/playlist/channel shapes the
  // UI already used, just built from real crawled articles.
  const { items } = useLiveFeed({ category: "All", pageSize: 50 });
  const showcase = useMemo(() => groupShowcaseFromFeed(items), [items]);
  const journal = useMemo(() => groupJournalFromFeed(items), [items]);
  const channels = useMemo(() => groupChannelsFromFeed(items), [items]);

  useEffect(() => {
    if (tabParam) setTab(tabParam);
    setOpenId(cat ?? null);
  }, [tabParam, cat]);

  const openCategory = journal.find((c) => c.id === openId) ?? null;

  return (
    <AppShell title="Stands">
      <div className="px-4 pt-3">
        {/* Trending / sponsored slot */}
        <TrendingCarousel items={items} />

        {/* Tabs */}
        <div className="flex rounded-full bg-secondary p-1 text-xs font-semibold">
          {TABS.map(({ k, label, icon: Icon }) => {
            const on = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 transition ${
                  on ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            );
          })}
        </div>

        {tab === "stands" && (
          <StandsTab
            showcase={showcase}
            journal={journal}
            onOpenJournalCategory={(id) => {
              setOpenId(id);
              setTab("journal");
            }}
          />
        )}

        {tab === "journal" && (
          <JournalTab
            categories={journal}
            openCategory={openCategory}
            onOpenCategory={(id) => setOpenId(id)}
            onCloseCategory={() => setOpenId(null)}
          />
        )}

        {tab === "channels" && <ChannelsTab channels={channels} />}
      </div>
    </AppShell>
  );
}
