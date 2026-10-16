import { useEffect, useRef, useState } from "react";
import { clearAdDebugFlag, readAdDebugFlag } from "@/components/ads/adDebug";
import { runAdSelfTest, type SelfTestResult } from "@/components/ads/AdSelfTest";

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
 * clicks or modifies ads. It also runs a one-shot "phone self-test" (see
 * adSelfTest.ts) that checks whether this phone can reach Google's ad servers
 * or is hiding ads, and prints a plain-English verdict.
 */
const ERROR_PATTERN = /adsbygoogle|tagerror|adsense|googlesyndication|pagead/i;
const MAX_ERRORS = 5;

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
  const [test, setTest] = useState<SelfTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const runTest = () => {
    setTesting(true);
    runAdSelfTest()
      .then(setTest)
      .catch(() => setTest({ lines: [], verdict: "VERDICT: the self-test itself failed to run." }))
      .finally(() => setTesting(false));
  };

  // Decided after mount so server and client render the same (empty) HTML.
  useEffect(() => {
    setOn(readAdDebugFlag());
  }, []);

  useEffect(() => {
    if (on) runTest();
  }, [on]);

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
              clearAdDebugFlag();
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
      <div className="mb-1 border-b border-white/20 pb-1">
        <div className="flex items-center justify-between font-sans text-[11px] font-semibold text-white">
          <span>Phone self-test</span>
          <button type="button" className="underline" onClick={runTest} disabled={testing}>
            {testing ? "testing..." : "run again"}
          </button>
        </div>
        {test?.verdict && (
          <div className="my-1 font-sans text-[11px] text-yellow-300">{test.verdict}</div>
        )}
        {test?.lines.map((l, i) => (
          <div key={`t${i}`} className={/BLOCKED|HIDDEN|ON$/.test(l) ? "text-red-300" : undefined}>
            {l}
          </div>
        ))}
        {!test && <div>running...</div>}
      </div>
      {lines.map((l, i) => (
        <div key={i} className={l.startsWith("!") ? "text-red-300" : undefined}>
          {l}
        </div>
      ))}
    </div>
  );
}