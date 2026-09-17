import { describe, expect, it } from "vitest";
import { isTwentyFirstConfigured } from "../lab/twentyfirst";

describe("twentyfirst lab client", () => {
  it("reports configured only when API_KEY_21ST is set", () => {
    expect(isTwentyFirstConfigured({})).toBe(false);
    expect(isTwentyFirstConfigured({ API_KEY_21ST: "  " })).toBe(false);
    expect(isTwentyFirstConfigured({ API_KEY_21ST: "21st_sk_test" })).toBe(true);
  });
});
