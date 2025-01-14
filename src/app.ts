import express, { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import { getAllTokenData } from "./helpers/fetchGlowTokenData.js"
import getAllData from './helpers/allData.js';
import NodeCache from 'node-cache';

const app = express();
app.use(cors());
app.use(express.json());

const cache = new NodeCache({ stdTTL: 1200 }); // Cache for 10 minutes

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});