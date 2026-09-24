import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — FOLIO" },
      {
        name: "description",
        content: "How FOLIO collects, uses, and protects your information.",
      },
      { property: "og:title", content: "Privacy Policy — FOLIO" },
      {
        property: "og:description",
        content: "How FOLIO collects, uses, and protects your information.",
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
      title="Privacy Policy"
      intro="Last updated September 24, 2026. FOLIO is built to keep share counts honest — and your data minimal."
    >
      <article className="legal-doc">
        <h2>What we collect</h2>
        <p>
          We may process wallet addresses you connect or look up, session cookies
          for signed-in desks, and basic technical logs (IP, user agent) needed to
          run the service and prevent abuse.
        </p>
        <h2>Cookies</h2>
        <p>
          FOLIO uses essential cookies for authentication and wallet binding
          (httpOnly where possible). Optional analytics cookies load only after
          you accept the cookie banner.
        </p>
        <h2>How we use data</h2>
        <p>
          To show live share counts, quotes, and credit reads; to keep your desk
          session secure; and to improve reliability. We do not sell personal data.
        </p>
        <h2>Third parties</h2>
        <p>
          Market data and auth may involve providers such as Solana RPC, Jupiter,
          Privy, and Supabase. Their policies apply to data they process.
        </p>
        <h2>Contact</h2>
        <p>
          Questions:{" "}
          <a href="https://x.com/henrysammarfo" rel="noreferrer" target="_blank">
            @henrysammarfo
          </a>
          . See also our{" "}
          <Link to="/terms" className="underline">
            Terms
          </Link>
          .
        </p>
      </article>
    </PublicShell>
  );
}
