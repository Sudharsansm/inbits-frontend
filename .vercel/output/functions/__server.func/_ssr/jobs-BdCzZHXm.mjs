import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-CCzBClNT.mjs";
import { e as Route$l, h as useToggleSet } from "./router-B91z3HGk.mjs";
import { C as CompanyLogo } from "./CompanyLogo-CJNU1DHt.mjs";
import { R as RelativeTime } from "./RelativeTime-6LiQ26XO.mjs";
import { a as AdSlot } from "./AdSlot-Do_We2Bz.mjs";
import { h as Search, X, B as Bookmark, E as ExternalLink, C as ChevronDown } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/seroval.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__query-core.mjs";
function FeaturedJob({ job }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Link,
    {
      to: "/job/$id",
      params: { id: job.id },
      className: "mt-4 block rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-4",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-[0.16em] text-primary", children: "Featured" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CompanyLogo,
            {
              logoUrl: job.logoUrl,
              initials: job.logo,
              size: "h-14 w-14",
              textSize: "text-sm"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif truncate text-lg font-bold leading-tight", children: job.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
              job.company,
              " · ",
              job.location
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 line-clamp-2 text-sm text-foreground/80", children: job.about }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground", children: job.workplaceType }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground", children: job.country }),
          job.tags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground",
              children: tag
            },
            tag
          )),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto text-xs font-semibold text-primary", children: job.salary })
        ] })
      ]
    }
  );
}
function JobCard({
  job,
  saved,
  onToggleSave
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-3 rounded-2xl border border-border bg-card p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Link,
      {
        to: "/job/$id",
        params: { id: job.id },
        className: "flex min-w-0 flex-1 items-center gap-3",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyLogo, { logoUrl: job.logoUrl, initials: job.logo }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "truncate text-sm font-bold leading-tight", children: job.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "truncate text-xs text-muted-foreground", children: [
              job.company,
              " · ",
              job.location
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground", children: job.type }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground", children: job.workplaceType }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground", children: job.country }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold text-primary", children: job.salary }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RelativeTime, { iso: job.posted }),
                " · via ",
                job.source
              ] })
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: onToggleSave,
        "aria-label": saved ? "Unsave job" : "Save job",
        className: "flex-none rounded-full p-2 hover:bg-secondary",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: `h-4 w-4 ${saved ? "fill-ink text-ink" : ""}` })
      }
    )
  ] });
}
const EMPTY_JOB_FILTERS = {
  q: "",
  type: null,
  workplace: null,
  country: null,
  category: null,
  postedWithin: null
};
function postedBucket(posted) {
  const date = new Date(posted);
  if (Number.isNaN(date.getTime())) return "Older";
  const days = (Date.now() - date.getTime()) / 864e5;
  if (days < 1) return "Today";
  if (days <= 7) return "This week";
  if (days <= 30) return "This month";
  return "Older";
}
function applyJobFilters(jobs, filters) {
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
function FacetDropdown({
  label,
  value,
  counts,
  onChange,
  sortByCount = true
}) {
  const [open, setOpen] = reactExports.useState(false);
  const options = reactExports.useMemo(() => {
    const entries = [...counts.entries()];
    return sortByCount ? entries.sort((a, b) => b[1] - a[1]) : entries;
  }, [counts, sortByCount]);
  if (options.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => setOpen((o) => !o),
        className: `flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"}`,
        children: [
          value ?? label,
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3.5 w-3.5" })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-30", onClick: () => setOpen(false) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute left-0 top-full z-40 mt-1 max-h-64 w-48 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => {
              onChange(null);
              setOpen(false);
            },
            className: `block w-full rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-secondary ${!value ? "text-primary" : "text-foreground"}`,
            children: [
              "All ",
              label.toLowerCase()
            ]
          }
        ),
        options.map(([opt, count]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => {
              onChange(opt);
              setOpen(false);
            },
            className: `flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-secondary ${value === opt ? "text-primary" : "text-foreground"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: opt }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 flex-none text-muted-foreground", children: count })
            ]
          },
          opt
        ))
      ] })
    ] })
  ] });
}
function countBy(jobs, selector) {
  const counts = /* @__PURE__ */ new Map();
  for (const job of jobs) {
    const v = selector(job);
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return counts;
}
const POSTED_ORDER = ["Today", "This week", "This month", "Older"];
function JobFilters({
  jobs,
  filters,
  onChange
}) {
  const typeCounts = reactExports.useMemo(() => countBy(jobs, (j) => j.type), [jobs]);
  const workplaceCounts = reactExports.useMemo(() => countBy(jobs, (j) => j.workplaceType), [jobs]);
  const countryCounts = reactExports.useMemo(() => countBy(jobs, (j) => j.country), [jobs]);
  const categoryCounts = reactExports.useMemo(() => countBy(jobs, (j) => j.category), [jobs]);
  const postedCounts = reactExports.useMemo(() => {
    const counts = countBy(jobs, (j) => postedBucket(j.posted));
    const ordered = /* @__PURE__ */ new Map();
    for (const bucket of POSTED_ORDER)
      if (counts.has(bucket)) ordered.set(bucket, counts.get(bucket));
    return ordered;
  }, [jobs]);
  const activeCount = [
    filters.type,
    filters.workplace,
    filters.country,
    filters.category,
    filters.postedWithin
  ].filter(Boolean).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-3 pt-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 flex-none text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: filters.q,
          onChange: (e) => onChange({ ...filters, q: e.target.value }),
          placeholder: "Search job title, company, or skill…",
          className: "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        }
      ),
      filters.q && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onChange({ ...filters, q: "" }), className: "text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FacetDropdown,
        {
          label: "Job type",
          value: filters.type,
          counts: typeCounts,
          onChange: (type) => onChange({ ...filters, type })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FacetDropdown,
        {
          label: "Workplace",
          value: filters.workplace,
          counts: workplaceCounts,
          onChange: (workplace) => onChange({ ...filters, workplace })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FacetDropdown,
        {
          label: "Country",
          value: filters.country,
          counts: countryCounts,
          onChange: (country) => onChange({ ...filters, country })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FacetDropdown,
        {
          label: "Category",
          value: filters.category,
          counts: categoryCounts,
          onChange: (category) => onChange({ ...filters, category })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FacetDropdown,
        {
          label: "Posted",
          value: filters.postedWithin,
          counts: postedCounts,
          sortByCount: false,
          onChange: (postedWithin) => onChange({ ...filters, postedWithin })
        }
      ),
      activeCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onChange(EMPTY_JOB_FILTERS),
          className: "flex-none rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground",
          children: "Clear"
        }
      )
    ] })
  ] });
}
function slugify(q) {
  const s = q.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return s || "all";
}
const EXTERNAL_JOB_BOARDS = [
  {
    name: "Naukri",
    homepage: "https://www.naukri.com/",
    buildSearchUrl: (q) => `https://www.naukri.com/${slugify(q)}-jobs?k=${encodeURIComponent(q)}`
  },
  {
    name: "Indeed",
    homepage: "https://in.indeed.com/",
    buildSearchUrl: (q) => `https://in.indeed.com/jobs?q=${encodeURIComponent(q)}`
  },
  {
    name: "Foundit",
    homepage: "https://www.foundit.in/",
    buildSearchUrl: (q) => `https://www.foundit.in/srp/results?query=${encodeURIComponent(q)}`,
    note: "Formerly Monster India — filed for bankruptcy in 2025, so listings may be thin."
  },
  {
    name: "Internshala",
    homepage: "https://internshala.com/",
    buildSearchUrl: (q) => `https://internshala.com/internships/keyword-${encodeURIComponent(q)}`,
    note: "Mainly internships and fresher roles."
  },
  {
    name: "SurelyRemote",
    homepage: "https://surelyremote.com/"
  },
  {
    name: "FlexJobs",
    homepage: "https://www.flexjobs.com/",
    note: "Most listings need a paid membership to view in full."
  },
  {
    name: "Instahyre",
    homepage: "https://www.instahyre.com/",
    note: "Matches you with recruiters after you build a profile, rather than open search."
  }
];
function externalBoardUrl(board, query) {
  const trimmed = query.trim();
  if (trimmed && board.buildSearchUrl) return board.buildSearchUrl(trimmed);
  return board.homepage;
}
function ExternalJobBoards({ query }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 border-t border-border pt-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Also search directly on" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: EXTERNAL_JOB_BOARDS.map((board) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "a",
      {
        href: externalBoardUrl(board, query),
        target: "_blank",
        rel: "noopener noreferrer",
        title: board.note,
        className: "flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:bg-secondary/80",
        children: [
          board.name,
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
        ]
      },
      board.name
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[11px] text-muted-foreground", children: "These open each site's own search in a new tab — InBits doesn't pull listings from them directly." })
  ] });
}
function Jobs() {
  const {
    jobs
  } = Route$l.useLoaderData();
  const {
    list,
    has,
    toggle
  } = useToggleSet("savedJobs");
  const [filters, setFilters] = reactExports.useState(EMPTY_JOB_FILTERS);
  const filtered = reactExports.useMemo(() => applyJobFilters(jobs, filters), [jobs, filters]);
  const isFiltering = filters.q.trim() !== "" || !!filters.type || !!filters.workplace || !!filters.country;
  const featured = !isFiltering ? filtered[0] : void 0;
  const rest = featured ? filtered.slice(1) : filtered;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { title: "Jobs", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(JobFilters, { jobs, filters, onChange: setFilters }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "px-4", children: [
      featured && /* @__PURE__ */ jsxRuntimeExports.jsx(FeaturedJob, { job: featured }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-baseline justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif text-lg font-bold", children: isFiltering ? `${filtered.length} match${filtered.length === 1 ? "" : "es"}` : "Open right now" }),
        list.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/menu/saved", className: "text-xs font-semibold text-primary", children: [
          list.length,
          " saved"
        ] })
      ] }),
      jobs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-10 text-center text-sm text-muted-foreground", children: "Couldn't reach the job boards right now — check back shortly." }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-10 text-center text-sm text-muted-foreground", children: "No jobs match those filters — try loosening one." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 space-y-3", children: rest.map((j, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
        idx > 0 && idx % 4 === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "list-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdSlot, { slot: "6051024090", label: "Sponsored" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(JobCard, { job: j, saved: has(j.id), onToggleSave: () => toggle(j.id) })
      ] }, j.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalJobBoards, { query: filters.q })
    ] })
  ] });
}
export {
  Jobs as component
};
