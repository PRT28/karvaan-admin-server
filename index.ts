import express, {Application} from 'express';
import { configDotenv } from 'dotenv';
import cors from 'cors';

import { connectToDatabase } from './utils/database';
import { checkKarvaanToken } from './utils/middleware';
import { setupSwagger } from './swagger';

import authRoutes from './routes/auth';
import customerRoutes from './routes/customer';
import vendorRoutes from './routes/vendor';
import quotationRoutes from './routes/quotation';
import teamRoutes from './routes/team';
import logsRoutes from './routes/logs';

configDotenv();

const app: Application = express();
app.use(express.json());
app.use(cors());

// Setup Swagger documentation
setupSwagger(app);

app.use('/auth', authRoutes);
app.use('/customer', checkKarvaanToken, customerRoutes);
app.use('/vendor', checkKarvaanToken, vendorRoutes);
app.use('/quotation', quotationRoutes);
app.use('/team', checkKarvaanToken, teamRoutes);
app.use('/logs', checkKarvaanToken, logsRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API server is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 */
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
})

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectToDatabase();

    /**
     * @swagger
     * /:
     *   get:
     *     summary: Root endpoint
     *     description: Welcome message and server status
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Server is running and MongoDB is connected
     *         content:
     *           text/html:
     *             schema:
     *               type: string
     *               example: "✅ Server is running and MongoDB is connected"
     */
    app.get('/', (_req, res) => {
      res.send('✅ Server is running and MongoDB is connected');
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();