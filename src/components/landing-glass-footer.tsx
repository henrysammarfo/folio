import { Link } from "@tanstack/react-router";
import {
  Github,
  Linkedin,
  Twitter,
} from "lucide-react";
import { motion } from "motion/react";
import { primaryXUrl, SOCIALS } from "@/lib/socials";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_114316_1c7889ad-2885-410e-b493-98119fee0ddb.mp4";

const discover = [
  { label: "Desk", to: "/desk" as const },
  { label: "Buy", to: "/desk/acquire" as const },
  { label: "Markets", to: "/markets" as const },
  { label: "Pre-IPO", to: "/preipo" as const },
  { label: "Pairs", to: "/pairs" as const },
  { label: "Borrow", to: "/desk/credit" as const },
];

const mission = [
  { label: "About", to: "/about" as const },
  { label: "Whitepaper", to: "/whitepaper" as const },
  { label: "Closed beta", to: "/beta" as const },
  { label: "Network", to: "/network" as const },
  { label: "Open desk", to: "/desk" as const },
];

const concierge = [
  { label: "Privacy", to: "/privacy" as const },
  { label: "Terms", to: "/terms" as const },
  { label: "Account", to: "/desk/settings" as const },
];

export function LandingGlassFooter() {
  return (
    <section
      className="relative w-full min-h-[70vh] overflow-x-hidden flex flex-col items-center font-[family-name:var(--font-helvetica)] selection:bg-white/20 selection:text-white"
      aria-label="Footer"
    >
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        loop
        muted
        playsInline
        src={VIDEO_SRC}
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/35 to-black/70"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 md:px-10 py-16 md:py-24 flex flex-col flex-1 justify-end">
        <div className="mb-10 md:mb-14 flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            to="/desk"
            className="inline-flex items-center justify-center rounded-md bg-white text-black px-5 py-2.5 text-sm font-semibold"
          >
            Open desk
          </Link>
          <Link
            to="/desk/acquire"
            className="inline-flex items-center justify-center rounded-md border border-white/30 text-white px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
          >
            Buy AAPLx
          </Link>
        </div>

        <motion.footer
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 1, delay: 0.15, ease: "easeOut" }}
          className="liquid-glass w-full rounded-3xl p-6 md:p-10 text-white/70"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 mb-10">
            <div className="md:col-span-5">
              <div className="flex items-center gap-2 text-white mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 256 256"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M 4.688 136 C 68.373 136 120 187.627 120 251.312 C 120 252.883 119.967 254.445 119.905 256 L 0 256 L 0 136.096 C 1.555 136.034 3.117 136 4.688 136 Z M 251.312 136 C 252.883 136 254.445 136.034 256 136.096 L 256 256 L 136.095 256 C 136.032 254.438 136.001 252.875 136 251.312 C 136 187.627 187.627 136 251.312 136 Z M 119.905 0 C 119.967 1.555 120 3.117 120 4.688 C 120 68.373 68.373 120 4.687 120 C 3.117 120 1.555 119.967 0 119.905 L 0 0 Z M 256 119.905 C 254.445 119.967 252.883 120 251.312 120 C 187.627 120 136 68.373 136 4.687 C 136 3.117 136.033 1.555 136.095 0 L 256 0 Z" />
                </svg>
                <span className="text-xl font-medium">FOLIO</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                FOLIO keeps share counts honest on Solana — safe routes, live
                quotes, and credit without selling.
              </p>
            </div>

            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm uppercase tracking-wider text-white font-medium mb-4">
                  Discover
                </h3>
                <ul className="text-xs space-y-2">
                  {discover.map((l) => (
                    <li key={l.to + l.label}>
                      <Link
                        to={l.to}
                        className="hover:text-white transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm uppercase tracking-wider text-white font-medium mb-4">
                  The Mission
                </h3>
                <ul className="text-xs space-y-2">
                  {mission.map((l) => (
                    <li key={l.to + l.label}>
                      <Link
                        to={l.to}
                        className="hover:text-white transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm uppercase tracking-wider text-white font-medium mb-4">
                  Concierge
                </h3>
                <ul className="text-xs space-y-2">
                  {concierge.map((l) => (
                    <li key={l.to + l.label}>
                      <Link
                        to={l.to}
                        className="hover:text-white transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
            <p className="text-[10px] uppercase tracking-widest opacity-50">
              Built by Henry Sam Marfo · Accra
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest opacity-50">
                Connect:
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={primaryXUrl()}
                  className="opacity-70 hover:opacity-100 transition-colors hover:text-white"
                  aria-label="X / Twitter"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Twitter size={16} />
                </a>
                <a
                  href={SOCIALS.github}
                  className="opacity-70 hover:opacity-100 transition-colors hover:text-white"
                  aria-label="GitHub"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github size={16} />
                </a>
                <a
                  href={SOCIALS.linkedin}
                  className="opacity-70 hover:opacity-100 transition-colors hover:text-white"
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Linkedin size={16} />
                </a>
              </div>
            </div>
          </div>
        </motion.footer>
      </div>
    </section>
  );
}
