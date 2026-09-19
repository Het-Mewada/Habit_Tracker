import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const INIT_SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "groqApiKey" TEXT,
    "geminiApiKey" TEXT,
    "requireMin7DaysAi" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`,
  `CREATE TABLE IF NOT EXISTS "Habit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT '⚡',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "category" TEXT NOT NULL DEFAULT 'General',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isTimeSpecific" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS "Habit_userId_idx" ON "Habit"("userId");`,
  `CREATE TABLE IF NOT EXISTS "HabitLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "HabitLog_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HabitLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "HabitLog_habitId_date_key" ON "HabitLog"("habitId", "date");`,
  `CREATE INDEX IF NOT EXISTS "HabitLog_userId_date_idx" ON "HabitLog"("userId", "date");`,
  `CREATE INDEX IF NOT EXISTS "HabitLog_userId_idx" ON "HabitLog"("userId");`,
  `CREATE TABLE IF NOT EXISTS "AiInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'last_30_days',
    "provider" TEXT NOT NULL DEFAULT 'heuristic',
    "summaryPayload" TEXT NOT NULL,
    "insightContent" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS "AiInsight_userId_idx" ON "AiInsight"("userId");`,
  `CREATE TABLE IF NOT EXISTS "HabitEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "habitId" TEXT,
    "habitName" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'code',
    "category" TEXT NOT NULL DEFAULT 'General',
    "eventType" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HabitEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS "HabitEvent_userId_date_idx" ON "HabitEvent"("userId", "date");`,
  `CREATE INDEX IF NOT EXISTS "HabitEvent_userId_idx" ON "HabitEvent"("userId");`,
];

function ensureTablesExist(client: PrismaClient) {
  Promise.resolve().then(async () => {
    for (const sql of INIT_SCHEMA_SQL) {
      try {
        await client.$executeRawUnsafe(sql);
      } catch (err) {
        // Ignore table creation errors if already existing
      }
    }
  });
}

function createPrismaClient(): PrismaClient {
  let client: PrismaClient;

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

    client = new PrismaClient({
      datasources: {
        db: {
          url: `file:${tmpDbPath}`,
        },
      },
    });
  } else {
    client = new PrismaClient({
      log: ['error'],
    });
  }

  ensureTablesExist(client);

  return client;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
