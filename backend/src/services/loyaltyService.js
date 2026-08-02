import { prisma } from '../db/prisma.js'

// 1 point per ₹10 spent
const POINTS_PER_RUPEE = 0.1
// 1 point = ₹0.5 discount
const POINT_VALUE = 0.5
const MIN_REDEEM = 50  // minimum 50 points to redeem

export async function getAccount(phone) {
  if (!phone) return null
  return prisma.loyaltyAccount.upsert({
    where: { phone },
    update: {},
    create: { phone },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } }
  })
}

export async function earnPoints(phone, orderTotal, orderId) {
  const points = Math.floor(orderTotal * POINTS_PER_RUPEE)
  if (points <= 0) return null

  await prisma.loyaltyAccount.upsert({
    where: { phone },
    update: {
      points: { increment: points },
      totalEarned: { increment: points }
    },
    create: { phone, points, totalEarned: points }
  })

  await prisma.loyaltyTransaction.create({
    data: {
      phone, points, type: 'earned',
      orderId, note: `Earned from order ₹${orderTotal.toFixed(0)}`
    }
  })

  return points
}

export async function redeemPoints(phone, pointsToRedeem) {
  const account = await prisma.loyaltyAccount.findUnique({ where: { phone } })
  if (!account) throw new Error('No loyalty account found')
  if (account.points < MIN_REDEEM) throw new Error(`Minimum ${MIN_REDEEM} points required`)
  if (account.points < pointsToRedeem) throw new Error('Insufficient points')

  const discount = pointsToRedeem * POINT_VALUE

  await prisma.loyaltyAccount.update({
    where: { phone },
    data: {
      points: { decrement: pointsToRedeem },
      totalRedeemed: { increment: pointsToRedeem }
    }
  })

  await prisma.loyaltyTransaction.create({
    data: {
      phone, points: -pointsToRedeem,
      type: 'redeemed',
      note: `Redeemed for ₹${discount.toFixed(0)} discount`
    }
  })

  return discount
}

export { POINTS_PER_RUPEE, POINT_VALUE, MIN_REDEEM }