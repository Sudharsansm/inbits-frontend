import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { JournalCategory } from "@/lib/content";
import { InfiniteRail } from "@/components/common/InfiniteRail";

/** Journal — readable category playlists, grouped live from whatever
 * categories the crawler actually produced (same data the Stands
 * page's Journal tab uses). */
export function JournalRail({ journal }: { journal: JournalCategory[] }) {
  if (journal.length === 0) return null;
  return (
    <section className="border-y border-border bg-paper py-5">
      <div className="mb-3 flex items-start justify-between gap-3 px-4">
        <div className="min-w-0">
          <h3 className="serif text-xl font-bold leading-tight">Journal</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Read-ready news playlists by category</p>
        </div>
        <Link to="/stands" search={{ tab: "journal" }} aria-label="All categories" className="mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary">
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
      <InfiniteRail
        items={journal}
        className="gap-3 pb-2 pl-4 pr-4"
        renderItem={(c, key) => (
          <Link
            key={key}
            to="/stands"
            search={{ tab: "journal", cat: c.id }}
            className="group w-44 flex-none text-left"
          >
            <div className="relative overflow-hidden rounded-xl">
              <img src={c.cover} alt="" loading="lazy" className="h-44 w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <div className="text-[11px] font-semibold text-white">{c.title}</div>
              </div>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">{c.articles.length} stories</div>
          </Link>
        )}
      />
    </section>
  );
}
