import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const STORAGE_KEY = "folio_cookie_consent";

export type CookieConsent = "accepted" | "essential" | null;

export function readCookieConsent(): CookieConsent {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "accepted" || v === "essential") return v;
  return null;
}

/** Cookie banner — essential always on; analytics only after Accept. */
export function CookieConsentBanner() {
  const [consent, setConsent] = useState<CookieConsent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(readCookieConsent());
    setReady(true);
  }, []);

  if (!ready || consent) return null;

  function save(next: Exclude<CookieConsent, null>) {
    window.localStorage.setItem(STORAGE_KEY, next);
    setConsent(next);
    window.dispatchEvent(new CustomEvent("folio-cookie-consent", { detail: next }));
  }

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-banner-copy">
        <p>
          We use essential cookies to run your desk. Optional analytics help us
          improve FOLIO — only if you accept.{" "}
          <Link to="/privacy">Privacy</Link>
        </p>
      </div>
      <div className="cookie-banner-actions">
        <button type="button" className="cookie-btn-secondary" onClick={() => save("essential")}>
          Essential only
        </button>
        <button type="button" className="cookie-btn-primary" onClick={() => save("accepted")}>
          Accept
        </button>
      </div>
    </div>
  );
}
