import type { FeedItem } from "@/lib/api";
import type {
  Channel,
  ChannelStory,
  JournalArticle,
  JournalCategory,
  ShowcasePanel,
} from "@/lib/content";
import { formatRelativeTime } from "@/lib/format";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function toChannelStory(item: FeedItem): ChannelStory {
  return {
    id: item.id,
    title: item.title,
    summary: item.excerpt,
    image: item.image,
    readTime: item.readTime,
    publishedAt: formatRelativeTime(item.publishedAt),
    category: item.category,
    sourceUrl: item.sourceUrl,
  };
}

/** Groups whatever's live right now by publisher — this *is* the Channels
 * list; there's no separate mock roster to keep in sync with reality. */
export function groupChannelsFromFeed(items: FeedItem[]): Channel[] {
  const map = new Map<string, Channel>();
  for (const item of items) {
    const slug = slugify(item.source || "unknown");
    let ch = map.get(slug);
    if (!ch) {
      ch = {
        slug,
        name: item.source,
        description: `Latest live reporting from ${item.source}.`,
        cover: item.image,
        location: item.location,
        language: item.language,
        stories: [],
      };
      map.set(slug, ch);
    }
    if (!ch.stories.some((s) => s.id === item.id)) ch.stories.push(toChannelStory(item));
  }
  return [...map.values()].sort((a, b) => b.stories.length - a.stories.length);
}

function toJournalArticle(item: FeedItem): JournalArticle {
  return {
    id: item.id,
    title: item.title,
    summary: item.excerpt,
    source: item.source,
    readTime: item.readTime,
    image: item.image,
    publishedAt: formatRelativeTime(item.publishedAt),
    sourceUrl: item.sourceUrl,
  };
}

/** Groups the live feed by its real subject classification (Politics,
 * Sports, Technology, etc — see the backend's app/topics.py), not by
 * `category` (which only ever distinguishes India/World editions, and
 * would leave this at just two unhelpfully broad groups). */
export function groupJournalFromFeed(items: FeedItem[]): JournalCategory[] {
  const map = new Map<string, JournalCategory>();
  for (const item of items) {
    const topic = item.topic || "General";
    const id = slugify(topic);
    let cat = map.get(id);
    if (!cat) {
      cat = {
        id,
        title: topic,
        description: `Live ${topic} stories, as they're scraped.`,
        cover: item.image,
        articles: [],
      };
      map.set(id, cat);
    }
    if (!cat.articles.some((a) => a.id === item.id)) cat.articles.push(toJournalArticle(item));
  }
  return [...map.values()].sort((a, b) => b.articles.length - a.articles.length);
}

/** Reorders the same live buffer so the Reels feed doesn't read as an
 * exact copy of the Home feed — round-robins across publishers (instead
 * of Home's straight chronological order) so consecutive reels come from
 * different sources. Same articles, different, genuinely distinct
 * sequence — nothing invented. */
export function diversifyBySource(items: FeedItem[]): FeedItem[] {
  const bySource = new Map<string, FeedItem[]>();
  for (const item of items) {
    const list = bySource.get(item.source) ?? [];
    list.push(item);
    bySource.set(item.source, list);
  }
  const queues = [...bySource.values()];
  const out: FeedItem[] = [];
  let remaining = items.length;
  let i = 0;
  while (remaining > 0) {
    const queue = queues[i % queues.length];
    if (queue.length > 0) {
      out.push(queue.shift() as FeedItem);
      remaining -= 1;
    }
    i += 1;
  }
  return out;
}

/** Top publishers right now, each shown as a small showcase panel — same
 * card shape the Stands tab already used, just built from what's actually
 * live instead of a hand-written mock set. */
export function groupShowcaseFromFeed(
  items: FeedItem[],
  panelCount = 4,
  storiesPerPanel = 3,
): ShowcasePanel[] {
  const bySource = new Map<string, FeedItem[]>();
  for (const item of items) {
    const list = bySource.get(item.source) ?? [];
    list.push(item);
    bySource.set(item.source, list);
  }
  return [...bySource.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, panelCount)
    .map(([source, list]) => ({
      id: `live-${slugify(source)}`,
      publisher: source,
      banner: "Live now",
      updated: list[0] ? formatRelativeTime(list[0].publishedAt) : "",
      stories: list.slice(0, storiesPerPanel).map((s) => ({
        id: s.id,
        kicker: s.category,
        title: s.title,
        image: s.image,
        sourceUrl: s.sourceUrl,
      })),
    }));
}
