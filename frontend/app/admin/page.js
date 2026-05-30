'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import QRCode from 'qrcode'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const ADMIN_KEY = 'admin123'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const headers = { 'x-admin-key': ADMIN_KEY }

const STATUS_COLORS = {
  pending:   { bg: 'rgba(255,170,64,0.15)', border: 'rgba(255,170,64,0.4)', text: '#ffaa40' },
  confirmed: { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)', text: '#60a5fa' },
  preparing: { bg: 'rgba(196,77,255,0.15)', border: 'rgba(196,77,255,0.4)', text: '#c44dff' },
  ready:     { bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.4)', text: '#4ade80' },
  delivered: { bg: 'rgba(100,100,100,0.15)', border: 'rgba(100,100,100,0.3)', text: '#888' },
  cancelled: { bg: 'rgba(255,100,100,0.15)', border: 'rgba(255,100,100,0.3)', text: '#ff6b6b' },
}

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

export default function AdminPanel() {
  const [tab, setTab] = useState('dashboard')
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [tables, setTables] = useState([])
  const [qrMap, setQrMap] = useState({})
  const [tableCount, setTableCount] = useState(10)
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Auth check
  function login() {
    if (password === 'admin123') {
      setAuthed(true)
      localStorage.setItem('admin_authed', '1')
    } else {
      alert('Wrong password')
    }
  }

  useEffect(() => {
    if (localStorage.getItem('admin_authed') === '1') setAuthed(true)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, statsRes, tablesRes] = await Promise.all([
        axios.get(`${API}/api/admin/orders`, { headers }),
        axios.get(`${API}/api/admin/stats`, { headers }),
        axios.get(`${API}/api/admin/tables`, { headers }),
      ])
      setOrders(ordersRes.data)
      setStats(statsRes.data)
      setTables(tablesRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchData()
    const interval = setInterval(fetchData, 10000) // auto-refresh every 10s
    return () => clearInterval(interval)
  }, [authed, fetchData])

  async function generateQR(tableId) {
    const url = `${APP_URL}/table/${tableId}`
    const qr = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#ff6b35', light: '#0d0a0f' } })
    setQrMap(prev => ({ ...prev, [tableId]: qr }))
  }

  async function updateStatus(orderId, status) {
    await axios.patch(`${API}/api/admin/orders/${orderId}/status`, { status }, { headers })
    fetchData()
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status }))
    }
  }

  async function closeTable(sessionId) {
    if (!confirm('Close this table session?')) return
    await axios.patch(`${API}/api/admin/sessions/${sessionId}/close`, {}, { headers })
    fetchData()
  }

  if (!authed) return <LoginScreen password={password} setPassword={setPassword} onLogin={login} />

  return (
    <div style={{ minHeight: '100vh', background: '#0d0a0f', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,107,157,0.06))',
        borderBottom: '1px solid rgba(255,107,53,0.15)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px', fontWeight: 700,
            background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>🍛 Spice Garden Admin</h1>
          <p style={{ color: '#7a5f58', fontSize: '12px', marginTop: '2px' }}>Restaurant Management Dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
          <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 600 }}>LIVE</span>
          <button
            onClick={() => { localStorage.removeItem('admin_authed'); setAuthed(false) }}
            style={{ marginLeft: '12px', background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.2)', color: '#ff6b6b', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}
          >Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '16px 24px 0', borderBottom: '1px solid rgba(255,107,53,0.1)' }}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'orders', label: '🧾 Orders' },
          { id: 'tables', label: '🪑 Tables & QR' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)',
            background: tab === t.id ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)' : 'transparent',
            color: tab === t.id ? '#fff' : '#7a5f58',
            borderRadius: '10px 10px 0 0',
            borderBottom: tab === t.id ? 'none' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#7a5f58' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {tab === 'dashboard' && <Dashboard stats={stats} orders={orders} onStatusChange={updateStatus} onSelectOrder={setSelectedOrder} />}
            {tab === 'orders' && <Orders orders={orders} onStatusChange={updateStatus} onSelectOrder={setSelectedOrder} />}
            {tab === 'tables' && <Tables tables={tables} tableCount={tableCount} setTableCount={setTableCount} qrMap={qrMap} onGenerateQR={generateQR} onCloseTable={closeTable} />}
          </>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatusChange={updateStatus} />
      )}
    </div>
  )
}

function LoginScreen({ password, setPassword, onLogin }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0d0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1a1220, #201628)',
        border: '1px solid rgba(255,107,53,0.2)',
        borderRadius: '24px', padding: '40px',
        width: '100%', maxWidth: '360px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: '#fff5f0', marginBottom: '8px' }}>Admin Login</h2>
        <p style={{ color: '#7a5f58', fontSize: '13px', marginBottom: '24px' }}>Spice Garden Dashboard</p>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onLogin()}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,107,53,0.2)', borderRadius: '12px',
            padding: '13px 16px', color: '#fff5f0', fontSize: '14px',
            fontFamily: 'sans-serif', outline: 'none', marginBottom: '16px', boxSizing: 'border-box',
          }}
        />
        <button onClick={onLogin} style={{
          width: '100%', background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
          border: 'none', color: '#fff', padding: '15px', borderRadius: '14px',
          fontSize: '15px', fontWeight: 700, cursor: 'pointer',
        }}>Login →</button>
        <p style={{ color: '#7a5f58', fontSize: '11px', marginTop: '12px' }}>Default password: admin123</p>
      </div>
    </div>
  )
}

function Dashboard({ stats, orders, onStatusChange, onSelectOrder }) {
  const pending = orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status))

  return (
    <div>
      {/* Stats */}
      <div className="admin-stats-grid"
       style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: "Today's Orders", value: stats?.todayOrders || 0, icon: '📦', color: '#ff6b35' },
          { label: 'Active Orders', value: stats?.pendingOrders || 0, icon: '🔥', color: '#ff6b9d' },
          { label: 'Total Orders', value: stats?.totalOrders || 0, icon: '🧾', color: '#c44dff' },
          { label: 'Total Revenue', value: `₹${Number(stats?.totalRevenue || 0).toFixed(0)}`, icon: '💰', color: '#4ade80' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'linear-gradient(145deg, #1a1220, #201628)',
            border: `1px solid ${s.color}30`,
            borderRadius: '16px', padding: '20px',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
            <p style={{ color: s.color, fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{s.value}</p>
            <p style={{ color: '#7a5f58', fontSize: '12px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active orders */}
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#fff5f0', marginBottom: '16px' }}>
        🔥 Active Orders ({pending.length})
      </h3>
      {pending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#7a5f58' }}>
          <p style={{ fontSize: '32px', marginBottom: '8px' }}>✅</p>
          <p>All orders fulfilled!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pending.map(order => <OrderCard key={order.id} order={order} compact />)}
        </div>
      )}
    </div>
  )
}

function Orders({ orders, onStatusChange, onSelectOrder }) {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 600, fontFamily: 'sans-serif',
            background: filter === s ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)' : 'rgba(255,255,255,0.05)',
            color: filter === s ? '#fff' : '#7a5f58',
          }}>{s.charAt(0).toUpperCase() + s.slice(1)} {filter !== s && orders.filter(o => s === 'all' || o.status === s).length > 0 ? `(${orders.filter(o => s === 'all' || o.status === s).length})` : ''}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(order => (
          <OrderCard key={order.id} order={order} onStatusChange={onStatusChange} onSelect={() => onSelectOrder(order)} />
        ))}
        {filtered.length === 0 && (
          <p style={{ color: '#7a5f58', textAlign: 'center', padding: '40px' }}>No orders found</p>
        )}
      </div>
    </div>
  )
}

function OrderCard({ order, onStatusChange, onSelect, compact }) {
  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]

  return (
    <div
      onClick={onSelect}
      style={{
        background: 'linear-gradient(145deg, #1a1220, #201628)',
        border: '1px solid rgba(255,107,53,0.12)',
        borderRadius: '16px', padding: '16px',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => onSelect && (e.currentTarget.style.borderColor = 'rgba(255,107,53,0.3)')}
      onMouseLeave={e => onSelect && (e.currentTarget.style.borderColor = 'rgba(255,107,53,0.12)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#fff5f0', fontWeight: 700, fontSize: '15px' }}>
              Table {order.session?.tableId}
            </span>
            <span style={{
              background: sc.bg, border: `1px solid ${sc.border}`,
              color: sc.text, fontSize: '11px', fontWeight: 700,
              padding: '2px 8px', borderRadius: '10px',
            }}>{order.status.toUpperCase()}</span>
          </div>
          <p style={{ color: '#7a5f58', fontSize: '12px' }}>
            {order.customerName} • {order.customerPhone}
          </p>
          <p style={{ color: '#7a5f58', fontSize: '11px', marginTop: '2px' }}>
            {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{
            background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', fontSize: '18px', fontWeight: 800,
          }}>₹{Number(order.totalAmount).toFixed(0)}</p>
          <p style={{ color: '#7a5f58', fontSize: '11px' }}>{order.orderItems?.length} items</p>
        </div>
      </div>

      {/* Items */}
      {!compact && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {order.orderItems?.map((oi, i) => (
            <span key={i} style={{
              background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.15)',
              color: '#c8a49a', fontSize: '11px', padding: '3px 8px', borderRadius: '8px',
            }}>{oi.menuItem?.name} ×{oi.quantity}</span>
          ))}
        </div>
      )}

      {/* Status action */}
      {onStatusChange && nextStatus && (
        <button
          onClick={e => { e.stopPropagation(); onStatusChange(order.id, nextStatus) }}
          style={{
            background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            border: 'none', color: '#fff', padding: '8px 16px',
            borderRadius: '10px', fontSize: '12px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'sans-serif',
          }}
        >Mark {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)} →</button>
      )}
    </div>
  )
}

function Tables({ tables, tableCount, setTableCount, qrMap, onGenerateQR, onCloseTable }) {
  const tableIds = Array.from({ length: tableCount }, (_, i) => `T${i + 1}`)
  const activeMap = {}
  tables.forEach(s => { activeMap[s.tableId] = s })

  return (
    <div>
      {/* Table count control */}
      <div style={{
        background: 'linear-gradient(145deg, #1a1220, #201628)',
        border: '1px solid rgba(255,107,53,0.15)',
        borderRadius: '16px', padding: '20px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
            🪑 Restaurant Tables
          </p>
          <p style={{ color: '#7a5f58', fontSize: '13px' }}>Set the number of tables in your restaurant</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setTableCount(Math.max(1, tableCount - 1))} style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)',
            color: '#ff6b35', fontSize: '20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>−</button>
          <span style={{ color: '#fff5f0', fontWeight: 800, fontSize: '24px', minWidth: '40px', textAlign: 'center' }}>
            {tableCount}
          </span>
          <button onClick={() => setTableCount(tableCount + 1)} style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)',
            color: '#ff6b35', fontSize: '20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>+</button>
        </div>
      </div>

      {/* Table grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {tableIds.map(tableId => {
          const session = activeMap[tableId]
          const isActive = !!session
          const hasOrder = session?.orders?.length > 0
          const qr = qrMap[tableId]

          return (
            <div key={tableId} style={{
              background: 'linear-gradient(145deg, #1a1220, #201628)',
              border: `1px solid ${isActive ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: '16px', padding: '18px',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Status indicator */}
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                width: '10px', height: '10px', borderRadius: '50%',
                background: isActive ? '#ff6b35' : '#333',
                boxShadow: isActive ? '0 0 8px #ff6b35' : 'none',
              }} />

              <p style={{ color: '#fff5f0', fontWeight: 800, fontSize: '20px', marginBottom: '4px' }}>
                {tableId}
              </p>
              <p style={{ color: isActive ? '#ff8c69' : '#7a5f58', fontSize: '12px', marginBottom: '14px' }}>
                {isActive ? (hasOrder ? '🔴 Order placed' : '🟡 Browsing') : '⚪ Available'}
              </p>

              {/* QR Code */}
              {qr ? (
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <img src={qr} alt={`QR ${tableId}`} style={{ width: '140px', height: '140px', borderRadius: '8px' }} />
                  <p style={{ color: '#7a5f58', fontSize: '10px', marginTop: '6px' }}>{APP_URL}/table/{tableId}</p>
                  <a href={qr} download={`qr-${tableId}.png`} style={{
                    display: 'inline-block', marginTop: '6px',
                    background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)',
                    color: '#ff8c69', fontSize: '11px', padding: '4px 10px',
                    borderRadius: '8px', textDecoration: 'none',
                  }}>⬇ Download QR</a>
                </div>
              ) : (
                <button onClick={() => onGenerateQR(tableId)} style={{
                  width: '100%', marginBottom: '10px',
                  background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)',
                  color: '#ff8c69', padding: '10px', borderRadius: '10px',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif',
                }}>📱 Generate QR</button>
              )}

              {isActive && (
                <button onClick={() => onCloseTable(session.id)} style={{
                  width: '100%',
                  background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)',
                  color: '#ff6b6b', padding: '8px', borderRadius: '10px',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif',
                }}>🔒 Close Table</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OrderModal({ order, onClose, onStatusChange }) {
  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1a1220, #201628)',
        border: '1px solid rgba(255,107,53,0.2)',
        borderRadius: '24px', padding: '28px',
        width: '100%', maxWidth: '440px',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: '#fff5f0' }}>
            Order Details
          </h3>
          <button onClick={onClose} style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,107,53,0.15)',
            color: '#c8a49a', fontSize: '16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '18px' }}>Table {order.session?.tableId}</p>
            <p style={{ color: '#7a5f58', fontSize: '13px' }}>{order.customerName} • {order.customerPhone}</p>
            <p style={{ color: '#7a5f58', fontSize: '11px', marginTop: '4px' }}>
              {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
          <span style={{
            background: sc.bg, border: `1px solid ${sc.border}`,
            color: sc.text, fontSize: '12px', fontWeight: 700,
            padding: '6px 12px', borderRadius: '12px', height: 'fit-content',
          }}>{order.status.toUpperCase()}</span>
        </div>

        {/* Items */}
        <div style={{
          background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.1)',
          borderRadius: '14px', padding: '14px', marginBottom: '16px',
        }}>
          {order.orderItems?.map((oi, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              color: '#c8a49a', fontSize: '14px', marginBottom: '8px',
            }}>
              <span>{oi.menuItem?.name} × {oi.quantity}</span>
              <span>₹{(Number(oi.price) * oi.quantity).toFixed(0)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,107,53,0.1)', paddingTop: '8px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7a5f58', fontSize: '12px', marginBottom: '4px' }}>
              <span>GST (5%)</span><span>₹{Number(order.taxAmount).toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff5f0', fontWeight: 800, fontSize: '16px' }}>
              <span>Total</span><span>₹{Number(order.totalAmount).toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Status flow */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {STATUS_FLOW.map((s, i) => {
            const current = STATUS_FLOW.indexOf(order.status)
            const done = i <= current
            return (
              <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  height: '4px', borderRadius: '2px', marginBottom: '4px',
                  background: done ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)' : 'rgba(255,255,255,0.08)',
                }} />
                <p style={{ color: done ? '#ff8c69' : '#7a5f58', fontSize: '9px', fontWeight: 600 }}>
                  {s.toUpperCase()}
                </p>
              </div>
            )
          })}
        </div>

        {nextStatus && (
          <button onClick={() => onStatusChange(order.id, nextStatus)} style={{
            width: '100%',
            background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            border: 'none', color: '#fff', padding: '14px', borderRadius: '14px',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif',
          }}>Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)} →</button>
        )}
       {['pending', 'confirmed'].includes(order.status?.toLowerCase()) && (
  <button
    onClick={async () => {
      if (!confirm('Cancel this order?')) return
      try {
        await axios.patch(
          `${API}/api/admin/orders/${order.id}/cancel`,
          {},
          { headers }
        )
        onStatusChange(order.id, 'cancelled')
        onClose()
      } catch(e) {
        alert('Could not cancel order')
      }
    }}
    style={{
      width: '100%', marginTop: '10px',
      background: 'rgba(255,100,100,0.08)',
      border: '1px solid rgba(255,100,100,0.3)',
      color: '#ff6b6b', padding: '14px', borderRadius: '14px',
      fontSize: '14px', fontWeight: 600, cursor: 'pointer',
      fontFamily: 'sans-serif',
    }}
  >✕ Cancel Order</button>
)}
      </div>
    </div>
  )
}