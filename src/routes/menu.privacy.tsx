import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, MenuPage, Row, Switch } from "@/components/menu/MenuPage";
import { usePref } from "@/hooks/usePrefs";

export const Route = createFileRoute("/menu/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy · InBits" },
      { name: "description", content: "Control personalisation, reading history and local data stored by InBits." },
      { property: "og:title", content: "Privacy · InBits" },
      { property: "og:description", content: "Control personalisation, reading history and local data stored by InBits." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const [personalise, setPersonalise] = usePref("privacy.personalise", true);
  const [history, setHistory] = usePref("privacy.history", true);
  const [analytics, setAnalytics] = usePref("privacy.analytics", false);
  const [cleared, setCleared] = useState(false);

  const clearAll = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("inbits:"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    setCleared(true);
  };

  return (
    <MenuPage title="Privacy" subtitle="No trackers. Everything stays on this device.">
      <Card>
        <Row label="Personalised feed" hint="Use your interests to order stories" right={<Switch label="Personalised feed" on={personalise} onToggle={() => setPersonalise(!personalise)} />} />
        <Row label="Reading history" hint="Remember what you've opened" right={<Switch label="Reading history" on={history} onToggle={() => setHistory(!history)} />} />
        <Row label="Anonymous analytics" hint="Off by default" right={<Switch label="Anonymous analytics" on={analytics} onToggle={() => setAnalytics(!analytics)} />} />
      </Card>

      <button
        onClick={clearAll}
        className="mt-4 w-full rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-primary"
      >
        {cleared ? "Local data cleared ✓" : "Clear local data"}
      </button>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        InBits stores your preferences, saved stories and followed sources in your browser only. Nothing is sent to an
        ad network, and clearing local data removes it permanently.
      </p>
    </MenuPage>
  );
}
