import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MenuPage } from "@/components/menu/MenuPage";
import { usePref } from "@/hooks/usePrefs";

export const Route = createFileRoute("/menu/login")({
  head: () => ({
    meta: [
      { title: "Log in · InBits" },
      { name: "description", content: "Sign in to sync your saved stories, sources and reading preferences on InBits." },
      { property: "og:title", content: "Log in · InBits" },
      { property: "og:description", content: "Sign in to sync your saved stories, sources and reading preferences on InBits." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [signedIn, setSignedIn] = usePref("account.email", "");

  if (signedIn) {
    return (
      <MenuPage title="Account" subtitle={signedIn}>
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm">You're signed in as <span className="font-semibold">{signedIn}</span>.</p>
          <button
            onClick={() => setSignedIn("")}
            className="mt-4 w-full rounded-2xl border border-border py-3 text-sm font-semibold text-primary"
          >
            Log out
          </button>
          <Link to="/" className="mt-3 inline-block text-xs text-muted-foreground underline">
            Back to the feed
          </Link>
        </div>
      </MenuPage>
    );
  }

  return (
    <MenuPage title={mode === "login" ? "Log in" : "Create account"} subtitle="Sync saves across devices">
      <div className="mb-3 flex rounded-full border border-border bg-card p-1 text-xs font-semibold">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full py-2 ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.includes("@")) setSignedIn(email);
        }}
        className="space-y-3 rounded-2xl border border-border bg-card p-4"
      >
        <label className="block text-xs font-semibold text-muted-foreground">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold text-muted-foreground">
          Password
          <input
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm"
          />
        </label>
        <button type="submit" className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground">
          {mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Demo mode: your session is remembered locally on this device only.
      </p>
    </MenuPage>
  );
}
