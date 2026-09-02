import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card, MenuPage, Row, Switch } from "@/components/menu/MenuPage";
import { usePref } from "@/hooks/usePrefs";

export const Route = createFileRoute("/menu/settings")({
  head: () => ({
    meta: [
      { title: "Settings · InBits" },
      { name: "description", content: "Set theme, language, text size and data saver options for InBits." },
      { property: "og:title", content: "Settings · InBits" },
      { property: "og:description", content: "Set theme, language, text size and data saver options for InBits." },
    ],
  }),
  component: SettingsPage,
});

const sizes = ["Small", "Medium", "Large"] as const;
const languages = ["English", "हिंदी", "தமிழ்", "Español"];

function SettingsPage() {
  const [dark, setDark] = usePref("settings.dark", false);
  const [size, setSize] = usePref<string>("settings.textSize", "Medium");
  const [lang, setLang] = usePref("settings.language", "English");
  const [dataSaver, setDataSaver] = usePref("settings.dataSaver", false);
  const [autoplay, setAutoplay] = usePref("settings.autoplay", true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const px = size === "Small" ? "15px" : size === "Large" ? "18px" : "16px";
    document.documentElement.style.fontSize = px;
  }, [size]);

  return (
    <MenuPage title="Settings" subtitle="Theme, language and reading comfort">
      <Card>
        <Row label="Dark mode" hint="Easier on late-night eyes" right={<Switch label="Dark mode" on={dark} onToggle={() => setDark(!dark)} />} />
        <Row
          label="Text size"
          hint="Applies across the app"
          right={
            <div className="flex gap-1">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    size === s ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          }
        />
        <Row
          label="Language"
          right={
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="rounded-lg border border-border bg-paper px-2 py-1 text-sm"
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          }
        />
        <Row label="Data saver" hint="Load lighter images" right={<Switch label="Data saver" on={dataSaver} onToggle={() => setDataSaver(!dataSaver)} />} />
        <Row label="Autoplay media" hint="Play video in Updates automatically" right={<Switch label="Autoplay media" on={autoplay} onToggle={() => setAutoplay(!autoplay)} />} />
      </Card>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">InBits · version 1.0.0</p>
    </MenuPage>
  );
}
