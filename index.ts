import express, {Application} from 'express';
import { configDotenv } from 'dotenv';
import authRoutes from './routes/auth';

const app: Application = express();
configDotenv();


app.use('/auth', authRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});