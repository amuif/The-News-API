import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client/extension";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prismaBase = new PrismaClient({ adapter });

export const prisma = prismaBase.$extends({
    query: {
        article: {
            async findMany({ args, query }) {
                args.where = {
                    deletedAt: null,
                    ...args.where,
                };
                return query(args);
            },
            async findFirst({ args, query }) {
                args.where = {
                    deletedAt: null,
                    ...args.where,
                };
                return query(args);
            },
            async findUnique({ args, query }) {
                args.where = {
                    deletedAt: null,
                    ...args.where,
                };
                return query(args);
            },
        },
    },
});