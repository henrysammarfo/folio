import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, MktSection } from "@/components/public-page";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — FOLIO" },
      {
        name: "description",
        content:
          "Doctrine and builder behind FOLIO — Accra, fail-closed, built for years.",
      },
      { property: "og:title", content: "About — FOLIO" },
      {
        property: "og:description",
        content:
          "Doctrine and builder behind FOLIO — Accra, fail-closed, built for years.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell
      tone="about"
      eyebrow="Built in Accra"
      title="A desk that earns trust by refusing shortcuts."
      intro="FOLIO is for people who need economic-share truth before they buy, borrow, or automate — built by a founder who refuses to let starting line cap ambition."
    >
      <MktSection title="Doctrine">
        <blockquote className="mkt-quote">
          “Prove the shares. Refuse the wash. Open credit on honest balances.”
        </blockquote>
        <p>
          FOLIO never fabricates equity mints, fills, or traction. Live mainnet
          reads stay separate from unfunded borrow broadcast. Every refusal is
          legible.
        </p>
        <p>
          <b>Henry Sam Marfo</b>
          <br />
          Builder · Accra, Ghana · @henrysammarfo
        </p>
      </MktSection>

      <MktSection n="01" title="Why this desk">
        <p>
          Tokenized US stocks on Solana break when corporate actions, wash flow,
          and credit are papered over. FOLIO is the honest stock desk: share
          counts you can trust, pools we refuse when dirty, credit without
          forced selling.
        </p>
      </MktSection>

      <MktSection n="02" title="Why Accra">
        <p>
          Pedigree will not carry this — the product must. Interview posture is
          not “please validate us.” It is: this is the problem we die on; here
          is the live spine; here is how it compounds.
        </p>
      </MktSection>

      <MktSection n="03" title="How we last">
        <ol className="mkt-steps">
          <li>
            <b>Now</b> — live read spine, wash gate, quote-only, credit honesty.
          </li>
          <li>
            <b>Next</b> — sessions, wash green path, polished desk chrome.
          </li>
          <li>
            <b>Later</b> — funded broadcast with hard spend caps; fees only after
            trust.
          </li>
        </ol>
        <p className="mkt-links">
          <Link to="/whitepaper">Whitepaper</Link>
          <Link to="/beta">Closed beta</Link>
          <Link to="/network">Network honesty</Link>
          <Link to="/desk">Open desk</Link>
        </p>
      </MktSection>
    </PublicShell>
  );
}
