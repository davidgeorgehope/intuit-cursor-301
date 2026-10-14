import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extensionDaysLeft } from "@/lib/extension-pace";
import { HEALTHY_RETURN, PLANTED_RETURN, plantExtensionPace, restoreExtensionPace } from "@/lib/mission-source";

describe("extension pace", () => {
  it("counts 7 days from the frozen clock to the extension deadline", () => {
    expect(extensionDaysLeft()).toBe(7);
  });

  it("ships the healthy return line", () => {
    expect(readFileSync("lib/extension-pace.ts", "utf8")).toContain(HEALTHY_RETURN);
    expect(readFileSync("lib/extension-pace.ts", "utf8")).not.toContain(PLANTED_RETURN);
  });

  it("plants and restores the off-by-one", () => {
    const healthy = readFileSync("lib/extension-pace.ts", "utf8");
    const planted = plantExtensionPace(healthy);
    expect(planted).toContain(PLANTED_RETURN);
    expect(planted).not.toContain(HEALTHY_RETURN);
    expect(restoreExtensionPace(planted)).toBe(healthy);
    expect(plantExtensionPace(planted)).toBe(planted);
    expect(restoreExtensionPace(healthy)).toBe(healthy);
  });
});
