import { PrismaClient } from "@prisma/client";
import {
  Compilable,
  DeleteResult,
  InsertResult,
  Kysely,
  KyselyPlugin,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  UpdateResult,
} from "kysely";
import { DB } from "../prisma/generated/types.js";
import kyselyExtension from "../src/index.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any

describe("prisma-extension-kysely", () => {
  const prisma = new PrismaClient();
  const xprisma = prisma.$extends(
    kyselyExtension({
      kysely: (driver) =>
        new Kysely<DB>({
          dialect: {
            createAdapter: () => new SqliteAdapter(),
            createDriver: () => driver,
            createIntrospector: (db) => new SqliteIntrospector(db),
            createQueryCompiler: () => new SqliteQueryCompiler(),
          },
        }),
    }),
  );

  const $queryRawUnsafeSpy = jest.spyOn(prisma, "$queryRawUnsafe");
  const $executeRawUnsafeSpy = jest.spyOn(prisma, "$executeRawUnsafe");

  const checkSpyCalledWith = (
    spy: jest.SpyInstance,
    query: Compilable<unknown>,
  ) => {
    const { sql, parameters } = query.compile();
    expect(spy).toHaveBeenCalledWith(sql, ...parameters);
  };

  let testRow: { id: number; value: string };

  beforeEach(async () => {
    // Clear the database before each test
    await xprisma.$kysely.deleteFrom("Model").execute();
    // Insert a row to test with
    testRow = await xprisma.$kysely
      .insertInto("Model")
      .values({ value: "test" })
      .returningAll()
      .executeTakeFirstOrThrow();
    // Reset the spies
    $queryRawUnsafeSpy.mockClear();
    $executeRawUnsafeSpy.mockClear();
  });

  it("should add the Kysely instance to the Prisma client", async () => {
    expect(xprisma.$kysely).toBeInstanceOf(Kysely);
  });

  it("should not overwrite any existing Prisma client methods", async () => {
    expect(xprisma.$queryRaw).toEqual(prisma.$queryRaw);
    expect(xprisma.$queryRawUnsafe).toEqual(prisma.$queryRawUnsafe);
    expect(xprisma.$executeRaw).toEqual(prisma.$executeRaw);
    expect(xprisma.$executeRawUnsafe).toEqual(prisma.$executeRawUnsafe);
  });

  it("should execute a select query and return the result", async () => {
    const query = xprisma.$kysely
      .selectFrom("Model")
      .selectAll()
      .where("id", "=", testRow.id);
    await expect(query.execute()).resolves.toEqual([testRow]);
    checkSpyCalledWith($queryRawUnsafeSpy, query);
  });

  it("should execute an insert query and return the number of rows affected", async () => {
    const query = xprisma.$kysely
      .insertInto("Model")
      .values({ value: "inserted" });
    await expect(query.execute()).resolves.toEqual([
      new InsertResult(undefined, BigInt(1)),
    ]);
    checkSpyCalledWith($executeRawUnsafeSpy, query);
  });

  it("should execute an update query and return the number of rows affected", async () => {
    const query = xprisma.$kysely
      .updateTable("Model")
      .set({ value: "updated" })
      .where("id", "=", testRow.id);
    await expect(query.execute()).resolves.toEqual([
      new UpdateResult(BigInt(1), undefined),
    ]);
    checkSpyCalledWith($executeRawUnsafeSpy, query);
  });

  it("should execute a delete query and return the number of rows affected", async () => {
    const query = xprisma.$kysely
      .deleteFrom("Model")
      .where("id", "=", testRow.id);
    await expect(query.execute()).resolves.toEqual([
      new DeleteResult(BigInt(1)),
    ]);
    checkSpyCalledWith($executeRawUnsafeSpy, query);
  });

  it("should execute an insert query with a returning clause and return the results", async () => {
    const query = xprisma.$kysely
      .insertInto("Model")
      .values({ value: "inserted" })
      .returningAll();
    await expect(query.execute()).resolves.toEqual([
      { id: expect.any(Number), value: "inserted" },
    ]);
    checkSpyCalledWith($queryRawUnsafeSpy, query);
  });

  it("should execute an update query with a returning clause and return the results", async () => {
    const query = xprisma.$kysely
      .updateTable("Model")
      .set({ value: "updated" })
      .where("id", "=", testRow.id)
      .returningAll();
    await expect(query.execute()).resolves.toEqual([
      { id: testRow.id, value: "updated" },
    ]);
    checkSpyCalledWith($queryRawUnsafeSpy, query);
  });

  it("should execute an update query with a returning clause and return the results", async () => {
    const query = xprisma.$kysely
      .deleteFrom("Model")
      .where("id", "=", testRow.id)
      .returningAll();
    await expect(query.execute()).resolves.toEqual([testRow]);
    checkSpyCalledWith($queryRawUnsafeSpy, query);
  });

  it("should throw an error if a query is executed with a stream", async () => {
    const query = xprisma.$kysely.selectFrom("Model").selectAll();
    await expect(query.stream().next()).rejects.toThrow(
      "prisma-extension-kysely does not support streaming queries",
    );
  });

  it("should expose kysely inside a Prisma transaction", async () => {
    await xprisma.$transaction(async (tx) => {
      expect(tx.$kysely).toBeInstanceOf(Kysely);
      expect(tx.$kysely).not.toBe(xprisma.$kysely);
    });
  });

  it("should support prisma transactions", async () => {
    await xprisma.$transaction(async (tx) => {
      await tx.$kysely.deleteFrom("Model").execute();
    });
    await expect(
      xprisma.$kysely.selectFrom("Model").selectAll().execute(),
    ).resolves.toHaveLength(0);
  });

  it("should rollback prisma transactions", async () => {
    await xprisma
      .$transaction(async (tx) => {
        await tx.$kysely.deleteFrom("Model").execute();
        throw new Error("rollback");
      })
      .catch(() => {});
    await expect(
      xprisma.$kysely.selectFrom("Model").selectAll().execute(),
    ).resolves.toHaveLength(1);
  });

  it("should not interfere with non-interactive transactions", async () => {
    await xprisma.$transaction([xprisma.model.deleteMany()]);
    await expect(
      xprisma.$kysely.selectFrom("Model").selectAll().execute(),
    ).resolves.toHaveLength(0);
  });

  it("should forbid the use of kysely's built-in transactions", async () => {
    await expect(
      xprisma.$kysely.transaction().execute(async () => {}),
    ).rejects.toThrow("prisma-extension-kysely does not support transactions");
  });

  it("should support kysely plugins", async () => {
    const plugin: KyselyPlugin = {
      transformQuery: jest.fn((args) => args.node),
      transformResult: jest.fn(async (args) => args.result),
    };
    const query = xprisma.$kysely
      .withPlugin(plugin)
      .selectFrom("Model")
      .selectAll();
    const rows = await query.execute();
    expect(rows).toEqual([testRow]);
    expect(plugin.transformQuery).toHaveBeenCalledWith(
      expect.objectContaining({ node: query.compile().query }),
    );
    expect(plugin.transformResult).toHaveBeenCalledWith(
      expect.objectContaining({ result: { rows } }),
    );
  });
});
