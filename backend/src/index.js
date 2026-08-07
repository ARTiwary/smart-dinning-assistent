import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import http from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import { setupSocketHandlers } from './lib/socket.js'
import menuRoutes from './routes/menu.js'
import sessionRoutes from './routes/session.js'
import cartRoutes from './routes/cart.js'
import orderRoutes from './routes/order.js'
import otpRoutes from './routes/otp.js'
import aiRoutes from './routes/ai.js'
import adminRoutes from './routes/admin.js'
import { popularItems } from './services/menuService.js'
import { prisma } from './db/prisma.js'
import { sendReservationConfirmation, sendOrderCancellation } from './lib/whatsapp.js'

dotenv.config()

const app = express()
const httpServer = http.createServer(app)

export const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

app.use(helmet())
app.use(cors({ origin: '*' }))
app.use(morgan('dev'))
app.use(express.json())

app.use('/api/menu', menuRoutes)
app.use('/api/table', sessionRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/session', cartRoutes)
app.use('/api/session', orderRoutes)
app.use('/api/otp', otpRoutes)
app.use('/api/session', aiRoutes)
app.use('/api/admin', adminRoutes)

// Standalone order tracking endpoint
app.get('/api/order/:orderId', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: {
        orderItems: { include: { menuItem: true } },
        session: true
      }
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Cancel order endpoint
app.patch('/api/order/:orderId/cancel', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (!['pending'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' })
    }
    const updated = await prisma.order.update({
      where: { id: req.params.orderId },
      data: { status: 'cancelled' }
    })

    // Send WhatsApp cancellation notification
    try {
      await sendOrderCancellation(order.customerPhone, updated)
    } catch (e) {
      console.error('WhatsApp cancellation error:', e.message)
    }

    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/popular', async (req, res) => {
  const items = await popularItems(req.query.time)
  res.json(items)
})

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Dining Backend is running 🚀' })
})

// Verify coupon
app.post('/api/coupon/verify', async (req, res) => {
  const { code, orderTotal } = req.body
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    })
    if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' })
    if (!coupon.active) return res.status(400).json({ error: 'Coupon is inactive' })
    if (coupon.usedCount >= coupon.maxUses) return res.status(400).json({ error: 'Coupon limit reached' })
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ error: 'Coupon has expired' })
    }
    if (orderTotal < coupon.minOrder) {
      return res.status(400).json({ error: `Minimum order ₹${coupon.minOrder} required` })
    }

    const discount = coupon.type === 'percentage'
      ? (orderTotal * coupon.discount) / 100
      : coupon.discount

    res.json({
      valid: true,
      discount: Math.min(discount, orderTotal),
      type: coupon.type,
      percentage: coupon.discount,
      code: coupon.code
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Apply coupon (increment usage)
app.post('/api/coupon/apply', async (req, res) => {
  const { code } = req.body
  try {
    await prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: { usedCount: { increment: 1 } }
    })
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Get loyalty account
app.get('/api/loyalty/:phone', async (req, res) => {
  try {
    const { getAccount, POINT_VALUE, MIN_REDEEM } = await import('./src/services/loyaltyService.js')
    const account = await getAccount(req.params.phone)
    res.json({ ...account, pointValue: POINT_VALUE, minRedeem: MIN_REDEEM })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Verify redemption
app.post('/api/loyalty/redeem/verify', async (req, res) => {
  const { phone, points } = req.body
  try {
    const { getAccount, POINT_VALUE, MIN_REDEEM } = await import('./src/services/loyaltyService.js')
    const account = await getAccount(phone)
    if (!account || account.points < MIN_REDEEM) {
      return res.status(400).json({ error: `Need at least ${MIN_REDEEM} points to redeem` })
    }
    if (account.points < points) {
      return res.status(400).json({ error: 'Insufficient points' })
    }
    const discount = points * POINT_VALUE
    res.json({ valid: true, discount, points, balance: account.points })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Create reservation
app.post('/api/reservations', async (req, res) => {
  try {
    const { name, phone, tableId, date, time, guests, note } = req.body
    if (!name || !phone || !date || !time) {
      return res.status(400).json({ error: 'Name, phone, date and time are required' })
    }

    // Check if table already reserved at that time
    const existing = await prisma.reservation.findFirst({
      where: { tableId, date, time, status: { not: 'cancelled' } }
    })
    if (existing) {
      return res.status(400).json({ error: 'Table already booked at this time' })
    }

    const reservation = await prisma.reservation.create({
      data: { name, phone, tableId, date, time, guests: Number(guests), note }
    })

    // Send WhatsApp confirmation
    try {
      await sendReservationConfirmation(phone, reservation)
    } catch (e) {
      console.error('WhatsApp reservation error:', e.message)
    }

    res.json(reservation)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Get reservations (admin)
app.get('/api/reservations', async (req, res) => {
  const key = req.headers['x-admin-key']
  if (key !== (process.env.ADMIN_KEY || 'admin123')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const reservations = await prisma.reservation.findMany({
    orderBy: [{ date: 'asc' }, { time: 'asc' }]
  })
  res.json(reservations)
})

// Cancel reservation
app.patch('/api/reservations/:id/cancel', async (req, res) => {
  try {
    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' }
    })
    res.json(reservation)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Get available slots for a date
app.get('/api/reservations/slots', async (req, res) => {
  try {
    const { date, guests } = req.query
    const booked = await prisma.reservation.findMany({
      where: { date, status: { not: 'cancelled' } },
      select: { tableId: true, time: true }
    })

    const TIMES = ['12:00', '12:30', '13:00', '13:30', '14:00',
                   '14:30', '19:00', '19:30', '20:00', '20:30', '21:00']
    const TABLES = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10']

    const bookedSet = new Set(booked.map(b => `${b.tableId}-${b.time}`))
    const available = []

    TIMES.forEach(time => {
      const availableTables = TABLES.filter(t => !bookedSet.has(`${t}-${time}`))
      if (availableTables.length > 0) {
        available.push({ time, availableTables: availableTables.length })
      }
    })

    res.json(available)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

setupSocketHandlers(io)

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
})