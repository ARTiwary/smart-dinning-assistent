import { prisma } from '../db/prisma.js'
import { io } from '../index.js'

export async function getInventory() {
  return prisma.inventory.findMany({
    include: { menuItem: true },
    orderBy: { stock: 'asc' }
  })
}

export async function setStock(menuItemId, stock, lowStockAt, trackStock) {
  const inventory = await prisma.inventory.upsert({
    where: { menuItemId },
    update: { stock, lowStockAt, trackStock },
    create: { menuItemId, stock, lowStockAt, trackStock }
  })

  // Auto mark unavailable if stock is 0
  if (trackStock && stock === 0) {
    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { available: false }
    })
  } else if (trackStock && stock > 0) {
    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { available: true }
    })
  }

  return inventory
}

export async function deductStock(menuItemId, quantity) {
  const inventory = await prisma.inventory.findUnique({ where: { menuItemId } })
  if (!inventory || !inventory.trackStock) return null

  const newStock = Math.max(0, inventory.stock - quantity)

  const updated = await prisma.inventory.update({
    where: { menuItemId },
    data: { stock: newStock }
  })

  // Auto mark unavailable
  if (newStock === 0) {
    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { available: false }
    })
    // Broadcast to admin
    io.to('kitchen').emit('inventory:out_of_stock', { menuItemId })
  }

  // Low stock alert
  if (newStock <= inventory.lowStockAt && newStock > 0) {
    io.to('kitchen').emit('inventory:low_stock', {
      menuItemId, stock: newStock, lowStockAt: inventory.lowStockAt
    })
  }

  return updated
}

export async function getLowStockItems() {
  const inventories = await prisma.inventory.findMany({
    where: { trackStock: true },
    include: { menuItem: true }
  })
  return inventories.filter(i => i.stock <= i.lowStockAt)
}