import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import {
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from "kysely";
import kyselyExtension from "prisma-extension-kysely";
import type { DB } from "./prisma/generated/types.js";

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});

const prisma = new PrismaClient({ adapter }).$extends(
  kyselyExtension({
    kysely: (driver) =>
      new Kysely<DB>({
        dialect: {
          createAdapter: () => new SqliteAdapter(),
          createDriver: () => driver,
          createIntrospector: (db) => new SqliteIntrospector(db),
          createQueryCompiler: () => new SqliteQueryCompiler(),
        },
      }),
  }),
);

async function main() {
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
  });

  // Create a post
  await prisma.$kysely
    .insertInto("Post")
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
  const userQuery = prisma.$kysely
    .selectFrom("User")
    .selectAll()
    .where("id", "=", insertedUser.id);
  const user = await userQuery.executeTakeFirstOrThrow();

  const postQuery = prisma.$kysely
    .selectFrom("Post")
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
