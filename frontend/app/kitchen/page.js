'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const ADMIN_KEY = 'admin123'
const headers = { 'x-admin-key': ADMIN_KEY }

const STATUS_COLORS = {
  pending:   { bg: '#ff6b35', label: 'NEW ORDER' },
  confirmed: { bg: '#60a5fa', label: 'CONFIRMED' },
  preparing: { bg: '#c44dff', label: 'PREPARING' },
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([])
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (localStorage.getItem('kitchen_authed') === '1') setAuthed(true)
  }, [])

  async function fetchOrders() {
    try {
      const { data } = await axios.get(`${API}/api/admin/kitchen/orders`, { headers })
      setOrders(data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    if (!authed) return
    fetchOrders()

    // Real-time socket
    const socket = io(API, { query: { tableId: 'kitchen' } })
    socket.on('kitchen:new_order', () => {
      fetchOrders()
      // Play sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA...')
        audio.play().catch(() => {})
      } catch(e) {}
    })

    // Auto refresh every 15s
    const interval = setInterval(fetchOrders, 15000)
    return () => { socket.disconnect(); clearInterval(interval) }
  }, [authed])

  async function markReady(orderId) {
    await axios.patch(`${API}/api/admin/kitchen/orders/${orderId}/ready`, {}, { headers })
    fetchOrders()
  }

  async function markPreparing(orderId) {
    await axios.patch(`${API}/api/admin/orders/${orderId}/status`, { status: 'preparing' }, { headers })
    fetchOrders()
  }

  function getWaitTime(createdAt) {
    const mins = Math.floor((new Date() - new Date(createdAt)) / 60000)
    return mins
  }

  if (!authed) return (
    <div style={{
      minHeight: '100vh', background: '#0d0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#1a1220', border: '1px solid rgba(255,107,53,0.2)',
        borderRadius: '20px', padding: '40px', width: '320px', textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍳</div>
        <h2 style={{ color: '#fff5f0', fontFamily: 'sans-serif', marginBottom: '20px' }}>
          Kitchen Display
        </h2>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && password === 'admin123') {
              localStorage.setItem('kitchen_authed', '1')
              setAuthed(true)
            }
          }}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,107,53,0.2)', borderRadius: '12px',
            padding: '12px 16px', color: '#fff', fontSize: '14px',
            outline: 'none', marginBottom: '12px', boxSizing: 'border-box'
          }}
        />
        <button
          onClick={() => {
            if (password === 'admin123') {
              localStorage.setItem('kitchen_authed', '1')
              setAuthed(true)
            }
          }}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            border: 'none', color: '#fff', padding: '13px',
            borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer'
          }}
        >Enter Kitchen →</button>
      </div>
    </div>
  )

  const pending = orders.filter(o => o.status === 'pending')
  const confirmed = orders.filter(o => o.status === 'confirmed')
  const preparing = orders.filter(o => o.status === 'preparing')

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🍳</span>
          <div>
            <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 800, margin: 0 }}>
              Kitchen Display
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: 0 }}>
              Spice Garden · Live Orders
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: '#fff', fontSize: '24px', fontWeight: 800, margin: 0 }}>
            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: 0 }}>
            {orders.length} active orders
          </p>
        </div>
      </div>

      {/* Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        padding: '20px',
        minHeight: 'calc(100vh - 80px)'
      }}>
        {/* New Orders */}
        <Column
          title="🔴 New Orders"
          color="#ff6b35"
          orders={pending}
          getWaitTime={getWaitTime}
          primaryAction={{ label: 'Accept →', fn: (id) => markPreparing(id), color: '#60a5fa' }}
        />

        {/* Preparing */}
        <Column
          title="🟣 Preparing"
          color="#c44dff"
          orders={[...confirmed, ...preparing]}
          getWaitTime={getWaitTime}
          primaryAction={{ label: '✓ Mark Ready', fn: (id) => markReady(id), color: '#4ade80' }}
        />

        {/* Ready to collect */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '16px', paddingBottom: '12px',
            borderBottom: '2px solid #4ade80'
          }}>
            <span style={{ fontSize: '18px' }}>🟢</span>
            <h2 style={{ color: '#4ade80', fontSize: '18px', fontWeight: 700, margin: 0 }}>
              Ready to Collect
            </h2>
          </div>
          {orders.filter(o => o.status === 'ready').length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px 0' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>✅</p>
              <p>No orders ready yet</p>
            </div>
          ) : (
            orders.filter(o => o.status === 'ready').map(order => (
              <div key={order.id} style={{
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: '12px', padding: '14px', marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '16px' }}>
                    Table {order.session?.tableId}
                  </span>
                  <span style={{ color: '#555', fontSize: '12px' }}>
                    {getWaitTime(order.createdAt)}m ago
                  </span>
                </div>
                <p style={{ color: '#888', fontSize: '12px' }}>{order.customerName}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function Column({ title, color, orders, getWaitTime, primaryAction }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '16px', paddingBottom: '12px',
        borderBottom: `2px solid ${color}`
      }}>
        <h2 style={{ color, fontSize: '18px', fontWeight: 700, margin: 0 }}>
          {title}
        </h2>
        <span style={{
          background: color, color: '#fff',
          fontSize: '12px', fontWeight: 800,
          padding: '2px 8px', borderRadius: '10px'
        }}>{orders.length}</span>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#555', padding: '40px 0' }}>
          <p style={{ fontSize: '32px', marginBottom: '8px' }}>🕐</p>
          <p>No orders here</p>
        </div>
      ) : (
        orders.map(order => {
          const waitMins = getWaitTime(order.createdAt)
          const isUrgent = waitMins > 15

          return (
            <div key={order.id} style={{
              background: '#1a1a1a',
              border: `1px solid ${isUrgent ? '#ff4444' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '14px', padding: '16px',
              marginBottom: '12px',
              boxShadow: isUrgent ? '0 0 20px rgba(255,68,68,0.2)' : 'none',
              animation: isUrgent ? 'pulse-glow 2s infinite' : 'none'
            }}>
              {/* Order header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <span style={{
                    color, fontWeight: 800, fontSize: '20px'
                  }}>Table {order.session?.tableId}</span>
                  <p style={{ color: '#888', fontSize: '12px', margin: '2px 0 0' }}>
                    {order.customerName}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    color: isUrgent ? '#ff4444' : '#888',
                    fontSize: '14px', fontWeight: isUrgent ? 800 : 400
                  }}>
                    {waitMins}m {isUrgent ? '⚠️' : ''}
                  </span>
                  <p style={{ color: '#555', fontSize: '11px', margin: '2px 0 0' }}>
                    ₹{Number(order.totalAmount).toFixed(0)}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div style={{
                background: '#111', borderRadius: '8px',
                padding: '10px', marginBottom: '12px'
              }}>
                {order.orderItems?.map((oi, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    color: '#ccc', fontSize: '13px',
                    marginBottom: i < order.orderItems.length - 1 ? '6px' : '0'
                  }}>
                    <span>{oi.menuItem?.name}</span>
                    <span style={{ color, fontWeight: 700 }}>×{oi.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Action button */}
              <button
                onClick={() => primaryAction.fn(order.id)}
                style={{
                  width: '100%',
                  background: primaryAction.color,
                  border: 'none', color: '#fff',
                  padding: '10px', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                }}
              >{primaryAction.label}</button>
            </div>
          )
        })
      )}
    </div>
  )
}