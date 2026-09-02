import { useSyncExternalStore } from "react";

// Shared mute state for the Home feed's background-music previews —
// mirrors how Instagram's mute toggle is one global switch that every
// post's audio obeys, not a per-post setting. A tiny external store (not
// component state) so the single mute button in the Home header and every
// PostCard's <audio> stay in sync instantly, with no prop-drilling through
// the rails/sidebar components sitting between them.

const STORAGE_KEY = "inbits:home.muted";
const listeners = new Set<() => void>();

function readInitial(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Muted by default, same as Instagram/Reels — sound is opt-in.
    return raw == null ? true : (JSON.parse(raw) as boolean);
  } catch {
    return true;
  }
}

let muted = readInitial();

function emit() {
  listeners.forEach((l) => l());
}

export function getHomeMuted(): boolean {
  return muted;
}

export function setHomeMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  emit();
}

export function toggleHomeMuted(): void {
  setHomeMuted(!muted);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Every PostCard (and the header mute button) call this so they all
 * re-render together the instant the mute state changes anywhere. */
export function useHomeMuted(): boolean {
  return useSyncExternalStore(subscribe, getHomeMuted, () => true);
}
