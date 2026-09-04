import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // FIX: was `true`. The router's own scroll restoration and this
    // app's manual "remember where you were" logic (see routes/index.tsx
    // and routes/updates.tsx) were both trying to control scroll
    // position after a Back navigation. React commits child layout
    // effects (the page's own restore) before this router-level one, so
    // the router's restore always ran last and silently overwrote the
    // correct position back to the top -- which is exactly why Back from
    // an article always landed on the first post instead of the one you
    // were reading. Turning this off leaves scroll restoration entirely
    // to the manual logic, which is the only thing that actually knows
    // about this app's cached/reordered feeds.
    scrollRestoration: false,
    // Start fetching a route's data on hover/touchstart, before the
    // click/tap even lands — combined with each route's own staleTime,
    // this means most navigations (tapping a story, going back to Home)
    // resolve with already-warm data instead of waiting on a fetch that
    // only starts once the click land.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};