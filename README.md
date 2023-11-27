# Prisma Client Extension starter repository

Use this template to bootstrap creating your Prisma Client extension.

Client extensions provide a powerful way to add functionality to Prisma Client in a type-safe manner. You can use them to create simple and flexible solutions that are not natively supported by Prisma. 



If you would like to learn more, refer to the [Prisma docs](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions) to learn more information.

## Get started

Click the **Use this template** button and provide details for your Client extension

Install the dependencies:

```
npm install
```

Build the extension:

```
npm run build
```

Set up the example app:

```
cd example
npm install
npx prisma db push
```

Test the extension in the example app:
```
npm run dev
```

### Evolve the extension

The code for the extension is located in the [`index.ts`](./src/index.ts) file. Feel free to update it before publishing your Client extension to [npm](https://npmjs.com/).

## Learn more

- [Docs — Client extensions](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions)
- [Docs — Shared extensions](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions/shared-extensions)
- [Examples](https://github.com/prisma/prisma-client-extensions/tree/main)
- [Preview announcement blog post](https://www.prisma.io/blog/client-extensions-preview-8t3w27xkrxxn#introduction)