import { readFileSync, writeFileSync } from "node:fs";
import { plantExtensionPace, restoreExtensionPace } from "@/lib/mission-source";

const file = "lib/extension-pace.ts";
const source = readFileSync(file, "utf8");
const restore = process.argv.includes("--restore");
const next = restore ? restoreExtensionPace(source) : plantExtensionPace(source);
writeFileSync(file, next);
console.log(restore ? "restored lib/extension-pace.ts" : "planted an off-by-one in lib/extension-pace.ts");
