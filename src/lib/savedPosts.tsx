import { createContext, useContext, type ReactNode } from "react";
import { useToggleSet } from "@/hooks/usePrefs";
import { useInstallGate } from "@/lib/installGate";

type SavedPostsContextValue = {
  has: (id: string) => boolean;
  toggleSave: (id: string) => void;
  savedIds: string[];
};

const SavedPostsContext = createContext<SavedPostsContextValue | null>(null);

/** Wraps the app once (see __root.tsx, inside <InstallGateProvider>).
 * Centralizing this means every Save button — Home feed, Reels, the
 * article page — shares the same localStorage-backed list and the same
 * "install first" gate on saving. */
export function SavedPostsProvider({ children }: { children: ReactNode }) {
  const { list, has, toggle } = useToggleSet("savedPosts");
  const { requireInstall } = useInstallGate();

  const toggleSave = (id: string) => {
    const wasSaved = has(id);
    // Saving (not un-saving) a story is gated on InBits actually being
    // installed — a save made in a plain browser tab lives only in that
    // browser's local storage, so it doesn't happen until installing is
    // done. Un-saving never needs to install anything.
    if (!wasSaved) {
      requireInstall(() => toggle(id));
      return;
    }
    toggle(id);
  };

  return (
    <SavedPostsContext.Provider value={{ has, toggleSave, savedIds: list }}>
      {children}
    </SavedPostsContext.Provider>
  );
}

export function useSavedPosts() {
  const ctx = useContext(SavedPostsContext);
  if (!ctx) throw new Error("useSavedPosts must be used within <SavedPostsProvider>");
  return ctx;
}
