import { prisma } from '../db/prisma.js';
import { broadcastCartUpdate } from '../lib/socket.js';
import { io } from '../index.js';

export async function getCart(sessionId) {
  return prisma.cartItem.findMany({
    where: { sessionId },
    include: { menuItem: true }
  });
}

export async function addToCart(sessionId, menuItemId, quantity, addedBy, specialInstructions) {
  const existing = await prisma.cartItem.findFirst({
    where: { sessionId, menuItemId }
  });

  let item;
  if (existing) {
    item = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
      include: { menuItem: true }
    });
  } else {
    item = await prisma.cartItem.create({
      data: { sessionId, menuItemId, quantity, addedBy, specialInstructions },
      include: { menuItem: true }
    });
  }

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (session) {
    broadcastCartUpdate(io, session.tableId, 'cart:item_added', {
      itemId: menuItemId,
      name: item.menuItem.name,
      qty: quantity,
      addedBy,
      cartTotal: await getCartTotal(sessionId)
    });
  }

  return item;
}

export async function updateCartItem(cartItemId, quantity, specialInstructions) {
  return prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity, ...(specialInstructions && { specialInstructions }) },
    include: { menuItem: true }
  });
}

export async function removeCartItem(cartItemId) {
  return prisma.cartItem.delete({ where: { id: cartItemId } });
}

export async function getCartTotal(sessionId) {
  const items = await prisma.cartItem.findMany({
    where: { sessionId },
    include: { menuItem: true }
  });
  return items.reduce((sum, i) => sum + Number(i.menuItem.price) * i.quantity, 0);
}