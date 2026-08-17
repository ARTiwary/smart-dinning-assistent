import { Router } from 'express';
import { getAllMenu, searchMenu } from '../services/menuService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { restaurantId } = req.query;

    const items = await getAllMenu(restaurantId);

    res.json(items);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;

    if (!q) return res.json([]);

    res.json(await searchMenu(q));
  } catch (error) {
    console.error('Error searching menu:', error);
    res.status(500).json({ error: 'Failed to search menu' });
  }
});

export default router;