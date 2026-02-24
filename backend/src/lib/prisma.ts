import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../prisma/generated/prisma/client.js";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prismaBase = new PrismaClient({ adapter });

export const prisma = prismaBase.$extends({
    query: {
        article: {
            async findMany({ args, query }: { args: Prisma.ArticleFindManyArgs, query: (args: Prisma.ArticleFindManyArgs) => Promise<any>  }) {
                args.where = {
                    deletedAt: null,
                    ...args.where,
                };
                return query(args);
            },
            async findFirst({ args, query }: { args: Prisma.ArticleFindFirstArgs, query: (args: Prisma.ArticleFindFirstArgs) => Promise<any>  }) {
                args.where = {
                    deletedAt: null,
                    ...args.where,
                };
                return query(args);
            },
            async findUnique({ args, query }: { args: Prisma.ArticleFindUniqueArgs, query: (args: Prisma.ArticleFindUniqueArgs) => Promise<any>  }) {
                args.where = {
                    deletedAt: null,
                    ...args.where,
                };
                return query(args);
            },
        },
    },
});