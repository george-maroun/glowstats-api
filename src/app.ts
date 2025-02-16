import express, { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import { getAllTokenData } from "./helpers/fetchGlowTokenData.js"
import { getNewFarmsWeekly, calculateFarmCountWeekly } from './helpers/auditDataHelpers.js';
import getAllData from './helpers/allData.js';
import NodeCache from 'node-cache';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';

const app = express();
app.use(cors());
app.use(express.json());

// Add rate limiter configuration
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 25, // Limit each IP to 25 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Glowstats API',
      version: '1.0.0',
      description: 'API for retrieving solar farm and token statistics',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/app.ts'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Default route that returns a welcome message
 *     responses:
 *       200:
 *         description: Returns Hello World message
 */
app.get('/', (_req: Request, res: Response) => {
  const cacheKey = 'welcome';
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return res.json(cachedData);
  }
  
  const data = { message: 'Glow morning!' };
  cache.set(cacheKey, data);
  res.json(data);
});

/**
 * @swagger
 * /tokenStats:
 *   get:
 *     summary: Get token-related data
 *     responses:
 *       200:
 *         description: Successful response
 */
app.get('/tokenStats', async (_req: Request, res: Response<any>) => {
  try {
    const cacheKey = 'tokenStats';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const data = await getAllTokenData();
    cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error retrieving tokenStats:', error);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

/**
 * @swagger
 * /allData:
 *   get:
 *     summary: Get weekly data across various metrics
 *     responses:
 *       200:
 *         description: Successful response
 */
app.get('/allData', async (_req: Request, res: Response<any>) => {
  try {
    const cacheKey = 'allData';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const data = await getAllData();
    cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error retrieving allData:', error);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});


/**
 * @swagger
 * /farmCount:
 *   get:
 *     summary: Get farm count
 *     responses:
 *       200:
 *         description: Successful response
 */
app.get('/farmCount', async (_req: Request, res: Response<any>) => {
  try {
    const cacheKey = 'farmCount';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const data = await fetch('https://glow.org/api/audits');
    const farmAudits = await data.json();
    const result = { farmCount: farmAudits.length };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error retrieving farmCount:', error);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

/**
 * @swagger
 * /weeklyFarmCount:
 *   get:
 *     summary: Get weekly farm count data
 *     responses:
 *       200:
 *         description: Successful response with weekly farm count
 */
app.get('/weeklyFarmCount', async (_req: Request, res: Response<any>) => {
  try {
    const cacheKey = 'weeklyFarmCount';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const newFarmsWeekly = await getNewFarmsWeekly();
    const weeklyFarmCount = calculateFarmCountWeekly(newFarmsWeekly);
    cache.set(cacheKey, weeklyFarmCount);
    res.json(weeklyFarmCount);
  } catch (error) {
    console.error('Error retrieving weekly farm count:', error);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

// Add revalidation function
const revalidateCache = async () => {
  // try {
  //   // Revalidate tokenStats
  //   const tokenData = await getAllTokenData();
  //   cache.set('tokenStats', tokenData);
  //   console.log('TokenStats cache revalidated successfully');
  // } catch (error) {
  //   console.error('Failed to revalidate tokenStats:', error);
  // }

  try {
    // Revalidate allData
    const allData = await getAllData();
    cache.set('allData', allData);
    console.log('AllData cache revalidated successfully');
  } catch (error) {
    console.error('Failed to revalidate allData:', error);
  }

  try {
    // Revalidate farmCount
    const farmResponse = await fetch('https://glow.org/api/audits');
    const farmAudits = await farmResponse.json();
    cache.set('farmCount', { farmCount: farmAudits.length });
    console.log('FarmCount cache revalidated successfully');
  } catch (error) {
    console.error('Failed to revalidate farmCount:', error);
  }

  try {
    // Revalidate weeklyFarmCount
    const newFarmsWeekly = await getNewFarmsWeekly();
    const weeklyFarmCount = calculateFarmCountWeekly(newFarmsWeekly);
    cache.set('weeklyFarmCount', weeklyFarmCount);
    console.log('WeeklyFarmCount cache revalidated successfully');
  } catch (error) {
    console.error('Failed to revalidate weeklyFarmCount:', error);
  }

  // Welcome message doesn't need try-catch as it's static
  cache.set('welcome', { message: 'Glow morning!' });

  console.log('Cache revalidation completed at:', new Date().toISOString());
};

// Schedule cache revalidation every hour
cron.schedule('0 * * * *', revalidateCache);

// Initial cache population on server start
revalidateCache();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});