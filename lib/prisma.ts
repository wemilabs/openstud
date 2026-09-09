import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prismaClientSingleton = () => {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter }).$extends({
    // Add query logging in development
    query: {
      async $allOperations({ operation, model, args, query }) {
        const start = performance.now();
        const result = await query(args);
        const end = performance.now();

        if (process.env.NODE_ENV === "development") {
          console.log(`${model}.${operation} took ${end - start}ms`);
        }

        return result;
      },
    },
  });
};

// Create a singleton instance of PrismaClient
const prisma = globalThis.prisma ?? prismaClientSingleton();

// Set the global prisma instance in development
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
