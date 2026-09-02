import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [
          { path: "/", priority: "1.0" },
          { path: "/updates", priority: "0.9" },
          { path: "/stands", priority: "0.9" },
          { path: "/jobs", priority: "0.9" },
          { path: "/search", priority: "0.6" },
          { path: "/notifications", priority: "0.4" },
          { path: "/menu", priority: "0.4" },
        ];
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map(
            (e) =>
              `  <url><loc>${BASE_URL}${e.path}</loc><changefreq>daily</changefreq><priority>${e.priority}</priority></url>`,
          ),
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
