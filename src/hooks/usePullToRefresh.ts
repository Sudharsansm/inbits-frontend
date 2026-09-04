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
  // FIX: onTouchEnd used to read `pullDistance`/`refreshing` from state,
  // which meant this whole effect had to list them as dependencies —
  // and since `setPullDistance` fires on every single touchmove pixel,
  // that tore the listeners down and re-attached them dozens of times
  // per gesture. Removing/re-adding a `{ passive: false }` touchmove
  // listener mid-drag is exactly the kind of thing that makes a pull
  // gesture feel broken or get randomly swallowed on a real phone
  // (worse inside an installed/standalone PWA, where there's no browser
  // chrome to fall back on if the gesture drops). Mirroring the same
  // values into refs lets onTouchEnd/onTouchMove read the current value
  // without the effect ever needing to re-run mid-gesture — it now binds
  // its listeners exactly once per mount.
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const setPullDistanceTracked = (value: number) => {
    pullDistanceRef.current = value;
    setPullDistance(value);
  };

  useEffect(() => {
    if (disabled || typeof window === "undefined") return;
    const target: HTMLElement | Window = scrollRef?.current ?? window;

    const atTop = () => {
      if (scrollRef?.current) return scrollRef.current.scrollTop <= 0;
      return window.scrollY <= 0;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!atTop() || refreshingRef.current) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        setPullDistanceTracked(0);
        return;
      }
      if (!atTop()) {
        pulling.current = false;
        setPullDistanceTracked(0);
        return;
      }
      // Only take over the gesture once it's clearly a downward pull, so
      // normal scrolling isn't hijacked.
      if (delta > 4) e.preventDefault();
      setPullDistanceTracked(Math.min(delta * 0.55, MAX_PULL));
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      startY.current = null;
      if (pullDistanceRef.current >= TRIGGER_DISTANCE) {
        refreshingRef.current = true;
        setRefreshing(true);
        Promise.resolve(onRefresh()).finally(() => {
          refreshingRef.current = false;
          setRefreshing(false);
          setPullDistanceTracked(0);
        });
      } else {
        setPullDistanceTracked(0);
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
    // FIX: deliberately NOT depending on `pullDistance`/`refreshing` — see
    // the refs above. `onRefresh` itself can still legitimately change
    // (e.g. a new `category`), so it stays as the one real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, onRefresh, scrollRef]);

  return { pullDistance, refreshing, triggerDistance: TRIGGER_DISTANCE };
}