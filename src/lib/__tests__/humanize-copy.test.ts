import { describe, expect, it } from "vitest";
import {
  humanizeGateReason,
  humanizeWashNote,
  scrubOpsJargon,
} from "../humanize-copy";

describe("humanizeWashNote", () => {
  it("maps bitquery errors to plain language without key names", () => {
    expect(humanizeWashNote("bitquery_http_error")).toMatch(/unreachable|tape/i);
    expect(humanizeWashNote("prefix bitquery_http_error suffix")).toMatch(
      /unreachable|tape/i,
    );
    expect(humanizeWashNote("bitquery_http_error")).not.toMatch(/bitquery/i);
  });

  it("passes through already-human notes", () => {
    expect(humanizeWashNote("Catalog unavailable")).toBe("Catalog unavailable");
  });
});

describe("humanizeGateReason", () => {
  it("scrubs env key names from gate strings", () => {
    expect(
      humanizeGateReason(
        "Wash gate: BITQUERY_API_KEY missing · fail-closed (set on Vercel + .env)",
      ),
    ).not.toMatch(/BITQUERY|Vercel|\.env/i);
  });

  it("maps market-tape wash block", () => {
    expect(
      humanizeGateReason(
        "Market tape unavailable — buy paused until wash checks are live",
      ),
    ).toMatch(/Market tape/i);
  });
});

describe("scrubOpsJargon", () => {
  it("replaces fail-closed", () => {
    expect(scrubOpsJargon("Blocked · fail-closed")).toMatch(/paused for safety/i);
  });
});
