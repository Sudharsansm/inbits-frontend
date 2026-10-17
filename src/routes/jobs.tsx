import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchJobs } from "@/lib/api";
import { useToggleSet } from "@/hooks/usePrefs";
import { FeaturedJob } from "@/components/jobs/FeaturedJob";
import { JobCard } from "@/components/jobs/JobCard";
import { EMPTY_JOB_FILTERS, JobFilters, applyJobFilters } from "@/components/jobs/JobFilters";
import { ExternalJobBoards } from "@/components/jobs/ExternalJobBoards";
import { AdSlot } from "@/components/ads/AdSlot";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs · InBits" },
      {
        name: "description",
        content: "Real, currently-open remote listings — fetched live, not a sample list.",
      },
    ],
  }),
  // Real remote job listings from Remotive + RemoteOK's public boards,
  // fetched during SSR so the page isn't empty on first paint. See
  // app/jobs.py.
  // Listings don't change minute-to-minute, so cache for a while instead
  // of re-fetching every time the Jobs tab is opened.
  staleTime: 5 * 60 * 1000,
  loader: async () => {
    try {
      const { items } = await fetchJobs();
      return { jobs: items };
    } catch {
      return { jobs: [] };
    }
  },
  component: Jobs,
});

function Jobs() {
  const { jobs } = Route.useLoaderData();
  const { list, has, toggle } = useToggleSet("savedJobs");
  const [filters, setFilters] = useState(EMPTY_JOB_FILTERS);

  const filtered = useMemo(() => applyJobFilters(jobs, filters), [jobs, filters]);
  const isFiltering =
    filters.q.trim() !== "" || !!filters.type || !!filters.workplace || !!filters.country;
  // The featured slot only makes sense as "the top real listing" when
  // nothing's been filtered out — once the reader's actually narrowing
  // things down, every match should show in the list, not get pulled out
  // on top.
  const featured = !isFiltering ? filtered[0] : undefined;
  const rest = featured ? filtered.slice(1) : filtered;

  return (
    <AppShell title="Jobs">
      <JobFilters jobs={jobs} filters={filters} onChange={setFilters} />

      <section className="px-4">
        {featured && <FeaturedJob job={featured} />}

        <div className="mt-6 flex items-baseline justify-between">
          <h3 className="serif text-lg font-bold">
            {isFiltering
              ? `${filtered.length} match${filtered.length === 1 ? "" : "es"}`
              : "Open right now"}
          </h3>
          {list.length > 0 && (
            <Link to="/menu/saved" className="text-xs font-semibold text-primary">
              {list.length} saved
            </Link>
          )}
        </div>

        {jobs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Couldn't reach the job boards right now — check back shortly.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No jobs match those filters — try loosening one.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {rest.map((j, idx) => (
              <Fragment key={j.id}>
                {/* One ad per 4-listing cycle — same card list rhythm as
                    the Stands channel/journal lists. Reuses the "Search
                    discover grid" unit since both are vertical lists of
                    result cards; create a dedicated "Jobs list" unit in
                    AdSense later and swap the slot ID here if you want
                    separate performance reporting for this surface.
                    Wrapped in its own <li> — AdSlot's root is a <div>,
                    and this list's children must all be <li> elements. */}
                {idx > 0 && idx % 2 === 0 && (
                  <li className="list-none">
                    <AdSlot slot="6051024090" label="Sponsored" />
                  </li>
                )}
                <JobCard job={j} saved={has(j.id)} onToggleSave={() => toggle(j.id)} />
              </Fragment>
            ))}
          </ul>
        )}

        <ExternalJobBoards query={filters.q} />
      </section>
    </AppShell>
  );
}