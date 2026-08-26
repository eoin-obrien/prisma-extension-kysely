import {
  DummyDriver,
  Kysely,
  MssqlAdapter,
  MssqlIntrospector,
  MssqlQueryCompiler,
} from "kysely";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { PrismaConnection } from "../src/connection.js";

interface Database {
  products: {
    id: number;
    name: string;
  };
}

describe("PrismaConnection", () => {
  const prisma = {
    $executeRawUnsafe: vi.fn(() => 0),
    $queryRawUnsafe: vi.fn(() => []),
  };
  const kysely = new Kysely<Database>({
    dialect: {
      createAdapter: () => new MssqlAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (db) => new MssqlIntrospector(db),
      createQueryCompiler: () => new MssqlQueryCompiler(),
    },
  });

  beforeEach(async () => {
    prisma.$queryRawUnsafe.mockClear();
    prisma.$executeRawUnsafe.mockClear();
  });

  test("should delegate to $queryRawUnsafe when INSERT query has OUTPUT clause", async () => {
    const conn = new PrismaConnection(prisma);
    await conn.executeQuery(
      kysely
        .insertInto("products")
        .values({ id: 1, name: "Product 1" })
        .outputAll("inserted")
        .compile(),
    );
    expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  test("should delegate to $queryRawUnsafe when UPDATE query has OUTPUT clause", async () => {
    const conn = new PrismaConnection(prisma);
    await conn.executeQuery(
      kysely
        .updateTable("products")
        .set({ name: "Updated Product 1" })
        .outputAll("inserted")
        .compile(),
    );
    expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  test("should delegate to $queryRawUnsafe when DELETE query has OUTPUT clause", async () => {
    const conn = new PrismaConnection(prisma);
    await conn.executeQuery(
      kysely.deleteFrom("products").outputAll("deleted").compile(),
    );
    expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });
});
