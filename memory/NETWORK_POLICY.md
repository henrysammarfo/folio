# FOLIO — NETWORK POLICY (Stocklana + Colosseum World’s Fair)

> Locked 2026-09-15 · Budget: ≤~$1 effective mainnet spend (keep ~$9 of $10)

## Verdict (plain)

We are **mainnet-primary for truth**, not “full mainnet broadcast everything,” and not “devnet cosplay as mainnet.”

| Layer | Network | Why |
|---|---|---|
| xStocks multiplier / asset / mint | **Mainnet READ** | Real Token-2022 ScaledUiAmount only on mainnet |
| Jupiter quote + Jupiter Price v3 | **Mainnet READ / quote-only** | Devnet routes ≈ empty; quotes are free |
| Pool / Kamino / Jup Lend / NestUSD | **Mainnet READ** | Markets live on mainnet |
| Wash / Bitquery | **Mainnet READ** (fail-closed until key) | Tape is mainnet |
| Swap / borrow **broadcast** | **Disabled** until funded + explicit confirm | ≤~$1 cannot cover program rent or sized credit |
| Borrow / CPI proofs | **Local mainnet-fork** | Honest CPI without spend |
| Optional FOLIO policy harness | **Devnet OK** | Free airdrop experiments only — never labeled as mainnet fill |
| Custom program **mainnet deploy** | **Out** | ~1 SOL rent for ~200KB ≫ $1 |

## Why this still wins World’s Fair

Colosseum / World’s Fair criteria reward **working product, Solana-native reason, honesty**.  
Live mainnet multiplier + refuse-wash + Jupiter quote + credit **reads** with labeled modes beats a fake “we swapped on mainnet” demo.

When budget grows: flip broadcast flags after funded wallet + threat review — no architecture rewrite.

## Labels required in UI

`mainnet-read` · `quote-only` · `fork` · `devnet` · `paper` · `unavailable`
