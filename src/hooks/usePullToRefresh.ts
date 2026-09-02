import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

const TRIGGER_DISTANCE = 70;
const MAX_PULL = 110;

/**
 * Standard mobile "swipe down at the top to refresh" gesture — the same
 * interaction Instagram/Twitter/etc use to bring in new content on
 * request instead of auto-injecting it while you're scrolling. Attach
 * `bind` to the scrollable element (or omit `scrollRef` to bind to the
 * window, for pages that scroll at the document level).
 */
export function usePullToRefresh({
  onRefresh,
  scrollRef,
  disabled = false,
}: {
  onRefresh: () => void | Promise<void>;
  scrollRef?: RefObject<HTMLElement | null>;
  disabled?: boolean;
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

  useEffect(() => {
    if (disabled || typeof window === "undefined") return;
    const target: HTMLElement | Window = scrollRef?.current ?? window;

    const atTop = () => {
      if (scrollRef?.current) return scrollRef.current.scrollTop <= 0;
      return window.scrollY <= 0;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!atTop() || refreshing) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        setPullDistance(0);
        return;
      }
      if (!atTop()) {
        pulling.current = false;
        setPullDistance(0);
        return;
      }
      // Only take over the gesture once it's clearly a downward pull, so
      // normal scrolling isn't hijacked.
      if (delta > 4) e.preventDefault();
      setPullDistance(Math.min(delta * 0.55, MAX_PULL));
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      startY.current = null;
      if (pullDistance >= TRIGGER_DISTANCE) {
        setRefreshing(true);
        Promise.resolve(onRefresh()).finally(() => {
          setRefreshing(false);
          setPullDistance(0);
        });
      } else {
        setPullDistance(0);
      }
    };

    target.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
    target.addEventListener("touchmove", onTouchMove as EventListener, { passive: false });
    target.addEventListener("touchend", onTouchEnd as EventListener, { passive: true });
    return () => {
      target.removeEventListener("touchstart", onTouchStart as EventListener);
      target.removeEventListener("touchmove", onTouchMove as EventListener);
      target.removeEventListener("touchend", onTouchEnd as EventListener);
    };
  }, [disabled, onRefresh, scrollRef, refreshing, pullDistance]);

  return { pullDistance, refreshing, triggerDistance: TRIGGER_DISTANCE };
}
