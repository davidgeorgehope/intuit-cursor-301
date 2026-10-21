#!/usr/bin/env node
// preToolUse: deny writes to filer data, tax-year figures, env files, and the
// user-level hooks file. "ask" is not returned. Cursor accepts "ask" for
// preToolUse and does not enforce it.

import { isDirectRun, readStdinJson, writeJson } from "./hook-io.mjs";

export const PROTECTED_SUFFIXES = [
  "prisma/seed.ts",
  "prisma/extra-filers.ts",
  "lib/tax-year.ts",
  ".env",
  ".env.local",
  ".env.production",
];

function normalize(filePath) {
  return String(filePath).replaceAll("\\", "/");
}

export function isProtectedPath(filePath) {
  const normalized = normalize(filePath);
  return PROTECTED_SUFFIXES.some((suffix) => normalized === suffix || normalized.endsWith(`/${suffix}`));
}

export function isUserHooksFile(filePath, workspaceRoots) {
  const normalized = normalize(filePath);
  if (!normalized.endsWith("/.cursor/hooks.json") && normalized !== ".cursor/hooks.json") return false;
  const roots = (workspaceRoots ?? []).map((root) => normalize(root).replace(/\/$/, ""));
  return !roots.some((root) => normalized === `${root}/.cursor/hooks.json`);
}

function pathsFrom(input) {
  const toolInput = input.tool_input && typeof input.tool_input === "object" ? input.tool_input : {};
  const candidates = [toolInput.path, toolInput.file_path, toolInput.target_file, input.file_path];
  return candidates.filter((value) => typeof value === "string");
}

export function decideWrite(input) {
  const toolName = typeof input.tool_name === "string" ? input.tool_name : "";
  if (toolName && !/write|delete|strreplace|editnotebook/i.test(toolName)) {
    return { permission: "allow" };
  }
  const roots = Array.isArray(input.workspace_roots) ? input.workspace_roots : [];
  const paths = pathsFrom(input);
  const hit = paths.find((filePath) => isProtectedPath(filePath) || isUserHooksFile(filePath, roots));
  if (!hit) return { permission: "allow" };
  const userHooks = isUserHooksFile(hit, roots);
  const message = userHooks
    ? "Blocked a write to the user-level hooks file. Put project hooks in .cursor/hooks.json. Editing ~/.cursor/hooks.json can disable managed hooks."
    : `Blocked a write to ${hit}. Filer data and tax-year figures stay as seeded.`;
  return {
    permission: "deny",
    user_message: message,
    agent_message: message,
  };
}

async function main() {
  const input = await readStdinJson();
  writeJson(decideWrite(input));
}

if (isDirectRun(import.meta.url)) {
  await main();
}
