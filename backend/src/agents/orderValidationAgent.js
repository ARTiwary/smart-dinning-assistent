import { prisma } from '../db/prisma.js';

export async function orderValidationAgent(sessionId) {
  const cartItems = await prisma.cartItem.findMany({
    where: { sessionId },
    include: { menuItem: true }
  });

  const errors = [];

  for (const item of cartItems) {
    if (!item.menuItem.available) {
      errors.push(`${item.menuItem.name} is no longer available`);
    }
    if (item.quantity < 1) {
      errors.push(`Invalid quantity for ${item.menuItem.name}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    itemCount: cartItems.length,
    total: cartItems.reduce((sum, i) => sum + Number(i.menuItem.price) * i.quantity, 0)
  };
}