/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client/extension";
import { Kysely } from "kysely";
import { PrismaDriver } from "./driver";

/**
 * The configuration object for the Prisma Kysely extension
 */
export type PrismaKyselyExtensionArgs<Database> = {
  /**
   * The Kysely instance to provide to the Prisma client
   */
  // kysely: Kysely<Database>;
  kysely: (driver: PrismaDriver<any>) => Kysely<Database>;
};

/**
 * Define a Prisma extension that adds Kysely query builder methods to the Prisma client
 * @param extensionArgs The extension configuration object
 */
export default <Database>(extensionArgs: PrismaKyselyExtensionArgs<Database>) =>
  Prisma.defineExtension((client) => {
    const driver = new PrismaDriver(client);

    const kysely = extensionArgs.kysely(driver);

    return client.$extends({
      name: "prisma-extension-kysely",
      client: {
        /**
         * The Kysely instance used by the Prisma client
         */
        $kysely: kysely,
      },
    });
  });
