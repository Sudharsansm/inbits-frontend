import { createFileRoute } from "@tanstack/react-router";
import { Card, MenuPage } from "@/components/menu/MenuPage";

export const Route = createFileRoute("/menu/about")({
  head: () => ({
    meta: [
      { title: "About · InBits" },
      {
        name: "description",
        content: "What InBits is, how it works, and who runs it.",
      },
      { property: "og:title", content: "About · InBits" },
      {
        property: "og:description",
        content: "What InBits is, how it works, and who runs it.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MenuPage title="About InBits" subtitle="What this app is, and how it works">
      <Card>
        <div className="space-y-4 p-4 text-[13px] leading-relaxed text-muted-foreground">
          <p>
            InBits is a reading app that brings together headlines and short summaries from a
            range of news publishers — The Hindu, Indian Express, Times of India, NDTV, The New
            York Times, BBC News and others — into one calm, distraction-light feed, organised by
            topic and by publisher.
          </p>
          <p>
            {/* TODO: replace with your real company/operator name. */}
            InBits is built and operated by <strong className="text-foreground">[Bitsophia
            ]</strong>.
          </p>
          <h2 className="serif text-sm font-bold text-foreground">How it works</h2>
          <p>
            For every story, InBits shows the original headline, a short excerpt, and a clear link
            back to the publisher's own site for the full article. InBits does not republish full
            articles — it's a discovery layer on top of the news, not a replacement for the
            newsrooms that report it. All reporting credit, and all rights to the full articles,
            belong to the original publishers.
          </p>
          <h2 className="serif text-sm font-bold text-foreground">How InBits is funded </h2>
          <p>
            InBits is supported by advertising (Google AdSense). See the {" Bitsophia "}
            <a href="/menu/privacy" className="font-semibold text-primary underline">
              Privacy
            </a>{" Bitsophia "}
            page for details on how ads and cookies work on this app.
          </p>
          <h2 className="serif text-sm font-bold text-foreground">Questions or concerns</h2>
          <p>
            If you're a publisher with a question about how your content appears here, or a reader
            with feedback, see the{" "}
            <a href="/menu/contact" className="font-semibold text-primary underline">
              Contact
            </a>{" "}
            page.
          </p>
        </div>
      </Card>
    </MenuPage>
  );
}