# Prisma Kysely Extension

[![npm version](https://badge.fury.io/js/prisma-extension-kysely.svg)](https://badge.fury.io/js/prisma-extension-kysely)
[![npm downloads](https://img.shields.io/npm/dm/prisma-extension-kysely.svg)](https://www.npmjs.com/package/prisma-extension-kysely)
[![npm type definitions](https://img.shields.io/npm/types/prisma-extension-kysely)](https://www.npmjs.com/package/prisma-extension-kysely)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/prisma-extension-kysely)](https://bundlephobia.com/package/prisma-extension-kysely)
[![Node.js CI](https://github.com/eoin-obrien/prisma-extension-kysely/actions/workflows/ci.yml/badge.svg)](https://github.com/eoin-obrien/prisma-extension-kysely/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/eoin-obrien/prisma-extension-kysely/graph/badge.svg?token=C18C7BGISJ)](https://codecov.io/gh/eoin-obrien/prisma-extension-kysely)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![GitHub license](https://img.shields.io/github/license/eoin-obrien/prisma-extension-kysely.svg)](https://github.com/eoin-obrien/prisma-extension-kysely/blob/main/LICENSE)

Writing and maintaining raw SQL queries for Prisma can be a tedious and error-prone task. The moment you need to write a query that is not supported out-of-the-box by Prisma, you lose all of that type-safety and autocompletion. This is where `prisma-extension-kysely` comes in! It allows you to easily write raw SQL queries in a type-safe manner with [`kysely`](https://kysely.dev/) and integrate them seamlessly with Prisma.

And the best part? You can use all of your favorite [`kysely`](https://kysely.dev/) plugins with `prisma-extension-kysely` too!

You don't have to take our word for it, though:

> I have to say, this is BY FAR the most amazing community package I've seen in the Prisma ecosystem!
>
> It makes it so much more convenient to drop down to raw SQL when needed without sacrificing DX — best of both worlds! 🚀

— [Nikolas Burk, DevRel @ Prisma](https://twitter.com/nikolasburk/status/1747901827960471699)

## Features

- **Type-safe** — Write raw SQL queries in a type-safe manner with `kysely`
- **Seamless integration** — Use `kysely` queries with Prisma as if they were native
- **Autocompletion** — Get autocompletion for your queries in your IDE
- **Type inference** — Get type inference for your queries in your IDE

## Compatibility

| prisma-extension-kysely | Prisma         | Kysely          |
|-------------------------|----------------|-----------------|
| v3.x                    | ^5.0 \| ^6.0  | ^0.27 \| ^0.28  |
| v4.x *(coming soon)*   | ^7.0           | ^0.28           |

## Get started

Install the dependencies:

```shell
npm install prisma-extension-kysely kysely
```

Set up the excellent [`prisma-kysely`](https://www.npmjs.com/package/prisma-kysely) library to automatically generate types for your database:

```shell
npm install -D prisma-kysely
```

Add `prisma-kysely` as a generator to your `schema.prisma`:

```prisma
generator kysely {
  provider = "prisma-kysely"
}
```

Generate the types:

```shell
npx prisma generate
```

Extend your Prisma Client:

```typescript
import kyselyExtension from "prisma-extension-kysely";
import type { DB } from "./prisma/generated/types";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter }).$extends(
  kyselyExtension({
    kysely: (driver) =>
      new Kysely<DB>({
        dialect: {
          // This is where the magic happens!
          createDriver: () => driver,
          // Don't forget to customize these to match your database!
          createAdapter: () => new PostgresAdapter(),
          createIntrospector: (db) => new PostgresIntrospector(db),
          createQueryCompiler: () => new PostgresQueryCompiler(),
        },
        plugins: [
          // Add your favorite plugins here!
        ],
      }),
  }),
);
```

It's that simple! Now you can write raw SQL queries with `kysely` and use them with Prisma:

```typescript
// Replace this...
const result = prisma.$queryRaw`SELECT * FROM User WHERE id = ${id}`;

// With this!
const query = prisma.$kysely
  .selectFrom("User")
  .selectAll()
  .where("id", "=", id);

// Thanks to kysely's magic, everything is type-safe!
const result = await query.execute();

// You can also execute queries without fetching the results
await prisma.$kysely.deleteFrom("User").where("id", "=", id).execute();
```

## Transactions

Prisma's interactive transactions are fully supported by `prisma-extension-kysely`! Just remember to use `tx.$kysely` instead of `prisma.$kysely`, and you're good to go:

```typescript
await prisma.$transaction(async (tx) => {
  await tx.$kysely
    .insertInto("User")
    .values({ id: 1, name: "John Doe" })
    .execute();

  await tx.$kysely
    .insertInto("User")
    .values({ id: 2, name: "Jane Doe" })
    .execute();
});
```

Don't try to use Kysely's `transaction` method directly, though. It's not supported by `prisma-extension-kysely`, and it will throw an error if you try to use it.

```typescript
// Don't do this! Prefer prisma.$transaction instead.
await prisma.$kysely.transaction().execute(async (trx) => {});
```

## Plugins

Do you love Kysely's plugins? So do we! You can use them with `prisma-extension-kysely` as well:

```typescript
const prisma = new PrismaClient().$extends(
  kyselyExtension({
    kysely: (driver) =>
      new Kysely<DB>({
        dialect: {
          createDriver: () => driver,
          createAdapter: () => new PostgresAdapter(),
          createIntrospector: (db) => new PostgresIntrospector(db),
          createQueryCompiler: () => new PostgresQueryCompiler(),
        },
        // Use your favorite plugins!
        plugins: [new CamelCasePlugin()],
      }),
  }),
);
```

If you're using the `CamelCasePlugin`, don't forget to add the `camelCase` option to your Prisma schema too:

```prisma
generator kysely {
  provider = "prisma-kysely"
  camelCase = true
}
```

Take a look at [the camel case example](examples/camel-case/) to see it in action! Check out the [Kysely documentation](https://kysely.dev/) for more information about plugins.

## Read Replicas

Using read replicas with `prisma-extension-kysely` is a breeze!
Just use the excellent [`@prisma/extension-read-replicas`](https://www.npmjs.com/package/@prisma/extension-read-replicas) extension as normal.
Pay attention to how it's configured, though:

```typescript
// Use a common config for primary and replica clients (or different configs)
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
  datasourceUrl: "YOUR_REPLICA_URL", // Replace this with your replica's URL!
  log: [{ level: "query", emit: "event" }],
}).$extends(kyselyExtension(kyselyExtensionArgs));

// Initialize the primary client and add the Kysely extension and the read replicas extension
const prisma = new PrismaClient()
  .$extends(kyselyExtension(kyselyExtensionArgs)) // Apply the Kysely extension before the read replicas extension!
  .$extends(
    readReplicas({
      replicas: [replicaClient],
    }),
  ); // Apply the read replicas extension after the Kysely extension!
```

See how we're setting up the replica client as a fully-fledged Prisma client and extending it separately? That's the secret sauce!
It make sure that the replica client has a separate Kysely instance. If you try to use bare URLs, you'll run into trouble;
it'll share the same Kysely instance as the primary client, and you'll get unpleasant surprises!

```typescript
// Don't do this! It won't work as expected.
readReplicas({
  url: "postgresql://user:password@localhost:5432/dbname",
});
```

Also, note that we're applying the Kysely extension before the read replicas extension. This is important! If you apply the read replicas extension first, you won't get `.$kysely` on the primary client.

Check out the [read replicas example](examples/read-replicas/) for a runnable example!

## Examples

Check out the [examples](examples) directory for a sample project!

```shell
cd examples/basic
npm install
npx prisma db push
npm run dev
```

## Learn more

- [Kysely](https://kysely.dev/)
- [`prisma-kysely`](https://www.npmjs.com/package/prisma-kysely)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
