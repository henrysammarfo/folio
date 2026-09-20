import { describe, expect, it } from "vitest";
import { isFolioOpsEnabled } from "../auth/ops-access";

describe("isFolioOpsEnabled", () => {
  it("defaults off", () => {
    expect(isFolioOpsEnabled({} as NodeJS.ProcessEnv)).toBe(false);
    expect(isFolioOpsEnabled({ FOLIO_OPS: "0" } as NodeJS.ProcessEnv)).toBe(
      false,
    );
  });

  it("arms only when FOLIO_OPS=1", () => {
    expect(isFolioOpsEnabled({ FOLIO_OPS: "1" } as NodeJS.ProcessEnv)).toBe(
      true,
    );
  });
});
