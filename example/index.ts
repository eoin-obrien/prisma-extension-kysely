import { PrismaClient } from "@prisma/client";
import {
  DummyDriver,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from "kysely";
import kyselyExtension from "../dist";
import type { DB } from "./prisma/generated/types";

const prisma = new PrismaClient().$extends(
  kyselyExtension({
    kysely: new Kysely<DB>({
      dialect: {
        createAdapter: () => new SqliteAdapter(),
        createDriver: () => new DummyDriver(),
        createIntrospector: (db) => new SqliteIntrospector(db),
        createQueryCompiler: () => new SqliteQueryCompiler(),
      },
    }),
  }),
);

async function main() {
  // Clear the database before running the example
  const deletedPosts = await prisma.$kyselyExecute(
    prisma.$kysely.deleteFrom("Post"),
  );
  console.log("Deleted posts:", deletedPosts);
  const deletedUsers = await await prisma.$kyselyExecute(
    prisma.$kysely.deleteFrom("User"),
  );
  console.log("Deleted users:", deletedUsers);

  // Create and update a user
  const [insertedUser] = await prisma.$kyselyQuery(
    prisma.$kysely
      .insertInto("User")
      .values({ name: "John", email: "john@prisma.io" })
      .returningAll(),
  );
  const affectedRows = await prisma.$kyselyExecute(
    prisma.$kysely
      .updateTable("User")
      .set({ name: "John Doe" })
      .where("id", "=", insertedUser.id),
  );
  console.log("Updated users:", affectedRows);

  // Create a post
  await prisma.$kyselyQuery(
    prisma.$kysely
      .insertInto("Post")
      .values({
        title: "Hello prisma!",
        content: "This is my first post about prisma",
        updatedAt: new Date().toISOString(),
        published: 1,
        authorId: insertedUser.id,
      })
      .returningAll(),
  );

  // Select a user and a post
  const userQuery = prisma.$kysely
    .selectFrom("User")
    .selectAll()
    .where("id", "=", insertedUser.id);
  const user = await prisma.$kyselyQuery(userQuery);

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
  const post = await prisma.$kyselyQuery(postQuery);

  console.log("Query results:", { user, post });
}

main();
