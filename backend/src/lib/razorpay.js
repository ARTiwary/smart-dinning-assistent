import Razorpay from 'razorpay'
import { createHmac } from 'crypto'

let razorpayClient = null

export function getRazorpay() {
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return razorpayClient
}

export async function createOrder(amount, currency = 'INR', receipt) {
  const razorpay = getRazorpay()
  return razorpay.orders.create({
    amount: Math.round(amount * 100), // paise
    currency,
    receipt,
    payment_capture: 1
  })
}

export function verifyPayment(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`
  const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')
  return expected === signature
}