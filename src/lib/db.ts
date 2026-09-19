import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      try {
        const possibleSources = [
          path.join(process.cwd(), 'prisma', 'dev.db'),
          path.join(process.cwd(), 'dev.db'),
        ];
        let copied = false;
        for (const src of possibleSources) {
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, tmpDbPath);
            copied = true;
            break;
          }
        }
        if (!copied) {
          fs.writeFileSync(tmpDbPath, '');
        }
      } catch (err) {
        console.error('Failed to prepare SQLite in /tmp:', err);
      }
    }

    return new PrismaClient({
      datasources: {
        db: {
          url: `file:${tmpDbPath}`,
        },
      },
    });
  }

  return new PrismaClient({
    log: ['error'],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
