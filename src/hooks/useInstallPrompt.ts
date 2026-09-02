import { useSyncExternalStore } from "react";
import { installPromptStore } from "@/lib/installPromptStore";

/** Wraps the browser's native "Add to Home Screen" prompt. `canPrompt` is
 * only true on browsers that support it and haven't already installed the
 * app (mainly Chromium); everywhere else callers should fall back to
 * manual instructions. `installed` is best-effort — see
 * installPromptStore.ts for what it can and can't guarantee.
 *
 * Reads from `installPromptStore` — a module-level singleton imported at
 * app root — rather than attaching its own `beforeinstallprompt` listener
 * here. That event fires once, early in the page's life, and this hook's
 * component may not mount until well after that (e.g. it only renders
 * inside a modal that opens on demand). Reading a shared store means a
 * component that mounts late still sees an event captured before it
 * existed, instead of missing it. */
export function useInstallPrompt() {
  const canPrompt = useSyncExternalStore(
    installPromptStore.subscribe,
    installPromptStore.getCanPrompt,
    () => false,
  );
  const installed = useSyncExternalStore(
    installPromptStore.subscribe,
    installPromptStore.getInstalled,
    () => false,
  );

  const promptInstall = () => installPromptStore.prompt();
  const openInstalledApp = () => installPromptStore.openInstalledApp();

  return { canPrompt, installed, promptInstall, openInstalledApp };
}