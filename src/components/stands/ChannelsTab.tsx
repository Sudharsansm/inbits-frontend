import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Channel } from "@/lib/content";

export function ChannelsTab({ channels }: { channels: Channel[] }) {
  return (
    <section className="pt-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="serif text-xl font-bold">Channels</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Every publisher live right now</p>
        </div>
        <span className="text-[11px] uppercase tracking-[0.14em] text-primary">
          {channels.length} channels
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {channels.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Fetching the latest stories…
          </p>
        )}
        {channels.map((c) => (
          <Link
            key={c.slug}
            to="/channel/$slug"
            params={{ slug: c.slug }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:border-primary/40"
          >
            <img
              src={c.cover}
              alt=""
              loading="lazy"
              className="h-16 w-16 flex-none rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="serif text-base font-bold leading-snug">{c.name}</div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
              <div className="mt-1 text-[11px] font-semibold text-primary">
                {c.stories.length} stories
              </div>
            </div>
            <ArrowRight className="h-4 w-4 flex-none text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  );
}
