import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


async function getAllData() {
  // Example: Read all users
  const farmsWeeklyMetrics = await prisma.farmsWeeklyMetrics.findMany();

  return { farmsWeeklyMetrics };
}

export default getAllData;