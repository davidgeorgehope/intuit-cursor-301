import { describe, expect, it } from "vitest";
import { GET as getTaxSummary } from "@/app/api/filers/[id]/tax-summary/route";
import { prisma } from "@/lib/prisma";
import { TAX_YEAR } from "@/lib/tax-year";

const params = (id: string) => ({ params: Promise.resolve({ id }) });

const yearError = `year must be a four-digit tax year no later than ${TAX_YEAR}`;

describe("tax summary API", () => {
  it("returns one filer's forms and totals as CSV", async () => {
    const response = await getTaxSummary(
      new Request(`http://localhost/api/filers/fil_marlow/tax-summary?year=${TAX_YEAR}`),
      params("fil_marlow"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe(
      `attachment; filename="tax-summary-fil_marlow-${TAX_YEAR}.csv"`,
    );

    const csv = await response.text();
    expect(csv).toBe(
      [
        "form_type,issuer,amount_usd,federal_withholding_usd",
        "W-2,Cobalt Goods,41800.00,3960.00",
        "1098-T,Lumen Education,4000.00,0.00",
        "total,,41800.00,3960.00",
      ].join("\n") + "\n",
    );

    const filer = await prisma.filer.findUnique({ where: { id: "fil_marlow" }, select: { ssnLast4: true } });
    expect(filer?.ssnLast4).toMatch(/^\d{4}$/);
    expect(csv).not.toContain(filer?.ssnLast4);
    expect(csv).not.toMatch(/\d{3}-\d{2}-\d{4}/);
  });

  it("returns 404 when the filer is missing", async () => {
    const response = await getTaxSummary(
      new Request(`http://localhost/api/filers/fil_missing/tax-summary?year=${TAX_YEAR}`),
      params("fil_missing"),
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Filer not found" });
  });

  it("returns 400 when the year is later than the tax year", async () => {
    const response = await getTaxSummary(
      new Request(`http://localhost/api/filers/fil_marlow/tax-summary?year=${TAX_YEAR + 1}`),
      params("fil_marlow"),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: yearError });
  });
});
