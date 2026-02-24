import * as fs from "node:fs";
import * as path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { readReplicas } from "@prisma/extension-read-replicas";
import {
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from "kysely";
import kyselyExtension, {
  type PrismaKyselyExtensionArgs,
} from "prisma-extension-kysely";
import type { DB } from "./prisma/generated/types.js";

// Use a common config for primary and replica clients
const kyselyExtensionArgs: PrismaKyselyExtensionArgs<DB> = {
  kysely: (driver) =>
    new Kysely<DB>({
      dialect: {
        createAdapter: () => new SqliteAdapter(),
        createDriver: () => driver,
        createIntrospector: (db) => new SqliteIntrospector(db),
        createQueryCompiler: () => new SqliteQueryCompiler(),
      },
    }),
};

async function main() {
  const prismaPath = "./prisma";
  const primarySqliteDbPath = "./dev.db";
  const replicaSqliteDbPath = "./replica.db";
  const syncReplica = () =>
    fs.copyFileSync(
      path.join(prismaPath, primarySqliteDbPath),
      path.join(prismaPath, replicaSqliteDbPath),
    );

  const primaryAdapter = new PrismaBetterSqlite3({
    url: `file:${primarySqliteDbPath}`,
  });
  const replicaAdapter = new PrismaBetterSqlite3({
    url: `file:${replicaSqliteDbPath}`,
  });

  // Initialize the primary client and add the Kysely extension
  const primaryClient = new PrismaClient({
    adapter: primaryAdapter,
    datasourceUrl: `file:${primarySqliteDbPath}`,
    log: [{ level: "query", emit: "event" }],
  }).$extends(kyselyExtension(kyselyExtensionArgs));

  // Initialize the replica client(s) and add the Kysely extension
  const replicaClient = new PrismaClient({
    adapter: replicaAdapter,
    datasourceUrl: `file:${replicaSqliteDbPath}`,
    log: [{ level: "query", emit: "event" }],
  }).$extends(kyselyExtension(kyselyExtensionArgs));

  // Initialize the main Prisma client with the read replicas extension
  const prisma = primaryClient.$extends(
    readReplicas({
      replicas: [replicaClient],
    }),
  );

  console.log(
    "Is prisma.$kysely the same as prisma.$primary().$kysely?",
    prisma.$kysely === prisma.$primary().$kysely,
  );
  console.log(
    "Is prisma.$kysely the same as prisma.$replica().$kysely?",
    prisma.$kysely === prisma.$replica().$kysely,
  );
  console.log(
    "Is prisma.$primary().$kysely the same as prisma.$replica().$kysely?",
    prisma.$primary().$kysely === prisma.$replica().$kysely,
  );

  // Clear the database before running the example
  const deletedPosts = await prisma.$kysely
    .deleteFrom("Post")
    .executeTakeFirstOrThrow();
  console.log("Deleted posts:", Number(deletedPosts.numDeletedRows));
  const deletedUsers = await prisma.$kysely
    .deleteFrom("User")
    .executeTakeFirstOrThrow();
  console.log("Deleted users:", Number(deletedUsers.numDeletedRows));

  // Create and update a user.
  // Note: inside a Prisma interactive transaction on SQLite, $queryRawUnsafe
  // (used by Kysely for INSERT...RETURNING) opens a separate connection rather
  // than reusing the transaction's connection, which causes a write-lock conflict.
  // Use Prisma's native tx.user.create() for the INSERT so it correctly binds
  // to the transaction connection, then use Kysely for the UPDATE.
  const insertedUser = await prisma.$transaction(
    async (tx) => {
      const insertedUser = await tx.user.create({
        data: {
          name: "John",
          email: "john@prisma.io",
        },
      });
      console.log("Inserted user:", insertedUser);

      return insertedUser;
    },
    { timeout: 30000 },
  );

  // Create a post
  await prisma
    .$primary()
    .$kysely.insertInto("Post")
    .values({
      title: "Hello prisma!",
      content: "This is my first post about prisma",
      updatedAt: new Date().toISOString(),
      published: 1,
      authorId: insertedUser.id,
    })
    .returningAll()
    .execute();

  syncReplica();

  // Select a user and a post
  const userQuery = prisma
    .$replica()
    .$kysely.selectFrom("User")
    .selectAll()
    .where("id", "=", insertedUser.id);
  const user = await userQuery.executeTakeFirstOrThrow();

  const postQuery = prisma
    .$replica()
    .$kysely.selectFrom("Post")
    .selectAll()
    .where((eb) =>
      eb.or([
        eb("title", "like", "%prisma%"),
        eb("content", "like", "%prisma%"),
      ]),
    )
    .where("published", "=", 1);
  const post = await postQuery.executeTakeFirstOrThrow();

  console.log("Query results:", { user, post });
}

main();
