import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config(); // Load .env file

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})


async function getAllData() {
  const { rows: farmsWeeklyMetrics } = await pool.query('SELECT * FROM farms_weekly_metrics');

  // sort the rows by week
  const sortedFarmsWeeklyMetrics = farmsWeeklyMetrics.sort((a, b) => {
    return new Date(b.week).getTime() - new Date(a.week).getTime();
  });

  return { farmsWeeklyMetrics: sortedFarmsWeeklyMetrics };
}

export default getAllData;