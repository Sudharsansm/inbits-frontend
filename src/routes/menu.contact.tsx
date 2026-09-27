import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { Card, MenuPage } from "@/components/menu/MenuPage";

export const Route = createFileRoute("/menu/contact")({
  head: () => ({
    meta: [
      { title: "Contact · InBits" },
      {
        name: "description",
        content: "How to reach the team behind InBits.",
      },
      { property: "og:title", content: "Contact · InBits" },
      {
        property: "og:description",
        content: "How to reach the team behind InBits.",
      },
    ],
  }),
  component: ContactPage,
});

// TODO: replace with a real inbox you actually check. A free mailbox
// (e.g. a Gmail address) is fine to start — AdSense and readers just
// need a working way to reach a human, not a specific domain/provider.
const CONTACT_EMAIL = "manisri88877@gmail.com";

function ContactPage() {
  return (
    <MenuPage title="Contact" subtitle="Reach the team behind InBits">
      <Card>
        <div className="space-y-4 p-4 text-[13px] leading-relaxed text-muted-foreground">
          <p>
            Questions about a story, a takedown or correction request from a publisher, feedback
            on the app, or an advertising inquiry — all of it can go to the same address:
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm font-semibold text-primary"
          >
          
            <Mail className="h-4 w-4 flex-none" />
            {CONTACT_EMAIL}
          </a>
          <p>We aim to respond within a few business days.</p>
          <h2 className="serif text-sm font-bold text-foreground">Publisher requests</h2>
          <p>
            If you represent a publisher whose content appears on InBits and you'd like a story
            removed, a link corrected, or an excerpt shortened further, email us with the story URL
            and we'll act on it promptly.
          </p>
        </div>
      </Card>
    </MenuPage>
  );
}