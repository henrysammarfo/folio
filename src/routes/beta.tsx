import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PublicShell } from "@/components/public-page";
import { siteMeta } from "@/lib/site-meta";
import { primaryXHandle, primaryXUrl, SOCIALS } from "@/lib/socials";

export const Route = createFileRoute("/beta")({
  head: () => ({
    meta: siteMeta({
      title: "Closed beta — FOLIO",
      description:
        "Join FOLIO closed beta — honest Solana stock desk. Quote-only until fills unlock.",
      path: "/beta",
    }),
  }),
  component: Page,
});

type Entry = { email: string; wallet?: string; note?: string; at: string };

function loadLocal(): Entry[] {
  try {
    const raw = localStorage.getItem("folio_beta_waitlist");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Entry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Page() {
  const [email, setEmail] = useState("");
  const [wallet, setWallet] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setErr("Enter a valid email.");
      return;
    }
    const entry: Entry = { email: em, at: new Date().toISOString() };
    const w = wallet.trim();
    const n = note.trim();
    if (w) entry.wallet = w;
    if (n) entry.note = n;
    const prev = loadLocal();
    const next = [entry, ...prev.filter((x) => x.email !== em)].slice(0, 200);
    localStorage.setItem("folio_beta_waitlist", JSON.stringify(next));
    setDone(true);
  }

  return (
    <PublicShell
      tone="about"
      eyebrow="Closed beta"
      title="Mainnet-close desk. Quote-only until fills unlock."
      intro="Join the waitlist for FOLIO closed beta — live share truth, wash refuse, Jupiter quotes. Broadcast stays paused on purpose until we’re funded."
    >
      <div className="fx-beta">
        {!done ? (
          <form className="fx-beta-form" onSubmit={submit}>
            <label className="fx-field">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </label>
            <label className="fx-field">
              Solana wallet (optional)
              <input
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="Paste pubkey"
                spellCheck={false}
              />
            </label>
            <label className="fx-field">
              How did you find FOLIO? (optional)
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Stocklana · X · friend…"
              />
            </label>
            {err ? <p className="fx-checks">{err}</p> : null}
            <button type="submit" className="fx-btn fx-btn-primary">
              Join waitlist
            </button>
            <p className="fx-ticket-sub">
              Stored in this browser for now — Henry exports / invites in batches.
              Follow {primaryXHandle()} for invite waves.
            </p>
          </form>
        ) : (
          <div className="fx-beta-done">
            <h2>You’re on the list.</h2>
            <p>
              Next: open the desk, run a quote, and follow{" "}
              <a href={primaryXUrl()} target="_blank" rel="noreferrer">
                {primaryXHandle()}
              </a>
              .
            </p>
            <div className="fx-beta-actions">
              <Link to="/desk" className="fx-btn fx-btn-primary">
                Open desk
              </Link>
              <Link to="/whitepaper" className="fx-btn fx-btn-sm">
                Read whitepaper
              </Link>
            </div>
          </div>
        )}

        <aside className="fx-beta-aside">
          <h2>What beta includes</h2>
          <ul>
            <li>Live Markets board + Buy lanes (mega / IPO / meme / pairs)</li>
            <li>PreStocks + Tessera desks (kept separate on purpose)</li>
            <li>Scaled UI share truth · wash fail-closed · quote-only</li>
            <li>Fills &amp; borrows paused until funded — labeled honestly</li>
          </ul>
          <p>
            <a href={SOCIALS.stocklana} target="_blank" rel="noreferrer">
              Stocklana
            </a>
            {" · "}
            <a href={SOCIALS.colosseum} target="_blank" rel="noreferrer">
              Colosseum World’s Fair
            </a>
          </p>
        </aside>
      </div>
    </PublicShell>
  );
}
