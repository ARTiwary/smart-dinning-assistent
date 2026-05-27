import { Router } from 'express';
import { placeOrder } from '../services/orderService.js';
import { prisma } from '../db/prisma.js';

const router = Router();

router.post('/:sessionId/order', async (req, res) => {
  try {
    const order = await placeOrder(req.params.sessionId, req.body.customerName, req.body.customerPhone);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/order/:orderId', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: { orderItems: { include: { menuItem: true } } }
  });
  res.json(order);
});

export default router;