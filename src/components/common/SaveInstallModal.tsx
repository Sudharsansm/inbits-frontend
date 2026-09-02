import { useState } from "react";
import { ExternalLink, Bookmark, Download, Sparkles, X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

const COPY = {
  save: {
    icon: Bookmark,
    title: "Install to save this story",
    body: "Saved stories live only in this browser's storage — clearing your browser data or switching devices loses them. Install InBits as an app first, and this story (and every one after it) stays saved on your home screen for good.",
  },
  open: {
    icon: Sparkles,
    title: "Install InBits",
    body: "You're viewing InBits in a browser tab. Install it as an app for a faster, full-screen experience — and so saved stories stick around instead of living in browser storage that can get cleared.",
  },
} as const;

const INSTALLED_COPY = {
  save: {
    icon: Bookmark,
    title: "Open InBits to save this story",
    body: "InBits is already installed on this device. Switch to the app to save this story so it sticks around for good.",
  },
  open: {
    icon: ExternalLink,
    title: "InBits is already installed",
    body: "You're viewing this in a browser tab. Switch over to the installed app for the faster, full-screen experience.",
  },
} as const;

/**
 * Gate shown whenever InBits wants someone to install before continuing —
 * either because they just tried to save a story (`variant="save"`) or
 * because they opened the site in a plain browser tab (`variant="open"`).
 * `onInstall` fires only once the native install prompt is actually
 * accepted — that's the caller's signal to run whatever was waiting on
 * it (e.g. complete a pending save). `onDismiss` fires for "Not now",
 * the close button, or the backdrop: nothing that was pending goes
 * through — installing isn't optional for the action it was guarding.
 *
 * Only two button states exist here on purpose: "Install app" (hands off
 * straight to the browser's own native install dialog) and "Open app"
 * (already installed — switch over to it). There is no manual-instructions
 * fallback: on browsers with no native prompt available, tapping "Install
 * app" simply has nothing to trigger.
 */
export function SaveInstallModal({
  variant,
  onInstall,
  onDismiss,
}: {
  variant: "save" | "open";
  onInstall: () => void;
  onDismiss: () => void;
}) {
  const { installed, promptInstall, openInstalledApp } = useInstallPrompt();
  // True from the moment "Install app" is clicked until the browser's own
  // native dialog resolves. We hide our card for the whole span (see the
  // early return below) so the person only ever sees one "Install" ask on
  // screen — the browser's — instead of ours sitting behind/alongside it
  // repeating the same word. We stay mounted purely so we can react once
  // the browser tells us what the person chose.
  const [awaitingBrowserPrompt, setAwaitingBrowserPrompt] = useState(false);
  const { icon: Icon, title, body } = installed ? INSTALLED_COPY[variant] : COPY[variant];

  // TEMP DEBUG — remove once the popup's behavior is confirmed correct.
  console.log("[SaveInstallModal] rendered with installed =", installed);

  const handlePrimaryAction = async () => {
    console.log("[SaveInstallModal] button clicked, installed =", installed); // TEMP DEBUG
    // Already installed on this device (best-effort — see
    // installPromptStore.ts) but this tab isn't the standalone window
    // itself. Nothing left to install, so the button's job changes to
    // switching over to the installed app instead.
    if (installed) {
      console.log("[SaveInstallModal] calling openInstalledApp()"); // TEMP DEBUG
      openInstalledApp();
      onInstall();
      return;
    }

    // Get our own card out of the way first, then hand off straight to
    // the browser's native dialog — one click, one prompt, no "Install"
    // from us followed by "Install" from the browser.
    console.log("[SaveInstallModal] calling promptInstall()"); // TEMP DEBUG
    setAwaitingBrowserPrompt(true);
    try {
      const accepted = await promptInstall();
      console.log("[SaveInstallModal] promptInstall() returned", accepted); // TEMP DEBUG
      if (accepted) {
        onInstall();
        return;
      }
      // Either the person said no in the browser's own dialog, or this
      // browser has no native install prompt to show at all — either
      // way there's nothing left to do here, so just close.
      onDismiss();
    } finally {
      setAwaitingBrowserPrompt(false);
    }
  };

  if (awaitingBrowserPrompt) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <button
            onClick={onDismiss}
            aria-label="Close"
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="serif mt-3 text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 rounded-full border border-border py-2.5 text-sm font-semibold text-muted-foreground"
          >
            Not now
          </button>
          <button
            onClick={handlePrimaryAction}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {installed ? (
              <>
                <ExternalLink className="h-4 w-4" /> Open app
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Install app
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}