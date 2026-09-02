// Mock content store for the InBits app
export type Post = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  source: string;
  readTime: number;
  image: string;
  publishedAt: string;
  likes: number;
};

const img = (seed: string, w = 800, h = 600) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;

export const posts: Post[] = [
  {
    id: "1",
    category: "Tech",
    title: "The quiet rise of small, sovereign AI models",
    excerpt:
      "While headlines chase trillion-parameter giants, a generation of compact, on-device models is reshaping how we ship intelligence to the edge.",
    author: "Maya Iyer",
    source: "The Verge",
    readTime: 6,
    image: img("1677442136019-21780ecad995"),
    publishedAt: "2h ago",
    likes: 1240,
  },
  {
    id: "2",
    category: "World",
    title: "Lisbon's new midnight metro is changing nightlife rules",
    excerpt:
      "The Portuguese capital quietly extended its metro to 2am — and the city's musicians, cooks and cleaners are the first to feel it.",
    author: "João Pereira",
    source: "Reuters",
    readTime: 4,
    image: img("1555881400-74d7acaacd8b"),
    publishedAt: "5h ago",
    likes: 802,
  },
  {
    id: "3",
    category: "Business",
    title: "India's chip dream finally has a factory floor",
    excerpt:
      "Inside Dholera's first fab: 9,000 workers, one trillion rupees, and the bet that the next decade of silicon is made in Gujarat.",
    author: "Ananya Rao",
    source: "Bloomberg",
    readTime: 8,
    image: img("1518770660439-4636190af475"),
    publishedAt: "Yesterday",
    likes: 2105,
  },
  {
    id: "4",
    category: "Culture",
    title: "Why everyone is suddenly reading 19th-century letters",
    excerpt:
      "A slow-reading movement is turning old correspondences into bedtime rituals. We spoke to the founders running it from a Brooklyn loft.",
    author: "Sofia Lin",
    source: "The Atlantic",
    readTime: 5,
    image: img("1455390582262-044cdead277a"),
    publishedAt: "Yesterday",
    likes: 633,
  },
  {
    id: "5",
    category: "Sports",
    title: "A 17-year-old just rewrote distance running's rulebook",
    excerpt:
      "Kenya's newest prodigy ran the 10k in 26:31. The coach who almost cut her tells us what changed.",
    author: "Theo Mwangi",
    source: "ESPN",
    readTime: 3,
    image: img("1546519638-68e109498ffc"),
    publishedAt: "2d ago",
    likes: 412,
  },
];

export type Gossip = {
  id: string;
  kind: "video" | "audio";
  category: string;
  title: string;
  host: string;
  duration: string;
  cover: string;
  plays: string;
};

export const gossip: Gossip[] = [
  {
    id: "g1",
    kind: "video",
    category: "Trending",
    title: "What really happened at the Met Gala after-party",
    host: "Late Bites",
    duration: "12:04",
    cover: img("1492684223066-81342ee5ff30"),
    plays: "812K",
  },
  {
    id: "g2",
    kind: "audio",
    category: "Breaking",
    title: "The breakup nobody saw coming",
    host: "Off The Record",
    duration: "28:11",
    cover: img("1511671782779-c97d3d27a1d4"),
    plays: "1.2M",
  },
  {
    id: "g3",
    kind: "video",
    category: "Culture",
    title: "Behind the scenes of the new K-drama everyone's talking about",
    host: "Stage Pass",
    duration: "08:47",
    cover: img("1493225457124-a3eb161ffa5f"),
    plays: "504K",
  },
  {
    id: "g4",
    kind: "audio",
    category: "Business",
    title: "Three CEOs, one boardroom leak",
    host: "The Memo",
    duration: "41:29",
    cover: img("1521737604893-d14cc237f11d"),
    plays: "298K",
  },
];

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  logo: string;
  posted: string;
  tags: string[];
  applyUrl: string;
  about: string;
  responsibilities: string[];
  requirements: string[];
  perks: string[];
};

export const jobs: Job[] = [
  {
    id: "j1",
    title: "Senior Product Designer",
    company: "Linear",
    location: "Remote · EU",
    type: "Full-time",
    salary: "₹38–52 LPA",
    logo: "🟣",
    posted: "1d ago",
    tags: ["Figma", "Design Systems"],
    applyUrl: "https://linear.app/careers",
    about:
      "Linear is looking for a senior product designer to shape the next generation of issue tracking for fast-moving software teams. You will own end-to-end flows, from early exploration to pixel-level polish.",
    responsibilities: [
      "Own design for one core product area, end to end",
      "Prototype interactions and validate them with real users",
      "Extend and maintain the shared design system",
      "Partner closely with engineers during implementation",
    ],
    requirements: [
      "5+ years designing software products",
      "Strong portfolio of shipped, complex interfaces",
      "Fluency in Figma and modern prototyping tools",
      "Comfortable working async in a distributed team",
    ],
    perks: ["Fully remote within EU", "Annual team offsites", "Equipment budget"],
  },
  {
    id: "j2",
    title: "Staff Software Engineer, ML",
    company: "Anthropic",
    location: "San Francisco",
    type: "Hybrid",
    salary: "$280–380k",
    logo: "🟡",
    posted: "3d ago",
    tags: ["Python", "PyTorch"],
    applyUrl: "https://www.anthropic.com/careers",
    about:
      "Join a small team working on training and evaluation infrastructure for frontier models. You will build systems that thousands of experiments depend on every week.",
    responsibilities: [
      "Design and scale distributed training pipelines",
      "Improve evaluation tooling and reproducibility",
      "Mentor engineers across the research org",
    ],
    requirements: [
      "8+ years of software engineering experience",
      "Deep Python and PyTorch expertise",
      "Experience with large-scale distributed systems",
    ],
    perks: ["Hybrid SF office", "Health and wellness stipend", "Learning budget"],
  },
  {
    id: "j3",
    title: "Newsroom Editor",
    company: "The Hindu",
    location: "Bengaluru",
    type: "Full-time",
    salary: "₹14–22 LPA",
    logo: "📰",
    posted: "5d ago",
    tags: ["Editing", "Politics"],
    applyUrl: "https://www.thehindu.com/careers/",
    about:
      "Lead the evening desk for one of India's most trusted newspapers. You will commission, edit and sharpen political coverage on deadline.",
    responsibilities: [
      "Edit and sign off on daily political copy",
      "Commission features and follow-ups from reporters",
      "Uphold accuracy, sourcing and style standards",
    ],
    requirements: [
      "6+ years in a working newsroom",
      "Excellent news judgement under deadline",
      "Strong grasp of Indian politics and policy",
    ],
    perks: ["Newsroom in central Bengaluru", "Press accreditation", "Health cover for family"],
  },
  {
    id: "j4",
    title: "Podcast Producer",
    company: "Spotify Studios",
    location: "Mumbai",
    type: "Contract",
    salary: "₹80k/mo",
    logo: "🎙️",
    posted: "1w ago",
    tags: ["Audio", "Interviews"],
    applyUrl: "https://www.lifeatspotify.com/jobs",
    about:
      "Produce a weekly interview show from concept to publish: booking guests, structuring episodes and shaping the final mix.",
    responsibilities: [
      "Research topics and book guests",
      "Run recording sessions and direct hosts",
      "Edit, mix and master weekly episodes",
    ],
    requirements: [
      "3+ years producing narrative or interview audio",
      "Hands-on with Pro Tools, Audition or Reaper",
      "A published portfolio of episodes",
    ],
    perks: ["Studio access in Mumbai", "Flexible schedule", "Contract renewable yearly"],
  },
];

export const getJob = (id: string) => jobs.find((j) => j.id === id);

export const searchGrid = [
  { id: "s1", title: "Sourdough revival", image: img("1509440159596-0249088772ff"), h: 280 },
  { id: "s2", title: "Night markets", image: img("1504674900247-0877df9cc836"), h: 220 },
  { id: "s3", title: "Quiet luxury", image: img("1490481651871-ab68de25d43d"), h: 360 },
  { id: "s4", title: "Indie chips", image: img("1518770660439-4636190af475"), h: 240 },
  { id: "s5", title: "Mars rovers", image: img("1451187580459-43490279c0fa"), h: 300 },
  { id: "s6", title: "City cycling", image: img("1485965120184-e220f721d03e"), h: 200 },
  { id: "s7", title: "Coffee labs", image: img("1495474472287-4d71bcdd2085"), h: 340 },
  { id: "s8", title: "Slow reading", image: img("1455390582262-044cdead277a"), h: 260 },
];

export type NotificationLink = { to: string; params?: Record<string, string> };

export const notifications = [
  {
    id: "n1",
    type: "mention",
    actor: "Riya Shah",
    text: "mentioned you in a comment on “The quiet rise of small AI models”",
    time: "12m",
    link: { to: "/post/$id", params: { id: "1" } },
  },
  {
    id: "n2",
    type: "follow",
    actor: "The Atlantic",
    text: "started following you",
    time: "1h",
    link: { to: "/channel/$slug", params: { slug: "the-atlantic" } },
  },
  {
    id: "n3",
    type: "job",
    actor: "Linear",
    text: "posted a job that matches your interests: Senior Product Designer",
    time: "3h",
    link: { to: "/jobs" },
  },
  {
    id: "n4",
    type: "update",
    actor: "Bloomberg",
    text: "published a new update in India's chip dream",
    time: "Yesterday",
    link: { to: "/post/$id", params: { id: "3" } },
  },
  {
    id: "n5",
    type: "mention",
    actor: "Theo Mwangi",
    text: "replied to your comment",
    time: "2d",
    link: { to: "/post/$id", params: { id: "5" } },
  },
];

export const filters = ["All", "Trending", "Tech", "World", "Business", "Culture", "Sports"];

export type ShowcasePanel = {
  id: string;
  publisher: string;
  banner: string;
  updated: string;
  stories: { id: string; kicker: string; title: string; image: string; sourceUrl?: string }[];
};

export const showcase: ShowcasePanel[] = [
  {
    id: "sc1",
    publisher: "National Herald",
    banner: "NH's Sunday Highlights",
    updated: "11 hours ago",
    stories: [
      {
        id: "sc1a",
        kicker: "Nation",
        title: "'This is not his failure, but that of the system'",
        image: img("1495020689067-958852a7765e", 300, 300),
      },
      {
        id: "sc1b",
        kicker: "Nation",
        title: "Manipur govt announces reopening of highways",
        image: img("1504674900247-0877df9cc836", 300, 300),
      },
      {
        id: "sc1c",
        kicker: "World",
        title: "Russia, Ukraine exchange overnight strikes",
        image: img("1526666923127-b2970f64b422", 300, 300),
      },
    ],
  },
  {
    id: "sc2",
    publisher: "India Today",
    banner: "Top stories",
    updated: "8 hours ago",
    stories: [
      {
        id: "sc2a",
        kicker: "NEET row",
        title: "450 law students oppose CJI's convocation invite",
        image: img("1523050854058-8df90110c9f1", 300, 300),
      },
      {
        id: "sc2b",
        kicker: "JPSC row",
        title: "Jharkhand to cancel JPSC exam, students seek probe",
        image: img("1524178232363-1fb2b075b655", 300, 300),
      },
      {
        id: "sc2c",
        kicker: "Iran war exit plan",
        title: "Hormuz reopening first, nuclear deal later",
        image: img("1541888946425-d81bb19240f5", 300, 300),
      },
    ],
  },
  {
    id: "sc3",
    publisher: "The Memo",
    banner: "Business briefing",
    updated: "3 hours ago",
    stories: [
      {
        id: "sc3a",
        kicker: "Markets",
        title: "Rupee steadies as oil slips below $70",
        image: img("1611974789855-9c2a0a7236a3", 300, 300),
      },
      {
        id: "sc3b",
        kicker: "Startups",
        title: "Three CEOs, one boardroom leak",
        image: img("1521737604893-d14cc237f11d", 300, 300),
      },
      {
        id: "sc3c",
        kicker: "Policy",
        title: "New data rules land on founders' desks",
        image: img("1454165804606-c3d57bc86b40", 300, 300),
      },
    ],
  },
];

export type JournalArticle = {
  id: string;
  title: string;
  summary: string;
  source: string;
  readTime: number;
  image: string;
  publishedAt: string;
  sourceUrl?: string;
};

export type JournalCategory = {
  id: string;
  title: string;
  description: string;
  cover: string;
  articles: JournalArticle[];
};

export const journal: JournalCategory[] = [
  {
    id: "sports",
    title: "Sports",
    description: "Scores, transfers and the stories behind the athletes.",
    cover: img("1546519638-68e109498ffc"),
    articles: [
      {
        id: "sp1",
        title: "A 17-year-old just rewrote distance running's rulebook",
        summary:
          "Kenya's newest prodigy ran the 10k in 26:31 — her coach explains the training block that changed everything.",
        source: "ESPN",
        readTime: 3,
        image: img("1546519638-68e109498ffc", 300, 300),
        publishedAt: "2h ago",
      },
      {
        id: "sp2",
        title: "India's Test summer begins with three uncapped names",
        summary: "Selectors bet on domestic form over reputation ahead of a five-match series.",
        source: "Cricbuzz",
        readTime: 5,
        image: img("1531415074968-036ba1b575da", 300, 300),
        publishedAt: "6h ago",
      },
      {
        id: "sp3",
        title: "The quiet economics of a mid-table football club",
        summary: "Wage bills, academy sales and why survival is the real trophy.",
        source: "The Athletic",
        readTime: 8,
        image: img("1517649763962-0c623066013b", 300, 300),
        publishedAt: "Yesterday",
      },
      {
        id: "sp4",
        title: "Marathon majors move to a new shoe rule",
        summary: "Stack heights get a fresh cap, and elite fields are already adjusting.",
        source: "Runner's World",
        readTime: 4,
        image: img("1552674605-db6ffd4facb5", 300, 300),
        publishedAt: "2d ago",
      },
    ],
  },
  {
    id: "business",
    title: "Business",
    description: "Markets, startups and the numbers moving economies.",
    cover: img("1518770660439-4636190af475"),
    articles: [
      {
        id: "bs1",
        title: "India's chip dream finally has a factory floor",
        summary: "Inside Dholera's first fab: 9,000 workers and a trillion-rupee bet on silicon.",
        source: "Bloomberg",
        readTime: 8,
        image: img("1518770660439-4636190af475", 300, 300),
        publishedAt: "1h ago",
      },
      {
        id: "bs2",
        title: "Rupee steadies as oil slips below $70",
        summary: "Importers exhale as the crude curve flattens for a third straight week.",
        source: "Mint",
        readTime: 3,
        image: img("1611974789855-9c2a0a7236a3", 300, 300),
        publishedAt: "5h ago",
      },
      {
        id: "bs3",
        title: "New data rules land on founders' desks",
        summary: "Consent, retention and the compliance work small teams can't outsource.",
        source: "The Memo",
        readTime: 6,
        image: img("1454165804606-c3d57bc86b40", 300, 300),
        publishedAt: "Yesterday",
      },
    ],
  },
  {
    id: "tech",
    title: "Technology",
    description: "AI, devices and the engineering behind them.",
    cover: img("1677442136019-21780ecad995"),
    articles: [
      {
        id: "tc1",
        title: "The quiet rise of small, sovereign AI models",
        summary: "Compact on-device models are reshaping how intelligence ships to the edge.",
        source: "The Verge",
        readTime: 6,
        image: img("1677442136019-21780ecad995", 300, 300),
        publishedAt: "2h ago",
      },
      {
        id: "tc2",
        title: "Inside the labs building coffee-cup-sized data centers",
        summary: "Thermal limits, not transistors, now set the pace of compute.",
        source: "Wired",
        readTime: 7,
        image: img("1495474472287-4d71bcdd2085", 300, 300),
        publishedAt: "8h ago",
      },
      {
        id: "tc3",
        title: "Mars rovers get a software upgrade from Earth",
        summary: "A 22-minute round trip and a patch that took two years to write.",
        source: "Ars Technica",
        readTime: 5,
        image: img("1451187580459-43490279c0fa", 300, 300),
        publishedAt: "Yesterday",
      },
    ],
  },
  {
    id: "world",
    title: "World",
    description: "Cities, conflict and cross-border shifts.",
    cover: img("1555881400-74d7acaacd8b"),
    articles: [
      {
        id: "wd1",
        title: "Lisbon's new midnight metro is changing nightlife rules",
        summary: "Musicians, cooks and cleaners are the first to feel a 2am timetable.",
        source: "Reuters",
        readTime: 4,
        image: img("1555881400-74d7acaacd8b", 300, 300),
        publishedAt: "3h ago",
      },
      {
        id: "wd2",
        title: "Russia, Ukraine exchange overnight strikes",
        summary: "Energy infrastructure takes the brunt as winter planning begins.",
        source: "AP",
        readTime: 4,
        image: img("1526666923127-b2970f64b422", 300, 300),
        publishedAt: "7h ago",
      },
      {
        id: "wd3",
        title: "Hormuz reopening first, nuclear deal later",
        summary: "Negotiators sequence a fragile exit plan in Vienna.",
        source: "AFP",
        readTime: 6,
        image: img("1541888946425-d81bb19240f5", 300, 300),
        publishedAt: "Yesterday",
      },
    ],
  },
  {
    id: "culture",
    title: "Culture",
    description: "Books, film and the rituals we build around them.",
    cover: img("1455390582262-044cdead277a"),
    articles: [
      {
        id: "cl1",
        title: "Why everyone is suddenly reading 19th-century letters",
        summary: "A slow-reading movement is turning old correspondence into bedtime rituals.",
        source: "The Atlantic",
        readTime: 5,
        image: img("1455390582262-044cdead277a", 300, 300),
        publishedAt: "4h ago",
      },
      {
        id: "cl2",
        title: "The new K-drama everyone's talking about",
        summary: "Behind the scenes of a set that shot 16 episodes in 40 days.",
        source: "Variety",
        readTime: 4,
        image: img("1493225457124-a3eb161ffa5f", 300, 300),
        publishedAt: "Yesterday",
      },
      {
        id: "cl3",
        title: "Quiet luxury's loud second act",
        summary: "Logos are back, but only where nobody can see them.",
        source: "Business of Fashion",
        readTime: 5,
        image: img("1490481651871-ab68de25d43d", 300, 300),
        publishedAt: "2d ago",
      },
    ],
  },
  {
    id: "food",
    title: "Food & Cities",
    description: "Night markets, bakeries and how cities eat.",
    cover: img("1509440159596-0249088772ff"),
    articles: [
      {
        id: "fd1",
        title: "The sourdough revival that never really ended",
        summary: "Five years on, neighbourhood bakeries are the quiet winners.",
        source: "Eater",
        readTime: 4,
        image: img("1509440159596-0249088772ff", 300, 300),
        publishedAt: "6h ago",
      },
      {
        id: "fd2",
        title: "Night markets are rewriting municipal budgets",
        summary: "Street vendors now bankroll lighting, waste and late buses.",
        source: "CityLab",
        readTime: 6,
        image: img("1504674900247-0877df9cc836", 300, 300),
        publishedAt: "Yesterday",
      },
      {
        id: "fd3",
        title: "City cycling's delivery problem",
        summary: "Bike lanes were built for commuters, not couriers.",
        source: "Guardian",
        readTime: 5,
        image: img("1485965120184-e220f721d03e", 300, 300),
        publishedAt: "3d ago",
      },
    ],
  },
];

/* ---------------- Channels ---------------- */

export type ChannelStory = {
  id: string;
  title: string;
  summary: string;
  image: string;
  readTime: number;
  publishedAt: string;
  category: string;
  sourceUrl?: string;
};

export type Channel = {
  slug: string;
  name: string;
  description: string;
  cover: string;
  /** This publisher's home country/region and language, from the feed
   * config (backend/app/config.py) — same metadata Google News shows
   * next to a source's name. One channel = one publisher, so this lives
   * on the channel itself rather than repeated per story. */
  location: string;
  language: string;
  stories: ChannelStory[];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const channelBlurbs: Record<string, string> = {
  "the-verge": "Technology, science and the culture of gadgets.",
  reuters: "Fast, factual global reporting.",
  bloomberg: "Markets, money and the business of power.",
  "the-atlantic": "Ideas, essays and long-form culture.",
  espn: "Scores, transfers and the athletes behind them.",
};

function buildChannels(): Channel[] {
  const map = new Map<string, Channel>();

  const add = (source: string, story: ChannelStory, cover: string) => {
    const slug = slugify(source);
    let ch = map.get(slug);
    if (!ch) {
      ch = {
        slug,
        name: source,
        description: channelBlurbs[slug] ?? `Latest reporting from ${source}.`,
        cover,
        // Mock/sample data (not the live feed) has no real location or
        // language on hand — leave blank so the UI simply skips the
        // badge here rather than showing a fabricated value.
        location: "",
        language: "",
        stories: [],
      };
      map.set(slug, ch);
    }
    if (!ch.stories.some((s) => s.id === story.id)) ch.stories.push(story);
  };

  for (const p of posts) {
    add(
      p.source,
      {
        id: p.id,
        title: p.title,
        summary: p.excerpt,
        image: p.image,
        readTime: p.readTime,
        publishedAt: p.publishedAt,
        category: p.category,
      },
      p.image,
    );
  }

  for (const c of journal) {
    for (const a of c.articles) {
      add(
        a.source,
        {
          id: a.id,
          title: a.title,
          summary: a.summary,
          image: a.image,
          readTime: a.readTime,
          publishedAt: a.publishedAt,
          category: c.title,
        },
        c.cover,
      );
    }
  }

  return [...map.values()].sort((a, b) => b.stories.length - a.stories.length);
}

export const channels: Channel[] = buildChannels();

export const getChannel = (slug: string) => channels.find((c) => c.slug === slug);

/* ---------------- Unified article lookup ---------------- */

export type Article = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  source: string;
  readTime: number;
  image: string;
  publishedAt: string;
};

export function getArticle(id: string): Article | undefined {
  const p = posts.find((x) => x.id === id);
  if (p) {
    return {
      id: p.id,
      category: p.category,
      title: p.title,
      excerpt: p.excerpt,
      author: p.author,
      source: p.source,
      readTime: p.readTime,
      image: p.image,
      publishedAt: p.publishedAt,
    };
  }

  for (const c of journal) {
    const a = c.articles.find((x) => x.id === id);
    if (a) {
      return {
        id: a.id,
        category: c.title,
        title: a.title,
        excerpt: a.summary,
        author: a.source,
        source: a.source,
        readTime: a.readTime,
        image: a.image,
        publishedAt: a.publishedAt,
      };
    }
  }

  for (const panel of showcase) {
    const s = panel.stories.find((x) => x.id === id);
    if (s) {
      return {
        id: s.id,
        category: s.kicker,
        title: s.title,
        excerpt: `${panel.banner} — reported by ${panel.publisher}.`,
        author: panel.publisher,
        source: panel.publisher,
        readTime: 4,
        image: s.image,
        publishedAt: panel.updated,
      };
    }
  }

  return undefined;
}
