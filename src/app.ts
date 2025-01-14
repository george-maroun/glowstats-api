import express, { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import { getAllTokenData } from "./helpers/fetchGlowTokenData.js"
import getAllData from './helpers/allData.js';

const app = express();
app.use(cors());
app.use(express.json());

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
  res.json({ message: 'Glow morning!' });
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
  const data = await getAllTokenData();
  res.json(data);
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
  const data = await getAllData();
  res.json(data);
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
  const data = await fetch('https://glow.org/api/audits');
  const farmAudits = await data.json();
  res.json({ farmCount: farmAudits.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});