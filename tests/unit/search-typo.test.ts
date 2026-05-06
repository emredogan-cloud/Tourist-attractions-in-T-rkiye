import { describe, expect, it } from "vitest";
import { DbSearchProvider } from "~/server/providers/search/db-provider";

const provider = new DbSearchProvider();

describe("DbSearchProvider typo tolerance", () => {
  it("matches single typo on 8-char query: kapadoya → Kapadokya", async () => {
    const r = await provider.search({ q: "kapadoya", locale: "tr", limit: 5 });
    expect(r.hits[0]?.name).toMatch(/Kapadokya/);
  });

  it("matches single typo on en: ephesos → Ephesus", async () => {
    const r = await provider.search({ q: "ephesos", locale: "en", limit: 5 });
    expect(r.hits[0]?.name).toMatch(/Ephesus/);
  });
});
