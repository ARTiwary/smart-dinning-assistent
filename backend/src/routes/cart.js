import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem } from '../services/cartService.js';

const router = Router();

router.get('/:sessionId/cart', async (req, res) => {
  res.json(await getCart(req.params.sessionId));
});

router.post('/:sessionId/cart', async (req, res) => {
  const { menuItemId, qty, addedBy, specialInstructions } = req.body;
  res.json(await addToCart(req.params.sessionId, menuItemId, qty || 1, addedBy || 'Guest', specialInstructions));
});

router.patch('/:sessionId/cart/:id', async (req, res) => {
  const { quantity, specialInstructions } = req.body;
  res.json(await updateCartItem(req.params.id, quantity, specialInstructions));
});

router.delete('/:sessionId/cart/:id', async (req, res) => {
  await removeCartItem(req.params.id);
  res.json({ success: true });
});

export default router;