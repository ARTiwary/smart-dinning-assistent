import { Router } from 'express';
import { getAllMenu, searchMenu } from '../services/menuService.js';

const router = Router();

router.get('/', async (req, res) => {
  const { restaurantId } = req.query
  const items = await prisma.menuItem.findMany({
    where: restaurantId ? { restaurantId } : {},
    orderBy: { category: 'asc' }
  })
  res.json(items)
})

router.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);
  res.json(await searchMenu(q));
});

export default router;