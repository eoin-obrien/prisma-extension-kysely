import type { PrismaClient } from "@prisma/client/extension";
import {
  type CompiledQuery,
  type DatabaseConnection,
  DeleteQueryNode,
  InsertQueryNode,
  type QueryResult,
  UpdateQueryNode,
} from "kysely";

/**
 * A duck-typed `Prisma.Sql` that `prisma.$executeRaw` / `prisma.$queryRaw`
 * accept. We build one of these from kysely's compiled query so that Prisma
 * routes the raw SQL through the interactive transaction connection — which
 * `$executeRawUnsafe` / `$queryRawUnsafe` do NOT do on Prisma 7 + driver
 * adapters (writes via the unsafe variants inside a `$transaction` callback
 * escape the tx and get auto-committed independently). See issue #71.
 */
type SqlLike = {
  readonly strings: readonly string[];
  readonly values: readonly unknown[];
  readonly sql: string;
  readonly text: string;
  readonly statement: string;
  inspect(): {
    sql: string;
    text: string;
    statement: string;
    values: unknown[];
  };
};

// Matches every dialect-specific parameter placeholder kysely can emit:
// `?` (sqlite/mysql), `$1..$N` (postgres), `@P1..@PN` (mssql), `:1..:N` (oracle-ish).
const PLACEHOLDER_RE = /\$\d+|@P\d+|:\d+|\?/g;

/**
 * Convert a kysely-compiled SQL string + parameter array into the
 * `Prisma.Sql`-shaped object that `prisma.$executeRaw` / `$queryRaw` accept.
 * The strings array is obtained by splitting the compiled SQL on its
 * placeholders, so Prisma's engine can re-emit dialect-correct placeholders
 * from the getters below.
 */
function toSqlLike(sql: string, parameters: readonly unknown[]): SqlLike {
  const strings: string[] = [];
  let lastIdx = 0;
  let matchCount = 0;
  if (parameters.length > 0) {
    PLACEHOLDER_RE.lastIndex = 0;
    let match: RegExpExecArray | null = PLACEHOLDER_RE.exec(sql);
    while (match !== null) {
      strings.push(sql.slice(lastIdx, match.index));
      lastIdx = match.index + match[0].length;
      matchCount++;
      match = PLACEHOLDER_RE.exec(sql);
    }
  }
  strings.push(sql.slice(lastIdx));
  if (matchCount !== parameters.length) {
    throw new Error(
      `prisma-extension-kysely: compiled SQL has ${matchCount} placeholder(s) but ${parameters.length} parameter(s) were provided`,
    );
  }
  const values = [...parameters];
  return {
    strings,
    values,
    get sql() {
      let out = strings[0];
      for (let i = 1; i < strings.length; i++) out += `?${strings[i]}`;
      return out;
    },
    get text() {
      let out = strings[0];
      for (let i = 1; i < strings.length; i++) out += `$${i}${strings[i]}`;
      return out;
    },
    get statement() {
      let out = strings[0];
      for (let i = 1; i < strings.length; i++) out += `:${i}${strings[i]}`;
      return out;
    },
    inspect() {
      return {
        sql: this.sql,
        text: this.text,
        statement: this.statement,
        values,
      };
    },
  };
}

/**
 * A Kysely database connection that uses Prisma as the driver
 */
export class PrismaConnection implements DatabaseConnection {
  constructor(private readonly prisma: PrismaClient) {}

  async executeQuery<R>(
    compiledQuery: CompiledQuery<unknown>,
  ): Promise<QueryResult<R>> {
    const { sql, parameters, query } = compiledQuery;

    // Capture the caller stack trace to provide better error messages when a query fails
    const callerStack: { stack?: string } = {};
    Error.captureStackTrace(
      callerStack,
      PrismaConnection.prototype.executeQuery,
    );

    // Delete, update and insert queries return the number of affected rows if no returning clause is specified
    const supportsReturning =
      DeleteQueryNode.is(query) ||
      UpdateQueryNode.is(query) ||
      InsertQueryNode.is(query);
    const shouldReturnAffectedRows = supportsReturning && !query.returning;

    const sqlObj = toSqlLike(sql, parameters);
    try {
      // We deliberately use the SAFE `$executeRaw`/`$queryRaw` variants with a
      // Prisma.Sql-shaped object rather than `$executeRawUnsafe`/`$queryRawUnsafe`.
      // On Prisma 7 with driver adapters, the `Unsafe` variants do not route
      // through the interactive transaction connection, so writes issued via
      // kysely inside a `$transaction` callback would escape the tx and be
      // committed independently. See issue #71 and the `toSqlLike` docstring.
      if (shouldReturnAffectedRows) {
        const numAffectedRows = BigInt(
          // biome-ignore lint/suspicious/noExplicitAny: duck-typed Sql
          await this.prisma.$executeRaw(sqlObj as any),
        );
        return {
          rows: [],
          numAffectedRows: numAffectedRows,
        };
      }

      // biome-ignore lint/suspicious/noExplicitAny: duck-typed Sql
      const rows = await this.prisma.$queryRaw(sqlObj as any);
      return { rows: rows as R[] };
    } catch (err) {
      if (err instanceof Error && callerStack.stack) {
        err.stack =
          (err.stack ?? "") +
          "\nFrom prisma-extension-kysely:\n" +
          callerStack.stack;
      }
      throw err;
    }
  }

  streamQuery<R>(
    _compiledQuery: CompiledQuery<unknown>,
    _chunkSize?: number | undefined,
  ): AsyncIterableIterator<QueryResult<R>> {
    throw new Error(
      "prisma-extension-kysely does not support streaming queries",
    );
  }
}
