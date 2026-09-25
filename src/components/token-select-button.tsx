/**
 * Clickable pay/receive token control — search dropdown (Uniswap-style).
 * Keeps selection inside FOLIO; no external redirects.
 */
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AssetLogo } from "@/components/asset-logo";
import {
  XSTOCK_CATALOG,
  type XStockCatalogItem,
} from "@/lib/xstock-catalog";

export type TokenOption = {
  symbol: string;
  name: string;
  underlying?: string;
  logo?: string | null;
  kind: "usdc" | "xstock";
};

type Props = {
  value: string;
  /** USDC allowed in this leg */
  allowUsdc?: boolean;
  /** Exclude these symbols from the list (e.g. the other leg) */
  exclude?: string[];
  onChange: (symbol: string) => void;
  "aria-label"?: string;
  className?: string;
};

const POPULAR = ["USDC", "AAPLx", "TSLAx", "NVDAx", "GOOGLx"] as const;

function usdcOption(): TokenOption {
  return { symbol: "USDC", name: "USD Coin", kind: "usdc" };
}

function toOption(item: XStockCatalogItem): TokenOption {
  return {
    symbol: item.symbol,
    name: item.name,
    underlying: item.underlying,
    kind: "xstock",
  };
}

export function TokenSelectButton({
  value,
  allowUsdc = true,
  exclude = [],
  onChange,
  "aria-label": ariaLabel = "Select token",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const options = useMemo(() => {
    const ex = new Set(exclude.map((s) => s.toUpperCase()));
    const out: TokenOption[] = [];
    if (allowUsdc && !ex.has("USDC")) out.push(usdcOption());
    for (const item of XSTOCK_CATALOG) {
      if (!item.buyable) continue;
      if (ex.has(item.symbol.toUpperCase())) continue;
      out.push(toOption(item));
    }
    const needle = q.trim().toLowerCase();
    if (!needle) return out;
    return out.filter(
      (o) =>
        o.symbol.toLowerCase().includes(needle) ||
        o.name.toLowerCase().includes(needle) ||
        (o.underlying?.toLowerCase().includes(needle) ?? false),
    );
  }, [allowUsdc, exclude, q]);

  const popular = useMemo(() => {
    const ex = new Set(exclude.map((s) => s.toUpperCase()));
    return POPULAR.filter((sym) => {
      if (ex.has(sym.toUpperCase())) return false;
      if (sym === "USDC") return allowUsdc;
      return XSTOCK_CATALOG.some(
        (i) => i.buyable && i.symbol.toUpperCase() === sym.toUpperCase(),
      );
    });
  }, [allowUsdc, exclude]);

  const selected =
    value.toUpperCase() === "USDC"
      ? usdcOption()
      : toOption(
          XSTOCK_CATALOG.find(
            (i) => i.symbol.toLowerCase() === value.toLowerCase(),
          ) ?? {
            symbol: value,
            name: value,
            underlying: value.replace(/x$/i, ""),
            lane: "mega",
            buyable: true,
          },
        );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    queueMicrotask(() => inputRef.current?.focus());
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`fx-token-select ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        className="fx-token-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        {selected.kind === "usdc" ? (
          <span className="fx-logo fx-logo-fallback fx-logo-usdc" aria-hidden>
            $
          </span>
        ) : (
          <AssetLogo
            symbol={selected.symbol}
            underlying={selected.underlying}
            size={28}
          />
        )}
        <span className="fx-token-sym">{selected.symbol}</span>
        <ChevronDown size={16} strokeWidth={2.2} aria-hidden />
      </button>

      {open ? (
        <div className="fx-token-pop" role="listbox" id={listId}>
          {popular.length > 0 && !q.trim() ? (
            <div className="fx-token-popular" aria-label="Popular">
              {popular.map((sym) => {
                const on = sym.toUpperCase() === value.toUpperCase();
                const und =
                  sym === "USDC"
                    ? undefined
                    : XSTOCK_CATALOG.find(
                        (i) => i.symbol.toUpperCase() === sym.toUpperCase(),
                      )?.underlying;
                return (
                  <button
                    key={sym}
                    type="button"
                    className={on ? "is-on" : undefined}
                    onClick={() => {
                      onChange(sym);
                      setOpen(false);
                      setQ("");
                    }}
                  >
                    {sym === "USDC" ? (
                      <span
                        className="fx-logo fx-logo-fallback fx-logo-usdc"
                        aria-hidden
                        style={{ width: 18, height: 18, fontSize: 9 }}
                      >
                        $
                      </span>
                    ) : (
                      <AssetLogo
                        symbol={sym}
                        {...(und ? { underlying: und } : {})}
                        size={18}
                      />
                    )}
                    {sym === "USDC" ? "USDC" : sym.replace(/x$/i, "")}
                  </button>
                );
              })}
            </div>
          ) : null}
          <label className="fx-token-search">
            <Search size={14} strokeWidth={2.2} aria-hidden />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search USDC or stock…"
              aria-label="Search tokens"
              autoComplete="off"
            />
          </label>
          <ul className="fx-token-list">
            {options.map((o) => {
              const on = o.symbol.toUpperCase() === value.toUpperCase();
              return (
                <li key={o.symbol}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    className={`fx-token-option${on ? " is-on" : ""}`}
                    onClick={() => {
                      onChange(o.symbol);
                      setOpen(false);
                      setQ("");
                    }}
                  >
                    {o.kind === "usdc" ? (
                      <span
                        className="fx-logo fx-logo-fallback fx-logo-usdc"
                        aria-hidden
                      >
                        $
                      </span>
                    ) : (
                      <AssetLogo
                        symbol={o.symbol}
                        underlying={o.underlying}
                        size={32}
                      />
                    )}
                    <span>
                      <strong>{o.symbol}</strong>
                      <small>{o.name}</small>
                    </span>
                  </button>
                </li>
              );
            })}
            {options.length === 0 ? (
              <li className="fx-token-empty">No matches</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
