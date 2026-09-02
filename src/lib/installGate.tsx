import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { SaveInstallModal } from "@/components/common/SaveInstallModal";

/** True when this page is already running as the installed app —
 * standalone display mode on Android/desktop, or the iOS-specific
 * `navigator.standalone` flag on Safari, which doesn't support the
 * standalone media query. Once true, there is nothing left to gate: the
 * whole point of the install prompt was getting here. */
function isRunningInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const standaloneMediaQuery =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standaloneMediaQuery || iosStandalone;
}

const SESSION_NUDGE_KEY = "inbits:installPrompt.shownThisSession";

type InstallGateContextValue = {
  /** Runs `proceed` immediately if InBits is already installed. Otherwise
   * shows the install modal and holds `proceed` until the app is actually
   * installed — dismissing the modal drops it, so the action it was
   * guarding (e.g. saving a story) never happens without installing
   * first. */
  requireInstall: (proceed: () => void) => void;
};

const InstallGateContext = createContext<InstallGateContextValue | null>(null);

export function InstallGateProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(isRunningInstalled);
  const [open, setOpen] = useState(false);
  // What to run once installing actually completes — null when the modal
  // is just the "you opened this in a browser tab" nudge with nothing
  // waiting on it.
  const pendingAction = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (installed || typeof window === "undefined") return;
    const onInstalled = () => {
      setInstalled(true);
      setOpen(false);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, [installed]);

  // Nudge to install the moment someone opens InBits in a regular browser
  // tab rather than the installed app — once per browsing session (a
  // sessionStorage flag, not the `savedPosts.seenInstallHint` pref), so a
  // fresh visit is greeted but normal in-app navigation isn't interrupted
  // again and again.
  useEffect(() => {
    if (installed || typeof window === "undefined") return;
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SESSION_NUDGE_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (alreadyShown) return;
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_NUDGE_KEY, "1");
      } catch {
        /* ignore */
      }
      pendingAction.current = null;
      setOpen(true);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [installed]);

  const requireInstall = (proceed: () => void) => {
    if (installed) {
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
    // Closing without installing drops whatever action was waiting
    // (e.g. a save) — it does not go through. The open-triggered nudge
    // has nothing pending, so this is just a close for that case.
    setOpen(false);
    pendingAction.current = null;
  };

  return (
    <InstallGateContext.Provider value={{ requireInstall }}>
      {children}
      {open && (
        <SaveInstallModal
          variant={pendingAction.current ? "save" : "open"}
          onInstall={handleInstalled}
          onDismiss={handleDismiss}
        />
      )}
    </InstallGateContext.Provider>
  );
}

export function useInstallGate() {
  const ctx = useContext(InstallGateContext);
  if (!ctx) throw new Error("useInstallGate must be used within <InstallGateProvider>");
  return ctx;
}
