'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { io } from 'socket.io-client'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const STATUS_STEPS = [
  { id: 'assigned', label: 'Driver Assigned', icon: '👨‍🦺', desc: 'Driver is heading to restaurant' },
  { id: 'picked_up', label: 'Order Picked Up', icon: '🛵', desc: 'Driver has your food' },
  { id: 'on_way', label: 'On the Way', icon: '🚀', desc: 'Driver is heading to you' },
  { id: 'delivered', label: 'Delivered', icon: '🎉', desc: 'Enjoy your meal!' },
]

export default function DeliveryTracking() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [delivery, setDelivery] = useState(null)
  const [driverLocation, setDriverLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!orderId) return
    fetchData()

    // Socket for real-time updates
    socketRef.current = io(API, { query: { tableId: `delivery-${orderId}` } })

    socketRef.current.on('delivery:location', ({ lat, lng, status }) => {
      setDriverLocation({ lat, lng })
      if (status) setDelivery(prev => prev ? { ...prev, status, lat, lng } : null)
    })

    socketRef.current.on('delivery:assigned', (data) => {
      fetchData()
    })

    const interval = setInterval(fetchData, 15000)

    return () => {
      socketRef.current?.disconnect()
      clearInterval(interval)
    }
  }, [orderId])

  async function fetchData() {
    try {
      const [orderRes, deliveryRes] = await Promise.all([
        axios.get(`${API}/api/order/${orderId}`),
        axios.get(`${API}/api/delivery/${orderId}`)
      ])
      setOrder(orderRes.data)
      setDelivery(deliveryRes.data)
      if (deliveryRes.data?.lat) {
        setDriverLocation({ lat: deliveryRes.data.lat, lng: deliveryRes.data.lng })
      }
    } catch (e) {}
    setLoading(false)
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0d0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px'
    }}>
      <div style={{ fontSize: '48px' }}>🛵</div>
      <p style={{ color: '#ff8c69', fontFamily: 'sans-serif' }}>Loading delivery...</p>
    </div>
  )

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === delivery?.status)
  const currentStep = STATUS_STEPS[currentStepIndex] || STATUS_STEPS[0]

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0a0f',
      fontFamily: 'sans-serif', padding: '0'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
        padding: '20px', textAlign: 'center'
      }}>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: '0 0 4px' }}>
          🍛 Spice Garden Delivery
        </p>
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 800, margin: 0 }}>
          {delivery ? currentStep.icon + ' ' + currentStep.label : '🛵 Tracking Your Order'}
        </h1>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '480px', margin: '0 auto' }}>

        {/* No delivery assigned yet */}
        {!delivery ? (
          <div style={{
            background: 'linear-gradient(145deg, #1a1220, #201628)',
            border: '1px solid rgba(255,107,53,0.15)',
            borderRadius: '20px', padding: '32px',
            textAlign: 'center', marginBottom: '16px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
            <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '18px', margin: '0 0 8px' }}>
              Preparing your order
            </p>
            <p style={{ color: '#7a5f58', fontSize: '13px', margin: 0 }}>
              A driver will be assigned shortly
            </p>
          </div>
        ) : (
          <>
            {/* Driver info */}
            <div style={{
              background: 'linear-gradient(145deg, #1a1220, #201628)',
              border: '1px solid rgba(255,107,53,0.2)',
              borderRadius: '20px', padding: '18px',
              marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '14px'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', flexShrink: 0
              }}>🛵</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '16px', margin: '0 0 2px' }}>
                  {delivery.driverName}
                </p>
                <p style={{ color: '#7a5f58', fontSize: '12px', margin: '0 0 6px' }}>
                  Your delivery driver
                </p>
                <a href={`tel:+91${delivery.driverPhone}`} style={{
                  background: 'rgba(255,107,53,0.1)',
                  border: '1px solid rgba(255,107,53,0.2)',
                  color: '#ff8c69', padding: '5px 12px',
                  borderRadius: '20px', fontSize: '12px',
                  fontWeight: 600, textDecoration: 'none',
                  display: 'inline-block'
                }}>📞 Call Driver</a>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ color: '#ff8c69', fontWeight: 800, fontSize: '22px', margin: '0 0 2px' }}>
                  {delivery.estimatedMin}
                </p>
                <p style={{ color: '#7a5f58', fontSize: '10px', margin: 0 }}>mins</p>
              </div>
            </div>

            {/* Map placeholder — shows driver location */}
            <div style={{
              background: 'linear-gradient(145deg, #1a1220, #201628)',
              border: '1px solid rgba(255,107,53,0.15)',
              borderRadius: '20px', overflow: 'hidden',
              marginBottom: '16px', height: '220px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative'
            }}>
              {driverLocation ? (
                <iframe
                  src={`https://maps.google.com/maps?q=${driverLocation.lat},${driverLocation.lng}&z=15&output=embed`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Driver location"
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>🗺️</div>
                  <p style={{ color: '#7a5f58', fontSize: '13px' }}>
                    Live map will appear once driver starts moving
                  </p>
                </div>
              )}

              {/* Live badge */}
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                background: 'rgba(13,10,15,0.8)',
                border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: '20px', padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#4ade80',
                  animation: 'pulse-glow 1.5s infinite'
                }} />
                <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: 600 }}>LIVE</span>
              </div>
            </div>

            {/* Progress steps */}
            <div style={{
              background: 'linear-gradient(145deg, #1a1220, #201628)',
              border: '1px solid rgba(255,107,53,0.15)',
              borderRadius: '20px', padding: '20px',
              marginBottom: '16px'
            }}>
              <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '15px', marginBottom: '16px' }}>
                Order Progress
              </p>
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIndex
                const active = i === currentStepIndex
                return (
                  <div key={step.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                    marginBottom: i < STATUS_STEPS.length - 1 ? '16px' : '0'
                  }}>
                    {/* Step indicator */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: done
                          ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)'
                          : '#2a2a2a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px',
                        boxShadow: active ? '0 0 15px rgba(255,107,53,0.5)' : 'none',
                        flexShrink: 0
                      }}>
                        {done ? (active ? step.icon : '✓') : '○'}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div style={{
                          width: '2px', height: '24px', marginTop: '4px',
                          background: i < currentStepIndex
                            ? 'linear-gradient(180deg, #ff6b35, #ff6b9d)'
                            : '#2a2a2a'
                        }} />
                      )}
                    </div>

                    {/* Step info */}
                    <div style={{ paddingTop: '6px' }}>
                      <p style={{
                        color: done ? '#fff5f0' : '#555',
                        fontWeight: active ? 700 : 400,
                        fontSize: '14px', margin: '0 0 2px'
                      }}>{step.label}</p>
                      <p style={{ color: '#7a5f58', fontSize: '12px', margin: 0 }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Order summary */}
        {order && (
          <div style={{
            background: 'linear-gradient(145deg, #1a1220, #201628)',
            border: '1px solid rgba(255,107,53,0.12)',
            borderRadius: '20px', padding: '18px',
          }}>
            <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '15px', marginBottom: '12px' }}>
              Order #{order.id?.slice(0, 8).toUpperCase()}
            </p>
            {order.orderItems?.map((oi, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                color: '#c8a49a', fontSize: '13px', marginBottom: '8px'
              }}>
                <span>{oi.menuItem?.name} × {oi.quantity}</span>
                <span>₹{(Number(oi.price) * oi.quantity).toFixed(0)}</span>
              </div>
            ))}
            <div style={{
              borderTop: '1px solid rgba(255,107,53,0.1)',
              paddingTop: '10px', marginTop: '6px',
              display: 'flex', justifyContent: 'space-between',
              color: '#fff5f0', fontWeight: 700, fontSize: '15px'
            }}>
              <span>Total</span>
              <span>₹{Number(order.totalAmount).toFixed(0)}</span>
            </div>
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
            borderRadius: '14px', fontSize: '14px', cursor: 'pointer'
          }}
        >← Back</button>
      </div>
    </div>
  )
}