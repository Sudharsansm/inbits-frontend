import { Link } from "@tanstack/react-router";
import { ArrowRight, Radio } from "lucide-react";
import type { Channel } from "@/lib/content";
import { InfiniteRail } from "@/components/common/InfiniteRail";
import { ChannelAvatar } from "@/components/common/ChannelAvatar";

/** Channels — unique "radio dial" treatment: circular cover, tuning bars,
 * live ticker. Grouped live by publisher (same data the Channels tab and
 * /channel/$slug pages use), so tapping a channel actually lands on it. */
export function ChannelsRail({ channels }: { channels: Channel[] }) {
  if (channels.length === 0) return null;
  return (
    <section className="border-y border-border bg-paper py-5">
      <div className="mb-3 flex items-start justify-between gap-3 px-4">
        <div className="min-w-0">
          <h3 className="serif text-xl font-bold leading-tight">Channels</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Tune into a
            newsroom
          </p>
        </div>
        <Link
          to="/stands"
          search={{ tab: "channels" }}
          aria-label="All channels"
          className="mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
      <InfiniteRail
        items={channels}
        className="gap-4 pb-2 pl-4 pr-4"
        renderItem={(c, key) => (
          <Link
            key={key}
            to="/channel/$slug"
            params={{ slug: c.slug }}
            className="group w-[100px] flex-none text-center"
          >
            <div className="relative mx-auto h-[84px] w-[84px]">
              <div className="absolute inset-0 rounded-full border border-dashed border-border transition group-hover:border-primary/60" />
              <div className="absolute inset-[6px] overflow-hidden rounded-full ring-2 ring-primary/70">
                <img
                  src={c.cover}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
              </div>
              {/* The publisher's real website logo, badged on the cover
                  photo — same idea as a verified-channel mark. */}
              <ChannelAvatar
                source={c.name}
                sampleUrl={c.stories[0]?.sourceUrl}
                className="absolute -right-0.5 -top-0.5 h-6 w-6 ring-2 ring-paper"
              />
              <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-primary-foreground">
                <Radio className="h-2.5 w-2.5" /> Live
              </span>
            </div>
            <div className="mt-3 truncate text-xs font-bold text-foreground">{c.name}</div>
            <div className="mt-1 flex items-end justify-center gap-[3px]">
              {[5, 9, 7, 11, 7, 4, 10].map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h}px`, animationDelay: `${i * 110}ms` }}
                  className="w-[3px] animate-pulse rounded-full bg-primary/70"
                />
              ))}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {c.stories.length} stories
            </div>
          </Link>
        )}
      />
    </section>
  );
}
