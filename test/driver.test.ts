import { PrismaClient } from "../prisma/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { TransactionSettings } from "kysely";
import { PrismaConnection } from "../src/connection.js";
import { PrismaDriver } from "../src/driver.js";

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: "file:./prisma/dev.db",
  });
  return new PrismaClient({ adapter });
}

describe("PrismaDriver", () => {
  const prisma = createPrismaClient();
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
