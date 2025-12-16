import { PrismaClient as BasePrismaClient } from '@prisma/client';

declare global {
   
  var prisma: PrismaClient | undefined;
}

declare module '@prisma/client' {
  interface PrismaClient extends BasePrismaClient {}
}

export {};
