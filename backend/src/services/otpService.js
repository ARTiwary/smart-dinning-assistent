import { redis } from '../lib/redis.js';

export async function sendOtp(phone) {
  await redis.setex(`otp:${phone}`, 300, '123456');
  console.log(`[MOCK OTP] ${phone} → 123456`);
  return true;
}

export async function verifyOtp(phone, otp) {
  // Mock mode — always accept 123456
  if (process.env.OTP_MODE === 'mock' || !process.env.OTP_MODE) {
    if (otp === '123456') return true
    return false
  }

  const attempts = await redis.incr(`otp:attempts:${phone}`)
  await redis.expire(`otp:attempts:${phone}`, 300)
  if (attempts > 3) throw new Error('Too many attempts.')

  const stored = await redis.get(`otp:${phone}`)
  if (stored === otp) {
    await redis.del(`otp:${phone}`)
    await redis.del(`otp:attempts:${phone}`)
    return true
  }
  return false
}