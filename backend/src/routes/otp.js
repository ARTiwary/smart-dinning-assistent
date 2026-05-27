import { Router } from 'express';
import { sendOtp, verifyOtp } from '../services/otpService.js';

const router = Router();

router.post('/send', async (req, res) => {
  await sendOtp(req.body.phone);
  res.json({ success: true });
});

router.post('/verify', async (req, res) => {
  try {
    const valid = await verifyOtp(req.body.phone, req.body.otp);
    res.json({ valid });
  } catch (err) {
    res.status(429).json({ error: err.message });
  }
});

export default router;