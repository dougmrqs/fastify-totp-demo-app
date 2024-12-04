import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  omit: {
    user: {
      password: true,
      otp_secret: true,
      otp_verified: true,
    }
  }
});

export { prisma };
