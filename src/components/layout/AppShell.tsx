import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export function AppShell({
  children,
  title,
  aside,
  fullWidth,
  headerAction,
}: {
  children: ReactNode;
  title?: string;
  aside?: ReactNode;
  fullWidth?: boolean;
  /** Optional control shown in the mobile header's action row and next
   * to the desktop title bar — e.g. Home's mute/unmute toggle. */
  headerAction?: ReactNode;
}) {
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname === to || (to !== "/" && pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background paper-grain">
      {/* Instagram-style layout: bottom nav on mobile, icon rail on tablet, full sidebar on desktop */}
      <Sidebar isActive={isActive} />

      <div className="md:pl-[72px] xl:pl-[245px] lg:pr-[320px]">
        {/* Instagram-style: centered feed column + optional right suggestion column */}
        <div
          className={`mx-auto flex w-full justify-center ${fullWidth ? "" : aside ? "" : "max-w-[440px] md:max-w-[600px] lg:max-w-[630px]"}`}
        >
          <div
            className={`flex min-h-screen w-full flex-col bg-paper text-ink shadow-[0_0_60px_-20px_rgba(0,0,0,0.25)] md:shadow-none ${fullWidth ? "" : aside ? "mx-auto w-full max-w-[440px] md:max-w-[470px]" : ""}`}
          >
            {/* Top nav — hidden on md+ where the sidebar takes over */}
            <MobileHeader title={title} action={headerAction} />

            {(title || headerAction) && (
              <div className="hidden items-center justify-between border-b border-border px-4 py-3 md:flex">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {title}
                </span>
                {headerAction}
              </div>
            )}

            <main className="flex-1 pb-24 md:pb-10">{children}</main>
          </div>
        </div>

        {aside && (
          <aside className="fixed right-0 top-0 z-30 hidden h-screen w-[320px] overflow-y-auto border-l border-border bg-paper py-8 pl-6 pr-4 scrollbar-none lg:block">
            {aside}
          </aside>
        )}
      </div>

      {/* Bottom nav — mobile only */}
      <MobileBottomNav isActive={isActive} />
    </div>
  );
}
