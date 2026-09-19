import { Analytics } from "@vercel/analytics/react";
import { useEffect, useState } from "react";
import { readCookieConsent, type CookieConsent } from "@/components/cookie-consent";

/** Vercel Analytics — mounts only after cookie Accept. */
export function ConsentAnalytics() {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const sync = () => setOk(readCookieConsent() === "accepted");
    sync();
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<CookieConsent>).detail;
      setOk(detail === "accepted");
    };
    window.addEventListener("folio-cookie-consent", onCustom);
    return () => window.removeEventListener("folio-cookie-consent", onCustom);
  }, []);

  if (!ok) return null;
  return <Analytics />;
}
