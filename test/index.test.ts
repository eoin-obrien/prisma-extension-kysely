import { PrismaClient } from "@prisma/client";
import { DummyDriver, Kysely, SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely";
import kyselyExtension from "../src";
import { DB } from "../prisma/generated/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const kysely = new Kysely<DB>({
  dialect: {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  },
});

describe("prisma-extension-kysely", () => {
  const prisma = new PrismaClient();
  const xprisma = prisma.$extends(kyselyExtension({ kysely }));

  it("should add the Kysely instance to the Prisma client", async () => {
    expect(xprisma.$kysely).toBe(kysely);
  });

  it("should not overwrite any existing Prisma client methods", async () => {
    expect(xprisma.$queryRaw).toEqual(prisma.$queryRaw);
    expect(xprisma.$queryRawUnsafe).toEqual(prisma.$queryRawUnsafe);
    expect(xprisma.$executeRaw).toEqual(prisma.$executeRaw);
    expect(xprisma.$executeRawUnsafe).toEqual(prisma.$executeRawUnsafe);
  });

  it("should execute a Kysely query with $kyselyQuery and return the result", async () => {
    const spy = jest.spyOn(xprisma, "$queryRawUnsafe").mockResolvedValueOnce([]);
    const query = kysely.selectFrom("Model").selectAll().where("id", "=", 1);
    const result = await xprisma.$kyselyQuery(query);
    expect(result).toEqual([]);
    expect(spy).toHaveBeenCalledWith(query.compile().sql, ...query.compile().parameters);
  });

  it("should execute a Kysely query with $kyselyExecute and return the number of rows affected", async () => {
    const spy = jest.spyOn(xprisma, "$executeRawUnsafe").mockResolvedValueOnce(1);
    const query = kysely.deleteFrom("Model").where("id", "=", 1);
    const result = await xprisma.$kyselyExecute(query);
    expect(result).toEqual(1);
    expect(spy).toHaveBeenCalledWith(query.compile().sql, ...query.compile().parameters);
  });
});
