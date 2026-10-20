import path from "node:path";
import { defineConfig } from "prisma/config";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";

const databaseUrl = path.join(process.cwd(), "prisma", "dev.db");

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  experimental: { adapter: true },
  engine: "js",
  adapter() {
    return Promise.resolve(new PrismaBetterSQLite3({ url: databaseUrl }));
  },
});
