# Prisma Kysely Extension

[![npm version](https://badge.fury.io/js/prisma-extension-kysely.svg)](https://badge.fury.io/js/prisma-extension-kysely)
[![npm downloads](https://img.shields.io/npm/dm/prisma-extension-kysely.svg)](https://www.npmjs.com/package/prisma-extension-kysely)
[![GitHub license](https://img.shields.io/github/license/oslabs-beta/prisma-extension-kysely.svg)](https://www.npmjs.com/package/prisma-extension-kysely)

Writing and maintaining raw SQL queries for Prisma can be a tedious and error-prone task. The moment you need to write a query that is not supported out-of-the-box by Prisma, you lose all of that type-safety and autocompletion. This is where `prisma-extension-kysely` comes in! It allowa you to easily write raw SQL queries in a type-safe manner with `kysely` and integrate them seamlessly with Prisma.

## Features

- **Type-safe** — Write raw SQL queries in a type-safe manner with `kysely`
- **Seamless integration** — Use `kysely` queries with Prisma as if they were native
- **Autocompletion** — Get autocompletion for your queries in your IDE
- **Type inference** — Get type inference for your queries in your IDE

## Get started

Click the **Use this template** button and provide details for your Client extension

Install the dependencies:

```shell
npm install prisma-extension-kysely kysely
```

Set up the excellent `prisma-kysely` library to automatically generate types for your database:

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

// Don't forget to customize this to match your database!
const kysely = new Kysely<DB>({
  dialect: {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  },
});

const prisma = new PrismaClient().$extends(kyselyExtension({ kysely }));
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
const result = await prisma.$kyselyQuery(query);

// You can also execute queries without fetching the results
await prisma.$kyselyExecute(
  prisma.$kysely.deleteFrom("User").where("id", "=", id),
);
```

## Examples

Check out the [example](example) directory for a sample project!

```shell
cd examples
npm install
npx prisma db push
npm run dev
```

## Learn more

- [Docs — Client extensions](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions)
- [Docs — Shared extensions](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions/shared-extensions)
- [Examples](https://github.com/prisma/prisma-client-extensions/tree/main)
- [Preview announcement blog post](https://www.prisma.io/blog/client-extensions-preview-8t3w27xkrxxn#introduction)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
