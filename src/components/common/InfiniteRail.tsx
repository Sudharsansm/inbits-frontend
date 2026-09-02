import { useCallback, useRef, useState, type ReactNode } from "react";

/**
 * Horizontal rail that keeps appending copies of `items` as the user
 * scrolls right, giving an endless suggestion strip.
 */
export function InfiniteRail<T>({
  items,
  renderItem,
  className = "",
}: {
  items: T[];
  renderItem: (item: T, key: string) => ReactNode;
  className?: string;
}) {
  const [cycles, setCycles] = useState(2);
  const ref = useRef<HTMLDivElement>(null);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 240) {
      setCycles((c) => (c < 12 ? c + 1 : c));
    }
  }, []);

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className={`scrollbar-none flex overflow-x-auto ${className}`}
    >
      {Array.from({ length: cycles }).flatMap((_, c) =>
        items.map((item, i) => renderItem(item, `${c}-${i}`)),
      )}
    </div>
  );
}
