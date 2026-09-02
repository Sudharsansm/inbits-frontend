import { ExternalLink } from "lucide-react";
import { EXTERNAL_JOB_BOARDS, externalBoardUrl } from "@/lib/externalJobBoards";

/**
 * Real deep links to job boards InBits doesn't pull structured listings
 * from (see lib/externalJobBoards.ts for why). Each button opens that
 * site's own search — pre-filled with the current keyword when the site
 * supports it, otherwise just its homepage — in a new tab.
 */
export function ExternalJobBoards({ query }: { query: string }) {
  return (
    <div className="mt-6 border-t border-border pt-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Also search directly on
      </h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {EXTERNAL_JOB_BOARDS.map((board) => (
          <a
            key={board.name}
            href={externalBoardUrl(board, query)}
            target="_blank"
            rel="noopener noreferrer"
            title={board.note}
            className="flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:bg-secondary/80"
          >
            {board.name}
            <ExternalLink className="h-3 w-3" />
          </a>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        These open each site's own search in a new tab — InBits doesn't pull listings from them
        directly.
      </p>
    </div>
  );
}
