import { describe, expect, it } from "vitest";

describe("Supabase production data contract", () => {
  it("exposes the tables required by the real persistence flows", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    expect(url).toBeTruthy();
    expect(key).toBeTruthy();

    const tables = ["offices", "checklists", "checklist_items", "conversations", "messages", "reports", "activity"];
    const responses = await Promise.all(tables.map(table => fetch(`${url}/rest/v1/${table}?select=id&limit=1`, { headers: { apikey: key!, Authorization: `Bearer ${key!}` } })));

    for (const response of responses) {
      expect(response.status, `Supabase returned a missing-table response for ${response.url}`).not.toBe(404);
    }
  }, 15000);
});
