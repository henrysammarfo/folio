# Tokenized equities field map (Uniswap + peers)

> Updated 2026-09-20 · Research for Phase A+ · **never claim unhackable**  
> FOLIO ship surface today: **Solana xStocks (Backed) via Jupiter** · PreStocks · Tessera.  
> Uniswap / Ondo / Dinari are **ecosystem context** — not “ignore,” not “port tomorrow.”

## Why this matters

Judges and investors compare desks. Saying “we use Jupiter” without knowing UniswapX / Ondo / Dinari looks thin. FOLIO’s wedge stays Solana-native honesty (Scaled UI · wash · quote · credit) — but copy and partner lanes must be accurate vs the field.

## Venue / rails

| Rail | Role | FOLIO implication |
|---|---|---|
| **Jupiter Swap V2** (`/order` + `/execute`) | Solana meta-aggregator (Metis, JupiterZ, Dflow, OKX) · gasless paths | **Primary live path** for xStocks buys |
| **Uniswap + UniswapX** | Eth/BNB discovery + intent routing; Ondo stocks live on Uniswap app/API; gasless/MEV-aware via UniswapX | Web2 users may know Uniswap first — marketing can say “Solana desk, not Uniswap clone”; **no Eth Uniswap integration in Phase A** (wrong chain for our mint set) |
| Raydium / Meteora | Solana pool venues under Jupiter | Awareness only (already pooled in matrix) |

## Issuers / products (structure ≠ price chart)

| Product | Chain bias | What holder actually gets | FOLIO use |
|---|---|---|---|
| **xStocks (Backed)** | Solana-strong, multi-chain | Tracker / certificate · DeFi-native · retail redeem often market-exit not issuer | **Core Buy desk** |
| **Ondo Stocks** | Eth / BNB / also Solana | Secured note · large catalog · KYC / eligibility gates · Uniswap distribution | Competitor / later optional lane — not Phase A |
| **Dinari dShares** | More onshore BD rails | Closer to broker-custody model · less free DeFi composability | Competitor honesty in docs |
| **Superstate / Securitize** | Ownership-heavy, permissioned | Closer to registered share · narrow names | Not our wedge |
| **Backpack / SPCX-class** | Solana bridge to real share | Stronger redeem story for some names | Watch / optional later |
| **PreStocks** | Solana pre-IPO | SPV / synthetic private exposure — **high structure risk** (2026 dislocations reported in research) | **Separate desk** · never mix into public xStock truth |
| **Tessera** | Solana T-tokens | Loan-participation style — **not equity shares** | **Separate desk** · label honestly |
| **Robinhood / CEX wrappers** | Closed app | Convenient · often non-exportable | Web2 comparison in pitch only |
| **Swarm** | EU certificate tokens | Regulated EU path | Out of Phase A |

## Retail questions (drive UI honesty)

- Liquidity / spreads vs NYSE hours  
- Dividends vs **Scaled UI** balance bumps  
- Freeze / mint authority (“why does this look scammy on explorers?”)  
- “Do I own the share?” → usually **no** for xStocks/Ondo notes  
- Who can use it (US / KYC / geo)

FOLIO answers with: share-count truth · wash refuse · clear route · borrow without selling · plain labels on PreStocks/Tessera.

## Phase A decision

1. Ship **Jupiter V2** for Solana xStocks (this branch).  
2. Document Uniswap/Ondo as **Eth distribution peers**, not a second swap stack.  
3. Phase E partner lanes: PreStocks + Tessera used meaningfully on overview with structure labels.  
4. Revisit Ondo-on-Solana or cross-venue only after $10 arm is real and stable.

## Sources (sampled 2026-09-20)

- Ondo × Uniswap blog · Uniswap tokenized securities blog  
- CoinDesk “Equities on Crypto Rails”  
- Pine Analytics Solana tokenized equities · issuer comparison writeups  
- Jupiter Order & Execute / gasless docs  
