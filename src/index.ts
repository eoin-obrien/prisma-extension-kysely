import { Prisma } from "@prisma/client/extension";
import type { PrismaPromise } from "@prisma/client/runtime/library";
import type { Compilable, Kysely, Simplify } from "kysely";

/**
 * The configuration object for the Prisma Kysely extension
 */
export type PrismaKyselyExtensionArgs<Database> = {
  /**
   * The Kysely instance to provide to the Prisma client
   */
  kysely: Kysely<Database>;
};

/**
 * Define a Prisma extension that adds Kysely query builder methods to the Prisma client
 * @param extensionArgs The extension configuration object
 */
export default <Database>(extensionArgs: PrismaKyselyExtensionArgs<Database>) =>
  Prisma.defineExtension((client) => {
    return client.$extends({
      name: "prisma-extension-kysely",
      client: {
        /**
         * The Kysely instance used by the Prisma client
         */
        $kysely: extensionArgs.kysely,

        /**
         * Execute a Kysely query and return the result
         * @param query A Kysely select, insert, delete or update query builder
         * @returns The result of the query
         */
        $kyselyQuery<T>(query: Compilable<T>): Promise<Simplify<T>[]> {
          const { sql, parameters } = query.compile();
          const ctx = Prisma.getExtensionContext(this);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (ctx as any).$queryRawUnsafe(sql, ...parameters);
        },

        /**
         * Execute a Kysely query and return the number of rows affected
         * @param query A Kysely select, insert, delete or update query builder
         * @returns The number of rows affected
         */
        $kyselyExecute(query: Compilable): PrismaPromise<number> {
          const { sql, parameters } = query.compile();
          const ctx = Prisma.getExtensionContext(this);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (ctx as any).$executeRawUnsafe(sql, ...parameters);
        },
      },
    });
  });
