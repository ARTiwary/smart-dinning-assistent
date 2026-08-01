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

setupSocketHandlers(io)

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
})