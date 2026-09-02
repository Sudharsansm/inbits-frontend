import { createFileRoute } from "@tanstack/react-router";
import { Card, MenuPage, Row, Switch } from "@/components/menu/MenuPage";
import { usePref } from "@/hooks/usePrefs";

export const Route = createFileRoute("/menu/notifications")({
  head: () => ({
    meta: [
      { title: "Notification preferences · InBits" },
      { name: "description", content: "Choose your InBits digest time, breaking alerts and channel pings." },
      { property: "og:title", content: "Notification preferences · InBits" },
      { property: "og:description", content: "Choose your InBits digest time, breaking alerts and channel pings." },
    ],
  }),
  component: NotificationPrefs,
});

function NotificationPrefs() {
  const [digest, setDigest] = usePref("notif.digest", true);
  const [time, setTime] = usePref("notif.time", "07:00");
  const [breaking, setBreaking] = usePref("notif.breaking", true);
  const [channels, setChannels] = usePref("notif.channels", false);
  const [jobs, setJobs] = usePref("notif.jobs", true);

  return (
    <MenuPage title="Notification preferences" subtitle="Only what you asked for">
      <Card>
        <Row label="Daily digest" hint="One quiet roundup each morning" right={<Switch label="Daily digest" on={digest} onToggle={() => setDigest(!digest)} />} />
        <Row
          label="Digest time"
          hint="Delivered in your local time"
          right={
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-lg border border-border bg-paper px-2 py-1 text-sm"
            />
          }
        />
        <Row label="Breaking news" hint="Rare, high-signal alerts" right={<Switch label="Breaking news" on={breaking} onToggle={() => setBreaking(!breaking)} />} />
        <Row label="Channel updates" hint="New episodes from channels you follow" right={<Switch label="Channel updates" on={channels} onToggle={() => setChannels(!channels)} />} />
        <Row label="Job matches" hint="Roles that fit your interests" right={<Switch label="Job matches" on={jobs} onToggle={() => setJobs(!jobs)} />} />
      </Card>
      <p className="mt-3 text-[11px] text-muted-foreground">Changes save automatically on this device.</p>
    </MenuPage>
  );
}
