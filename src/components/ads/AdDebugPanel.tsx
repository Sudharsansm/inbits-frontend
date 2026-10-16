import { useEffect, useRef, useState } from "react";

/**
 * On-screen AdSense diagnostics for phones and the installed (PWA) app,
 * where there are no DevTools.
 *
 * Off by default and invisible to normal visitors. To turn it on, open the
 * site once with ?adsdebug=1 on the end of the address (e.g.
 * https://inbits.vercel.app/?adsdebug=1). That sets a flag in this
 * origin's localStorage, so the panel also shows in the installed app on
 * the same phone (they share storage). Turn it off with ?adsdebug=0 or the
 * "turn off" button.
 *
 * It only READS state (script tag, the adsbygoogle queue, each <ins>'s
 * attributes and size, AdSense-related console errors). It never requests,
 * clicks or modifies ads.
 */
const KEY = "inbits:adsdebug";
const ERROR_PATTERN = /adsbygoogle|tagerror|adsense|googlesyndication|pagead/i;
const MAX_ERRORS = 5;

function readFlag(): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get("adsdebug");
    if (q === "1") window.localStorage.setItem(KEY, "1");
    if (q === "0") window.localStorage.removeItem(KEY);
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function snapshot(errors: string[]): string[] {
  const out: string[] = [];
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const standalone =
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    nav.standalone === true;
  out.push(`host: ${window.location.hostname}`);
  out.push(`mode: ${standalone ? "installed app (standalone)" : "browser tab"}`);
  out.push(`viewport: ${window.innerWidth}x${window.innerHeight}  online: ${nav.onLine}`);

  const script = document.querySelector('script[src*="adsbygoogle.js"]');
  const queue = (window as unknown as { adsbygoogle?: unknown }).adsbygoogle;
  const loaded =
    !!queue && !Array.isArray(queue) && (queue as { loaded?: boolean }).loaded === true;
  out.push(`script tag: ${script ? "yes" : "NO"}   script loaded: ${loaded ? "yes" : "no"}`);
  out.push(`queue length: ${Array.isArray(queue) ? (queue as unknown[]).length : "(processed)"}`);

  const slots = Array.from(document.querySelectorAll<HTMLElement>("ins.adsbygoogle"));
  out.push(`ad units on page: ${slots.length}`);
  slots.slice(0, 6).forEach((ins, i) => {
    const r = ins.getBoundingClientRect();
    out.push(
      `#${i + 1} slot ${ins.getAttribute("data-ad-slot")} ${ins.getAttribute("data-ad-format")}` +
        ` | status: ${ins.getAttribute("data-ad-status") ?? "-"}` +
        ` | processed: ${ins.getAttribute("data-adsbygoogle-status") ?? "no"}` +
        ` | ${Math.round(r.width)}x${Math.round(r.height)}` +
        ` | iframe: ${ins.querySelector("iframe") ? "yes" : "no"}`,
    );
  });
  if (slots.length > 6) out.push(`... +${slots.length - 6} more`);
  if (errors.length) {
    out.push("AdSense errors:");
    errors.forEach((e) => out.push(`! ${e}`));
  }
  return out;
}

export function AdDebugPanel() {
  const [on, setOn] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const errors = useRef<string[]>([]);

  // Decided after mount so server and client render the same (empty) HTML.
  useEffect(() => {
    setOn(readFlag());
  }, []);

  useEffect(() => {
    if (!on) return;
    const remember = (args: unknown[]) => {
      const text = args.map((a) => (a instanceof Error ? a.message : String(a))).join(" ");
      if (ERROR_PATTERN.test(text)) {
        errors.current = [...errors.current, text.slice(0, 160)].slice(-MAX_ERRORS);
      }
    };
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = (...args: unknown[]) => {
      remember(args);
      originalError(...args);
    };
    console.warn = (...args: unknown[]) => {
      remember(args);
      originalWarn(...args);
    };
    const onWindowError = (e: ErrorEvent) => remember([e.message]);
    window.addEventListener("error", onWindowError);

    const tick = () => setLines(snapshot(errors.current));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("error", onWindowError);
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [on]);

  if (!on) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-2 bottom-20 z-[9999] max-h-[45vh] overflow-auto rounded-lg bg-black/90 p-2 font-mono text-[10px] leading-snug text-green-300 shadow-lg"
    >
      <div className="mb-1 flex items-center justify-between gap-2 font-sans text-[11px] font-semibold text-white">
        <span>AdSense debug</span>
        <span className="flex gap-3">
          <button
            type="button"
            className="underline"
            onClick={() => {
              try {
                window.localStorage.removeItem(KEY);
              } catch {
                /* ignore */
              }
              setOn(false);
            }}
          >
            turn off
          </button>
          <button type="button" className="underline" onClick={() => setOn(false)}>
            hide
          </button>
        </span>
      </div>
      {lines.map((l, i) => (
        <div key={i} className={l.startsWith("!") ? "text-red-300" : undefined}>
          {l}
        </div>
      ))}
    </div>
  );
}