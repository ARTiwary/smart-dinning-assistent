import { prisma } from '../db/prisma.js'
import { redis } from '../lib/redis.js'

export async function getOrCreateProfile(phone) {
  let profile = await prisma.customerProfile.findUnique({ where: { phone } })
  if (!profile) {
    profile = await prisma.customerProfile.create({ data: { phone } })
  }
  return profile
}

export async function updateProfile(phone, name, orderTotal, preferences) {
  const profile = await prisma.customerProfile.findUnique({ where: { phone } })
  const existing = profile?.preferences || {}
  const merged = { ...existing, ...preferences }

  return prisma.customerProfile.upsert({
    where: { phone },
    update: {
      name,
      preferences: merged,
      orderCount: { increment: 1 },
      totalSpent: { increment: orderTotal },
      lastVisit: new Date()
    },
    create: {
      phone, name,
      preferences: merged,
      orderCount: 1,
      totalSpent: orderTotal,
    }
  })
}

export async function getProfileMemory(phone) {
  if (!phone) return null
  const cached = await redis.get(`profile:${phone}`)
  if (cached) return JSON.parse(cached)

  const profile = await prisma.customerProfile.findUnique({ where: { phone } })
  if (profile) {
    await redis.setex(`profile:${phone}`, 3600, JSON.stringify(profile))
  }

export async function getLastOrder(phone) {
  if (!phone) return null
  try {
    const orders = await prisma.order.findMany({
      where: { customerPhone: phone, status: { not: 'cancelled' } },
      include: { orderItems: { include: { menuItem: true } }, session: true },
      orderBy: { createdAt: 'desc' },
      take: 1
    })
    return orders[0] || null
  } catch (e) {
    return null
  }
}

export async function getOrderHistory(phone) {
  if (!phone) return []
  try {
    return prisma.order.findMany({
      where: { customerPhone: phone, status: { not: 'cancelled' } },
      include: { orderItems: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  } catch (e) {
    return []
  }
}

export async function getFavoriteItems(phone) {
  if (!phone) return []
  try {
    const orders = await prisma.order.findMany({
      where: { customerPhone: phone, status: { not: 'cancelled' } },
      include: { orderItems: { include: { menuItem: true } } },
    })

    const itemCount = {}
    orders.forEach(o => {
      o.orderItems.forEach(oi => {
        const id = oi.menuItemId
        if (!itemCount[id]) itemCount[id] = { item: oi.menuItem, count: 0 }
        itemCount[id].count += oi.quantity
      })
    })

    return Object.values(itemCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(e => e.item)
  } catch (e) {
    return []
  }
}
  return profile
}