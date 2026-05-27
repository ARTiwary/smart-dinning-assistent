import { prisma } from '../db/prisma.js';
import { redis } from '../lib/redis.js';

export async function contextMemoryAgent() {} // dummy export to satisfy import

export async function getContext(sessionId) {
  const cached = await redis.get(`context:${sessionId}`);
  if (cached) return JSON.parse(cached);

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  return { preferences: session?.preferences || {}, conversationHistory: [] };
}

export async function updateContext(sessionId, newPreferences, message, role) {
  const context = await getContext(sessionId);

  const updatedPrefs = { ...context.preferences, ...newPreferences };

  const history = context.conversationHistory || [];
  history.push({ role, content: message, timestamp: new Date().toISOString() });
  if (history.length > 10) history.shift();

  const updated = { preferences: updatedPrefs, conversationHistory: history };
  await redis.setex(`context:${sessionId}`, 14400, JSON.stringify(updated));

  await prisma.session.update({
    where: { id: sessionId },
    data: { preferences: updatedPrefs }
  });

  return updated;
}