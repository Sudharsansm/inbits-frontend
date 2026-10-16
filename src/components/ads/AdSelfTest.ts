/**
 * "Why don't ads show on THIS phone?" -- a one-shot self-test for the ad
 * debug panel (?adsdebug=1). Ads can work on a laptop and still fail on a
 * phone for reasons the page's own code can't see, so this measures them:
 *
 *   - can this phone actually reach Google's ad servers? (a blocker, private
 *     DNS ad-filter, VPN or the mobile network can silently drop them)
 *   - is a browser ad blocker hiding ad-looking elements? (Brave Shields,
 *     Samsung Internet / Opera / Firefox blockers, "ad-block" extensions)
 *   - is Data Saver on?
 *   - which browser is it, and which JS build + service worker are running?
 *     (an installed app can keep running an OLD build after a deploy)
 *
 * It only READS and makes two harmless requests to Google's own ad hosts (no
 * cookies sent, no ad is requested or shown). It never touches real ads.
 */

export type SelfTestResult = { lines: string[]; verdict: string };

const AD_SCRIPT_URL = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
const AD_SERVER_URL = "https://googleads.g.doubleclick.net/";
const REACH_TIMEOUT_MS = 7000;
const BAIT_WAIT_MS = 200;

type BraveNavigator = Navigator & {
  brave?: { isBrave?: () => Promise<boolean> };
  connection?: { saveData?: boolean; effectiveType?: string };
};

export function detectBrowser(userAgent: string, isBrave: boolean): string {
  if (isBrave) return "Brave (Shields can block ads)";
  if (/SamsungBrowser/i.test(userAgent)) return "Samsung Internet";
  if (/OPR\/|Opera|OPiOS/i.test(userAgent)) return "Opera";
  if (/EdgA|EdgiOS|Edg\//i.test(userAgent)) return "Edge";
  if (/Firefox|FxiOS/i.test(userAgent)) return "Firefox";
  if (/DuckDuckGo/i.test(userAgent)) return "DuckDuckGo (blocks trackers/ads)";
  if (/CriOS|Chrome/i.test(userAgent)) return "Chrome";
  if (/Safari/i.test(userAgent)) return "Safari";
  return "unknown";
}

async function reach(url: string): Promise<{ ok: boolean; ms: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REACH_TIMEOUT_MS);
  const started = Date.now();
  try {
    // no-cors: we only care whether the request can leave the phone and be
    // answered at all (the response is opaque and never read).
    await fetch(url, {
      mode: "no-cors",
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    });
    return { ok: true, ms: Date.now() - started };
  } catch {
    return { ok: false, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

/** Do cosmetic ad filters hide an element that merely LOOKS like an ad? */
async function adLookingElementHidden(): Promise<boolean> {
  const bait = document.createElement("div");
  bait.className = "adsbox ad-banner ad-placement textads banner-ads pub_300x250";
  bait.style.cssText =
    "position:absolute;left:-9999px;top:-9999px;width:10px;height:10px;pointer-events:none;";
  bait.innerHTML = "&nbsp;";
  document.body.appendChild(bait);
  await new Promise((r) => setTimeout(r, BAIT_WAIT_MS));
  const cs = getComputedStyle(bait);
  const hidden =
    !bait.isConnected ||
    cs.display === "none" ||
    cs.visibility === "hidden" ||
    bait.offsetHeight === 0;
  bait.remove();
  return hidden;
}

export async function runAdSelfTest(): Promise<SelfTestResult> {
  const nav = window.navigator as BraveNavigator;
  const lines: string[] = [];

  let isBrave = false;
  try {
    isBrave = (await nav.brave?.isBrave?.()) === true;
  } catch {
    /* not Brave */
  }
  const browser = detectBrowser(nav.userAgent, isBrave);
  lines.push(`browser: ${browser}`);

  const saveData = nav.connection?.saveData === true;
  lines.push(
    `data saver: ${saveData ? "ON" : "off"}   network: ${nav.connection?.effectiveType ?? "?"}`,
  );

  const entry = Array.from(document.scripts)
    .map((s) => s.src)
    .find((src) => src.startsWith(window.location.origin) && /\.js(\?|$)/.test(src));
  lines.push(`build running: ${entry ? (entry.split("/").pop() ?? entry) : "unknown"}`);

  let sw = "not supported";
  if (nav.serviceWorker) {
    try {
      const reg = await nav.serviceWorker.getRegistration();
      sw = nav.serviceWorker.controller
        ? "controlling this page"
        : reg
          ? "registered (not yet controlling)"
          : "none";
    } catch {
      sw = "unreadable";
    }
  }
  lines.push(`service worker: ${sw}`);

  const [script, server, hidden] = await Promise.all([
    reach(AD_SCRIPT_URL),
    reach(AD_SERVER_URL),
    adLookingElementHidden(),
  ]);
  lines.push(
    `reach Google ad script: ${script.ok ? `ok (${script.ms}ms)` : `BLOCKED/unreachable (${script.ms}ms)`}`,
  );
  lines.push(
    `reach Google ad server: ${server.ok ? `ok (${server.ms}ms)` : `BLOCKED/unreachable (${server.ms}ms)`}`,
  );
  lines.push(
    `ad-like elements: ${hidden ? "HIDDEN by an ad filter on this phone" : "shown normally"}`,
  );

  let verdict: string;
  if (!script.ok || !server.ok) {
    verdict =
      "VERDICT: this phone cannot reach Google's ad servers. An ad blocker, private DNS " +
      "(e.g. AdGuard), a VPN, or the mobile network is blocking them. Turn those off and retry.";
  } else if (hidden) {
    verdict =
      "VERDICT: an ad filter on this phone hides ad elements (browser protection or an ad-blocker " +
      "extension). Switch it off for this site, or try another browser.";
  } else if (saveData) {
    verdict =
      "VERDICT: Data Saver is on and can stop ads loading. Turn it off for this site and retry.";
  } else {
    verdict =
      "VERDICT: nothing on this phone is blocking ads. If the units below say 'unfilled', Google is " +
      "simply not returning an ad for this phone/format. Compare 'build running' with your laptop's: " +
      "if it differs, the phone is on an old build.";
  }
  return { lines, verdict };
}