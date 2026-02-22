import { PrismaClient } from "@prisma/client/extension";
import {
  CompiledQuery,
  DatabaseConnection,
  DeleteQueryNode,
  InsertQueryNode,
  QueryResult,
  UpdateQueryNode,
} from "kysely";

/**
 * A Kysely database connection that uses Prisma as the driver
 */
export class PrismaConnection implements DatabaseConnection {
  constructor(private readonly prisma: PrismaClient) {}

  async executeQuery<R>(
    compiledQuery: CompiledQuery<unknown>,
  ): Promise<QueryResult<R>> {
    // Capture the async call stack before crossing into Prisma. Prisma creates
    // a new Error object for query failures, discarding the caller's async
    // context. Capturing here (before any await) preserves the full chain back
    // to the user's .execute() call so we can stitch it back on if needed.
    const callerStack = new Error().stack;

    try {
      const { sql, parameters, query } = compiledQuery;

      // Delete, update and insert queries return the number of affected rows if no returning clause is specified
      const supportsReturning =
        DeleteQueryNode.is(query) ||
        UpdateQueryNode.is(query) ||
        InsertQueryNode.is(query);
      const shouldReturnAffectedRows = supportsReturning && !query.returning;

      // Execute the query with $executeRawUnsafe to get the number of affected rows
      if (shouldReturnAffectedRows) {
        const numAffectedRows = BigInt(
          await this.prisma.$executeRawUnsafe(sql, ...parameters),
        );
        return {
          rows: [],
          numAffectedRows: numAffectedRows,
        };
      }

      // Otherwise, execute it with $queryRawUnsafe to get the query results
      const rows = await this.prisma.$queryRawUnsafe(sql, ...parameters);
      return { rows };
    } catch (err) {
      if (err instanceof Error && callerStack) {
        err.stack =
          (err.stack ?? "") +
          "\nFrom prisma-extension-kysely:\n" +
          callerStack.split("\n").slice(1).join("\n");
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
