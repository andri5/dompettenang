/**
 * ============================================
 * Dompet Tenang API - Prisma Client
 * ============================================
 * Singleton Prisma client instance.
 * Uses global caching to prevent multiple instances during hot reload.
 * 
 * @see https://www.prisma.io/docs/guides/performance-and-optimization
 * ============================================
 */

import { PrismaClient } from '@prisma/client';

// Global reference for Prisma client to prevent multiple instances
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma client instance
 * @description Singleton instance with logging based on environment
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

// Cache the Prisma client in development to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
