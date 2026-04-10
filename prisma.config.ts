import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL is picked up from the environment so the same config works for
// both `prisma db push --schema prisma/schema.prisma` (sqlite) and
// `prisma db push --schema prisma/postgres.schema.prisma` (postgres).
// Falls back to the local sqlite file when nothing is set, matching the
// original `npm run pretest` behavior.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
