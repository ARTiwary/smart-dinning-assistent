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
  return profile
}