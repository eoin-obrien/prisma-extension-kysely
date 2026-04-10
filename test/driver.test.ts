import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import type { SqlDriverAdapterFactory } from "@prisma/client/runtime/library";
import type { TransactionSettings } from "kysely";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaConnection } from "../src/connection.js";
import { PrismaDriver } from "../src/driver.js";

const TEST_DB = (process.env.TEST_DB ?? "sqlite") as "sqlite" | "postgres";
const DATABASE_URL =
  process.env.DATABASE_URL ??
  (TEST_DB === "postgres"
    ? "postgres://test:test@localhost:5433/test"
    : "file:./dev.db");

function makeAdapter(): SqlDriverAdapterFactory {
  if (TEST_DB === "postgres") {
    return new PrismaPg({ connectionString: DATABASE_URL });
  }
  return new PrismaBetterSqlite3({ url: DATABASE_URL });
}

describe(`PrismaDriver (${TEST_DB})`, () => {
  const adapter = makeAdapter();
  const prisma = new PrismaClient({ adapter });
  let driver: PrismaDriver<typeof prisma>;
  let connection: PrismaConnection;

  beforeEach(() => {
    driver = new PrismaDriver(prisma);
    connection = new PrismaConnection(prisma);
  });

  afterEach(() => {
    // Clean up any resources if needed
  });

  it("should acquire a connection", async () => {
    const connection = await driver.acquireConnection();
    expect(connection).toBeDefined();
    expect(connection).toBeInstanceOf(PrismaConnection);
  });

  it("should throw an error when beginning a transaction", async () => {
    const settings: TransactionSettings = {};
    await expect(driver.beginTransaction(connection, settings)).rejects.toThrow(
      "prisma-extension-kysely does not support transactions",
    );
  });

  it("should throw an error when committing a transaction", async () => {
    await expect(driver.commitTransaction(connection)).rejects.toThrow(
      "prisma-extension-kysely does not support transactions",
    );
  });

  it("should throw an error when rolling back a transaction", async () => {
    await expect(driver.rollbackTransaction(connection)).rejects.toThrow(
      "prisma-extension-kysely does not support transactions",
    );
  });

  it("should release a connection", async () => {
    await driver.releaseConnection(connection);
    // Add assertions if needed
  });

  it("should destroy the driver", async () => {
    await driver.destroy();
  });
});
