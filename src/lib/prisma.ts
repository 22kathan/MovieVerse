// ============================================
// MovieVerse — Prisma Client Singleton
// Prevents multiple instances in development
// ============================================

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  isDbOffline: boolean | undefined;
  lastCheckedDb: number | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

const CHECK_INTERVAL = 10000; // 10 seconds check interval

import net from 'net';

export async function isDatabaseOffline(): Promise<boolean> {
  const now = Date.now();
  if (
    globalForPrisma.isDbOffline !== undefined &&
    globalForPrisma.lastCheckedDb !== undefined &&
    now - globalForPrisma.lastCheckedDb < CHECK_INTERVAL
  ) {
    return globalForPrisma.isDbOffline;
  }

  let host = 'localhost';
  let port = 5432;
  const dbUrl = process.env.DATABASE_URL || '';
  const match = dbUrl.match(/@([^:\/]+)(?::(\d+))?/);
  if (match) {
    host = match[1];
    if (match[2]) {
      port = parseInt(match[2]);
    }
  }

  const checkPort = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let hasResponded = false;

      const timer = setTimeout(() => {
        if (!hasResponded) {
          hasResponded = true;
          socket.destroy();
          resolve(false);
        }
      }, 250);

      socket.connect(port, host, () => {
        if (!hasResponded) {
          hasResponded = true;
          clearTimeout(timer);
          socket.destroy();
          resolve(true);
        }
      });

      socket.on('error', () => {
        if (!hasResponded) {
          hasResponded = true;
          clearTimeout(timer);
          socket.destroy();
          resolve(false);
        }
      });
    });
  };

  const isOnline = await checkPort();
  globalForPrisma.isDbOffline = !isOnline;

  if (isOnline) {
    try {
      await prisma.$executeRawUnsafe("SELECT 1");
      globalForPrisma.isDbOffline = false;
    } catch {
      globalForPrisma.isDbOffline = true;
    }
  }

  globalForPrisma.lastCheckedDb = now;
  return globalForPrisma.isDbOffline;
}

export default prisma;
