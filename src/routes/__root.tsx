import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import logoMarkUrl from "../assets/logo-mark.svg?url";
import { reportAppError } from "../lib/error-reporting";
import { SavedPostsProvider } from "../lib/savedPosts";
import { InstallGateProvider } from "../lib/installGate";
import { ArticleViewerProvider } from "../lib/articleViewer";
// Side-effect only: attaches the beforeinstallprompt listener as soon as
// this module loads, not only once the install modal happens to mount.
// See installPromptStore.ts for why that timing matters.
import "../lib/installPromptStore";

// Minimum time the splash stays fully visible, and how long its fade-out
// transition runs, in milliseconds. Kept short so it reads as a branded
// flash on cold start rather than something the user has to wait through.
const SPLASH_MIN_VISIBLE_MS = 550;
const SPLASH_FADE_MS = 400;

function SplashScreen({ visible }: { visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background transition-opacity ease-out ${
        visible ? "opacity-100 duration-150" : "pointer-events-none opacity-0"
      }`}
      style={{ transitionDuration: visible ? undefined : `${SPLASH_FADE_MS}ms` }}
    >
      <img src={logoMarkUrl} alt="InBits" className="h-14 w-auto animate-pulse sm:h-16" />
      <span className="font-serif text-base font-semibold tracking-tight text-foreground sm:text-lg">
        InBits
      </span>
      <span className="sr-only">Loading InBits…</span>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportAppError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#f6f3ec" },
      { name: "author", content: "InBits" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "InBits" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,900&family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashMounted, setSplashMounted] = useState(true);

  useEffect(() => {
    // Registers the PWA service worker (public/sw.js) so the app is
    // installable and usable offline. No-op on browsers without support.
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }, []);

  useEffect(() => {
    // The splash is server-rendered so it's the very first thing painted on
    // cold start (including when launched standalone from a home screen).
    // Hold it for a minimum beat, then fade it out.
    const hideTimer = window.setTimeout(() => setSplashVisible(false), SPLASH_MIN_VISIBLE_MS);
    return () => window.clearTimeout(hideTimer);
  }, []);

  useEffect(() => {
    if (splashVisible) return;
    const unmountTimer = window.setTimeout(() => setSplashMounted(false), SPLASH_FADE_MS);
    return () => window.clearTimeout(unmountTimer);
  }, [splashVisible]);

  return (
    <QueryClientProvider client={queryClient}>
      <InstallGateProvider>
        <SavedPostsProvider>
          <ArticleViewerProvider>
            {splashMounted && <SplashScreen visible={splashVisible} />}
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </ArticleViewerProvider>
        </SavedPostsProvider>
      </InstallGateProvider>
    </QueryClientProvider>
  );
}