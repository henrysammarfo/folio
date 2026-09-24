import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — FOLIO" },
      {
        name: "description",
        content: "Terms governing use of the FOLIO desk and related services.",
      },
      { property: "og:title", content: "Terms of Use — FOLIO" },
      {
        property: "og:description",
        content: "Terms governing use of the FOLIO desk and related services.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell
      tone="legal"
      compactIntro
      eyebrow="Legal"
      title="Terms of Use"
      intro="Last updated September 24, 2026. By using FOLIO you agree to these terms."
    >
      <article className="legal-doc">
        <h2>Service</h2>
        <p>
          FOLIO provides labeled market reads, quotes, and desk tools for
          tokenized stocks on Solana. Features may be paused, quote-only, or
          unavailable. Nothing here is financial, investment, or legal advice.
        </p>
        <h2>Eligibility</h2>
        <p>
          You must be able to form a binding contract in your jurisdiction and
          comply with applicable laws when connecting a wallet or using the desk.
        </p>
        <h2>No guarantees</h2>
        <p>
          Markets move. Oracles, multipliers, and pool data can be delayed or
          wrong. FOLIO does not guarantee fills, borrow capacity, or uninterrupted
          uptime. Residual risk always remains — we never claim “unhackable.”
        </p>
        <h2>Your responsibility</h2>
        <p>
          You are responsible for wallet security, reviewing quotes before any
          transaction, and understanding on-chain settlement. Do not use FOLIO to
          violate law or market-manipulation rules.
        </p>
        <h2>Limitation</h2>
        <p>
          To the fullest extent permitted by law, FOLIO and its operators are not
          liable for indirect, incidental, or consequential damages arising from
          use of the service.
        </p>
        <h2>Privacy</h2>
        <p>
          See our{" "}
          <Link to="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </article>
    </PublicShell>
  );
}
