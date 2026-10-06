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
});
