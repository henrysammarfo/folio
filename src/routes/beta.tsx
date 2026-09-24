import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { PublicShell } from "@/components/public-page";
import { trackFolioEvent } from "@/lib/analytics";
import { joinBetaWaitlist } from "@/lib/desk.functions";
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

function Page() {
  const joinWaitlist = useServerFn(joinBetaWaitlist);
  const [email, setEmail] = useState("");
  const [wallet, setWallet] = useState("");
  const [note, setNote] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (honeypot.trim()) return; // bot filled hidden field
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setErr("Enter a valid email.");
      return;
    }
    setBusy(true);
    try {
      const w = wallet.trim();
      const n = note.trim();
      const res = await joinWaitlist({
        data: {
          email: em,
          ...(w ? { wallet: w } : {}),
          ...(n ? { note: n } : {}),
        },
      });
      if (!res.ok) {
        setErr(res.detail ?? "Couldn’t join — try again shortly.");
        return;
      }
      trackFolioEvent("beta_join", { ok: true });
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicShell
      tone="about"
      compactIntro
      eyebrow="Closed beta"
      title="Mainnet-close desk. Quote-only until fills unlock."
      intro="Join the waitlist for FOLIO closed beta — live share truth, wash refuse, Jupiter quotes. Broadcast stays paused on purpose until we’re funded."
    >
      <div className="fx-beta">
        {!done ? (
          <form className="fx-beta-form" onSubmit={(e) => void submit(e)}>
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
            <label className="hp-field" aria-hidden="true">
              Company
              <input
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </label>
            {err ? <p className="fx-checks">{err}</p> : null}
            <button
              type="submit"
              className="fx-btn fx-btn-primary"
              disabled={busy}
            >
              {busy ? "Joining…" : "Join waitlist"}
            </button>
            <p className="fx-ticket-sub">
              Saved on FOLIO servers (rate-limited). Follow {primaryXHandle()}{" "}
              for invite waves.
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
            <li>Scaled UI share truth · wash refuse · Jupiter quotes</li>
            <li>
              Fills arm when BROADCAST_PAUSED=false · borrows still
              unavailable-until-funded
            </li>
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
