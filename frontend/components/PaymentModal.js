'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function PaymentModal({
  sessionId, customerName, customerPhone,
  total, couponCode, loyaltyDiscount,
  onSuccess, onCancel
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [method, setMethod] = useState('online') // online | cash

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => document.body.removeChild(script)
  }, [])

  async function payOnline() {
    setLoading(true)
    setError('')
    try {
      // Create Razorpay order
      const { data: rpOrder } = await axios.post(`${API}/api/payment/create`, {
        sessionId, couponCode, loyaltyDiscount
      })

      const options = {
        key: rpOrder.keyId,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: 'Spice Garden',
        description: 'Food Order Payment',
        order_id: rpOrder.razorpayOrderId,
        prefill: {
          name: customerName,
          contact: `+91${customerPhone}`,
        },
        theme: { color: '#ff6b35' },
        modal: {
          ondismiss: () => setLoading(false)
        },
        handler: async (response) => {
          try {
            const { data } = await axios.post(`${API}/api/payment/verify`, {
              sessionId,
              customerName,
              customerPhone,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              couponCode,
              loyaltyDiscount
            })
            onSuccess(data.order)
          } catch (e) {
            setError('Payment verification failed. Contact support.')
            setLoading(false)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`)
        setLoading(false)
      })
      rzp.open()
    } catch (e) {
      setError(e.response?.data?.error || 'Payment failed')
      setLoading(false)
    }
  }

  async function payCash() {
    setLoading(true)
    try {
      const { data: order } = await axios.post(`${API}/api/session/${sessionId}/order`, {
        customerName, customerPhone,
        paymentMethod: 'cash'
      })
      onSuccess(order)
    } catch (e) {
      setError(e.response?.data?.error || 'Order failed')
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 70,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1a1220, #201628)',
        borderTop: '1px solid rgba(255,107,53,0.25)',
        borderTopLeftRadius: '28px', borderTopRightRadius: '28px',
        padding: '12px 24px 44px',
        width: '100%',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.8)',
      }}>
        {/* Handle */}
        <div style={{
          width: '40px', height: '4px',
          background: 'rgba(255,107,53,0.3)',
          borderRadius: '2px', margin: '0 auto 20px'
        }} />

        <h3 style={{
          color: '#fff5f0', fontSize: '22px',
          fontWeight: 700, marginBottom: '6px'
        }}>💳 Payment</h3>
        <p style={{ color: '#7a5f58', fontSize: '13px', marginBottom: '20px' }}>
          Total: <span style={{ color: '#ff8c69', fontWeight: 700 }}>
            ₹{total.toFixed(0)}
          </span>
        </p>

        {error && (
          <div style={{
            background: 'rgba(255,100,100,0.1)',
            border: '1px solid rgba(255,100,100,0.3)',
            borderRadius: '10px', padding: '10px 14px',
            marginBottom: '14px', color: '#ff6b6b', fontSize: '13px'
          }}>⚠ {error}</div>
        )}

        {/* Payment method selector */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setMethod('online')} style={{
            flex: 1, padding: '14px', borderRadius: '14px',
            border: 'none', cursor: 'pointer',
            background: method === 'online'
              ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)'
              : 'rgba(255,255,255,0.04)',
            color: method === 'online' ? '#fff' : '#7a5f58',
            fontSize: '14px', fontWeight: 600,
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>💳</div>
            Online Payment
            <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
              UPI · Cards · Wallets
            </div>
          </button>

          <button onClick={() => setMethod('cash')} style={{
            flex: 1, padding: '14px', borderRadius: '14px',
            border: 'none', cursor: 'pointer',
            background: method === 'cash'
              ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)'
              : 'rgba(255,255,255,0.04)',
            color: method === 'cash' ? '#fff' : '#7a5f58',
            fontSize: '14px', fontWeight: 600,
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>💵</div>
            Pay at Counter
            <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
              Cash · Card on delivery
            </div>
          </button>
        </div>

        {/* Info box */}
        <div style={{
          background: method === 'online'
            ? 'rgba(255,107,53,0.06)' : 'rgba(74,222,128,0.06)',
          border: `1px solid ${method === 'online' ? 'rgba(255,107,53,0.15)' : 'rgba(74,222,128,0.15)'}`,
          borderRadius: '12px', padding: '12px 14px', marginBottom: '16px'
        }}>
          <p style={{
            color: method === 'online' ? '#ff8c69' : '#4ade80',
            fontSize: '13px', margin: 0
          }}>
            {method === 'online'
              ? '🔒 Secure payment via Razorpay. Supports UPI, cards, net banking & wallets.'
              : '✓ Order will be confirmed immediately. Pay when you collect your food.'}
          </p>
        </div>

        {/* Pay button */}
        <button
          onClick={method === 'online' ? payOnline : payCash}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? 'rgba(255,107,53,0.4)' : 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            border: 'none', color: '#fff', padding: '16px',
            borderRadius: '14px', fontSize: '16px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '10px',
            boxShadow: '0 6px 20px rgba(255,107,53,0.35)'
          }}
        >
          {loading ? '⏳ Processing...' : method === 'online'
            ? `Pay ₹${total.toFixed(0)} Online →`
            : `Place Order — Pay at Counter`}
        </button>

        <button onClick={onCancel} style={{
          width: '100%', background: 'transparent', border: 'none',
          color: '#7a5f58', padding: '8px', cursor: 'pointer', fontSize: '13px'
        }}>Cancel</button>
      </div>
    </div>
  )
}