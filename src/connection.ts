import { PrismaClient } from "@prisma/client/extension";
import {
  CompiledQuery,
  DatabaseConnection,
  DeleteQueryNode,
  InsertQueryNode,
  QueryResult,
  UpdateQueryNode,
} from "kysely";
import { PrismaKyselyExtensionDriverConfig } from "./driver.js";

/**
 * A Kysely database connection that uses Prisma as the driver
 */
export class PrismaConnection implements DatabaseConnection {
  protected config: PrismaKyselyExtensionDriverConfig = {};

  constructor(
    private readonly prisma: PrismaClient,
    config: PrismaKyselyExtensionDriverConfig = {},
  ) {
    this.config = config;
  }

  async executeQuery<R>(
    compiledQuery: CompiledQuery<unknown>,
  ): Promise<QueryResult<R>> {
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
        numUpdatedOrDeletedRows: numAffectedRows,
      };
    }

    // Otherwise, execute it with $queryRawUnsafe to get the query results
    const instance = this.config.withReadReplica
      ? supportsReturning
        ? this.prisma.$primary()
        : this.prisma.$replica()
      : this.prisma;

    const rows = await instance.$queryRawUnsafe(sql, ...parameters);
    return { rows };
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
