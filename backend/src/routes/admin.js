import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { redis } from '../lib/redis.js';
import { io } from '../index.js'
import { upload, cloudinary } from '../lib/cloudinary.js'
import { sendOrderReady } from '../lib/whatsapp.js'

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
    include: {
      session: true,
      orderItems: { include: { menuItem: true } }
    }
  })

  // Notify customer on WhatsApp
  try {
    await sendOrderReady(order.customerPhone, order, order.session?.tableId)
  } catch (e) {
    console.error('WhatsApp ready error:', e.message)
  }

  io.to(`table:${order.session.tableId}`).emit('order:ready', {
    orderId: order.id,
    message: '🎉 Your order is ready!'
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

router.get('/forecast', adminAuth, async (req, res) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get last 30 days orders
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { not: 'cancelled' }
      },
      include: { orderItems: { include: { menuItem: true } } }
    })

    // Revenue by hour
    const hourlyRevenue = {}
    const hourlyCount = {}
    orders.forEach(o => {
      const hour = new Date(o.createdAt).getHours()
      hourlyRevenue[hour] = (hourlyRevenue[hour] || 0) + Number(o.totalAmount)
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1
    })

    // Revenue by day of week
    const dailyRevenue = {}
    const dailyCount = {}
    orders.forEach(o => {
      const day = new Date(o.createdAt).getDay()
      dailyRevenue[day] = (dailyRevenue[day] || 0) + Number(o.totalAmount)
      dailyCount[day] = (dailyCount[day] || 0) + 1
    })

    // Top items
    const itemCount = {}
    orders.forEach(o => {
      o.orderItems.forEach(oi => {
        const name = oi.menuItem?.name
        if (!itemCount[name]) itemCount[name] = { count: 0, revenue: 0, id: oi.menuItemId }
        itemCount[name].count += oi.quantity
        itemCount[name].revenue += Number(oi.price) * oi.quantity
      })
    })

    const topItems = Object.entries(itemCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }))

    // Tomorrow prediction
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDay = tomorrow.getDay()

    const avgDailyRevenue = dailyRevenue[tomorrowDay]
      ? dailyRevenue[tomorrowDay] / (dailyCount[tomorrowDay] || 1) * 4
      : Object.values(dailyRevenue).reduce((s, v) => s + v, 0) / 30

    // Peak hours prediction
    const peakHours = Object.entries(hourlyCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        label: formatHour(parseInt(hour)),
        expectedOrders: Math.round(count / 4)
      }))

    // Weekly trend
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyTrend = DAYS.map((day, i) => ({
      day,
      revenue: Math.round((dailyRevenue[i] || 0) / 4),
      orders: Math.round((dailyCount[i] || 0) / 4)
    }))

    // Growth rate
    const last7 = orders.filter(o =>
      new Date(o.createdAt) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    )
    const prev7 = orders.filter(o => {
      const d = new Date(o.createdAt)
      return d >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
             d < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    })

    const last7Revenue = last7.reduce((s, o) => s + Number(o.totalAmount), 0)
    const prev7Revenue = prev7.reduce((s, o) => s + Number(o.totalAmount), 0)
    const growthRate = prev7Revenue > 0
      ? ((last7Revenue - prev7Revenue) / prev7Revenue * 100).toFixed(1)
      : 0

    res.json({
      tomorrow: {
        day: DAYS[tomorrowDay],
        expectedRevenue: Math.round(avgDailyRevenue),
        expectedOrders: Math.round(avgDailyRevenue / 250),
        peakHours
      },
      topItems,
      weeklyTrend,
      growthRate: Number(growthRate),
      totalOrders30d: orders.length,
      avgOrderValue: orders.length > 0
        ? Math.round(orders.reduce((s, o) => s + Number(o.totalAmount), 0) / orders.length)
        : 0
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

function formatHour(hour) {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

export default router;