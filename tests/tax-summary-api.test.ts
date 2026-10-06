import { describe, expect, it } from "vitest";
import { GET as getTaxSummary } from "@/app/api/filers/[id]/tax-summary/route";

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (id: string, query: string) =>
  new Request(`http://localhost/api/filers/${id}/tax-summary${query}`);

describe("tax summary API", () => {
  it("returns the filer's forms and a totals row as CSV", async () => {
    const response = await getTaxSummary(request("fil_marlow", "?year=2025"), params("fil_marlow"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="tax-summary-fil_marlow-2025.csv"',
    );

    const lines = (await response.text()).trim().split("\r\n");
    expect(lines).toEqual([
      "form_type,issuer,amount_usd,federal_withholding_usd",
      "W-2,Cobalt Goods,41800.00,3960.00",
      "1098-T,Lumen Education,4000.00,0.00",
      "Total income,,41800.00,3960.00",
    ]);
  });

  it("returns 404 for an unknown filer", async () => {
    const response = await getTaxSummary(request("fil_missing", "?year=2025"), params("fil_missing"));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Filer not found" });
  });

  it("returns 400 for a missing, malformed, or future year", async () => {
    for (const query of ["", "?year=25", "?year=abcd", "?year=2026"]) {
      const response = await getTaxSummary(request("fil_marlow", query), params("fil_marlow"));
      expect(response.status, query).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "year must be a four-digit tax year no later than 2025",
      });
    }
  });
});
