import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { siteMeta } from "@/lib/site-meta";
import { primaryXHandle, primaryXUrl, SOCIALS } from "@/lib/socials";

export const Route = createFileRoute("/whitepaper")({
  head: () => ({
    meta: siteMeta({
      title: "Whitepaper — FOLIO",
      description:
        "FOLIO whitepaper — honest stock desk on Solana: truth, safe routes, credit without selling.",
      path: "/whitepaper",
    }),
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell
      tone="about"
      eyebrow="Whitepaper v1.0"
      title="Honest stock desk on Solana."
      intro="Share counts you can trust. Routes that refuse wash. Credit without forced selling. Broadcast paused until funded — no theater."
    >
      <article className="fx-whitepaper">
        <section>
          <h2>1. Abstract</h2>
          <p>
            Tokenized US stocks on Solana already trade at scale. What is still
            missing is a consumer brokerage layer that tells the truth. FOLIO is
            that desk: live Scaled UI share math, fail-closed wash gates,
            Jupiter quote-only buys, honest credit reads, and separate PreStocks
            / Tessera lanes.
          </p>
        </section>

        <section>
          <h2>2. Problem</h2>
          <ul>
            <li>
              <b>Share truth</b> — balances drift after corporate actions /
              Scaled UI rebases.
            </li>
            <li>
              <b>Liquidity</b> — wash / thin tape can look deep until it isn’t.
            </li>
            <li>
              <b>UX</b> — raw DEX screens don’t build a holdings habit.
            </li>
            <li>
              <b>Credit</b> — borrow often means sell the position.
            </li>
            <li>
              <b>Pre-IPO</b> — PreStocks ≠ Tessera; mixing them confuses users
              and bounty tracks.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Solution</h2>
          <p>
            <b>One job:</b> honest stock desk on Solana (truth · safe route ·
            credit). Pitch order is locked: honest shares → won’t buy wash → buy
            on Solana → borrow without selling → guarded agent.
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
            dominating on-chain equity DEX volume (multi-billion quarterly).
            Issuers and wallets sell access. FOLIO sells <b>desk trust</b> —
            hold, rebalance, and borrow against tokenized stocks without lying.
          </p>
        </section>

        <section>
          <h2>5. Honesty matrix</h2>
          <ul>
            <li>Multiplier / Scaled UI — mainnet READ, labeled if feeds die</li>
            <li>Jupiter — quote-only until broadcast is funded + unpaused</li>
            <li>Wash — fail-closed without live tape</li>
            <li>NestUSD — unavailable until verified (never invent Ready)</li>
            <li>Security — residual risk disclosed; never “unhackable”</li>
          </ul>
          <p>
            Live matrix:{" "}
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
