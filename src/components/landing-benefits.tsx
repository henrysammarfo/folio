/**
 * BenefitsSection — template layout (black / 3 cards / center video).
 * Copy adapted for FOLIO; structure matches template classes.
 */
export function BenefitsSection() {
  return (
    <section
      className="relative w-full bg-black px-4 sm:px-6 md:px-10 py-12 sm:py-20 font-[family-name:var(--font-futura)]"
      aria-label="Key benefits"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <h2
          className="text-white text-3xl sm:text-4xl md:text-5xl font-light text-center mb-12 sm:mb-24"
          style={{ letterSpacing: "-0.04em" }}
        >
          Key Benefits
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1 */}
          <article className="relative h-[380px] sm:h-[460px] rounded-2xl bg-neutral-950 overflow-hidden p-6 sm:p-8">
            <div
              className="absolute top-1/2 -translate-y-1/2 -left-[420px] h-[460px] w-[460px] rounded-full bg-[#1e3a8a] blur-3xl opacity-40"
              aria-hidden
            />
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-white text-xl sm:text-2xl font-light leading-tight">
                Honest share
                <br />
                counts, live
              </h3>
              <p className="mt-12 sm:mt-20 text-[13px] sm:text-[14px] leading-relaxed text-white/70 font-light max-w-[280px]">
                FOLIO reads corporate-action multipliers and checks them against
                Solana Token-2022 Scaled UI — so raw balances never silently lie
                after splits or dividends.
              </p>
            </div>
          </article>

          {/* Card 2 — video */}
          <article className="relative h-[380px] sm:h-[460px] rounded-2xl bg-neutral-950 overflow-hidden flex flex-col">
            <div
              className="relative w-full overflow-hidden"
              style={{ height: "75%" }}
            >
              <video
                className="w-full h-full object-cover block"
                autoPlay
                loop
                muted
                playsInline
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260421_072701_f6a01abb-eb30-4559-9d6e-774362defbc3.mp4"
              />
              <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-neutral-950"
                aria-hidden
              />
            </div>
            <div className="flex-1 flex items-center justify-start p-6 sm:p-8">
              <h3 className="text-white text-xl sm:text-2xl font-light leading-tight text-left">
                Safe routes
                <br />
                before you buy
              </h3>
            </div>
          </article>

          {/* Card 3 */}
          <article className="relative h-[380px] sm:h-[460px] rounded-2xl bg-neutral-950 overflow-hidden p-6 sm:p-8">
            <div
              className="absolute -top-28 -right-28 h-56 w-56 rounded-full bg-[#1e3a8a] blur-3xl opacity-40"
              aria-hidden
            />
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-white text-xl sm:text-2xl font-light leading-tight">
                Credit without
                <br />
                selling shares
              </h3>
              <p className="mt-auto text-[13px] sm:text-[14px] leading-relaxed text-white/70 font-light max-w-[320px]">
                Live Kamino reads power illustrative borrow capacity. Broadcast
                stays paused until funded — every refusal stays labeled.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
