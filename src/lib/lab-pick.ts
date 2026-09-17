/** Lab approve-gate helpers. Picks stay local until Henry replies in chat — never auto-merge. */

export const LAB_UI_IDS = [
  "netro-density",
  "aionis-brand-plane",
  "cinematic-landing-21st",
  "trade-journal-21st",
] as const;

export const LAB_SHADER_IDS = [
  "ink-ledger",
  "ledger-mist",
  "aurora-grid",
] as const;

export type LabUiId = (typeof LAB_UI_IDS)[number];
export type LabShaderId = (typeof LAB_SHADER_IDS)[number];

export const LAB_UI_STORAGE_KEY = "folio.lab.uiPick";
export const LAB_SHADER_STORAGE_KEY = "folio.lab.shaderPick";
/** Session-only: opt-in desk preview of a lab pick. Cleared on Exit / tab close. */
export const LAB_PREVIEW_SESSION_KEY = "folio.lab.previewActive";

/** Production merge after Henry chat approve — set on Vercel, never auto from local Pick. */
export const APPROVED_LAB_UI_ENV = "FOLIO_APPROVED_LAB_UI";
export const APPROVED_LAB_SHADER_ENV = "FOLIO_APPROVED_LAB_SHADER";

export function isLabUiId(value: string | null | undefined): value is LabUiId {
  return !!value && (LAB_UI_IDS as readonly string[]).includes(value);
}

export function isLabShaderId(
  value: string | null | undefined,
): value is LabShaderId {
  return !!value && (LAB_SHADER_IDS as readonly string[]).includes(value);
}

export function chatReplyForPick(kind: "ui" | "shaders", id: string): string {
  return kind === "ui"
    ? `Approve lab UI: ${id}`
    : `Approve lab shader: ${id}`;
}

/** Server-only: Henry-approved production desk chrome (env after chat reply). */
export function readApprovedLabUi(
  env: NodeJS.ProcessEnv = process.env,
): LabUiId | null {
  const raw = env[APPROVED_LAB_UI_ENV]?.trim();
  return isLabUiId(raw) ? raw : null;
}

export function readApprovedLabShader(
  env: NodeJS.ProcessEnv = process.env,
): LabShaderId | null {
  const raw = env[APPROVED_LAB_SHADER_ENV]?.trim();
  return isLabShaderId(raw) ? raw : null;
}

export function readLabUiPick(): LabUiId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAB_UI_STORAGE_KEY);
    return isLabUiId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function readLabShaderPick(): LabShaderId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAB_SHADER_STORAGE_KEY);
    return isLabShaderId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeLabUiPick(id: LabUiId): void {
  window.localStorage.setItem(LAB_UI_STORAGE_KEY, id);
}

export function writeLabShaderPick(id: LabShaderId): void {
  window.localStorage.setItem(LAB_SHADER_STORAGE_KEY, id);
}

export function isLabPreviewActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(LAB_PREVIEW_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function startLabPreview(): void {
  window.sessionStorage.setItem(LAB_PREVIEW_SESSION_KEY, "1");
}

export function stopLabPreview(): void {
  try {
    window.sessionStorage.removeItem(LAB_PREVIEW_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
