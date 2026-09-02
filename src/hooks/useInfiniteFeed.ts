import { useRef, useState, useEffect } from "react";

/** Appends more feed pages when the sentinel scrolls into view. */
export function useInfiniteFeed<T>(items: T[], pageSize = items.length) {
  const [pages, setPages] = useState(1);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setPages((p) => (p < 20 ? p + 1 : p));
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const feed = Array.from({ length: pages }).flatMap((_, p) =>
    items.slice(0, pageSize).map((item, i) => ({ item, key: `${p}-${i}`, index: p * pageSize + i })),
  );

  return { feed, sentinel };
}
