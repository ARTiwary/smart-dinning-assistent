import { prisma } from '../db/prisma.js'

export async function createRestaurant(data) {
  return prisma.restaurant.create({ data })
}

export async function getAllRestaurants() {
  return prisma.restaurant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { sessions: true, menuItems: true }
      }
    }
  })
}

export async function getRestaurantBySlug(slug) {
  return prisma.restaurant.findUnique({ where: { slug } })
}

export async function updateRestaurant(id, data) {
  return prisma.restaurant.update({ where: { id }, data })
}

export async function getRestaurantStats(restaurantId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sessions = await prisma.session.findMany({
    where: { restaurantId },
    include: {
      orders: {
        where: { createdAt: { gte: today } },
        include: { orderItems: true }
      }
    }
  })

  const todayOrders = sessions.flatMap(s => s.orders)
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.totalAmount), 0)

  return {
    todayOrders: todayOrders.length,
    todayRevenue,
    activeTables: sessions.filter(s => s.status === 'active').length,
  }
}