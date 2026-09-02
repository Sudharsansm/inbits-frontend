import { Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import type { RemoteJob } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { CompanyLogo } from "@/components/jobs/CompanyLogo";

export function JobCard({
  job,
  saved,
  onToggleSave,
}: {
  job: RemoteJob;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <Link
        to="/job/$id"
        params={{ id: job.id }}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <CompanyLogo logoUrl={job.logoUrl} initials={job.logo} />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-bold leading-tight">{job.title}</h4>
          <p className="truncate text-xs text-muted-foreground">
            {job.company} · {job.location}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
              {job.type}
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
              {job.workplaceType}
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
              {job.country}
            </span>
            <span className="text-[10px] font-semibold text-primary">{job.salary}</span>
            <span className="text-[10px] text-muted-foreground">
              {formatRelativeTime(job.posted)} · via {job.source}
            </span>
          </div>
        </div>
      </Link>
      <button
        onClick={onToggleSave}
        aria-label={saved ? "Unsave job" : "Save job"}
        className="flex-none rounded-full p-2 hover:bg-secondary"
      >
        <Bookmark className={`h-4 w-4 ${saved ? "fill-ink text-ink" : ""}`} />
      </button>
    </li>
  );
}