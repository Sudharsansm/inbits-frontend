import { ArrowLeft, BookOpen } from "lucide-react";
import type { JournalCategory } from "@/lib/content";
import { useArticleViewer } from "@/lib/articleViewer";

export function JournalTab({
  categories,
  openCategory,
  onOpenCategory,
  onCloseCategory,
}: {
  categories: JournalCategory[];
  openCategory: JournalCategory | null;
  onOpenCategory: (id: string) => void;
  onCloseCategory: () => void;
}) {
  const { openArticle } = useArticleViewer();
  if (openCategory) {
    return (
      <section className="pt-4">
        <button
          onClick={onCloseCategory}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> All categories
        </button>

        <div className="relative mt-3 overflow-hidden rounded-2xl">
          <img src={openCategory.cover} alt="" className="h-32 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
              {openCategory.articles.length} stories
            </span>
            <h2 className="serif mt-2 text-2xl font-bold leading-tight text-white">
              {openCategory.title}
            </h2>
            <p className="mt-0.5 line-clamp-1 text-xs text-white/80">{openCategory.description}</p>
          </div>
        </div>

        <ul className="mt-4 space-y-3">
          {openCategory.articles.map((a) => (
            <li key={a.id}>
              <button
                onClick={() =>
                  openArticle({
                    id: a.id,
                    title: a.title,
                    source: a.source,
                    sourceUrl: a.sourceUrl ?? "",
                  })
                }
                className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition hover:bg-secondary"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                    {a.source}
                  </div>
                  <h3 className="serif mt-1 line-clamp-2 text-base font-bold leading-snug">
                    {a.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {a.summary}
                  </p>
                  <div className="mt-1.5 text-[11px] text-muted-foreground">
                    {a.publishedAt} · {a.readTime} min read
                  </div>
                </div>
                <img
                  src={a.image}
                  alt=""
                  loading="lazy"
                  className="h-20 w-20 flex-none rounded-xl object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="pt-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="serif text-xl font-bold">Journal</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Live news, grouped by category</p>
        </div>
        <span className="text-[11px] uppercase tracking-[0.14em] text-primary">
          {categories.length} categories
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {categories.length === 0 && (
          <p className="col-span-2 py-6 text-center text-xs text-muted-foreground">
            Fetching the latest stories…
          </p>
        )}
        {categories.map((c) => (
          <article
            key={c.id}
            onClick={() => onOpenCategory(c.id)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <div className="relative aspect-[4/5]">
              <img
                src={c.cover}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute left-3 top-3">
                <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                  {c.articles.length} stories
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3">
                <h3 className="serif text-lg font-bold leading-tight text-white">{c.title}</h3>
                <p className="mt-0.5 line-clamp-2 text-xs text-white/80">{c.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-xs font-semibold text-primary">Read playlist</span>
              <button
                aria-label={`Open ${c.title}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground"
              >
                <BookOpen className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
