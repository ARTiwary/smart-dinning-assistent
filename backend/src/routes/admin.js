import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { redis } from '../lib/redis.js';
import { io } from '../index.js'
import { upload, cloudinary } from '../lib/cloudinary.js'

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
  // Notify customer
  io.to(`table:${order.session.tableId}`).emit('order:status_update', {
    orderId: order.id, status
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

router.patch('/orders/:id/cancel', adminAuth, async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' }
    })
    res.json(order)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Get pending + confirmed + preparing orders for kitchen
router.get('/kitchen/orders', adminAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { status: { in: ['pending', 'confirmed', 'preparing'] } },
    include: {
      orderItems: { include: { menuItem: true } },
      session: true,
    },
    orderBy: { createdAt: 'asc' }
  })
  res.json(orders)
})

// Kitchen marks order ready
router.patch('/kitchen/orders/:id/ready', adminAuth, async (req, res) => {
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: 'ready' },
    include: { session: true }
  })
  // Notify customer via socket
  io.to(`table:${order.session.tableId}`).emit('order:ready', {
    orderId: order.id,
    message: '🎉 Your order is ready! Please collect it.'
  })
  res.json(order)
})

// Get all menu items
router.get('/menu', adminAuth, async (req, res) => {
  const items = await prisma.menuItem.findMany({ orderBy: { category: 'asc' } })
  res.json(items)
})

// Add new menu item
router.post('/menu', adminAuth, async (req, res) => {
  try {
    const item = await prisma.menuItem.create({ data: req.body })
    res.json(item)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Update menu item
router.patch('/menu/:id', adminAuth, async (req, res) => {
  try {
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: req.body
    })
    res.json(item)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Delete menu item
router.delete('/menu/:id', adminAuth, async (req, res) => {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Toggle availability
router.patch('/menu/:id/toggle', adminAuth, async (req, res) => {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } })
    const updated = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { available: !item.available }
    })
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
});

// Get all coupons
router.get('/coupons', adminAuth, async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(coupons)
})

// Create coupon
router.post('/coupons', adminAuth, async (req, res) => {
  try {
    const coupon = await prisma.coupon.create({ data: req.body })
    res.json(coupon)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Delete coupon
router.delete('/coupons/:id', adminAuth, async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// Toggle coupon active
router.patch('/coupons/:id/toggle', adminAuth, async (req, res) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } })
  const updated = await prisma.coupon.update({
    where: { id: req.params.id },
    data: { active: !coupon.active }
  })
  res.json(updated)
})

// Loyalty stats
router.get('/loyalty/stats', adminAuth, async (req, res) => {
  const accounts = await prisma.loyaltyAccount.findMany({
    orderBy: { points: 'desc' },
    take: 10
  })
  const totalPoints = await prisma.loyaltyAccount.aggregate({
    _sum: { points: true, totalEarned: true }
  })
  res.json({ topAccounts: accounts, totalPoints: totalPoints._sum })
})

// Upload menu item image
router.post('/menu/upload-image', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    res.json({
      imageUrl: req.file.path,
      publicId: req.file.filename
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Delete image from cloudinary
router.delete('/menu/image/:publicId', adminAuth, async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.publicId)
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router;