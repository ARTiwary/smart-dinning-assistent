import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './lib/socket.js';
import menuRoutes from './routes/menu.js';
import sessionRoutes from './routes/session.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/order.js';
import otpRoutes from './routes/otp.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';
import { popularItems } from './services/menuService.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, methods: ['GET', 'POST'] }
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/menu', menuRoutes);
app.use('/api/table', sessionRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/session', cartRoutes);
app.use('/api/session', orderRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/session', aiRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/popular', async (req, res) => {
  const items = await popularItems(req.query.time);
  res.json(items);
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Smart Dining Backend is running 🚀"
  });
});