import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { siteMeta } from "@/lib/site-meta";
import { primaryXHandle, primaryXUrl, SOCIALS } from "@/lib/socials";

export const Route = createFileRoute("/whitepaper")({
  head: () => ({
    meta: siteMeta({
      title: "Whitepaper — FOLIO",
      description:
        "FOLIO whitepaper — buy US stocks on Solana with share counts you can trust.",
      path: "/whitepaper",
    }),
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell
      tone="about"
      eyebrow="Whitepaper v1.1"
      title="Buy US stocks. Keep the share count true."
      intro="FOLIO is the honest stock desk on Solana — real share math, safe routes, buys and borrows inside one desk. We never invent a fill."
    >
      <article className="fx-whitepaper">
        <section>
          <h2>1. Abstract</h2>
          <p>
            Tokenized US stocks on Solana already trade at scale. What is still
            missing is a desk that tells the truth before you buy, borrow, or
            automate. FOLIO shows the real share math after dividends and
            splits, refuses dirty routes, lets you buy and rotate stocks in one
            place, and borrow cash without selling — with PreStocks and Tessera
            each in their own room.
          </p>
        </section>

        <section>
          <h2>2. Problem</h2>
          <ul>
            <li>
              <b>Share truth</b> — wallet balances drift after dividends and
              splits.
            </li>
            <li>
              <b>Liquidity</b> — dirty or thin pools can look deep until they
              aren’t.
            </li>
            <li>
              <b>UX</b> — raw swap screens don’t build a holdings habit.
            </li>
            <li>
              <b>Credit</b> — borrow often means sell the position.
            </li>
            <li>
              <b>Pre-IPO</b> — PreStocks and Tessera are different products;
              mixing them confuses everyone.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Solution</h2>
          <p>
            <b>One job:</b> honest stock desk on Solana. Pitch order is locked:
            honest shares → won’t buy wash → buy on Solana → borrow without
            selling → guarded agent.
          </p>
          <p>
            Soft line: FOLIO buys the US stocks you want on Solana — keeps share
            counts honest, won’t buy in shady pools, and lets you borrow cash
            without selling.
          </p>
        </section>

        <section>
          <h2>4. Market</h2>
          <p>
            Public 2026 reports place xStocks near ~$800M AUM with Solana
            dominating on-chain equity volume. Issuers and wallets sell access.
            FOLIO sells <b>desk trust</b> — hold, rebalance, and borrow against
            tokenized stocks without lying.
          </p>
        </section>

        <section>
          <h2>5. How we stay honest</h2>
          <ul>
            <li>Share multiplier — live mainnet read, labeled if feeds die</li>
            <li>Buy — live quotes · you sign fills · we never invent one</li>
            <li>Wash — pauses size when the tape looks dirty or missing</li>
            <li>Borrow — Kamino in-desk · NestUSD metrics only for now</li>
            <li>Security — residual risk named; never “unhackable”</li>
          </ul>
          <p>
            Live status:{" "}
            <Link to="/network">/network</Link>
          </p>
        </section>

        <section>
          <h2>6. Business model</h2>
          <p>
            Barbell revenue so the desk earns in bull <b>and</b> bear: swap
            take-rate (volatile) + credit/earn on balances (sticky) + Pro
            subscription (recurring) + careful pre-IPO desk fees. Target Year-2
            mix: ≤50% trading.
          </p>
        </section>

        <section>
          <h2>7. Path</h2>
          <ol>
            <li>Submit Stocklana with working honesty</li>
            <li>Judge feedback · socials · closed beta</li>
            <li>Traction → Colosseum / World’s Fair</li>
            <li>Funded micro-fills → retention → multi-rail revenue</li>
          </ol>
          <p>
            Full docs on GitHub:{" "}
            <a href={`${SOCIALS.github}/blob/main/docs/FOLIO_WHITEPAPER.md`}>
              FOLIO_WHITEPAPER.md
            </a>
            {" · "}
            <a
              href={`${SOCIALS.github}/blob/main/docs/FOUNDER_OPERATING_PLAN.md`}
            >
              Operating plan
            </a>
            {" · "}
            <a href={`${SOCIALS.github}/blob/main/docs/LAUNCH_AND_SOCIALS.md`}>
              Launch &amp; socials
            </a>
          </p>
        </section>

        <section>
          <h2>8. Call to action</h2>
          <div className="fx-beta-actions">
            <Link to="/beta" className="fx-btn fx-btn-primary">
              Join closed beta
            </Link>
            <Link to="/desk" className="fx-btn fx-btn-sm">
              Open desk
            </Link>
            <a
              className="fx-btn fx-btn-sm"
              href={primaryXUrl()}
              target="_blank"
              rel="noreferrer"
            >
              Follow {primaryXHandle()}
            </a>
          </div>
        </section>
      </article>
    </PublicShell>
  );
}
