/** Shared site URL + social meta for FOLIO pages. */
export const SITE_URL = "https://folio-tawny-one.vercel.app";
export const SITE_NAME = "FOLIO";
export const DEFAULT_TITLE = "FOLIO — Buy tokenized stocks on Solana";
export const DEFAULT_DESCRIPTION =
  "Honest share counts, safe routes, and credit without selling — your stock desk on Solana.";

export function siteMeta(input?: {
  title?: string;
  description?: string;
  path?: string;
}) {
  const title = input?.title ?? DEFAULT_TITLE;
  const description = input?.description ?? DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${input?.path ?? "/"}`;
  const image = `${SITE_URL}/og.png`;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}
