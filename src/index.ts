import { Prisma } from "@prisma/client/extension";
import type { Kysely } from "kysely";
import { PrismaDriver } from "./driver.js";

/**
 * The configuration object for the Prisma Kysely extension
 */
export type PrismaKyselyExtensionArgs<Database> = {
  /**
   * The Kysely instance to provide to the Prisma client
   */
  kysely: (driver: PrismaDriver<unknown>) => Kysely<Database>;
};

export class PrismaKyselyExtensionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrismaKyselyExtensionError";
  }
}

/**
 * Define a Prisma extension that adds Kysely query builder methods to the Prisma client
 * @param extensionArgs The extension configuration object
 */
export default <Database>(extensionArgs: PrismaKyselyExtensionArgs<Database>) =>
  Prisma.defineExtension((client) => {
    // Check if the client is already extended
    if ("$kysely" in client) {
      throw new PrismaKyselyExtensionError(
        "The Prisma client is already extended with Kysely",
      );
    }

    const driver = new PrismaDriver(client);
    const kysely = extensionArgs.kysely(driver);

    const extendedClient = client.$extends({
      name: "prisma-extension-kysely",
      client: {
        /**
         * The Kysely instance used by the Prisma client
         */
        $kysely: kysely,
      },
    });

    // Wrap the $transaction method so each interactive transaction gets its own Kysely instance.
    // The transaction-bound Kysely is exposed via a Proxy on the tx client — never by mutating
    // the tx object — so concurrent transactions cannot interfere with each other.
    const kyselyTransaction =
      (target: typeof extendedClient) =>
      (...args: Parameters<typeof target.$transaction>) => {
        if (typeof args[0] === "function") {
          // biome-ignore lint/suspicious/noExplicitAny: @prisma/client/extension types $transaction overloads differently
          type ExtensionTransactionArgs = [(tx: any) => Promise<unknown>, any?];
          const [fn, options] = args as unknown as ExtensionTransactionArgs;
          return target.$transaction(async (tx) => {
            // The Kysely instance must use the transaction client, not the original client
            const txDriver = new PrismaDriver(tx);
            const txKysely = extensionArgs.kysely(txDriver);
            // Wrap the tx client in a Proxy so $kysely resolves to the transaction-bound
            // instance without mutating the underlying tx object. This is safe under
            // concurrent transactions on databases like Postgres that actually run them
            // in parallel — see issue #71.
            const txProxy = new Proxy(tx, {
              get: (txTarget, prop, receiver) => {
                if (prop === "$kysely") {
                  return txKysely;
                }
                return Reflect.get(txTarget, prop, receiver);
              },
            });
            return fn(txProxy);
          }, options);
        }
        // Otherwise, just call the original $transaction method
        return target.$transaction(...args);
      };

    // Attach the wrapped $transaction method to the extended client using a proxy
    const extendedClientProxy = new Proxy(extendedClient, {
      get: (target, prop, receiver) => {
        if (prop === "$transaction") {
          return kyselyTransaction(target);
        }

        return Reflect.get(target, prop, receiver);
      },
    });

    return extendedClientProxy;
  });
