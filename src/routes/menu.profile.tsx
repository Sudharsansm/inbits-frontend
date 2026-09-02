import { createFileRoute } from "@tanstack/react-router";
import { Card, MenuPage, Row } from "@/components/menu/MenuPage";
import { usePref } from "@/hooks/usePrefs";

export const Route = createFileRoute("/menu/profile")({
  head: () => ({
    meta: [
      { title: "Profile · InBits" },
      { name: "description", content: "Edit your InBits reader profile, handle, city and reading interests." },
      { property: "og:title", content: "Profile · InBits" },
      { property: "og:description", content: "Edit your InBits reader profile, handle, city and reading interests." },
    ],
  }),
  component: ProfilePage,
});

const interests = ["Tech", "World", "Business", "Culture", "Sports", "Science"];

function ProfilePage() {
  const [name, setName] = usePref("profile.name", "Maya Iyer");
  const [handle, setHandle] = usePref("profile.handle", "maya.reads");
  const [city, setCity] = usePref("profile.city", "Bengaluru");
  const [picked, setPicked] = usePref<string[]>("profile.interests", ["Tech", "Culture"]);
  const [saved, setSaved] = usePref("profile.savedFlag", 0);

  return (
    <MenuPage title="Profile" subtitle="Your reader identity">
      <div className="space-y-3">
        <Card>
          <Row
            label="Display name"
            right={
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-40 rounded-lg border border-border bg-paper px-2 py-1 text-right text-sm"
              />
            }
          />
          <Row
            label="Handle"
            right={
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-40 rounded-lg border border-border bg-paper px-2 py-1 text-right text-sm"
              />
            }
          />
          <Row
            label="City"
            right={
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-40 rounded-lg border border-border bg-paper px-2 py-1 text-right text-sm"
              />
            }
          />
        </Card>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm font-medium">Interests</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {interests.map((i) => {
              const on = picked.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => setPicked(on ? picked.filter((x) => x !== i) : [...picked, i])}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    on ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
                  }`}
                >
                  {i}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setSaved(Date.now())}
          className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          {saved ? "Saved ✓" : "Save profile"}
        </button>
      </div>
    </MenuPage>
  );
}
