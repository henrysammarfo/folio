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
    expect(isLabUiId("desk-density-a")).toBe(true);
    expect(isLabUiId("desk-density-b")).toBe(true);
    expect(isLabUiId("gate-chip")).toBe(true);
    expect(isLabUiId("desk-density-z")).toBe(false);
    expect(isLabUiId("")).toBe(false);
    expect(LAB_UI_IDS).toHaveLength(3);
  });

  it("accepts only known shader candidate ids", () => {
    expect(isLabShaderId("ink-ledger")).toBe(true);
    expect(isLabShaderId("ledger-mist")).toBe(true);
    expect(isLabShaderId("aurora-grid")).toBe(true);
    expect(isLabShaderId("ink-ledger-x")).toBe(false);
    expect(LAB_SHADER_IDS).toHaveLength(3);
  });

  it("builds chat reply lines Henry can paste", () => {
    expect(chatReplyForPick("ui", "desk-density-a")).toBe(
      "Approve lab UI: desk-density-a",
    );
    expect(chatReplyForPick("shaders", "ink-ledger")).toBe(
      "Approve lab shader: ink-ledger",
    );
  });
});
