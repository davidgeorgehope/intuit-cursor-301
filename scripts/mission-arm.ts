import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isMissionId } from "@/lib/missions";

const disarm = process.argv.includes("--disarm");
const armPath = join(process.cwd(), "missions/active.json");

if (disarm) {
  rmSync(armPath, { force: true });
  console.log("disarmed");
  process.exit(0);
}

const id = process.argv.slice(2).find((arg) => !arg.startsWith("-"));
if (!id || !isMissionId(id)) {
  console.error("Usage: npm run mission:arm -- extension-pace");
  process.exit(1);
}

mkdirSync(join(process.cwd(), "missions"), { recursive: true });
writeFileSync(armPath, `${JSON.stringify({ id }, null, 2)}\n`);
console.log(`armed ${id}`);
