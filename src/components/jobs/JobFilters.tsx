import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import type { RemoteJob } from "@/lib/api";

export type PostedWithin = "Today" | "This week" | "This month" | "Older";

export type JobFilterState = {
  q: string;
  type: string | null;
  workplace: string | null;
  country: string | null;
  category: string | null;
  postedWithin: PostedWithin | null;
};

export const EMPTY_JOB_FILTERS: JobFilterState = {
  q: "",
  type: null,
  workplace: null,
  country: null,
  category: null,
  postedWithin: null,
};

function postedBucket(posted: string): PostedWithin {
  const date = new Date(posted);
  if (Number.isNaN(date.getTime())) return "Older";
  const days = (Date.now() - date.getTime()) / 86_400_000;
  if (days < 1) return "Today";
  if (days <= 7) return "This week";
  if (days <= 30) return "This month";
  return "Older";
}

/** Narrows `jobs` down to whatever the current filter state asks for.
 * Kept alongside the filter UI itself so the two can never drift apart. */
export function applyJobFilters(jobs: RemoteJob[], filters: JobFilterState): RemoteJob[] {
  const q = filters.q.trim().toLowerCase();
  return jobs.filter((job) => {
    if (filters.type && job.type !== filters.type) return false;
    if (filters.workplace && job.workplaceType !== filters.workplace) return false;
    if (filters.country && job.country !== filters.country) return false;
    if (filters.category && job.category !== filters.category) return false;
    if (filters.postedWithin && postedBucket(job.posted) !== filters.postedWithin) return false;
    if (q) {
      const haystack = `${job.title} ${job.company} ${job.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/** One dropdown of option pills, built from whatever values actually
 * exist in the current job list — sorted most-common first, so the
 * options offered are always ones that will actually return results. */
function FacetDropdown({
  label,
  value,
  counts,
  onChange,
  sortByCount = true,
}: {
  label: string;
  value: string | null;
  counts: Map<string, number>;
  onChange: (next: string | null) => void;
  sortByCount?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => {
    const entries = [...counts.entries()];
    return sortByCount ? entries.sort((a, b) => b[1] - a[1]) : entries;
  }, [counts, sortByCount]);

  if (options.length === 0) return null;

  return (
    <div className="relative flex-none">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          value
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
        }`}
      >
        {value ?? label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          {/* Closes the dropdown on any outside click/tap. */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-1 max-h-64 w-48 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg">
            <button
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-secondary ${
                !value ? "text-primary" : "text-foreground"
              }`}
            >
              All {label.toLowerCase()}
            </button>
            {options.map(([opt, count]) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-secondary ${
                  value === opt ? "text-primary" : "text-foreground"
                }`}
              >
                <span className="truncate">{opt}</span>
                <span className="ml-2 flex-none text-muted-foreground">{count}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function countBy<T extends string>(jobs: RemoteJob[], selector: (job: RemoteJob) => T | ""): Map<string, number> {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    const v = selector(job);
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return counts;
}

const POSTED_ORDER: PostedWithin[] = ["Today", "This week", "This month", "Older"];

/**
 * Real filters over the actual fetched job list: keyword search, job
 * type, workplace type, country, category, and how recently it was
 * posted — everything needed to actually narrow this down to jobs worth
 * applying to, not just a decorative pill row.
 *
 * Fixed vs. the previous version: the dropdown popovers now live inside a
 * wrapping (not horizontally-scrolling) row. `overflow-x-auto` on the
 * pill row was creating a clipping context that cut the open dropdown off
 * or made it un-clickable — which is what "the filters aren't working"
 * actually was.
 */
export function JobFilters({
  jobs,
  filters,
  onChange,
}: {
  jobs: RemoteJob[];
  filters: JobFilterState;
  onChange: (next: JobFilterState) => void;
}) {
  const typeCounts = useMemo(() => countBy(jobs, (j) => j.type), [jobs]);
  const workplaceCounts = useMemo(() => countBy(jobs, (j) => j.workplaceType), [jobs]);
  const countryCounts = useMemo(() => countBy(jobs, (j) => j.country), [jobs]);
  const categoryCounts = useMemo(() => countBy(jobs, (j) => j.category), [jobs]);
  const postedCounts = useMemo(() => {
    const counts = countBy(jobs, (j) => postedBucket(j.posted));
    // Keep a stable, chronological order (Today → Older) instead of
    // "most common first" — that reads more naturally for a time filter.
    const ordered = new Map<string, number>();
    for (const bucket of POSTED_ORDER) if (counts.has(bucket)) ordered.set(bucket, counts.get(bucket)!);
    return ordered;
  }, [jobs]);

  const activeCount = [
    filters.type,
    filters.workplace,
    filters.country,
    filters.category,
    filters.postedWithin,
  ].filter(Boolean).length;

  return (
    <div className="px-4 pb-3 pt-4">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 flex-none text-muted-foreground" />
        <input
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search job title, company, or skill…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {filters.q && (
          <button onClick={() => onChange({ ...filters, q: "" })} className="text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* flex-wrap, not overflow-x-auto — see the fix note above. */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <FacetDropdown
          label="Job type"
          value={filters.type}
          counts={typeCounts}
          onChange={(type) => onChange({ ...filters, type })}
        />
        <FacetDropdown
          label="Workplace"
          value={filters.workplace}
          counts={workplaceCounts}
          onChange={(workplace) => onChange({ ...filters, workplace })}
        />
        <FacetDropdown
          label="Country"
          value={filters.country}
          counts={countryCounts}
          onChange={(country) => onChange({ ...filters, country })}
        />
        <FacetDropdown
          label="Category"
          value={filters.category}
          counts={categoryCounts}
          onChange={(category) => onChange({ ...filters, category })}
        />
        <FacetDropdown
          label="Posted"
          value={filters.postedWithin}
          counts={postedCounts}
          sortByCount={false}
          onChange={(postedWithin) => onChange({ ...filters, postedWithin: postedWithin as PostedWithin | null })}
        />
        {activeCount > 0 && (
          <button
            onClick={() => onChange(EMPTY_JOB_FILTERS)}
            className="flex-none rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}