import { PrismaClient } from "@prisma/client/extension";
import { DatabaseConnection, Driver, TransactionSettings } from "kysely";
import { PrismaConnection } from "./connection";

export class PrismaDriver<T extends PrismaClient> implements Driver {
  constructor(private readonly prisma: T) {}

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    return new PrismaConnection(this.prisma);
  }

  beginTransaction(
    _connection: DatabaseConnection,
    _settings: TransactionSettings,
  ): Promise<void> {
    throw new Error("prisma-extension-kysely does not support transactions");
  }

  commitTransaction(_connection: DatabaseConnection): Promise<void> {
    throw new Error("prisma-extension-kysely does not support transactions");
  }

  rollbackTransaction(_connection: DatabaseConnection): Promise<void> {
    throw new Error("prisma-extension-kysely does not support transactions");
  }

  async releaseConnection(_connection: DatabaseConnection): Promise<void> {}

  async destroy(): Promise<void> {}
}
