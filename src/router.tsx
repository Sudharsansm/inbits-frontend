import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { RoutePendingSkeleton } from "./components/layout/RoutePendingSkeleton";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Start fetching a route's data on hover/touchstart, before the
    // click/tap even lands — combined with each route's own staleTime,
    // this means most navigations (tapping a story, going back to Home)
    // resolve with already-warm data instead of waiting on a fetch that
    // only starts once the click land.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    // "Frontend first, backend after": on a genuinely first-time
    // navigation (nothing preloaded/cached yet), show the app frame
    // immediately instead of leaving the screen blank/frozen while the
    // loader's network call is still in flight. Defaults were 1000ms/
    // 500ms, which is long enough on a slower connection that switching
    // pages felt stuck; showing the shell fast (and only holding it for a
    // beat so it doesn't flash) reads as instant.
    defaultPendingComponent: RoutePendingSkeleton,
    defaultPendingMs: 150,
    defaultPendingMinMs: 120,
  });

  return router;
};
