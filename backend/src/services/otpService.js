import { redis } from '../lib/redis.js';

export async function sendOtp(phone) {
  await redis.setex(`otp:${phone}`, 300, '123456');
  console.log(`[MOCK OTP] ${phone} → 123456`);
  return true;
}

export async function verifyOtp(phone, otp) {
  const attempts = await redis.incr(`otp:attempts:${phone}`);
  await redis.expire(`otp:attempts:${phone}`, 300);

  if (attempts > 3) throw new Error('Too many attempts. Please request a new OTP.');

  const stored = await redis.get(`otp:${phone}`);
  if (stored === otp) {
    await redis.del(`otp:${phone}`);
    await redis.del(`otp:attempts:${phone}`);
    return true;
  }
  return false;
}