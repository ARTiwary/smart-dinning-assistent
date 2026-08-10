import { prisma } from '../db/prisma.js';
import { io } from '../index.js';
import { sendOrderConfirmation } from '../lib/whatsapp.js';
import { deductStock } from './inventoryService.js';

export async function placeOrder(sessionId, customerName, customerPhone) {
  const cartItems = await prisma.cartItem.findMany({
    where: { sessionId },
    include: { menuItem: true }
  });

  if (cartItems.length === 0) throw new Error('Cart is empty');

  const subtotal = cartItems.reduce((sum, i) => sum + Number(i.menuItem.price) * i.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const order = await prisma.order.create({
    data: {
      sessionId,
      customerName,
      customerPhone,
      totalAmount: total,
      taxAmount: tax,
      orderItems: {
        create: cartItems.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          price: i.menuItem.price
        }))
      }
    },
    include: { orderItems: { include: { menuItem: true } } }
  });

  // Deduct inventory stock for each ordered item
  for (const item of cartItems) {
    try {
      await deductStock(item.menuItemId, item.quantity);
    } catch (e) {
      console.error('Stock deduct error:', e.message);
    }
  }

  // Send WhatsApp confirmation right after order creation
  try {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    await sendOrderConfirmation(customerPhone, order, session?.tableId || 'T1');
  } catch (e) {
    console.error('WhatsApp notification error:', e.message);
  }

  await prisma.session.update({ where: { id: sessionId }, data: { status: 'ordered' } });

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (session) {
    io.to(`table:${session.tableId}`).emit('order:placed', {
      orderId: order.id,
      status: 'pending',
      estimatedWait: '15-20 mins'
    });
    io.to('kitchen').emit('kitchen:new_order', order);
  }

  return order;
}