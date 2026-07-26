'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'

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
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!orderId) return
    fetchOrder()
    const interval = setInterval(fetchOrder, 10000)
    return () => clearInterval(interval)
  }, [orderId])

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0d0a0f',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: '16px'
    }}>
      <div style={{ fontSize: '48px' }}>⏳</div>
      <p style={{ color: '#ff8c69', fontFamily: 'sans-serif' }}>Loading your order...</p>
    </div>
  )

  if (!order) return (
    <div style={{
      minHeight: '100vh', background: '#0d0a0f',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: '16px'
    }}>
      <div style={{ fontSize: '48px' }}>❌</div>
      <p style={{ color: '#ff6b6b', fontFamily: 'sans-serif' }}>Order not found</p>
    </div>
  )

  const currentStep = STEPS.indexOf(order.status)
  const stepInfo = STEP_INFO[order.status] || STEP_INFO.pending

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0a0f',
      fontFamily: 'sans-serif',
      padding: '24px 16px',
      maxWidth: '480px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <p style={{ color: '#7a5f58', fontSize: '13px', marginBottom: '8px' }}>
          🍛 Spice Garden
        </p>
        <div style={{ fontSize: '56px', marginBottom: '12px' }}>
          {stepInfo.icon}
        </div>
        <h1 style={{
          background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '28px', fontWeight: 800, margin: '0 0 8px'
        }}>{stepInfo.label}</h1>
        <p style={{ color: '#7a5f58', fontSize: '14px' }}>
          {stepInfo.desc}
        </p>
      </div>

      {/* Progress steps */}
      <div style={{
        background: '#1a1220',
        border: '1px solid rgba(255,107,53,0.15)',
        borderRadius: '20px', padding: '24px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {STEPS.filter(s => s !== 'delivered').map((step, i) => {
            const done = i <= currentStep
            const active = i === currentStep
            const info = STEP_INFO[step]
            return (
              <div key={step} style={{
                flex: 1, textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}>
                {/* Circle */}
                <div style={{
                  width: '40px', height: '40px',
                  borderRadius: '50%',
                  background: done
                    ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)'
                    : '#2a2a2a',
                  border: active ? '3px solid #ff6b9d' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: done ? '16px' : '18px',
                  boxShadow: active ? '0 0 20px rgba(255,107,157,0.5)' : 'none',
                  transition: 'all 0.4s ease',
                  marginBottom: '6px',
                  color: '#fff'
                }}>
                  {done && !active ? '✓' : info.icon}
                </div>

                {/* Connector line */}
                {i < STEPS.filter(s => s !== 'delivered').length - 1 && (
                  <div style={{
                    position: 'absolute',
                    width: '100%'
                  }} />
                )}

                <p style={{
                  color: done ? '#ff8c69' : '#555',
                  fontSize: '10px',
                  fontWeight: done ? 600 : 400,
                  margin: 0,
                  lineHeight: 1.3
                }}>{info.label}</p>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div style={{
          height: '4px', background: '#2a2a2a',
          borderRadius: '2px', marginTop: '16px'
        }}>
          <div style={{
            height: '100%', borderRadius: '2px',
            background: 'linear-gradient(90deg, #ff6b35, #ff6b9d)',
            width: `${Math.min((currentStep / 3) * 100, 100)}%`,
            transition: 'width 0.6s ease'
          }} />
        </div>
      </div>

      {/* Order details */}
      <div style={{
        background: '#1a1220',
        border: '1px solid rgba(255,107,53,0.15)',
        borderRadius: '20px', padding: '20px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px'
        }}>
          <h3 style={{ color: '#fff5f0', fontSize: '16px', fontWeight: 700, margin: 0 }}>
            Order Details
          </h3>
          <span style={{ color: '#7a5f58', fontSize: '12px' }}>
            #{order.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {order.orderItems?.map((oi, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
            color: '#c8a49a', fontSize: '14px',
            marginBottom: '10px',
            paddingBottom: i < order.orderItems.length - 1 ? '10px' : '0',
            borderBottom: i < order.orderItems.length - 1
              ? '1px solid rgba(255,107,53,0.08)' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {oi.menuItem?.imageUrl && (
                <img
                  src={oi.menuItem.imageUrl}
                  alt={oi.menuItem.name}
                  style={{
                    width: '36px', height: '36px',
                    borderRadius: '8px', objectFit: 'cover'
                  }}
                />
              )}
              <span>{oi.menuItem?.name} × {oi.quantity}</span>
            </div>
            <span>₹{(Number(oi.price) * oi.quantity).toFixed(0)}</span>
          </div>
        ))}

        <div style={{
          borderTop: '1px solid rgba(255,107,53,0.12)',
          paddingTop: '12px', marginTop: '8px',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#fff5f0', fontWeight: 700, fontSize: '15px' }}>
            Total
          </span>
          <span style={{
            background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 800, fontSize: '18px'
          }}>₹{Number(order.totalAmount).toFixed(0)}</span>
        </div>
      </div>

      {/* Status card */}
      {order.status === 'ready' ? (
        <div style={{
          background: 'rgba(74,222,128,0.1)',
          border: '1px solid rgba(74,222,128,0.3)',
          borderRadius: '16px', padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#4ade80', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>
            🎉 Your order is ready!
          </p>
          <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
            Please collect from the counter
          </p>
        </div>
      ) : order.status === 'delivered' ? (
        <div style={{
          background: 'rgba(255,107,53,0.08)',
          border: '1px solid rgba(255,107,53,0.2)',
          borderRadius: '16px', padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#ff8c69', fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>
            🍽️ Enjoy your meal!
          </p>
          <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
            Thank you for dining with us
          </p>
        </div>
      ) : order.status === 'cancelled' ? (
        <div style={{
          background: 'rgba(255,100,100,0.08)',
          border: '1px solid rgba(255,100,100,0.2)',
          borderRadius: '16px', padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#ff6b6b', fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>
            ✕ Order Cancelled
          </p>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,107,53,0.06)',
          border: '1px solid rgba(255,107,53,0.15)',
          borderRadius: '16px', padding: '16px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#ff8c69', fontSize: '14px', margin: 0 }}>
            ⏱️ Estimated wait: <strong>15–20 mins</strong>
          </p>
          <p style={{ color: '#555', fontSize: '12px', margin: '6px 0 0' }}>
            Auto-refreshing every 10 seconds...
          </p>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        style={{
          width: '100%', marginTop: '16px',
          background: 'transparent',
          border: '1px solid rgba(255,107,53,0.2)',
          color: '#7a5f58', padding: '12px',
          borderRadius: '14px', fontSize: '14px',
          cursor: 'pointer'
        }}
      >← Back to Menu</button>
    </div>
  )
}