/**
 * `beforeinstallprompt` fires once, early in the page's life — often
 * before the user has done anything that would open our install modal.
 * It is only ever delivered to whichever listener happens to be attached
 * at that exact moment, and Chrome does not re-fire it on demand.
 *
 * If we only attached a listener inside the modal (which mounts on
 * demand, when the user triggers a save or after a 1.2s nudge timer),
 * any event fired before that point was captured by nobody and is gone
 * for the rest of the page's life — the modal would then wrongly fall
 * back to manual instructions even in a fully install-capable Chrome.
 *
 * This module is a plain singleton (not a hook) specifically so it can
 * be imported — and its listener attached — as early as possible in the
 * app's lifecycle, independent of any component's mount timing. Multiple
 * components can subscribe to it via `useSyncExternalStore` without
 * missing an event that already happened.
 *
 * WHY A PERSISTED FLAG IS STILL NEEDED (this went back and forth, so the
 * reasoning is worth keeping): no browser exposes a fully reliable, live
 * "is this PWA currently installed" check that works from a plain browser
 * tab. `matchMedia("display-mode: standalone")` is 100% reliable but only
 * true while already inside the installed app window — useless for
 * detecting "was this installed, on a normal tab revisit".
 * `navigator.getInstalledRelatedApps()` is a real live check, but it
 * commonly under-reports on desktop Chrome, so it can't be trusted as the
 * *only* source either. So a persisted flag remembers "yes, we saw this
 * installed before" — and the one thing that reliably corrects that
 * memory if it's ever gone stale (e.g. later uninstalled) is
 * `beforeinstallprompt` firing, which Chrome only ever sends when it
 * currently sees the app as genuinely NOT installed.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PERSISTED_INSTALLED_KEY = "inbits:pwaInstalled";

function readPersistedInstalled(): boolean {
  try {
    return localStorage.getItem(PERSISTED_INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

function persistInstalled() {
  try {
    localStorage.setItem(PERSISTED_INSTALLED_KEY, "1");
  } catch {
    /* ignore — worst case we just re-detect via standalone mode next time */
  }
}

function clearPersistedInstalled() {
  try {
    localStorage.removeItem(PERSISTED_INSTALLED_KEY);
  } catch {
    /* ignore */
  }
}

function isStandaloneNow(): boolean {
  return (
    (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Chrome's live "is this app installed" check. Only trusted to *upgrade*
 * `installed` to true — an empty/failed result is treated as "unknown",
 * not "definitely not installed", because this API is known to
 * under-report on desktop.
 */
async function refreshInstalledFromBrowser() {
  const getInstalledRelatedApps = (
    navigator as Navigator & { getInstalledRelatedApps?: () => Promise<Array<{ platform: string }>> }
  ).getInstalledRelatedApps;
  if (typeof getInstalledRelatedApps !== "function") return;
  try {
    const relatedApps = await getInstalledRelatedApps.call(navigator);
    if (relatedApps.some((app) => app.platform === "webapp") && !installed) {
      installed = true;
      persistInstalled();
      notify();
    }
  } catch {
    /* API present but blocked/failed — leave `installed` as-is */
  }
}

let deferredEvent: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

if (typeof window !== "undefined") {
  const standaloneNow = isStandaloneNow();
  installed = standaloneNow || readPersistedInstalled();
  if (standaloneNow) persistInstalled();
  console.log("[installPromptStore] initial: standaloneNow =", standaloneNow, "installed =", installed); // TEMP DEBUG

  void refreshInstalledFromBrowser();
  window.addEventListener("focus", () => void refreshInstalledFromBrowser());
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshInstalledFromBrowser();
  });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredEvent = e as BeforeInstallPromptEvent;
    // Live correction: Chrome only sends this when it currently sees the
    // app as not installed, so any older "installed" memory is stale.
    if (installed && !isStandaloneNow()) {
      installed = false;
      clearPersistedInstalled();
    }
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredEvent = null;
    installed = true;
    persistInstalled();
    notify();
  });
}

export const installPromptStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getCanPrompt() {
    return deferredEvent !== null;
  },
  getInstalled() {
    return installed;
  },
  async prompt(): Promise<boolean> {
    const event = deferredEvent;
    console.log("[installPromptStore] prompt() called, deferredEvent present =", !!event); // TEMP DEBUG
    if (!event) return false;
    console.log("[installPromptStore] calling event.prompt()..."); // TEMP DEBUG
    await event.prompt();
    const { outcome } = await event.userChoice;
    console.log("[installPromptStore] userChoice outcome =", outcome); // TEMP DEBUG
    // Single-use no matter the outcome: Chrome invalidates the event
    // object after `.prompt()` resolves either way.
    deferredEvent = null;
    if (outcome === "accepted") {
      installed = true;
      persistInstalled();
    }
    notify();
    return outcome === "accepted";
  },
  /**
   * Switch over to the installed app.
   *
   * IMPORTANT LIMIT: there is no JS API that replicates the browser's own
   * "Open in app" icon — that's privileged browser-chrome UI, and a web
   * page is deliberately not allowed to trigger another app or window on
   * the OS's behalf directly, for security reasons. No site's code (ours
   * included) can invoke that exact action.
   *
   * What we do instead is the same underlying mechanism Chrome itself
   * uses: a real, top-level, user-gesture-driven navigation to a URL
   * inside the app's `scope`. When the person has "Open supported links
   * in this app" enabled for InBits (Chrome turns this on automatically
   * for most installs), Chrome's OS-level app-link handling intercepts
   * exactly this kind of navigation and hands it to the installed app
   * window instead of the browser — combined with the manifest's
   * `launch_handler: navigate-existing`, which then reuses that window
   * rather than opening a second one.
   *
   * A real `<a target="_blank" rel="noopener">` click is used rather than
   * `window.open()` directly — some browsers only honor app-link
   * capturing on an actual anchor-element navigation, not a scripted
   * `window.open` call, even though both look similar. If link capturing
   * isn't enabled or supported, this just opens a normal new browser tab
   * — a reasonable fallback, not a broken state.
   */
  openInstalledApp() {
    const target = window.location.origin + "/";
    console.log("[installPromptStore] openInstalledApp() called, target =", target); // TEMP DEBUG
    const link = document.createElement("a");
    link.href = target;
    link.target = "_blank";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    console.log("[installPromptStore] openInstalledApp() finished clicking link"); // TEMP DEBUG
  },
};