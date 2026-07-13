'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { io } from 'socket.io-client'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

const STEP_INFO = {
  pending:   { label: 'Order Placed', icon: '📋', desc: 'Your order has been received' },
  confirmed: { label: 'Confirmed', icon: '✅', desc: 'Kitchen has confirmed your order' },
  preparing: { label: 'Preparing', icon: '👨‍🍳', desc: 'Your food is being prepared' },
  ready:     { label: 'Ready!', icon: '🎉', desc: 'Your order is ready to collect' },
  delivered: { label: 'Delivered', icon: '🍽️', desc: 'Enjoy your meal!' },
}

export default function TrackOrder() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchOrder() {
    try {
      const { data } = await axios.get(`${API}/api/order/${orderId}`)
      setOrder(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchOrder()
    const socket = io(API, { query: { tableId: `track-${orderId}` } })
    socket.on('order:ready', () => fetchOrder())
    socket.on('order:status_update', () => fetchOrder())
    const interval = setInterval(fetchOrder, 10000)
    return () => { socket.disconnect(); clearInterval(interval) }
  }, [orderId])

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0d0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ fontSize: '48px' }}>⏳</div>
    </div>
  )

  if (!order) return (
    <div style={{
      minHeight: '100vh', background: '#0d0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff'
    }}>Order not found</div>
  )

  const currentStep = STEPS.indexOf(order.status)

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0a0f',
      fontFamily: 'sans-serif', padding: '24px 16px'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>
          {STEP_INFO[order.status]?.icon}
        </div>
        <h1 style={{
          background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontSize: '26px', fontWeight: 800, margin: '0 0 4px'
        }}>{STEP_INFO[order.status]?.label}</h1>
        <p style={{ color: '#7a5f58', fontSize: '14px' }}>
          {STEP_INFO[order.status]?.desc}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        background: '#1a1220', border: '1px solid rgba(255,107,53,0.15)',
        borderRadius: '20px', padding: '24px', marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          {STEPS.filter(s => s !== 'delivered').map((step, i) => {
            const done = i <= currentStep
            const active = i === currentStep
            return (
              <div key={step} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: done ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)' : '#2a2a2a',
                  border: active ? '3px solid #ff6b9d' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 6px', fontSize: '16px',
                  boxShadow: active ? '0 0 20px rgba(255,107,157,0.5)' : 'none',
                  transition: 'all 0.3s'
                }}>
                  {done ? '✓' : STEP_INFO[step]?.icon}
                </div>
                <p style={{
                  color: done ? '#ff8c69' : '#555',
                  fontSize: '10px', fontWeight: done ? 600 : 400
                }}>{STEP_INFO[step]?.label}</p>
              </div>
            )
          })}
        </div>

        {/* Progress line */}
        <div style={{ height: '4px', background: '#2a2a2a', borderRadius: '2px', marginTop: '4px' }}>
          <div style={{
            height: '100%', borderRadius: '2px',
            background: 'linear-gradient(90deg, #ff6b35, #ff6b9d)',
            width: `${(currentStep / (STEPS.length - 2)) * 100}%`,
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Order details */}
      <div style={{
        background: '#1a1220', border: '1px solid rgba(255,107,53,0.15)',
        borderRadius: '20px', padding: '20px', marginBottom: '16px'
      }}>
        <h3 style={{ color: '#fff5f0', fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
          Order #{order.id?.slice(0, 8).toUpperCase()}
        </h3>
        {order.orderItems?.map((oi, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            color: '#c8a49a', fontSize: '14px', marginBottom: '8px'
          }}>
            <span>{oi.menuItem?.name} × {oi.quantity}</span>
            <span>₹{(Number(oi.price) * oi.quantity).toFixed(0)}</span>
          </div>
        ))}
        <div style={{
          borderTop: '1px solid rgba(255,107,53,0.12)',
          paddingTop: '10px', marginTop: '6px',
          display: 'flex', justifyContent: 'space-between'
        }}>
          <span style={{ color: '#fff5f0', fontWeight: 700 }}>Total</span>
          <span style={{
            background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontWeight: 800, fontSize: '16px'
          }}>₹{Number(order.totalAmount).toFixed(0)}</span>
        </div>
      </div>

      {/* Est time */}
      {!['ready', 'delivered'].includes(order.status) && (
        <div style={{
          background: 'rgba(255,107,53,0.08)',
          border: '1px solid rgba(255,107,53,0.2)',
          borderRadius: '14px', padding: '14px', textAlign: 'center'
        }}>
          <p style={{ color: '#ff8c69', fontSize: '13px' }}>
            ⏱️ Estimated wait: <strong>15–20 mins</strong>
          </p>
        </div>
      )}

      {order.status === 'ready' && (
        <div style={{
          background: 'rgba(74,222,128,0.1)',
          border: '1px solid rgba(74,222,128,0.3)',
          borderRadius: '14px', padding: '20px', textAlign: 'center'
        }}>
          <p style={{ color: '#4ade80', fontSize: '18px', fontWeight: 700 }}>
            🎉 Your order is ready!
          </p>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '6px' }}>
            Please collect your order from the counter
          </p>
        </div>
      )}
    </div>
  )
}