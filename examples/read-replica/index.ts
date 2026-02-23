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

// Initialize the replica client(s) and add the Kysely extension
const replicaClient = new PrismaClient({
  // For demonstration purposes, use the same SQLite database
  datasourceUrl: "file:./dev.db",
  log: [{ level: "query", emit: "event" }],
}).$extends(kyselyExtension(kyselyExtensionArgs));

// Initialize the primary client and add the Kysely extension
const prisma = new PrismaClient()
  .$extends(kyselyExtension(kyselyExtensionArgs))
  .$extends(
    readReplicas({
      replicas: [replicaClient],
    }),
  );

async function main() {
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

  // Create and update a user
  const insertedUser = await prisma.$transaction(async (tx) => {
    const [insertedUser] = await tx.$kysely
      .insertInto("User")
      .values({ name: "John", email: "john@prisma.io" })
      .returningAll()
      .execute();
    const affectedRows = await tx.$kysely
      .updateTable("User")
      .set({ name: "John Doe" })
      .where("id", "=", insertedUser.id)
      .executeTakeFirstOrThrow();
    console.log("Updated users:", Number(affectedRows.numUpdatedRows));

    return insertedUser;
  }, { timeout: 30000 });

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
