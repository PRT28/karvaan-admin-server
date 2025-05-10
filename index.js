import express from 'express';
import { configDotenv } from 'dotenv';
import authRoutes from './routes/auth';

const app = express();
configDotenv();


app.use('/auth', authRoutes);

const port = parseInt(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});