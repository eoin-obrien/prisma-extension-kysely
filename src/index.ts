import { Prisma } from '@prisma/client/extension'

type Args = {}

export const existsFn = (_extensionArgs: Args) =>
  Prisma.defineExtension({
    name: "prisma-extension-find-or-create",
    model: {
      $allModels: {
        async exists<T, A>(
          this: T,
          args: Prisma.Exact<A, Prisma.Args<T, 'findFirst'>>
        ): Promise<boolean> {

          const ctx = Prisma.getExtensionContext(this)
          const result = await (ctx as any).findFirst(args)
          return result !== null
        },
      },
    },
  })
