import { useCallback, useEffect, useState } from "react";

// Tiny localStorage-backed preference store used by the Menu screens.
export function usePref<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`inbits:${key}`);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(`inbits:${key}`, JSON.stringify(next));
      } catch {
        /* ignore */
      }
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
