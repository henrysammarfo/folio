import { describe, expect, it } from "vitest";
import { humanizeWashNote } from "../humanize-copy";

describe("humanizeWashNote", () => {
  it("maps bitquery errors to plain language", () => {
    expect(humanizeWashNote("bitquery_http_error")).toMatch(/unreachable/i);
    expect(humanizeWashNote("prefix bitquery_http_error suffix")).toMatch(
      /unreachable/i,
    );
  });

  it("passes through already-human notes", () => {
    expect(humanizeWashNote("Catalog unavailable")).toBe("Catalog unavailable");
  });
});
