import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("project MCP map", () => {
  it("ships no project MCP servers and no database MCP", () => {
    const mcp = JSON.parse(readFileSync(join(root, ".cursor/mcp.json"), "utf8"));
    expect(mcp.mcpServers).toEqual({});
    expect(existsSync(join(root, "mcp"))).toBe(false);
  });
});
