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

    try {
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
