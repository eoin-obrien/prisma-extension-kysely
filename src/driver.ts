import type { PrismaClient } from "@prisma/client/extension";
import { DatabaseConnection, Driver, TransactionSettings } from "kysely";
import { PrismaConnection } from "./connection.js";

export class PrismaDriver<T extends PrismaClient> implements Driver {
  constructor(private readonly prisma: T) {}

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    return new PrismaConnection(this.prisma);
  }

  async beginTransaction(
    _connection: DatabaseConnection,
    _settings: TransactionSettings,
  ): Promise<void> {
    throw new Error("prisma-extension-kysely does not support transactions");
  }

  async commitTransaction(_connection: DatabaseConnection): Promise<void> {
    throw new Error("prisma-extension-kysely does not support transactions");
  }

  async rollbackTransaction(_connection: DatabaseConnection): Promise<void> {
    throw new Error("prisma-extension-kysely does not support transactions");
  }

  async releaseConnection(_connection: DatabaseConnection): Promise<void> {}

  async destroy(): Promise<void> {}
}
