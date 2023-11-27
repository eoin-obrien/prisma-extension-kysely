import { PrismaClient } from "@prisma/client";
import { existsFn } from "../dist"

const prisma = new PrismaClient().$extends(existsFn({}))

async function main() {
  const user = await prisma.user.exists({ where: { id: 1 } })

  const post = await prisma.post.exists({
    where: {
      OR: [
        { title: { contains: 'prisma' } },
        { content: { contains: 'prisma' } },
      ],
      published: true,
    },
  })

  console.log({ user, post })
}

main()
