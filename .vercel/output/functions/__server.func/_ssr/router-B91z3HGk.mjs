import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { Q as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent, d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { V as notFound } from "../_libs/tanstack__router-core.mjs";
import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { E as ExternalLink, B as Bookmark, S as Sparkles, X, D as Download } from "../_libs/lucide-react.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/seroval.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
const appCss = "/assets/styles-B1zkTW_Q.css";
function reportAppError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__appErrorEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
}
const listeners$1 = /* @__PURE__ */ new Map();
const cache = /* @__PURE__ */ new Map();
function storageKey(key) {
  return `inbits:${key}`;
}
function readFromStorage(key, initial) {
  if (typeof window === "undefined") return initial;
  if (cache.has(key)) return cache.get(key);
  let value = initial;
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (raw != null) value = JSON.parse(raw);
  } catch {
  }
  cache.set(key, value);
  return value;
}
function notify$1(key) {
  listeners$1.get(key)?.forEach((listener) => listener());
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (!event.key || !event.key.startsWith("inbits:")) return;
    const key = event.key.slice("inbits:".length);
    cache.delete(key);
    notify$1(key);
  });
}
function usePref(key, initial) {
  const subscribe = reactExports.useCallback(
    (onStoreChange) => {
      let set = listeners$1.get(key);
      if (!set) {
        set = /* @__PURE__ */ new Set();
        listeners$1.set(key, set);
      }
      set.add(onStoreChange);
      return () => {
        set.delete(onStoreChange);
      };
    },
    [key]
  );
  const getSnapshot = reactExports.useCallback(() => readFromStorage(key, initial), [key, initial]);
  const getServerSnapshot = reactExports.useCallback(() => initial, [initial]);
  const value = reactExports.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const update = reactExports.useCallback(
    (next) => {
      cache.set(key, next);
      try {
        localStorage.setItem(storageKey(key), JSON.stringify(next));
      } catch {
      }
      notify$1(key);
    },
    [key]
  );
  return [value, update];
}
function useToggleSet(key, initial = []) {
  const [list, setList] = usePref(key, initial);
  const has = (id) => list.includes(id);
  const toggle = (id) => setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  return { list, has, toggle };
}
const PERSISTED_INSTALLED_KEY = "inbits:pwaInstalled";
function readPersistedInstalled() {
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
  }
}
function clearPersistedInstalled() {
  try {
    localStorage.removeItem(PERSISTED_INSTALLED_KEY);
  } catch {
  }
}
function isStandaloneNow() {
  return typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
async function refreshInstalledFromBrowser() {
  const getInstalledRelatedApps = navigator.getInstalledRelatedApps;
  if (typeof getInstalledRelatedApps !== "function") return;
  try {
    const relatedApps = await getInstalledRelatedApps.call(navigator);
    if (relatedApps.some((app) => app.platform === "webapp") && !installed) {
      installed = true;
      persistInstalled();
      notify();
    }
  } catch {
  }
}
let deferredEvent = null;
let installed = false;
const listeners = /* @__PURE__ */ new Set();
function notify() {
  for (const listener of listeners) listener();
}
if (typeof window !== "undefined") {
  const standaloneNow = isStandaloneNow();
  installed = standaloneNow || readPersistedInstalled();
  if (standaloneNow) persistInstalled();
  console.log(
    "[installPromptStore] initial: standaloneNow =",
    standaloneNow,
    "installed =",
    installed
  );
  void refreshInstalledFromBrowser();
  window.addEventListener("focus", () => void refreshInstalledFromBrowser());
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshInstalledFromBrowser();
  });
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredEvent = e;
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
const installPromptStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getCanPrompt() {
    return deferredEvent !== null;
  },
  getInstalled() {
    return installed;
  },
  async prompt() {
    const event = deferredEvent;
    console.log("[installPromptStore] prompt() called, deferredEvent present =", !!event);
    if (!event) return false;
    console.log("[installPromptStore] calling event.prompt()...");
    await event.prompt();
    const { outcome } = await event.userChoice;
    console.log("[installPromptStore] userChoice outcome =", outcome);
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
    console.log("[installPromptStore] openInstalledApp() called, target =", target);
    const link = document.createElement("a");
    link.href = target;
    link.target = "_blank";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    console.log("[installPromptStore] openInstalledApp() finished clicking link");
  }
};
function useInstallPrompt() {
  const canPrompt = reactExports.useSyncExternalStore(
    installPromptStore.subscribe,
    installPromptStore.getCanPrompt,
    () => false
  );
  const installed2 = reactExports.useSyncExternalStore(
    installPromptStore.subscribe,
    installPromptStore.getInstalled,
    () => false
  );
  const promptInstall = () => installPromptStore.prompt();
  const openInstalledApp = () => installPromptStore.openInstalledApp();
  return { canPrompt, installed: installed2, promptInstall, openInstalledApp };
}
const COPY = {
  save: {
    icon: Bookmark,
    title: "Install to save this story",
    body: "Saved stories live only in this browser's storage — clearing your browser data or switching devices loses them. Install InBits as an app first, and this story (and every one after it) stays saved on your home screen for good."
  },
  open: {
    icon: Sparkles,
    title: "Install InBits",
    body: "You're viewing InBits in a browser tab. Install it as an app for a faster, full-screen experience — and so saved stories stick around instead of living in browser storage that can get cleared."
  }
};
const INSTALLED_COPY = {
  save: {
    icon: Bookmark,
    title: "Open InBits to save this story",
    body: "InBits is already installed on this device. Switch to the app to save this story so it sticks around for good."
  },
  open: {
    icon: ExternalLink,
    title: "InBits is already installed",
    body: "You're viewing this in a browser tab. Switch over to the installed app for the faster, full-screen experience."
  }
};
function SaveInstallModal({
  variant,
  onInstall,
  onDismiss
}) {
  const { installed: installed2, promptInstall, openInstalledApp } = useInstallPrompt();
  const [awaitingBrowserPrompt, setAwaitingBrowserPrompt] = reactExports.useState(false);
  const { icon: Icon, title, body } = installed2 ? INSTALLED_COPY[variant] : COPY[variant];
  console.log("[SaveInstallModal] rendered with installed =", installed2);
  const handlePrimaryAction = async () => {
    console.log("[SaveInstallModal] button clicked, installed =", installed2);
    if (installed2) {
      console.log("[SaveInstallModal] calling openInstalledApp()");
      openInstalledApp();
      onInstall();
      return;
    }
    console.log("[SaveInstallModal] calling promptInstall()");
    setAwaitingBrowserPrompt(true);
    try {
      const accepted = await promptInstall();
      console.log("[SaveInstallModal] promptInstall() returned", accepted);
      if (accepted) {
        onInstall();
        return;
      }
      onDismiss();
    } finally {
      setAwaitingBrowserPrompt(false);
    }
  };
  if (awaitingBrowserPrompt) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center",
      onClick: onDismiss,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "w-full max-w-sm rounded-t-3xl bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl sm:pb-5",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: onDismiss,
                  "aria-label": "Close",
                  className: "rounded-full p-1 text-muted-foreground hover:bg-secondary",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "serif mt-3 text-lg font-bold", children: title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm leading-relaxed text-muted-foreground", children: body }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: onDismiss,
                  className: "flex-1 rounded-full border border-border py-2.5 text-sm font-semibold text-muted-foreground",
                  children: "Not now"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: handlePrimaryAction,
                  className: "flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground",
                  children: installed2 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4" }),
                    " Open app"
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
                    " Install app"
                  ] })
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
function isRunningInstalled() {
  if (typeof window === "undefined") return false;
  const standaloneMediaQuery = typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = window.navigator.standalone === true;
  return standaloneMediaQuery || iosStandalone;
}
const SESSION_NUDGE_KEY = "inbits:installPrompt.shownThisSession";
const InstallGateContext = reactExports.createContext(null);
function InstallGateProvider({ children }) {
  const [installed2, setInstalled] = reactExports.useState(isRunningInstalled);
  const [open, setOpen] = reactExports.useState(false);
  const pendingAction = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (installed2 || typeof window === "undefined") return;
    const onInstalled = () => {
      setInstalled(true);
      setOpen(false);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, [installed2]);
  reactExports.useEffect(() => {
    if (installed2 || typeof window === "undefined") return;
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SESSION_NUDGE_KEY) === "1";
    } catch {
    }
    if (alreadyShown) return;
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_NUDGE_KEY, "1");
      } catch {
      }
      pendingAction.current = null;
      setOpen(true);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [installed2]);
  const requireInstall = (proceed) => {
    if (installed2) {
      proceed();
      return;
    }
    pendingAction.current = proceed;
    setOpen(true);
  };
  const handleInstalled = () => {
    setInstalled(true);
    setOpen(false);
    const proceed = pendingAction.current;
    pendingAction.current = null;
    proceed?.();
  };
  const handleDismiss = () => {
    setOpen(false);
    pendingAction.current = null;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(InstallGateContext.Provider, { value: { requireInstall }, children: [
    children,
    open && /* @__PURE__ */ jsxRuntimeExports.jsx(
      SaveInstallModal,
      {
        variant: pendingAction.current ? "save" : "open",
        onInstall: handleInstalled,
        onDismiss: handleDismiss
      }
    )
  ] });
}
function useInstallGate() {
  const ctx = reactExports.useContext(InstallGateContext);
  if (!ctx) throw new Error("useInstallGate must be used within <InstallGateProvider>");
  return ctx;
}
const SavedPostsContext = reactExports.createContext(null);
function SavedPostsProvider({ children }) {
  const { list, has, toggle } = useToggleSet("savedPosts");
  const { requireInstall } = useInstallGate();
  const toggleSave = (id) => {
    const wasSaved = has(id);
    if (!wasSaved) {
      requireInstall(() => toggle(id));
      return;
    }
    toggle(id);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SavedPostsContext.Provider, { value: { has, toggleSave, savedIds: list }, children });
}
function useSavedPosts() {
  const ctx = reactExports.useContext(SavedPostsContext);
  if (!ctx) throw new Error("useSavedPosts must be used within <SavedPostsProvider>");
  return ctx;
}
const MAX_ENTRIES = 60;
const articleCache = /* @__PURE__ */ new Map();
const FALLBACK = {
  id: "",
  originalArticleId: "",
  category: "",
  topic: "",
  title: "",
  excerpt: "",
  content: "",
  author: "",
  source: "",
  sourceUrl: "",
  readTime: 1,
  image: "",
  images: [],
  publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
  updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  likes: 0,
  views: 0,
  tags: [],
  language: "",
  location: "",
  status: "published"
};
function touch(id, value) {
  articleCache.delete(id);
  articleCache.set(id, value);
}
function evictIfNeeded() {
  while (articleCache.size > MAX_ENTRIES) {
    const oldestKey = articleCache.keys().next().value;
    if (oldestKey === void 0) break;
    articleCache.delete(oldestKey);
  }
}
function getArticle(id) {
  const existing = articleCache.get(id);
  if (existing) touch(id, existing);
  return existing;
}
function seedArticle(partial) {
  const existing = articleCache.get(partial.id);
  if (existing?.complete) {
    touch(partial.id, existing);
    return;
  }
  const post = { ...FALLBACK, ...existing?.post, ...partial, id: partial.id };
  touch(partial.id, { post, related: existing?.related ?? [], complete: false });
  evictIfNeeded();
}
function setArticle(id, data) {
  touch(id, data);
  evictIfNeeded();
}
const STORAGE_KEY = "inbits:feedReturnIntent";
let memoryIntent = null;
function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
function markLeavingForArticle(postId) {
  const value = { intent: "preserve", postId };
  memoryIntent = value;
  getStorage()?.setItem(STORAGE_KEY, JSON.stringify(value));
}
function consumeFeedReturnIntent() {
  const storage = getStorage();
  let stored = memoryIntent;
  if (!stored && storage) {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        stored = JSON.parse(raw);
      } catch {
        stored = null;
      }
    }
  }
  memoryIntent = null;
  storage?.removeItem(STORAGE_KEY);
  if (!stored) return { intent: "reset", postId: null };
  return { intent: "preserve", postId: stored.postId };
}
const ArticleViewerContext = reactExports.createContext(null);
function ArticleViewerProvider({ children }) {
  const navigate = useNavigate();
  const openArticle = (article) => {
    seedArticle(article);
    markLeavingForArticle(article.id);
    navigate({
      to: "/post/$id",
      params: { id: article.id }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ArticleViewerContext.Provider, { value: { openArticle }, children });
}
function useArticleViewer() {
  const ctx = reactExports.useContext(ArticleViewerContext);
  if (!ctx) throw new Error("useArticleViewer must be used within <ArticleViewerProvider>");
  return ctx;
}
const AD_DEBUG_KEY = "inbits:adsdebug";
function readAdDebugFlag() {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("adsdebug");
    if (q === "1") window.localStorage.setItem(AD_DEBUG_KEY, "1");
    if (q === "0") window.localStorage.removeItem(AD_DEBUG_KEY);
    return window.localStorage.getItem(AD_DEBUG_KEY) === "1";
  } catch {
    return false;
  }
}
function clearAdDebugFlag() {
  try {
    window.localStorage.removeItem(AD_DEBUG_KEY);
  } catch {
  }
}
const AD_SCRIPT_URL = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
const AD_SERVER_URL = "https://googleads.g.doubleclick.net/";
const REACH_TIMEOUT_MS = 7e3;
const BAIT_WAIT_MS = 200;
function detectBrowser(userAgent, isBrave) {
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
async function reach(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REACH_TIMEOUT_MS);
  const started = Date.now();
  try {
    await fetch(url, {
      mode: "no-cors",
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal
    });
    return { ok: true, ms: Date.now() - started };
  } catch {
    return { ok: false, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}
async function adLookingElementHidden() {
  const bait = document.createElement("div");
  bait.className = "adsbox ad-banner ad-placement textads banner-ads pub_300x250";
  bait.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:10px;height:10px;pointer-events:none;";
  bait.innerHTML = "&nbsp;";
  document.body.appendChild(bait);
  await new Promise((r) => setTimeout(r, BAIT_WAIT_MS));
  const cs = getComputedStyle(bait);
  const hidden = !bait.isConnected || cs.display === "none" || cs.visibility === "hidden" || bait.offsetHeight === 0;
  bait.remove();
  return hidden;
}
async function runAdSelfTest() {
  const nav = window.navigator;
  const lines = [];
  let isBrave = false;
  try {
    isBrave = await nav.brave?.isBrave?.() === true;
  } catch {
  }
  const browser = detectBrowser(nav.userAgent, isBrave);
  lines.push(`browser: ${browser}`);
  const saveData = nav.connection?.saveData === true;
  lines.push(
    `data saver: ${saveData ? "ON" : "off"}   network: ${nav.connection?.effectiveType ?? "?"}`
  );
  const entry = Array.from(document.scripts).map((s) => s.src).find((src) => src.startsWith(window.location.origin) && /\.js(\?|$)/.test(src));
  lines.push(`build running: ${entry ? entry.split("/").pop() ?? entry : "unknown"}`);
  let sw = "not supported";
  if (nav.serviceWorker) {
    try {
      const reg = await nav.serviceWorker.getRegistration();
      sw = nav.serviceWorker.controller ? "controlling this page" : reg ? "registered (not yet controlling)" : "none";
    } catch {
      sw = "unreadable";
    }
  }
  lines.push(`service worker: ${sw}`);
  const [script, server, hidden] = await Promise.all([
    reach(AD_SCRIPT_URL),
    reach(AD_SERVER_URL),
    adLookingElementHidden()
  ]);
  lines.push(
    `reach Google ad script: ${script.ok ? `ok (${script.ms}ms)` : `BLOCKED/unreachable (${script.ms}ms)`}`
  );
  lines.push(
    `reach Google ad server: ${server.ok ? `ok (${server.ms}ms)` : `BLOCKED/unreachable (${server.ms}ms)`}`
  );
  lines.push(
    `ad-like elements: ${hidden ? "HIDDEN by an ad filter on this phone" : "shown normally"}`
  );
  let verdict;
  if (!script.ok || !server.ok) {
    verdict = "VERDICT: this phone cannot reach Google's ad servers. An ad blocker, private DNS (e.g. AdGuard), a VPN, or the mobile network is blocking them. Turn those off and retry.";
  } else if (hidden) {
    verdict = "VERDICT: an ad filter on this phone hides ad elements (browser protection or an ad-blocker extension). Switch it off for this site, or try another browser.";
  } else if (saveData) {
    verdict = "VERDICT: Data Saver is on and can stop ads loading. Turn it off for this site and retry.";
  } else {
    verdict = "VERDICT: nothing on this phone is blocking ads. If the units below say 'unfilled', Google is simply not returning an ad for this phone/format. Compare 'build running' with your laptop's: if it differs, the phone is on an old build.";
  }
  return { lines, verdict };
}
const ERROR_PATTERN = /adsbygoogle|tagerror|adsense|googlesyndication|pagead/i;
function snapshot(errors) {
  const out = [];
  const nav = window.navigator;
  const standalone = typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
  out.push(`host: ${window.location.hostname}`);
  out.push(`mode: ${standalone ? "installed app (standalone)" : "browser tab"}`);
  out.push(`viewport: ${window.innerWidth}x${window.innerHeight}  online: ${nav.onLine}`);
  const script = document.querySelector('script[src*="adsbygoogle.js"]');
  const queue = window.adsbygoogle;
  const loaded = !!queue && !Array.isArray(queue) && queue.loaded === true;
  out.push(`script tag: ${script ? "yes" : "NO"}   script loaded: ${loaded ? "yes" : "no"}`);
  out.push(`queue length: ${Array.isArray(queue) ? queue.length : "(processed)"}`);
  const slots = Array.from(document.querySelectorAll("ins.adsbygoogle"));
  out.push(`ad units on page: ${slots.length}`);
  slots.slice(0, 6).forEach((ins, i) => {
    const r = ins.getBoundingClientRect();
    out.push(
      `#${i + 1} slot ${ins.getAttribute("data-ad-slot")} ${ins.getAttribute("data-ad-format")} | status: ${ins.getAttribute("data-ad-status") ?? "-"} | processed: ${ins.getAttribute("data-adsbygoogle-status") ?? "no"} | ${Math.round(r.width)}x${Math.round(r.height)} | iframe: ${ins.querySelector("iframe") ? "yes" : "no"}`
    );
  });
  if (slots.length > 6) out.push(`... +${slots.length - 6} more`);
  if (errors.length) {
    out.push("AdSense errors:");
    errors.forEach((e) => out.push(`! ${e}`));
  }
  return out;
}
function AdDebugPanel() {
  const [on, setOn] = reactExports.useState(false);
  const [lines, setLines] = reactExports.useState([]);
  const errors = reactExports.useRef([]);
  const [test, setTest] = reactExports.useState(null);
  const [testing, setTesting] = reactExports.useState(false);
  const runTest = () => {
    setTesting(true);
    runAdSelfTest().then(setTest).catch(() => setTest({ lines: [], verdict: "VERDICT: the self-test itself failed to run." })).finally(() => setTesting(false));
  };
  reactExports.useEffect(() => {
    setOn(readAdDebugFlag());
  }, []);
  reactExports.useEffect(() => {
    if (on) runTest();
  }, [on]);
  reactExports.useEffect(() => {
    if (!on) return;
    const remember = (args) => {
      const text = args.map((a) => a instanceof Error ? a.message : String(a)).join(" ");
      if (ERROR_PATTERN.test(text)) {
        errors.current = [...errors.current, text.slice(0, 160)].slice(-5);
      }
    };
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = (...args) => {
      remember(args);
      originalError(...args);
    };
    console.warn = (...args) => {
      remember(args);
      originalWarn(...args);
    };
    const onWindowError = (e) => remember([e.message]);
    window.addEventListener("error", onWindowError);
    const tick = () => setLines(snapshot(errors.current));
    tick();
    const id = window.setInterval(tick, 1e3);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("error", onWindowError);
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [on]);
  if (!on) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      role: "status",
      className: "fixed inset-x-2 bottom-20 z-[9999] max-h-[45vh] overflow-auto rounded-lg bg-black/90 p-2 font-mono text-[10px] leading-snug text-green-300 shadow-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex items-center justify-between gap-2 font-sans text-[11px] font-semibold text-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "AdSense debug" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "underline",
                onClick: () => {
                  clearAdDebugFlag();
                  setOn(false);
                },
                children: "turn off"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "underline", onClick: () => setOn(false), children: "hide" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 border-b border-white/20 pb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between font-sans text-[11px] font-semibold text-white", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Phone self-test" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "underline", onClick: runTest, disabled: testing, children: testing ? "testing..." : "run again" })
          ] }),
          test?.verdict && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-1 font-sans text-[11px] text-yellow-300", children: test.verdict }),
          test?.lines.map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: /BLOCKED|HIDDEN|ON$/.test(l) ? "text-red-300" : void 0, children: l }, `t${i}`)),
          !test && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "running..." })
        ] }),
        lines.map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: l.startsWith("!") ? "text-red-300" : void 0, children: l }, i))
      ]
    }
  );
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  reactExports.useEffect(() => {
    reportAppError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$n = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#f6f3ec" },
      { name: "author", content: "InBits" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "InBits" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // Ads: open the connections to Google's ad servers up front. On a slow
      // mobile connection the DNS + TCP + TLS handshakes alone can cost
      // hundreds of ms before the first ad byte moves. (crossOrigin matches
      // the script tag below, which is loaded with crossorigin="anonymous".)
      {
        rel: "preconnect",
        href: "https://pagead2.googlesyndication.com",
        crossOrigin: "anonymous"
      },
      { rel: "preconnect", href: "https://googleads.g.doubleclick.net", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://tpc.googlesyndication.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,900&family=Inter:wght@400;500;600;700&display=swap"
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" }
    ]
    // FIX: the AdSense loader used to be listed here, which put it in
    // the initial document's <head> -- competing for bandwidth with the
    // app's own JS/CSS/feed data during the most critical first second,
    // on a page that hasn't even scrolled to an ad slot yet. It's now
    // injected client-side, after first paint, from RootComponent below
    // (see the AdSense-loading effect) instead of being part of the
    // critical request chain.
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$n.useRouteContext();
  reactExports.useEffect(() => {
    if (document.querySelector('script[src*="adsbygoogle.js"]')) return;
    const script = document.createElement("script");
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5505424042187351";
    script.async = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }, []);
  reactExports.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(InstallGateProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SavedPostsProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArticleViewerProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AdDebugPanel, {})
  ] });
}
function resolveApiBase() {
  const buildTimeBase = "http://localhost:8000";
  return buildTimeBase.replace(/\/+$/, "");
}
const API_BASE_URL = resolveApiBase();
const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");
const LIVE_DATA_FETCH_OPTS = { cache: "no-store" };
async function getJson(path, signal) {
  const res = await fetch(`${API_BASE_URL}${path}`, { ...LIVE_DATA_FETCH_OPTS, signal });
  if (!res.ok) throw new Error(`${path} failed: HTTP ${res.status}`);
  return res.json();
}
async function fetchFeed(category = "All", signal) {
  return getJson(`/api/feed?category=${encodeURIComponent(category)}`, signal);
}
async function fetchArticle(id, signal) {
  const res = await fetch(`${API_BASE_URL}/api/article/${encodeURIComponent(id)}`, {
    ...LIVE_DATA_FETCH_OPTS,
    signal
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`/api/article/${id} failed: HTTP ${res.status}`);
  return res.json();
}
async function searchArticles(query, signal) {
  return getJson(`/api/search?q=${encodeURIComponent(query)}`, signal);
}
async function fetchJobs(signal) {
  return getJson(`/api/jobs`, signal);
}
async function fetchJob(id, signal) {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(id)}`, {
    ...LIVE_DATA_FETCH_OPTS,
    signal
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`/api/jobs/${id} failed: HTTP ${res.status}`);
  return res.json();
}
function feedSocketUrl(category) {
  return `${WS_BASE_URL}/ws/feed?category=${encodeURIComponent(category)}`;
}
const LOADER_TIMEOUT_MS = 1500;
async function loadFeedForRoute(category = "All") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOADER_TIMEOUT_MS);
  try {
    const { items } = await fetchFeed(category, controller.signal);
    return items;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
const $$splitComponentImporter$l = () => import("./index-BE2VwKLf.mjs");
const Route$m = createFileRoute()({
  head: () => ({
    meta: [{
      title: "InBits"
    }, {
      name: "description",
      content: "A calm, book-readable feed of news, gossip, and jobs. Scraped from the best sources, served like a magazine."
    }, {
      property: "og:title",
      content: "InBits — News & Updates"
    }, {
      property: "og:description",
      content: "A calm, book-readable feed of news, gossip, and jobs."
    }]
  }),
  // A short, timeout-bounded loader (see lib/feedLoader.ts) — this is
  // what makes a cold visit (fresh tab, hard refresh, a shared link)
  // render real articles on the very first frame instead of the
  // skeleton, on both the server-rendered HTML and the client. It's safe
  // to have this run on every navigation now: the backend response it
  // hits is nginx-microcached (see deploy/nginx/nginx.conf) and short
  // `Cache-Control`'d, so it's cheap even under heavy traffic, and it can
  // never block the route for more than ~1.2s even if the backend is
  // completely unreachable — at which point the route still renders
  // immediately with nothing, and useLiveFeed's own REST-fallback +
  // WebSocket take over exactly as before. `staleTime`
  // means returning to Home within 30s of the last load reuses that data
  // instead of refetching, so it doesn't slow down normal in-app nav.
  loader: () => loadFeedForRoute("All"),
  staleTime: 3e4,
  component: lazyRouteComponent($$splitComponentImporter$l, "component")
});
const $$splitComponentImporter$k = () => import("./jobs-BdCzZHXm.mjs");
const Route$l = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Jobs · InBits"
    }, {
      name: "description",
      content: "Real, currently-open remote listings — fetched live, not a sample list."
    }]
  }),
  // Real remote job listings from Remotive + RemoteOK's public boards,
  // fetched during SSR so the page isn't empty on first paint. See
  // app/jobs.py.
  // Listings don't change minute-to-minute, so cache for a while instead
  // of re-fetching every time the Jobs tab is opened.
  staleTime: 5 * 60 * 1e3,
  loader: async () => {
    try {
      const {
        items
      } = await fetchJobs();
      return {
        jobs: items
      };
    } catch {
      return {
        jobs: []
      };
    }
  },
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const $$splitComponentImporter$j = () => import("./notifications-B1F0nWSm.mjs");
const Route$k = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Notifications · InBits"
    }, {
      name: "description",
      content: "New stories and job postings, as they come in."
    }]
  }),
  // There's no account/social-graph system behind this app, so rather than
  // invent fake "so-and-so followed you" activity, notifications are just
  // the real things that actually change: new live articles and new job
  // postings — both fetched live, nothing sampled.
  // A short staleTime keeps this feeling live without blocking every single
  // page visit on a fresh round-trip the way an unset (0) staleTime would.
  staleTime: 60 * 1e3,
  loader: async () => {
    const [feed, jobs] = await Promise.all([fetchFeed("All").catch(() => ({
      items: []
    })), fetchJobs().catch(() => ({
      items: []
    }))]);
    return {
      articles: feed.items.slice(0, 20),
      jobs: jobs.items.slice(0, 10)
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
const $$splitComponentImporter$i = () => import("./search-Din8wKew.mjs");
const Route$j = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Search · InBits"
    }, {
      name: "description",
      content: "Search InBits' live news feed, or browse what's live right now."
    }]
  }),
  // No loader — the default browse grid is populated client-side by
  // useLiveFeed below (same REST-fallback + WebSocket pattern as Home and
  // Updates), so opening Search is never blocked on a network round-trip.
  // Typed searches always hit the backend fresh regardless (see
  // handleSearch below).
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const BASE_URL = "";
const Route$i = createFileRoute()({
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
          { path: "/menu", priority: "0.4" }
        ];
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map(
            (e) => `  <url><loc>${BASE_URL}${e.path}</loc><changefreq>daily</changefreq><priority>${e.priority}</priority></url>`
          ),
          `</urlset>`
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" }
        });
      }
    }
  }
});
const $$splitComponentImporter$h = () => import("./stands-CWavoEsN.mjs");
const Route$h = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
const $$splitComponentImporter$g = () => import("./updates-DRerxd_A.mjs");
const Route$g = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Updates · InBits"
    }, {
      name: "description",
      content: "A reels-style vertical feed of the day's most important updates."
    }]
  }),
  // FIX: this route used to skip the loader entirely on the theory that
  // any network round-trip in the way of navigation was bad. It backfired
  // — Updates then *always* opened blank and waited on a client-only
  // fetch after mount to show anything, on every visit, not just the
  // first. Same short, timeout-bounded loader Home uses (see
  // lib/feedLoader.ts): it's cheap (nginx-microcached) and can never hold
  // the route up for more than ~300ms even if the backend is completely
  // unreachable, at which point the route still renders immediately with
  // nothing and useLiveFeed's REST-fallback + WebSocket take over exactly
  // as before.
  loader: () => loadFeedForRoute("All"),
  staleTime: 3e4,
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
function formatRelativeTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 6e4);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" });
}
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function toChannelStory(item) {
  return {
    id: item.id,
    title: item.title,
    summary: item.excerpt,
    image: item.image,
    readTime: item.readTime,
    publishedAt: formatRelativeTime(item.publishedAt),
    category: item.category,
    sourceUrl: item.sourceUrl
  };
}
function groupChannelsFromFeed(items) {
  const map = /* @__PURE__ */ new Map();
  for (const item of items) {
    const slug = slugify(item.source || "unknown");
    let ch = map.get(slug);
    if (!ch) {
      ch = {
        slug,
        name: item.source,
        description: `Latest live reporting from ${item.source}.`,
        cover: item.image,
        location: item.location,
        language: item.language,
        stories: []
      };
      map.set(slug, ch);
    }
    if (!ch.stories.some((s) => s.id === item.id)) ch.stories.push(toChannelStory(item));
  }
  return [...map.values()].sort((a, b) => b.stories.length - a.stories.length);
}
function toJournalArticle(item) {
  return {
    id: item.id,
    title: item.title,
    summary: item.excerpt,
    source: item.source,
    readTime: item.readTime,
    image: item.image,
    publishedAt: formatRelativeTime(item.publishedAt),
    sourceUrl: item.sourceUrl
  };
}
function groupJournalFromFeed(items) {
  const map = /* @__PURE__ */ new Map();
  for (const item of items) {
    const topic = item.topic || "General";
    const id = slugify(topic);
    let cat = map.get(id);
    if (!cat) {
      cat = {
        id,
        title: topic,
        description: `Live ${topic} stories, as they're scraped.`,
        cover: item.image,
        articles: []
      };
      map.set(id, cat);
    }
    if (!cat.articles.some((a) => a.id === item.id)) cat.articles.push(toJournalArticle(item));
  }
  return [...map.values()].sort((a, b) => b.articles.length - a.articles.length);
}
function diversifyBySource(items) {
  const bySource = /* @__PURE__ */ new Map();
  for (const item of items) {
    const list = bySource.get(item.source) ?? [];
    list.push(item);
    bySource.set(item.source, list);
  }
  const queues = [...bySource.values()];
  const out = [];
  let remaining = items.length;
  let i = 0;
  while (remaining > 0) {
    const queue = queues[i % queues.length];
    if (queue.length > 0) {
      out.push(queue.shift());
      remaining -= 1;
    }
    i += 1;
  }
  return out;
}
function groupShowcaseFromFeed(items, panelCount = 4, storiesPerPanel = 3) {
  const bySource = /* @__PURE__ */ new Map();
  for (const item of items) {
    const list = bySource.get(item.source) ?? [];
    list.push(item);
    bySource.set(item.source, list);
  }
  return [...bySource.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, panelCount).map(([source, list]) => ({
    id: `live-${slugify(source)}`,
    publisher: source,
    banner: "Live now",
    updated: list[0] ? formatRelativeTime(list[0].publishedAt) : "",
    stories: list.slice(0, storiesPerPanel).map((s) => ({
      id: s.id,
      kicker: s.category,
      title: s.title,
      image: s.image,
      sourceUrl: s.sourceUrl
    }))
  }));
}
const $$splitComponentImporter$f = () => import("./channel._slug-BjwPUMIL.mjs");
const $$splitNotFoundComponentImporter$1 = () => import("./channel._slug-C9pd4QOq.mjs");
const Route$f = createFileRoute()({
  // Was 60s, which meant re-fetching the entire live feed just to filter
  // one channel out of it on almost every visit. 5 minutes is still fresh
  // enough for a channel page and cuts that down a lot.
  staleTime: 5 * 60 * 1e3,
  // Grouped live from whatever's currently in the crawler's buffer —
  // there's no separate channel directory to keep in sync.
  loader: async ({
    params
  }) => {
    const {
      items
    } = await fetchFeed("All");
    const channel = groupChannelsFromFeed(items).find((c) => c.slug === params.slug);
    if (!channel) throw notFound();
    return {
      channel
    };
  },
  head: ({
    loaderData
  }) => {
    if (!loaderData) {
      return {
        meta: [{
          title: "Channel not found · InBits"
        }, {
          name: "robots",
          content: "noindex"
        }]
      };
    }
    const {
      channel
    } = loaderData;
    const description = `${channel.description} Read the latest ${channel.name} stories on InBits.`;
    return {
      meta: [{
        title: `${channel.name} · Channels · InBits`
      }, {
        name: "description",
        content: description
      }, {
        property: "og:title",
        content: `${channel.name} on InBits`
      }, {
        property: "og:description",
        content: description
      }, {
        property: "og:type",
        content: "website"
      }, {
        name: "twitter:card",
        content: "summary_large_image"
      }]
    };
  },
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$1, "notFoundComponent"),
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./job._id-DkJaRddX.mjs");
const $$splitNotFoundComponentImporter = () => import("./job._id-CmeIMfQ8.mjs");
const Route$e = createFileRoute()({
  loader: async ({
    params
  }) => {
    const job = await fetchJob(params.id).catch(() => null);
    if (!job) throw notFound();
    return {
      job
    };
  },
  head: ({
    loaderData
  }) => {
    if (!loaderData) return {
      meta: [{
        title: "Job not found · InBits"
      }]
    };
    const {
      job
    } = loaderData;
    return {
      meta: [{
        title: `${job.title} at ${job.company} · InBits Jobs`
      }, {
        name: "description",
        content: job.about
      }]
    };
  },
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent"),
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./menu.index-D6ap41M5.mjs");
const Route$d = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Menu · InBits"
    }, {
      name: "description",
      content: "Your InBits profile, saved stories, settings, and account."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./menu.about-BPq-S_HW.mjs");
const Route$c = createFileRoute()({
  head: () => ({
    meta: [{
      title: "About · InBits"
    }, {
      name: "description",
      content: "What InBits is, how it works, and who runs it."
    }, {
      property: "og:title",
      content: "About · InBits"
    }, {
      property: "og:description",
      content: "What InBits is, how it works, and who runs it."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./menu.contact--4_OVbnT.mjs");
const Route$b = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Contact · InBits"
    }, {
      name: "description",
      content: "How to reach the team behind InBits."
    }, {
      property: "og:title",
      content: "Contact · InBits"
    }, {
      property: "og:description",
      content: "How to reach the team behind InBits."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./menu.login-CrlU6bXS.mjs");
const Route$a = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Log in · InBits"
    }, {
      name: "description",
      content: "Sign in to sync your saved stories, sources and reading preferences on InBits."
    }, {
      property: "og:title",
      content: "Log in · InBits"
    }, {
      property: "og:description",
      content: "Sign in to sync your saved stories, sources and reading preferences on InBits."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./menu.notifications-DhQYJHWK.mjs");
const Route$9 = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Notification preferences · InBits"
    }, {
      name: "description",
      content: "Choose your InBits digest time, breaking alerts and channel pings."
    }, {
      property: "og:title",
      content: "Notification preferences · InBits"
    }, {
      property: "og:description",
      content: "Choose your InBits digest time, breaking alerts and channel pings."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./menu.privacy-Bs89A9Qy.mjs");
const Route$8 = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Privacy · InBits"
    }, {
      name: "description",
      content: "Control personalisation, reading history and local data stored by InBits."
    }, {
      property: "og:title",
      content: "Privacy · InBits"
    }, {
      property: "og:description",
      content: "Control personalisation, reading history and local data stored by InBits."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./menu.profile-C5quddfh.mjs");
const Route$7 = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Profile · InBits"
    }, {
      name: "description",
      content: "Edit your InBits reader profile, handle, city and reading interests."
    }, {
      property: "og:title",
      content: "Profile · InBits"
    }, {
      property: "og:description",
      content: "Edit your InBits reader profile, handle, city and reading interests."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./menu.saved-CA8_vdmE.mjs");
const Route$6 = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Saved · InBits"
    }, {
      name: "description",
      content: "Every story and job you bookmarked on InBits, ready to revisit."
    }, {
      property: "og:title",
      content: "Saved · InBits"
    }, {
      property: "og:description",
      content: "Every story and job you bookmarked on InBits, ready to revisit."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./menu.settings-5ib4suV6.mjs");
const Route$5 = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Settings · InBits"
    }, {
      name: "description",
      content: "Set theme, language, text size and data saver options for InBits."
    }, {
      property: "og:title",
      content: "Settings · InBits"
    }, {
      property: "og:description",
      content: "Set theme, language, text size and data saver options for InBits."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./menu.sources-WsKIQCx-.mjs");
const Route$4 = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Sources · InBits"
    }, {
      name: "description",
      content: "Follow or mute the publishers that feed your InBits reading list."
    }, {
      property: "og:title",
      content: "Sources · InBits"
    }, {
      property: "og:description",
      content: "Follow or mute the publishers that feed your InBits reading list."
    }]
  }),
  // Same live buffer everything else reads from — the publisher list here
  // is exactly whoever's actually been crawled recently, not a fixed roster.
  // Cached so opening Sources repeatedly doesn't re-fetch every time.
  staleTime: Infinity,
  loader: async () => {
    try {
      const {
        items
      } = await fetchFeed("All");
      return {
        channels: groupChannelsFromFeed(items)
      };
    } catch {
      return {
        channels: []
      };
    }
  },
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./menu.terms-Flqy5oYZ.mjs");
const Route$3 = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Terms of Service · InBits"
    }, {
      name: "description",
      content: "The terms that govern use of InBits."
    }, {
      property: "og:title",
      content: "Terms of Service · InBits"
    }, {
      property: "og:description",
      content: "The terms that govern use of InBits."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./post._id-9AtzOfBp.mjs");
const Route$2 = createFileRoute()({
  head: () => ({
    meta: [{
      title: "Story · InBits"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./stands.index-Mi1yYkF9.mjs");
const Route$1 = createFileRoute()({
  validateSearch: (search) => ({
    tab: search.tab === "journal" || search.tab === "channels" || search.tab === "stands" ? search.tab : void 0,
    cat: typeof search.cat === "string" ? search.cat : void 0
  }),
  head: () => ({
    meta: [{
      title: "Stands · InBits"
    }, {
      name: "description",
      content: "Video and audio stands — podcasts, shorts and playlists from across the web."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./stands.showcase-d-U5xuoK.mjs");
const Route = createFileRoute()({
  head: () => ({
    meta: [{
      title: "News Showcase · InBits"
    }, {
      name: "description",
      content: "Every publisher's top stories, grouped live from the current crawl."
    }]
  }),
  // Same live buffer the Stands tab and Home's rail use — grouped by
  // publisher client-side, not a separate curated mock set.
  // staleTime: Infinity means re-opening this page (e.g. Stands -> Showcase
  // -> back -> Showcase) reuses what's already loaded instead of blocking
  // the navigation on a fresh network round-trip every time.
  staleTime: Infinity,
  loader: async () => {
    try {
      const {
        items
      } = await fetchFeed("All");
      return {
        showcase: groupShowcaseFromFeed(items, 12, 5)
      };
    } catch {
      return {
        showcase: []
      };
    }
  },
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const IndexRoute = Route$m.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$n
});
const JobsRoute = Route$l.update({
  id: "/jobs",
  path: "/jobs",
  getParentRoute: () => Route$n
});
const NotificationsRoute = Route$k.update({
  id: "/notifications",
  path: "/notifications",
  getParentRoute: () => Route$n
});
const SearchRoute = Route$j.update({
  id: "/search",
  path: "/search",
  getParentRoute: () => Route$n
});
const SitemapDotxmlRoute = Route$i.update({
  id: "/sitemap.xml",
  path: "/sitemap.xml",
  getParentRoute: () => Route$n
});
const StandsRoute = Route$h.update({
  id: "/stands",
  path: "/stands",
  getParentRoute: () => Route$n
});
const UpdatesRoute = Route$g.update({
  id: "/updates",
  path: "/updates",
  getParentRoute: () => Route$n
});
const ChannelSlugRoute = Route$f.update({
  id: "/channel/$slug",
  path: "/channel/$slug",
  getParentRoute: () => Route$n
});
const JobIdRoute = Route$e.update({
  id: "/job/$id",
  path: "/job/$id",
  getParentRoute: () => Route$n
});
const MenuIndexRoute = Route$d.update({
  id: "/menu/",
  path: "/menu/",
  getParentRoute: () => Route$n
});
const MenuAboutRoute = Route$c.update({
  id: "/menu/about",
  path: "/menu/about",
  getParentRoute: () => Route$n
});
const MenuContactRoute = Route$b.update({
  id: "/menu/contact",
  path: "/menu/contact",
  getParentRoute: () => Route$n
});
const MenuLoginRoute = Route$a.update({
  id: "/menu/login",
  path: "/menu/login",
  getParentRoute: () => Route$n
});
const MenuNotificationsRoute = Route$9.update({
  id: "/menu/notifications",
  path: "/menu/notifications",
  getParentRoute: () => Route$n
});
const MenuPrivacyRoute = Route$8.update({
  id: "/menu/privacy",
  path: "/menu/privacy",
  getParentRoute: () => Route$n
});
const MenuProfileRoute = Route$7.update({
  id: "/menu/profile",
  path: "/menu/profile",
  getParentRoute: () => Route$n
});
const MenuSavedRoute = Route$6.update({
  id: "/menu/saved",
  path: "/menu/saved",
  getParentRoute: () => Route$n
});
const MenuSettingsRoute = Route$5.update({
  id: "/menu/settings",
  path: "/menu/settings",
  getParentRoute: () => Route$n
});
const MenuSourcesRoute = Route$4.update({
  id: "/menu/sources",
  path: "/menu/sources",
  getParentRoute: () => Route$n
});
const MenuTermsRoute = Route$3.update({
  id: "/menu/terms",
  path: "/menu/terms",
  getParentRoute: () => Route$n
});
const PostIdRoute = Route$2.update({
  id: "/post/$id",
  path: "/post/$id",
  getParentRoute: () => Route$n
});
const StandsIndexRoute = Route$1.update({
  id: "/",
  path: "/",
  getParentRoute: () => StandsRoute
});
const StandsShowcaseRoute = Route.update({
  id: "/showcase",
  path: "/showcase",
  getParentRoute: () => StandsRoute
});
const StandsRouteChildren = {
  StandsShowcaseRoute,
  StandsIndexRoute
};
const StandsRouteWithChildren = StandsRoute._addFileChildren(StandsRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  JobsRoute,
  NotificationsRoute,
  SearchRoute,
  SitemapDotxmlRoute,
  StandsRoute: StandsRouteWithChildren,
  UpdatesRoute,
  ChannelSlugRoute,
  JobIdRoute,
  MenuAboutRoute,
  MenuContactRoute,
  MenuLoginRoute,
  MenuNotificationsRoute,
  MenuPrivacyRoute,
  MenuProfileRoute,
  MenuSavedRoute,
  MenuSettingsRoute,
  MenuSourcesRoute,
  MenuTermsRoute,
  PostIdRoute,
  MenuIndexRoute
};
const routeTree = Route$n._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    // FIX: was `true`. The router's own scroll restoration and this
    // app's manual "remember where you were" logic (see routes/index.tsx
    // and routes/updates.tsx) were both trying to control scroll
    // position after a Back navigation. React commits child layout
    // effects (the page's own restore) before this router-level one, so
    // the router's restore always ran last and silently overwrote the
    // correct position back to the top -- which is exactly why Back from
    // an article always landed on the first post instead of the one you
    // were reading. Turning this off leaves scroll restoration entirely
    // to the manual logic, which is the only thing that actually knows
    // about this app's cached/reordered feeds.
    scrollRestoration: false,
    // Start fetching a route's data on hover/touchstart, before the
    // click/tap even lands — combined with each route's own staleTime,
    // this means most navigations (tapping a story, going back to Home)
    // resolve with already-warm data instead of waiting on a fetch that
    // only starts once the click land.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$1 as A,
  feedSocketUrl as B,
  Route as C,
  API_BASE_URL as D,
  router as E,
  Route$m as R,
  useSavedPosts as a,
  groupJournalFromFeed as b,
  consumeFeedReturnIntent as c,
  groupChannelsFromFeed as d,
  Route$l as e,
  fetchJobs as f,
  groupShowcaseFromFeed as g,
  useToggleSet as h,
  Route$k as i,
  Route$g as j,
  diversifyBySource as k,
  usePref as l,
  Route$f as m,
  Route$e as n,
  fetchArticle as o,
  fetchJob as p,
  Route$4 as q,
  readAdDebugFlag as r,
  searchArticles as s,
  Route$2 as t,
  useArticleViewer as u,
  getArticle as v,
  fetchFeed as w,
  setArticle as x,
  articleCache as y,
  formatRelativeTime as z
};
