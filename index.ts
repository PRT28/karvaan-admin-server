import express, {Application} from 'express';
import { configDotenv } from 'dotenv';

import { connectToDatabase } from './utils/database';
import { checkKarvaanToken } from './utils/middleware';

import authRoutes from './routes/auth';
import customerRoutes from './routes/customer';
import vendorRoutes from './routes/vendor';
import quotationRoutes from './routes/quotation';

configDotenv();

const app: Application = express();
app.use(express.json());


app.use('/auth', authRoutes);
app.use('/customer', checkKarvaanToken, customerRoutes);
app.use('/vendor', checkKarvaanToken, vendorRoutes);
app.use('/quotation', checkKarvaanToken, quotationRoutes);
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
})

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectToDatabase();

    app.get('/', (req, res) => {
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