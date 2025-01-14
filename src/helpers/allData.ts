import prisma from '../lib/prisma';


async function getAllData() {
  // Example: Read all users
  const farmsWeeklyMetrics = await prisma.farmsWeeklyMetrics.findMany();

  return { farmsWeeklyMetrics };
}

export default getAllData;