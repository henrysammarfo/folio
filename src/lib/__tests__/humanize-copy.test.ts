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

  it("humanizes jupiter rate limit codes", () => {
    expect(scrubOpsJargon("jupiter_rate_limited")).toMatch(/cooling/i);
  });
});

describe("humanizeVenueNote", () => {
  it("softens rate-limit blanks on markets board", async () => {
    const { humanizeVenueNote } = await import("../humanize-copy");
    expect(humanizeVenueNote("jupiter_rate_limited")).toMatch(/cooling/i);
    expect(humanizeVenueNote("live")).toBe("live");
  });
});

describe("humanizeWashNote gecko soft", () => {
  it("scrubs GeckoTerminal jargon from free-path notes", () => {
    expect(
      humanizeWashNote(
        "No recent GeckoTerminal trades for mint — paused for safety.; Free path via GeckoTerminal · pool ANDURIL / USDC",
      ),
    ).not.toMatch(/GeckoTerminal/i);
  });
});
