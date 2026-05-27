import { prisma } from '../db/prisma.js';

export async function getAllMenu() {
  return prisma.menuItem.findMany({ orderBy: { category: 'asc' } });
}

export async function searchMenu(query) {
  return prisma.menuItem.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } }
      ]
    }
  });
}

export async function popularItems(timeOfDay) {
  return prisma.menuItem.findMany({
    where: { available: true },
    orderBy: { popularScore: 'desc' },
    take: 5
  });
}