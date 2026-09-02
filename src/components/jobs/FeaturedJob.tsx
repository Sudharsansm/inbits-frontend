import { Link } from "@tanstack/react-router";
import type { RemoteJob } from "@/lib/api";
import { CompanyLogo } from "@/components/jobs/CompanyLogo";

export function FeaturedJob({ job }: { job: RemoteJob }) {
  return (
    <Link
      to="/job/$id"
      params={{ id: job.id }}
      className="mt-4 block rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-4"
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
        Featured
      </div>
      <div className="mt-2 flex items-center gap-3">
        <CompanyLogo logoUrl={job.logoUrl} initials={job.logo} size="h-14 w-14" textSize="text-sm" />
        <div className="min-w-0">
          <h3 className="serif truncate text-lg font-bold leading-tight">{job.title}</h3>
          <p className="text-sm text-muted-foreground">
            {job.company} · {job.location}
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{job.about}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
          {job.workplaceType}
        </span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
          {job.country}
        </span>
        {job.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
          >
            {tag}
          </span>
        ))}
        <span className="ml-auto text-xs font-semibold text-primary">{job.salary}</span>
      </div>
    </Link>
  );
}