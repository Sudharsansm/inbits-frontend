import { createFileRoute } from "@tanstack/react-router";
import { Card, MenuPage } from "@/components/menu/MenuPage";

export const Route = createFileRoute("/menu/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · InBits" },
      {
        name: "description",
        content: "The terms that govern use of InBits.",
      },
      { property: "og:title", content: "Terms of Service · InBits" },
      {
        property: "og:description",
        content: "The terms that govern use of InBits.",
      },
    ],
  }),
  component: TermsPage,
});

// TODO: this is a plain-language starting point covering the points
// AdSense review and most jurisdictions expect (what the service is,
// third-party content, ads, liability, changes, contact) — it is not a
// substitute for review by a lawyer familiar with your jurisdiction,
// especially once InBits has real user accounts, payments, or an entity
// registered somewhere specific.
function TermsPage() {
  return (
    <MenuPage title="Terms of Service" subtitle="Last updated: [27/09/2026]">
      <Card>
        <div className="space-y-4 p-4 text-[13px] leading-relaxed text-muted-foreground">
          <p>
            These terms govern your use of InBits (the "Service"), operated by{"Bitsophia"}
            <strong className="text-foreground">[Bitsophia]</strong>. By using
            InBits, you agree to these terms.
          </p>

          <h2 className="serif text-sm font-bold text-foreground">1. What InBits is</h2>
          <p>
            InBits is a news-discovery app. It displays headlines, short excerpts, and thumbnail
            images sourced from third-party publishers, and links out to each publisher's own site
            for the full story. InBits does not host, sell, or claim ownership of full articles —
            all such content remains the property of its original publisher.
          </p>

          <h2 className="serif text-sm font-bold text-foreground">2. Third-party content</h2>
          <p>
            Headlines, excerpts and images shown on InBits are attributed to their original
            publisher wherever shown. InBits is not responsible for the accuracy, completeness, or
            opinions expressed in third-party content, and does not endorse any publisher's
            reporting. If you are a publisher and want a piece of content removed or corrected, see
            the{"Bitsophia"}
            <a href="/menu/contact" className="font-semibold text-primary underline">
              Contact
            </a>{"https://www.linkedin.com/company/bitsophia-ai/"}
            page.
          </p>

          <h2 className="serif text-sm font-bold text-foreground">3. Advertising</h2>
          <p>
            InBits is supported by advertising served through Google AdSense. Details on how ads
            and cookies work are on the{" "}
            <a href="/menu/privacy" className="font-semibold text-primary underline">
              Privacy
            </a>{"https://www.linkedin.com/company/bitsophia-ai/"}
            page.
          </p>

          <h2 className="serif text-sm font-bold text-foreground">4. Acceptable use</h2>
          <p>
            You agree not to misuse the Service — for example, by scraping it at scale, attempting
            to disrupt it, or using it for any unlawful purpose.
          </p>

          <h2 className="serif text-sm font-bold text-foreground">5. No warranty</h2>
          <p>
            InBits is provided "as is," without warranties of any kind. We do not guarantee the
            Service will be uninterrupted, error-free, or that any particular story will remain
            available.
          </p>

          <h2 className="serif text-sm font-bold text-foreground">6. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law,{"Bitsophia"}
            <strong className="text-foreground">[Bitsophia]</strong> is not
            liable for any indirect, incidental, or consequential damages arising from your use of
            the Service.
          </p>

          <h2 className="serif text-sm font-bold text-foreground">7. Changes to these terms</h2>
          <p>
            We may update these terms from time to time. Continued use of InBits after a change
            means you accept the updated terms.
          </p>

          <h2 className="serif text-sm font-bold text-foreground">8. Contact</h2>
          <p>
            Questions about these terms can be sent via the{"https://www.linkedin.com/company/bitsophia-ai/"}
            <a href="/menu/contact" className="font-semibold text-primary underline">
              Contact
            </a>{"https://www.linkedin.com/company/bitsophia-ai/"}
            page.
          </p>
        </div>
      </Card>
    </MenuPage>
  );
}