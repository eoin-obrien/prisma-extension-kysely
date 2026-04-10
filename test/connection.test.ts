// Unit tests for the connection-layer branching logic in src/connection.ts.
// These do NOT need a real database — they use a fake Prisma client whose
// $queryRaw / $executeRaw simply record their args. This lets us assert:
//
//  1. SELECT queries route through `$queryRaw`.
//  2. INSERT/UPDATE/DELETE without a RETURNING clause route through
//     `$executeRaw` and report the affected-row count.
//  3. INSERT/UPDATE/DELETE *with* a RETURNING clause route through `$queryRaw`.
//  4. The arg passed to Prisma is a `Prisma.Sql`-shaped object (not the
//     `(sql, ...params)` tuple form used by the unsafe variants), and its
//     dialect-specific getter round-trips back to kysely's compiled SQL.
//
// We deliberately avoid spying on the real Prisma client for this — replacing
// `prisma.$queryRaw` / `prisma.$executeRaw` with a bound copy of the original
// breaks interactive transaction routing (the bound copy uses the outer
// client's connection instead of the per-tx connection). See `test/index.test.ts`
// for the integration coverage that pins down the tx behavior.

import {
  type CompiledQuery,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { PrismaConnection } from "../src/connection.js";

type RecordedCall = {
  method: "queryRaw" | "executeRaw";
  arg: { sql: string; text: string; statement: string; values: unknown[] };
};

function makeFakePrisma() {
  const calls: RecordedCall[] = [];
  return {
    calls,
    prisma: {
      // biome-ignore lint/suspicious/noExplicitAny: fake prisma
      $queryRaw: vi.fn(async (arg: any) => {
        calls.push({ method: "queryRaw", arg });
        return [{ id: 1, value: "fake" }];
      }),
      // biome-ignore lint/suspicious/noExplicitAny: fake prisma
      $executeRaw: vi.fn(async (_arg: any) => {
        calls.push({ method: "executeRaw", arg: _arg });
        return 3; // pretend three rows were affected
      }),
    },
  };
}

// A throwaway kysely instance just so we can compile representative queries
// against a known schema. Postgres dialect because its $1/$2 placeholders make
// it easier to verify the round-trip; the connection layer is dialect-agnostic.
type DB = { Model: { id: number; value: string } };
const compileQueries = () => {
  const noopDriver = {
    init: async () => {},
    acquireConnection: async () => ({
      executeQuery: async () => ({ rows: [] }),
      streamQuery: () => {
        throw new Error("not used");
      },
    }),
    beginTransaction: async () => {},
    commitTransaction: async () => {},
    rollbackTransaction: async () => {},
    releaseConnection: async () => {},
    destroy: async () => {},
  };
  const db = new Kysely<DB>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => noopDriver,
      createIntrospector: (k) => new PostgresIntrospector(k),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });
  return {
    select: db
      .selectFrom("Model")
      .selectAll()
      .where("id", "=", 1)
      .compile() as CompiledQuery<unknown>,
    insertNoReturning: db
      .insertInto("Model")
      .values({ value: "x" })
      .compile() as CompiledQuery<unknown>,
    updateNoReturning: db
      .updateTable("Model")
      .set({ value: "y" })
      .where("id", "=", 1)
      .compile() as CompiledQuery<unknown>,
    deleteNoReturning: db
      .deleteFrom("Model")
      .where("id", "=", 1)
      .compile() as CompiledQuery<unknown>,
    insertReturning: db
      .insertInto("Model")
      .values({ value: "x" })
      .returningAll()
      .compile() as CompiledQuery<unknown>,
    updateReturning: db
      .updateTable("Model")
      .set({ value: "y" })
      .where("id", "=", 1)
      .returningAll()
      .compile() as CompiledQuery<unknown>,
    deleteReturning: db
      .deleteFrom("Model")
      .where("id", "=", 1)
      .returningAll()
      .compile() as CompiledQuery<unknown>,
  };
};

describe("PrismaConnection routing", () => {
  const queries = compileQueries();

  function assertSqlRoundtrip(
    arg: RecordedCall["arg"],
    expected: CompiledQuery<unknown>,
  ) {
    // The Sql-shaped argument is dialect-agnostic — its `text`/`sql`/`statement`
    // getters each emit the same parameter positions with a different placeholder
    // syntax. At least one must round-trip back to kysely's compiled SQL.
    expect(
      arg.text === expected.sql ||
        arg.sql === expected.sql ||
        arg.statement === expected.sql,
    ).toBe(true);
    expect(arg.values).toEqual([...expected.parameters]);
  }

  it("routes SELECT through $queryRaw", async () => {
    const { calls, prisma } = makeFakePrisma();
    // biome-ignore lint/suspicious/noExplicitAny: fake prisma client
    const connection = new PrismaConnection(prisma as any);
    await connection.executeQuery(queries.select);
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("queryRaw");
    assertSqlRoundtrip(calls[0].arg, queries.select);
  });

  for (const [name, key] of [
    ["INSERT without RETURNING", "insertNoReturning"],
    ["UPDATE without RETURNING", "updateNoReturning"],
    ["DELETE without RETURNING", "deleteNoReturning"],
  ] as const) {
    it(`routes ${name} through $executeRaw and reports affected rows`, async () => {
      const { calls, prisma } = makeFakePrisma();
      // biome-ignore lint/suspicious/noExplicitAny: fake prisma client
      const connection = new PrismaConnection(prisma as any);
      const result = await connection.executeQuery(queries[key]);
      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("executeRaw");
      assertSqlRoundtrip(calls[0].arg, queries[key]);
      expect(result.numAffectedRows).toBe(BigInt(3));
      expect(result.rows).toEqual([]);
    });
  }

  for (const [name, key] of [
    ["INSERT with RETURNING", "insertReturning"],
    ["UPDATE with RETURNING", "updateReturning"],
    ["DELETE with RETURNING", "deleteReturning"],
  ] as const) {
    it(`routes ${name} through $queryRaw`, async () => {
      const { calls, prisma } = makeFakePrisma();
      // biome-ignore lint/suspicious/noExplicitAny: fake prisma client
      const connection = new PrismaConnection(prisma as any);
      const result = await connection.executeQuery(queries[key]);
      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("queryRaw");
      assertSqlRoundtrip(calls[0].arg, queries[key]);
      expect(result.rows).toHaveLength(1);
    });
  }

  it("attaches the caller stack to errors", async () => {
    const { prisma } = makeFakePrisma();
    prisma.$queryRaw = vi.fn(async () => {
      throw new Error("kaboom");
    });
    // biome-ignore lint/suspicious/noExplicitAny: fake prisma client
    const connection = new PrismaConnection(prisma as any);
    let caught: Error | undefined;
    try {
      await connection.executeQuery(queries.select);
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).toBeDefined();
    expect(caught?.stack).toContain("From prisma-extension-kysely:");
  });

  it("throws when the placeholder/parameter counts disagree", async () => {
    const { prisma } = makeFakePrisma();
    // biome-ignore lint/suspicious/noExplicitAny: fake prisma client
    const connection = new PrismaConnection(prisma as any);
    const broken: CompiledQuery<unknown> = {
      // SELECT with one parameter position but two parameters supplied — this
      // simulates a buggy compiler. The connection should reject it loudly.
      sql: 'SELECT * FROM "Model" WHERE id = $1',
      parameters: [1, 2],
      // biome-ignore lint/suspicious/noExplicitAny: minimal QueryNode shape
      query: { kind: "SelectQueryNode" } as any,
    };
    await expect(connection.executeQuery(broken)).rejects.toThrow(
      /placeholder/,
    );
  });
});
