import { describe, it, expect } from "vitest";
import { buildProtomapsStyleUrl } from "@/lib/maps/protomaps-style";

describe("buildProtomapsStyleUrl", () => {
  it("builds expected style URL", () => {
    expect(buildProtomapsStyleUrl("light", "abc123")).toBe(
      "https://api.protomaps.com/styles/v5/light/en.json?key=abc123"
    );
  });
});
