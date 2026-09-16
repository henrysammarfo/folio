/** Lab approve-gate helpers. Picks stay local until Henry replies in chat — never auto-merge. */

export const LAB_UI_IDS = [
  "netro-density",
  "aionis-brand-plane",
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
