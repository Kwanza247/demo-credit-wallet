import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth_route';
import walletRoutes from './routes/wallet_routes';
import { errorHandler } from './middlewares/error_middleware';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Demo Credit Wallet API is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/wallet', walletRoutes);

app.use(errorHandler);

export default app;