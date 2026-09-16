import { describe, expect, it } from "vitest";
import {
  LAB_SHADER_IDS,
  LAB_UI_IDS,
  chatReplyForPick,
  isLabShaderId,
  isLabUiId,
} from "../lab-pick";

describe("lab-pick", () => {
  it("accepts only known UI candidate ids", () => {
    expect(isLabUiId("netro-density")).toBe(true);
    expect(isLabUiId("aionis-brand-plane")).toBe(true);
    expect(isLabUiId("cinematic-landing-21st")).toBe(true);
    expect(isLabUiId("trade-journal-21st")).toBe(true);
    expect(isLabUiId("desk-density-a")).toBe(false);
    expect(isLabUiId("")).toBe(false);
    expect(LAB_UI_IDS).toHaveLength(4);
    // Stocklana desk recommend: Netro 12-col leads the pick list
    expect(LAB_UI_IDS[0]).toBe("netro-density");
  });

  it("accepts only known shader candidate ids", () => {
    expect(isLabShaderId("ink-ledger")).toBe(true);
    expect(isLabShaderId("ledger-mist")).toBe(true);
    expect(isLabShaderId("aurora-grid")).toBe(true);
    expect(isLabShaderId("ink-ledger-x")).toBe(false);
    expect(LAB_SHADER_IDS).toHaveLength(3);
  });

  it("builds chat reply lines Henry can paste", () => {
    expect(chatReplyForPick("ui", "netro-density")).toBe(
      "Approve lab UI: netro-density",
    );
    expect(chatReplyForPick("shaders", "ink-ledger")).toBe(
      "Approve lab shader: ink-ledger",
    );
  });
});
