import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { redis } from '../lib/redis.js';

const router = Router();

// Simple admin auth middleware
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key !== (process.env.ADMIN_KEY || 'admin123')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Get all tables with active sessions and orders
router.get('/tables', adminAuth, async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: { status: { in: ['active', 'ordered'] } },
    include: {
      orders: {
        include: { orderItems: { include: { menuItem: true } } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      cartItems: { include: { menuItem: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(sessions);
});

// Get all orders
router.get('/orders', adminAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      orderItems: { include: { menuItem: true } },
      session: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(orders);
});

// Update order status
router.patch('/orders/:id/status', adminAuth, async (req, res) => {
  const { status } = req.body;
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include: { session: true },
  });
  res.json(order);
});

// Get stats
router.get('/stats', adminAuth, async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrders, todayOrders, pendingOrders, totalRevenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: { in: ['pending', 'confirmed', 'preparing'] } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
  ]);

  res.json({
    totalOrders,
    todayOrders,
    pendingOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
  });
});

// Close a session/table
router.patch('/sessions/:id/close', adminAuth, async (req, res) => {
  const session = await prisma.session.update({
    where: { id: req.params.id },
    data: { status: 'closed' },
  });
  await redis.del(`session:${session.tableId}`);
  res.json(session);
});

export default router;