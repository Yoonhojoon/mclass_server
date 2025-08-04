import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
} else {
  // Handle graceful shutdown in production
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
