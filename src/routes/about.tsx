import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";

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
      eyebrow="Built in Accra"
      title="A prime desk that earns trust by refusing shortcuts."
      intro="FOLIO is built for EU and APAC non-US Solana users who need economic-share truth before they acquire, borrow, or automate — and for a founder who refuses to let starting line cap ambition."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge tone="green">Mainnet read</StatusBadge>
        <StatusBadge tone="blue">Broadcast paused</StatusBadge>
        <StatusBadge tone="neutral">≤~$1 demo doctrine</StatusBadge>
      </div>

      <div className="manifesto">
        <blockquote>
          “Prove the shares. Refuse the wash. Open credit on honest balances.”
        </blockquote>
        <div>
          <p>
            FOLIO never fabricates equity mints, fills, or user traction. It separates live mainnet
            reads from unfunded borrow CPI (no fork harness theater) and keeps every refusal
            legible — wash without Bitquery stays fail-closed; NestUSD stays hidden until the
            endpoint is verified; broadcast stays off until funded.
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
          Tokenized US stocks on Solana break when corporate actions, wash flow, and credit are
          papered over. FOLIO is the honest corporate-action prime desk: share counts you can
          trust, pools we refuse when dirty, credit without forced selling.
        </p>
        <h2>Why Accra — grit, not pity</h2>
        <p>
          Building from a less-privileged starting line means pedigree will not carry this — the
          product must. Interview posture is not “please validate us.” It is: this is the problem
          we die on; here is the live spine; here is how it compounds for years.
        </p>
        <h2>How we last</h2>
        <ol>
          <li>
            <b>Now</b> — live read spine, wash gate, quote-only, credit honesty, multi-tenant when
            keyed.
          </li>
          <li>
            <b>Next</b> — Henry-approved premium chrome; Privy + Supabase sessions; Bitquery wash
            green path.
          </li>
          <li>
            <b>Later</b> — funded broadcast with hard spend caps; fee on credit/routing only after
            trust.
          </li>
        </ol>
        <p className="mt-4 text-sm opacity-80">
          Premium look is gated on purpose.{" "}
          <Link to="/lab/ui" className="underline">
            Approve desk UI
          </Link>{" "}
          ·{" "}
          <Link to="/lab/shaders" className="underline">
            Approve shaders
          </Link>{" "}
          ·{" "}
          <Link to="/network" className="underline">
            Network honesty
          </Link>
          .
        </p>
      </section>
    </PublicShell>
  );
}
