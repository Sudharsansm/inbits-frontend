import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Briefcase, DollarSign, Bookmark } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchJob } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { useToggleSet } from "@/hooks/usePrefs";
import { CompanyLogo } from "@/components/jobs/CompanyLogo";

export const Route = createFileRoute("/job/$id")({
  loader: async ({ params }) => {
    const job = await fetchJob(params.id).catch(() => null);
    if (!job) throw notFound();
    return { job };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Job not found · InBits" }] };
    const { job } = loaderData;
    return {
      meta: [
        { title: `${job.title} at ${job.company} · InBits Jobs` },
        { name: "description", content: job.about },
      ],
    };
  },
  notFoundComponent: () => (
    <AppShell title="Jobs">
      <div className="px-6 py-16 text-center">
        <h1 className="serif text-2xl font-bold">Job not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This listing may have closed or been removed.
        </p>
        <Link
          to="/jobs"
          className="mt-6 inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Back to Jobs
        </Link>
      </div>
    </AppShell>
  ),
  component: JobPage,
});

function JobPage() {
  const { job } = Route.useLoaderData();
  const { has, toggle } = useToggleSet("savedJobs");
  const saved = has(job.id);

  return (
    <AppShell title="Jobs">
      <article className="px-4 pt-4">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to jobs
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <CompanyLogo logoUrl={job.logoUrl} initials={job.logo} size="h-14 w-14" textSize="text-sm" />
          <div className="min-w-0">
            <h1 className="serif text-xl font-black leading-tight">{job.title}</h1>
            <p className="text-sm text-muted-foreground">
              {job.company} · {formatRelativeTime(job.posted)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {job.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" /> {job.type} · {job.workplaceType}
          </span>
          <span className="inline-flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" /> {job.salary}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {job.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="flex-1 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground"
          >
            Apply now
          </a>
          <button
            onClick={() => toggle(job.id)}
            aria-label={saved ? "Unsave job" : "Save job"}
            className="rounded-full border border-border p-2.5 hover:bg-secondary"
          >
            <Bookmark className={`h-5 w-5 ${saved ? "fill-ink text-ink" : ""}`} />
          </button>
        </div>

        <section className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/85">
          <div>
            <h2 className="serif text-lg font-bold text-foreground">About the role</h2>
            <p className="mt-2">{job.about}</p>
          </div>
          {job.responsibilities.length > 0 && (
            <div>
              <h2 className="serif text-lg font-bold text-foreground">What the role involves</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {job.responsibilities.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h2 className="serif text-lg font-bold text-foreground">Details</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {job.perks.filter(Boolean).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </section>

        <div className="py-10 text-center text-[11px] text-muted-foreground">
          — End of listing —
        </div>
      </article>
    </AppShell>
  );
}