// "Search on X" deep links for job boards InBits doesn't (and can't
// responsibly) pull structured listings from — none of these offer a
// free public API the way Remotive/RemoteOK do; the only "APIs" for them
// are unofficial scrapers of their internal endpoints, which we're not
// going to build into this app. These are just real, ordinary URLs to
// each site's own search page — the same link you'd get typing a query
// into their site yourself, opened in a new tab.
export type ExternalBoard = {
  name: string;
  homepage: string;
  /** Only set when the site's query-string search pattern is confirmed
   * to work. Omitted (rather than guessed) for boards where that isn't
   * reliably known, so this never sends someone to a broken/empty page —
   * those just link to the homepage instead. */
  buildSearchUrl?: (query: string) => string;
  /** Shown as a small caption under the button — a real, relevant
   * caveat about how that site actually works, not filler. */
  note?: string;
};

function slugify(q: string): string {
  const s = q
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return s || "all";
}

export const EXTERNAL_JOB_BOARDS: ExternalBoard[] = [
  {
    name: "Naukri",
    homepage: "https://www.naukri.com/",
    buildSearchUrl: (q) => `https://www.naukri.com/${slugify(q)}-jobs?k=${encodeURIComponent(q)}`,
  },
  {
    name: "Indeed",
    homepage: "https://in.indeed.com/",
    buildSearchUrl: (q) => `https://in.indeed.com/jobs?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Foundit",
    homepage: "https://www.foundit.in/",
    buildSearchUrl: (q) => `https://www.foundit.in/srp/results?query=${encodeURIComponent(q)}`,
    note: "Formerly Monster India — filed for bankruptcy in 2025, so listings may be thin.",
  },
  {
    name: "Internshala",
    homepage: "https://internshala.com/",
    buildSearchUrl: (q) => `https://internshala.com/internships/keyword-${encodeURIComponent(q)}`,
    note: "Mainly internships and fresher roles.",
  },
  {
    name: "SurelyRemote",
    homepage: "https://surelyremote.com/",
  },
  {
    name: "FlexJobs",
    homepage: "https://www.flexjobs.com/",
    note: "Most listings need a paid membership to view in full.",
  },
  {
    name: "Instahyre",
    homepage: "https://www.instahyre.com/",
    note: "Matches you with recruiters after you build a profile, rather than open search.",
  },
];

export function externalBoardUrl(board: ExternalBoard, query: string): string {
  const trimmed = query.trim();
  if (trimmed && board.buildSearchUrl) return board.buildSearchUrl(trimmed);
  return board.homepage;
}
