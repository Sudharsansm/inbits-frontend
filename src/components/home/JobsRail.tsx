import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchJobs, type RemoteJob } from "@/lib/api";
import { InfiniteRail } from "@/components/common/InfiniteRail";
import { RailHeader } from "@/components/home/RailHeader";
import { CompanyLogo } from "@/components/jobs/CompanyLogo";

export function JobsRail() {
  const [jobs, setJobs] = useState<RemoteJob[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchJobs()
      .then(({ items }) => {
        if (!cancelled) setJobs(items.slice(0, 10));
      })
      .catch(() => {
        /* jobs rail is a nice-to-have — a failed fetch just hides it */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (jobs.length === 0) return null;

  return (
    <section className="border-y border-border bg-paper py-5">
      <RailHeader
        title="Jobs for you"
        subtitle="Real, currently-open remote roles"
        to="/jobs"
        cta="See all jobs"
      />
      <InfiniteRail
        items={jobs}
        className="gap-3 pb-2 pl-4 pr-4"
        renderItem={(j, key) => (
          <Link
            key={key}
            to="/job/$id"
            params={{ id: j.id }}
            className="flex w-64 flex-none items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <CompanyLogo logoUrl={j.logoUrl} initials={j.logo} />
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-bold leading-tight">{j.title}</h4>
              <p className="text-xs text-muted-foreground">
                {j.company} · {j.location}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  {j.type}
                </span>
                <span className="text-[10px] font-semibold text-primary">{j.salary}</span>
              </div>
            </div>
          </Link>
        )}
      />
    </section>
  );
}