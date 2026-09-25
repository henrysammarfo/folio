import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, MktSection } from "@/components/public-page";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — FOLIO" },
      {
        name: "description",
        content:
          "FOLIO is the honest stock desk on Solana — built in Accra, shipped for the world.",
      },
      { property: "og:title", content: "About — FOLIO" },
      {
        property: "og:description",
        content:
          "FOLIO is the honest stock desk on Solana — built in Accra, shipped for the world.",
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
      intro="FOLIO is for people who need the truth before they buy, borrow, or automate — built by a founder who won’t let the starting line cap the ambition."
    >
      <MktSection title="Doctrine">
        <blockquote className="mkt-quote">
          “Prove the shares. Refuse the wash. Open credit on honest balances.”
        </blockquote>
        <p>
          We never invent fills, mints, or traction. Live market reads stay
          labeled. When something isn’t ready, we say so — clearly.
        </p>
        <p>
          <b>Henry Sam Marfo</b>
          <br />
          Builder · Accra, Ghana · @henrysammarfo
        </p>
      </MktSection>

      <MktSection n="01" title="Why this desk">
        <p>
          Tokenized US stocks on Solana break when corporate actions, dirty
          pools, and credit are papered over. FOLIO is the desk that won’t: share
          counts you can trust, routes we refuse when they’re dirty, cash without
          forced selling.
        </p>
      </MktSection>

      <MktSection n="02" title="Why Accra">
        <p>
          Pedigree won’t carry this — the product must. We show up with a live
          spine, not a slide deck of promises.
        </p>
      </MktSection>

      <MktSection n="03" title="How we last">
        <ol className="mkt-steps">
          <li>
            <b>Now</b> — live share truth, wash refuse, buy &amp; borrow in
            FOLIO, PreStocks + Tessera desks.
          </li>
          <li>
            <b>Next</b> — tighter sessions, wider beta, sharper desk chrome.
          </li>
          <li>
            <b>Later</b> — deeper credit rails and fees only after trust is
            earned.
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
