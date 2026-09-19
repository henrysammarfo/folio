import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — FOLIO" },
      {
        name: "description",
        content: "Doctrine and builder behind FOLIO — Accra, fail-closed, built for years.",
      },
      { property: "og:title", content: "About — FOLIO" },
      {
        property: "og:description",
        content: "Doctrine and builder behind FOLIO — Accra, fail-closed, built for years.",
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
      <div className="manifesto">
        <blockquote>
          “Prove the shares. Refuse the wash. Open credit on honest balances.”
        </blockquote>
        <div>
          <p>
            FOLIO never fabricates equity mints, fills, or traction. Live mainnet
            reads stay separate from unfunded borrow broadcast. Every refusal is
            legible — wash without a key stays fail-closed; NestUSD stays hidden
            until verified; broadcast stays off until funded.
          </p>
          <p>
            <b>Henry Sam Marfo</b>
            <br />
            Builder · Accra, Ghana · @henrysammarfo
          </p>
        </div>
      </div>

      <section className="about-vision mt-10">
        <h2>Why this desk</h2>
        <p>
          Tokenized US stocks on Solana break when corporate actions, wash flow,
          and credit are papered over. FOLIO is the honest stock desk: share
          counts you can trust, pools we refuse when dirty, credit without
          forced selling.
        </p>
        <h2>Why Accra</h2>
        <p>
          Pedigree will not carry this — the product must. Interview posture is
          not “please validate us.” It is: this is the problem we die on; here
          is the live spine; here is how it compounds.
        </p>
        <h2>How we last</h2>
        <ol>
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
        <p className="mt-4 text-sm opacity-80">
          <Link to="/network" className="underline">
            Network honesty
          </Link>
          {" · "}
          <Link to="/desk" className="underline">
            Open desk
          </Link>
        </p>
      </section>
    </PublicShell>
  );
}

