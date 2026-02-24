import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import {
  CamelCasePlugin,
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

const prismaClient = new PrismaClient({ adapter });
const prisma = prismaClient.$extends(
  kyselyExtension({
    kysely: (driver) =>
      new Kysely<DB>({
        dialect: {
          createAdapter: () => new SqliteAdapter(),
          createDriver: () => driver,
          createIntrospector: (db) => new SqliteIntrospector(db),
          createQueryCompiler: () => new SqliteQueryCompiler(),
        },
        plugins: [new CamelCasePlugin()],
      }),
  }),
);

async function main() {
  // Clear the database before running the example
  const deletedPosts = await prisma.$kysely
    .deleteFrom("posts")
    .executeTakeFirstOrThrow();
  console.log("Deleted posts:", Number(deletedPosts.numDeletedRows));
  const deletedUsers = await prisma.$kysely
    .deleteFrom("users")
    .executeTakeFirstOrThrow();
  console.log("Deleted users:", Number(deletedUsers.numDeletedRows));

  // Create and update a user
  const [insertedUser] = await prisma.$kysely
    .insertInto("users")
    .values({ name: "John", email: "john@prisma.io" })
    .returningAll()
    .execute();
  const affectedRows = await prisma.$kysely
    .updateTable("users")
    .set({ name: "John Doe" })
    .where("id", "=", insertedUser.id)
    .executeTakeFirstOrThrow();
  console.log("Updated users:", Number(affectedRows.numUpdatedRows));

  // Create a post
  await prisma.$kysely
    .insertInto("posts")
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
    .selectFrom("users")
    .selectAll()
    .where("id", "=", insertedUser.id);
  const user = await userQuery.executeTakeFirstOrThrow();

  const postQuery = prisma.$kysely
    .selectFrom("posts")
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
