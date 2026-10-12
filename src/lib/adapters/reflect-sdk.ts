/**
 * Reflect SDK handoff — mint/redeem transaction builders live in
 * `@reflectmoney/stable.ts`. FOLIO's fail-closed read path uses REST
 * (`adapters/reflect.ts`) so SSR never loads Codama/Kit venue plumbing.
 * Import this module only from client or funded execute paths.
 */
export const REFLECT_SDK_PACKAGE = "@reflectmoney/stable.ts" as const;
export const REFLECT_SDK_DOCS =
  "https://docs.reflect.money/api-reference/stablecoin" as const;

export type ReflectSdkHandoff = {
  packageName: typeof REFLECT_SDK_PACKAGE;
  docsUrl: typeof REFLECT_SDK_DOCS;
  note: string;
};

export function reflectSdkHandoff(): ReflectSdkHandoff {
  return {
    packageName: REFLECT_SDK_PACKAGE,
    docsUrl: REFLECT_SDK_DOCS,
    note: "REST mainnet-read for desk honesty · SDK for mint/redeem txs when you fund execute",
  };
}
