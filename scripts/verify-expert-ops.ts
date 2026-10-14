import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkCreditReview, checkRejectsPage, checkReturnsApi, type ConsoleCheck } from "@/lib/verify-console";

const base = process.env.VERIFY_BASE_URL ?? "http://127.0.0.1:43173";
const evidenceDir = join(process.cwd(), "artifacts/verify-expert-ops");

async function fetchText(path: string): Promise<{ status: number; text: string }> {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(4000) });
  return { status: response.status, text: await response.text() };
}

function writeEvidence(check: ConsoleCheck) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, `${check.id}.txt`), `${check.pass ? "PASS" : "FAIL"} ${check.id}: ${check.detail}\n`);
}

async function main() {
  let returns: ConsoleCheck;
  let rejects: ConsoleCheck;
  let review: ConsoleCheck;
  try {
    const returnsResponse = await fetchText("/api/returns");
    let body: unknown = null;
    try {
      body = JSON.parse(returnsResponse.text);
    } catch {
      body = null;
    }
    returns = checkReturnsApi(returnsResponse.status, body);
    const rejectsResponse = await fetchText("/rejects");
    rejects = checkRejectsPage(rejectsResponse.status, rejectsResponse.text);
    const reviewResponse = await fetchText("/reviews/rev_1043");
    review = checkCreditReview(reviewResponse.status, reviewResponse.text);
  } catch {
    const down: ConsoleCheck = {
      id: "doctor",
      pass: false,
      detail: `server is not answering at ${base}. Start it with npm run dev, then rerun npm run verify.`,
    };
    console.log(`FAIL ${down.id}: ${down.detail}`);
    writeEvidence(down);
    process.exitCode = 1;
    return;
  }

  const checks = [returns, rejects, review];
  for (const check of checks) {
    console.log(`${check.pass ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
    writeEvidence(check);
  }
  console.log(`evidence: ${evidenceDir}`);
  if (checks.some((check) => !check.pass)) process.exitCode = 1;
}

await main();
