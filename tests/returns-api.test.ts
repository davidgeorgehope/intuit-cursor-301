import { describe, expect, it } from "vitest";
import { GET as getReturns } from "@/app/api/returns/route";
import { GET as getReturn } from "@/app/api/returns/[id]/route";

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("returns API", () => {
  it("returns one return with its filer and forms", async () => {
    const response = await getReturn(new Request("http://localhost/api/returns/ret_1043"), params("ret_1043"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.return).toMatchObject({ id: "ret_1043", number: "TY25-1043", taxYear: 2025 });
    expect(body.return.filer.name).toBe("Ellis Marlow");
    expect(body.return.forms.map((form: { formType: string }) => form.formType)).toEqual(["W-2", "1098-T"]);
  });

  it("returns 404 when the return is missing", async () => {
    const response = await getReturn(new Request("http://localhost/api/returns/ret_missing"), params("ret_missing"));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Return not found" });
  });

  it("filters the list by status", async () => {
    const response = await getReturns(new Request("http://localhost/api/returns?status=REJECTED"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.returns.map((taxReturn: { rejectCode: string }) => taxReturn.rejectCode).sort()).toEqual([
      "IND-031-04",
      "IND-032-04",
      "IND-181-01",
    ]);
  });

  it("filters the list by every status", async () => {
    const seeded = { ALL: 24, EXTENDED: 6, READY: 1, TRANSMITTED: 1, ACCEPTED: 13, REJECTED: 3 };
    for (const [status, count] of Object.entries(seeded)) {
      const response = await getReturns(new Request(`http://localhost/api/returns?status=${status}`));
      expect(response.status, status).toBe(200);
      const { returns } = await response.json();
      expect(returns, status).toHaveLength(count);
      if (status !== "ALL") {
        expect(returns.every((taxReturn: { status: string }) => taxReturn.status === status), status).toBe(true);
      }
    }

    const unfiltered = await getReturns(new Request("http://localhost/api/returns"));
    expect((await unfiltered.json()).returns).toHaveLength(24);
  });

  it("searches by return number, filer name, and state", async () => {
    const search = async (q: string) => {
      const response = await getReturns(new Request(`http://localhost/api/returns?q=${encodeURIComponent(q)}`));
      const { returns } = await response.json();
      return returns.map((taxReturn: { number: string }) => taxReturn.number).sort();
    };

    expect(await search("ty25-1043")).toEqual(["TY25-1043"]);
    expect(await search(" MARLOW ")).toEqual(["TY25-1043"]);
    expect(await search("tx")).toEqual(["TY25-1044", "TY25-2014"]);
  });

  it("rejects an unknown status with 400", async () => {
    const response = await getReturns(new Request("http://localhost/api/returns?status=BOGUS"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "status must be one of ALL, EXTENDED, READY, TRANSMITTED, ACCEPTED, REJECTED",
    });
  });
});
