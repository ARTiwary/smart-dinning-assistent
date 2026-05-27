import { prisma } from '../db/prisma.js';
import { redis } from '../lib/redis.js';

export async function getOrCreateSession(tableId) {
  const cached = await redis.get(`session:${tableId}`);
  if (cached) return JSON.parse(cached);

  let session = await prisma.session.findFirst({
    where: { tableId, status: 'active', expiresAt: { gt: new Date() } }
  });

  if (!session) {
    session = await prisma.session.create({
      data: {
        tableId,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
      }
    });
  }

  await redis.setex(`session:${tableId}`, 14400, JSON.stringify(session));
  return session;
}

export async function getSessionById(sessionId) {
  return prisma.session.findUnique({ where: { id: sessionId } });
}

export async function updatePreferences(sessionId, prefs) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  return prisma.session.update({
    where: { id: sessionId },
    data: { preferences: { ...session?.preferences, ...prefs } }
  });
}