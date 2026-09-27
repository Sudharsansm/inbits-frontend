import { useCallback, useSyncExternalStore } from "react";

// Tiny localStorage-backed preference store used across the app (Menu
// screens, the language picker, saved posts, interests, etc).
//
// Every `usePref(key, ...)` call for the same key needs to see the same
// value at the same time. A plain per-component `useState` seeded from
// localStorage on mount can't do that: e.g. changing the language in
// Settings would update localStorage, but a PostCard already mounted on
// Home would keep its own stale in-memory copy and never re-render — the
// feed would silently stay in English until a full reload. The shared
// cache + listener map below fix that by re-rendering every subscribed
// component whenever any of them calls `update()`.

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();
const cache = new Map<string, unknown>();

function storageKey(key: string) {
  return `inbits:${key}`;
}

function readFromStorage<T>(key: string, initial: T): T {
  if (typeof window === "undefined") return initial;
  if (cache.has(key)) return cache.get(key) as T;
  let value = initial;
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (raw != null) value = JSON.parse(raw) as T;
  } catch {
    /* ignore malformed/inaccessible storage, fall back to initial */
  }
  cache.set(key, value);
  return value;
}

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

// Keep multiple tabs/windows in sync too — `storage` only fires in other
// tabs, which pairs nicely with the in-tab `notify()` above.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (!event.key || !event.key.startsWith("inbits:")) return;
    const key = event.key.slice("inbits:".length);
    cache.delete(key);
    notify(key);
  });
}

export function usePref<T>(key: string, initial: T) {
  const subscribe = useCallback(
    (onStoreChange: Listener) => {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(onStoreChange);
      return () => {
        set!.delete(onStoreChange);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(() => readFromStorage(key, initial), [key, initial]);
  const getServerSnapshot = useCallback(() => initial, [initial]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback(
    (next: T) => {
      cache.set(key, next);
      try {
        localStorage.setItem(storageKey(key), JSON.stringify(next));
      } catch {
        /* ignore */
      }
      notify(key);
    },
    [key],
  );

  return [value, update] as const;
}

export function useToggleSet(key: string, initial: string[] = []) {
  const [list, setList] = usePref<string[]>(key, initial);
  const has = (id: string) => list.includes(id);
  const toggle = (id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  return { list, has, toggle };
}