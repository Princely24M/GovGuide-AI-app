import { describe, expect, it } from "vitest";

describe("Supabase connectivity", () => {
  it("can read the public departments endpoint with the configured publishable key", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    expect(url, "VITE_SUPABASE_URL must be configured").toBeTruthy();
    expect(key, "VITE_SUPABASE_PUBLISHABLE_KEY must be configured").toBeTruthy();

    const response = await fetch(`${url}/rest/v1/departments?select=id&limit=1`, {
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key!}`,
      },
    });

    expect(response.ok, await response.text()).toBe(true);
  }, 15000);
});
