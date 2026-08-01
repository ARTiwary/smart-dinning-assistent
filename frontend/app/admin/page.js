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
  const [menuItems, setMenuItems] = useState([])
  const [coupons, setCoupons] = useState([])
  const [qrMap, setQrMap] = useState({})
  const [tableCount, setTableCount] = useState(10)
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

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

  async function fetchMenuItems() {
    try {
      const { data } = await axios.get(`${API}/api/admin/menu`, { headers })
      setMenuItems(data)
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchCoupons() {
    try {
      const { data } = await axios.get(`${API}/api/admin/coupons`, { headers })
      setCoupons(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (!authed) return
    fetchData()
    fetchMenuItems()
    fetchCoupons()
    const interval = setInterval(() => {
      fetchData()
      fetchMenuItems()
      fetchCoupons()
    }, 10000)
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

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '16px 24px 0', borderBottom: '1px solid rgba(255,107,53,0.1)' }}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'analytics', label: '📈 Analytics' },
          { id: 'orders', label: '🧾 Orders' },
          { id: 'tables', label: '🪑 Tables & QR' },
          { id: 'menu', label: '🍽️ Menu' },
          { id: 'coupons', label: '🎟️ Coupons' },
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

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#7a5f58' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {tab === 'dashboard' && <Dashboard stats={stats} orders={orders} onStatusChange={updateStatus} onSelectOrder={setSelectedOrder} />}
            {tab === 'analytics' && <Analytics orders={orders} stats={stats} />}
            {tab === 'orders' && <Orders orders={orders} onStatusChange={updateStatus} onSelectOrder={setSelectedOrder} />}
            {tab === 'tables' && <Tables tables={tables} tableCount={tableCount} setTableCount={setTableCount} qrMap={qrMap} onGenerateQR={generateQR} onCloseTable={closeTable} />}
            {tab === 'menu' && (
              <MenuManagement
                menuItems={menuItems}
                onRefresh={fetchMenuItems}
                headers={headers}
              />
            )}
            {tab === 'coupons' && <CouponManager coupons={coupons} onRefresh={fetchCoupons} headers={headers} />}
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

function CouponManager({ coupons, onRefresh, headers }) {
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({
    code: '', discount: '', type: 'percentage', minOrder: 0, maxUses: 100
  })
  const [loading, setLoading] = useState(false)

  async function createCoupon() {
    if (!form.code || !form.discount) return alert('Code and discount required')
    setLoading(true)
    try {
      await axios.post(`${API}/api/admin/coupons`, {
        ...form,
        code: form.code.toUpperCase(),
        discount: Number(form.discount),
        minOrder: Number(form.minOrder),
        maxUses: Number(form.maxUses),
      }, { headers })
      setAddOpen(false)
      setForm({ code: '', discount: '', type: 'percentage', minOrder: 0, maxUses: 100 })
      onRefresh()
    } catch (e) {
      alert(e.response?.data?.error || 'Error creating coupon')
    }
    setLoading(false)
  }

  async function deleteCoupon(id, code) {
    if (!confirm(`Delete coupon "${code}"?`)) return
    await axios.delete(`${API}/api/admin/coupons/${id}`, { headers })
    onRefresh()
  }

  async function toggleCoupon(id) {
    await axios.patch(`${API}/api/admin/coupons/${id}/toggle`, {}, { headers })
    onRefresh()
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,107,53,0.2)', borderRadius: '10px',
    padding: '11px 14px', color: '#fff5f0', fontSize: '14px',
    outline: 'none', marginBottom: '12px', boxSizing: 'border-box',
    fontFamily: 'sans-serif'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#fff5f0', fontSize: '20px', fontWeight: 700, margin: 0 }}>
          Discount Coupons
        </h3>
        <button
          onClick={() => setAddOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            border: 'none', color: '#fff',
            padding: '10px 20px', borderRadius: '12px',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer'
          }}
        >+ Create Coupon</button>
      </div>

      {/* Coupons list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {coupons.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7a5f58' }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>🎟️</p>
            <p>No coupons yet. Create one!</p>
          </div>
        )}
        {coupons.map(coupon => (
          <div key={coupon.id} style={{
            background: 'linear-gradient(145deg, #1a1220, #201628)',
            border: `1px solid ${coupon.active ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: '14px', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '16px',
            opacity: coupon.active ? 1 : 0.5
          }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,157,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', flexShrink: 0
            }}>🎟️</div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <p style={{ color: '#fff5f0', fontSize: '16px', fontWeight: 800, margin: 0, letterSpacing: '0.05em' }}>
                  {coupon.code}
                </p>
                {!coupon.active && (
                  <span style={{
                    background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.2)',
                    color: '#ff6b6b', fontSize: '10px', padding: '2px 6px', borderRadius: '6px'
                  }}>INACTIVE</span>
                )}
              </div>
              <p style={{ color: '#ff8c69', fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>
                {coupon.type === 'percentage' ? `${coupon.discount}% off` : `₹${coupon.discount} flat off`}
                {coupon.minOrder > 0 && ` · Min ₹${coupon.minOrder}`}
              </p>
              <p style={{ color: '#7a5f58', fontSize: '11px', margin: 0 }}>
                Used {coupon.usedCount}/{coupon.maxUses} times
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={() => toggleCoupon(coupon.id)} style={{
                background: coupon.active ? 'rgba(74,222,128,0.1)' : 'rgba(255,107,53,0.1)',
                border: `1px solid ${coupon.active ? 'rgba(74,222,128,0.3)' : 'rgba(255,107,53,0.2)'}`,
                color: coupon.active ? '#4ade80' : '#ff8c69',
                padding: '5px 12px', borderRadius: '8px',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer'
              }}>{coupon.active ? '✓ Active' : '✗ Inactive'}</button>
              <button onClick={() => deleteCoupon(coupon.id, coupon.code)} style={{
                background: 'rgba(255,100,100,0.08)',
                border: '1px solid rgba(255,100,100,0.2)',
                color: '#ff6b6b', padding: '5px 12px',
                borderRadius: '8px', fontSize: '11px',
                fontWeight: 600, cursor: 'pointer'
              }}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {addOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1a1220, #201628)',
            border: '1px solid rgba(255,107,53,0.25)',
            borderRadius: '20px', padding: '28px',
            width: '100%', maxWidth: '380px'
          }}>
            <h3 style={{ color: '#fff5f0', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
              🎟️ Create Coupon
            </h3>

            <input placeholder="Coupon code (e.g. SAVE20)" value={form.code}
              onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              style={inputStyle} />

            <select value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="percentage">Percentage discount (%)</option>
              <option value="flat">Flat discount (₹)</option>
            </select>

            <input type="number"
              placeholder={form.type === 'percentage' ? 'Discount % (e.g. 20)' : 'Discount amount ₹'}
              value={form.discount}
              onChange={e => setForm(p => ({ ...p, discount: e.target.value }))}
              style={inputStyle} />

            <input type="number" placeholder="Minimum order value (₹)" value={form.minOrder}
              onChange={e => setForm(p => ({ ...p, minOrder: e.target.value }))}
              style={inputStyle} />

            <input type="number" placeholder="Max uses (default 100)" value={form.maxUses}
              onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
              style={inputStyle} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={createCoupon} disabled={loading} style={{
                flex: 1, background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                border: 'none', color: '#fff', padding: '14px',
                borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', opacity: loading ? 0.6 : 1
              }}>{loading ? 'Creating...' : 'Create'}</button>
              <button onClick={() => setAddOpen(false)} style={{
                flex: 1, background: 'transparent',
                border: '1px solid rgba(255,107,53,0.2)',
                color: '#7a5f58', padding: '14px',
                borderRadius: '12px', fontSize: '14px', cursor: 'pointer'
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Analytics({ orders, stats }) {
  const revenueByDay = {}
  orders.forEach(o => {
    const day = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    revenueByDay[day] = (revenueByDay[day] || 0) + Number(o.totalAmount)
  })
  const revenueData = Object.entries(revenueByDay).slice(-7)
  const maxRevenue = Math.max(...revenueData.map(([,v]) => v), 1)

  const itemCount = {}
  orders.forEach(o => {
    o.orderItems?.forEach(oi => {
      const name = oi.menuItem?.name || 'Unknown'
      itemCount[name] = (itemCount[name] || 0) + oi.quantity
    })
  })
  const topItems = Object.entries(itemCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxCount = Math.max(...topItems.map(([,v]) => v), 1)

  const statusCount = {}
  orders.forEach(o => {
    statusCount[o.status] = (statusCount[o.status] || 0) + 1
  })

  const catRevenue = {}
  orders.forEach(o => {
    o.orderItems?.forEach(oi => {
      const cat = oi.menuItem?.category || 'Other'
      catRevenue[cat] = (catRevenue[cat] || 0) + Number(oi.price) * oi.quantity
    })
  })
  const topCats = Object.entries(catRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const avgOrderValue = orders.length > 0
    ? orders.reduce((s, o) => s + Number(o.totalAmount), 0) / orders.length
    : 0

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px', marginBottom: '28px'
      }}>
        {[
          { label: 'Total Revenue', value: `₹${Number(stats?.totalRevenue || 0).toFixed(0)}`, icon: '💰', color: '#4ade80' },
          { label: 'Total Orders', value: stats?.totalOrders || 0, icon: '🧾', color: '#ff6b35' },
          { label: "Today's Orders", value: stats?.todayOrders || 0, icon: '📦', color: '#ff6b9d' },
          { label: 'Avg Order Value', value: `₹${avgOrderValue.toFixed(0)}`, icon: '📊', color: '#c44dff' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: 'linear-gradient(145deg, #1a1220, #201628)',
            border: `1px solid ${kpi.color}30`,
            borderRadius: '16px', padding: '18px',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{kpi.icon}</div>
            <p style={{ color: kpi.color, fontSize: '22px', fontWeight: 800, margin: '0 0 4px' }}>
              {kpi.value}
            </p>
            <p style={{ color: '#7a5f58', fontSize: '11px', margin: 0 }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{
          background: 'linear-gradient(145deg, #1a1220, #201628)',
          border: '1px solid rgba(255,107,53,0.15)',
          borderRadius: '16px', padding: '20px'
        }}>
          <h3 style={{ color: '#fff5f0', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>
            📈 Revenue Last 7 Days
          </h3>
          {revenueData.length === 0 ? (
            <p style={{ color: '#7a5f58', textAlign: 'center', padding: '20px' }}>No data yet</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px' }}>
              {revenueData.map(([day, revenue]) => (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <p style={{ color: '#ff8c69', fontSize: '9px', fontWeight: 700 }}>
                    ₹{revenue >= 1000 ? `${(revenue/1000).toFixed(1)}k` : revenue.toFixed(0)}
                  </p>
                  <div style={{
                    width: '100%',
                    height: `${(revenue / maxRevenue) * 100}px`,
                    background: 'linear-gradient(180deg, #ff6b9d, #ff6b35)',
                    borderRadius: '6px 6px 0 0',
                    minHeight: '4px',
                    transition: 'height 0.5s ease'
                  }} />
                  <p style={{ color: '#7a5f58', fontSize: '9px', textAlign: 'center' }}>{day}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          background: 'linear-gradient(145deg, #1a1220, #201628)',
          border: '1px solid rgba(255,107,53,0.15)',
          borderRadius: '16px', padding: '20px'
        }}>
          <h3 style={{ color: '#fff5f0', fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>
            ⭐ Top Ordered Items
          </h3>
          {topItems.length === 0 ? (
            <p style={{ color: '#7a5f58', textAlign: 'center', padding: '20px' }}>No data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topItems.map(([name, count], i) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#c8a49a', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '} {name}
                    </span>
                    <span style={{ color: '#ff8c69', fontSize: '12px', fontWeight: 700 }}>{count}x</span>
                  </div>
                  <div style={{ height: '6px', background: '#2a2a2a', borderRadius: '3px' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      background: 'linear-gradient(90deg, #ff6b35, #ff6b9d)',
                      width: `${(count / maxCount) * 100}%`,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{
          background: 'linear-gradient(145deg, #1a1220, #201628)',
          border: '1px solid rgba(255,107,53,0.15)',
          borderRadius: '16px', padding: '20px'
        }}>
          <h3 style={{ color: '#fff5f0', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
            🧾 Orders by Status
          </h3>
          {Object.entries(statusCount).map(([status, count]) => {
            const colors = {
              pending: '#ffaa40', confirmed: '#60a5fa',
              preparing: '#c44dff', ready: '#4ade80',
              delivered: '#888', cancelled: '#ff6b6b'
            }
            return (
              <div key={status} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '10px'
              }}>
                <span style={{ color: colors[status] || '#888', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>
                  {status}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '80px', height: '6px',
                    background: '#2a2a2a', borderRadius: '3px'
                  }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      background: colors[status] || '#888',
                      width: `${(count / orders.length) * 100}%`
                    }} />
                  </div>
                  <span style={{ color: '#fff5f0', fontSize: '13px', fontWeight: 700, minWidth: '20px' }}>
                    {count}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{
          background: 'linear-gradient(145deg, #1a1220, #201628)',
          border: '1px solid rgba(255,107,53,0.15)',
          borderRadius: '16px', padding: '20px'
        }}>
          <h3 style={{ color: '#fff5f0', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
            🍽️ Revenue by Category
          </h3>
          {topCats.length === 0 ? (
            <p style={{ color: '#7a5f58', textAlign: 'center', padding: '20px' }}>No data yet</p>
          ) : topCats.map(([cat, rev]) => (
            <div key={cat} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#c8a49a', fontSize: '11px' }}>{cat}</span>
                <span style={{ color: '#ff8c69', fontSize: '11px', fontWeight: 700 }}>
                  ₹{rev.toFixed(0)}
                </span>
              </div>
              <div style={{ height: '5px', background: '#2a2a2a', borderRadius: '3px' }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  background: 'linear-gradient(90deg, #c44dff, #ff6b9d)',
                  width: `${(rev / topCats[0][1]) * 100}%`
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
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
            color: sc.text, fontSize: '11px', fontWeight: 700,
            padding: '4px 10px', borderRadius: '10px', height: 'fit-content'
          }}>{order.status.toUpperCase()}</span>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 0', marginBottom: '20px' }}>
          {order.orderItems?.map((oi, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#c8a49a', fontSize: '14px' }}>
              <span>{oi.menuItem?.name} × {oi.quantity}</span>
              <span>₹{(Number(oi.price) * oi.quantity).toFixed(0)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', color: '#fff5f0', fontWeight: 800, fontSize: '16px' }}>
            <span>Total</span>
            <span>₹{Number(order.totalAmount).toFixed(0)}</span>
          </div>
        </div>

        {onStatusChange && nextStatus && (
          <button
            onClick={() => onStatusChange(order.id, nextStatus)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
              border: 'none', color: '#fff', padding: '12px',
              borderRadius: '12px', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'sans-serif',
            }}
          >
            Mark {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)} →
          </button>
        )}
      </div>
    </div>
  )
}

function MenuManagement({ menuItems, onRefresh, headers }) {
  const [editItem, setEditItem] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')

  const categories = ['All', ...new Set(menuItems.map(i => i.category))]

  const filtered = menuItems.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'All' || item.category === filterCat
    return matchSearch && matchCat
  })

  async function toggleAvailability(id) {
    await axios.patch(`${API}/api/admin/menu/${id}/toggle`, {}, { headers })
    onRefresh()
  }

  async function deleteItem(id, name) {
    if (!confirm(`Delete "${name}"?`)) return
    await axios.delete(`${API}/api/admin/menu/${id}`, { headers })
    onRefresh()
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <h3 style={{ color: '#fff5f0', fontSize: '20px', fontWeight: 700, margin: 0 }}>
            Menu Management
          </h3>
          <p style={{ color: '#7a5f58', fontSize: '13px', margin: '4px 0 0' }}>
            {menuItems.length} items total
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            border: 'none', color: '#fff',
            padding: '10px 20px', borderRadius: '12px',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer'
          }}
        >+ Add Item</button>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          placeholder="Search items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '200px',
            background: '#1a1220', border: '1px solid rgba(255,107,53,0.2)',
            borderRadius: '10px', padding: '10px 14px',
            color: '#fff5f0', fontSize: '14px', outline: 'none'
          }}
        />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={{
            background: '#1a1220', border: '1px solid rgba(255,107,53,0.2)',
            borderRadius: '10px', padding: '10px 14px',
            color: '#fff5f0', fontSize: '13px', outline: 'none', cursor: 'pointer'
          }}
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Items grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(item => (
          <div key={item.id} style={{
            background: 'linear-gradient(145deg, #1a1220, #201628)',
            border: `1px solid ${item.available ? 'rgba(255,107,53,0.12)' : 'rgba(255,100,100,0.15)'}`,
            borderRadius: '14px', padding: '14px',
            display: 'flex', alignItems: 'center', gap: '12px',
            opacity: item.available ? 1 : 0.6
          }}>
            {/* Image */}
            <div style={{
              width: '52px', height: '52px', borderRadius: '10px',
              overflow: 'hidden', flexShrink: 0,
              background: 'rgba(255,107,53,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : <span style={{ fontSize: '22px' }}>🍽️</span>}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <p style={{
                  color: '#fff5f0', fontSize: '14px', fontWeight: 600,
                  margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>{item.name}</p>
                {!item.available && (
                  <span style={{
                    background: 'rgba(255,100,100,0.15)',
                    border: '1px solid rgba(255,100,100,0.3)',
                    color: '#ff6b6b', fontSize: '10px',
                    padding: '2px 6px', borderRadius: '6px', flexShrink: 0
                  }}>UNAVAILABLE</span>
                )}
              </div>
              <p style={{ color: '#7a5f58', fontSize: '12px', margin: '0 0 4px' }}>
                {item.category}
              </p>
              <p style={{
                background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontSize: '14px', fontWeight: 700, margin: 0
              }}>₹{item.price}</p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={() => toggleAvailability(item.id)}
                style={{
                  background: item.available ? 'rgba(74,222,128,0.1)' : 'rgba(255,107,53,0.1)',
                  border: `1px solid ${item.available ? 'rgba(74,222,128,0.3)' : 'rgba(255,107,53,0.3)'}`,
                  color: item.available ? '#4ade80' : '#ff8c69',
                  padding: '5px 10px', borderRadius: '8px',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                }}
              >{item.available ? '✓ Available' : '✗ Unavailable'}</button>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setEditItem(item)}
                  style={{
                    flex: 1, background: 'rgba(255,107,53,0.1)',
                    border: '1px solid rgba(255,107,53,0.2)',
                    color: '#ff8c69', padding: '5px',
                    borderRadius: '8px', fontSize: '12px', cursor: 'pointer'
                  }}
                >✏️</button>
                <button
                  onClick={() => deleteItem(item.id, item.name)}
                  style={{
                    flex: 1, background: 'rgba(255,100,100,0.1)',
                    border: '1px solid rgba(255,100,100,0.2)',
                    color: '#ff6b6b', padding: '5px',
                    borderRadius: '8px', fontSize: '12px', cursor: 'pointer'
                  }}
                >🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(addOpen || editItem) && (
        <MenuItemModal
          item={editItem}
          headers={headers}
          onClose={() => { setAddOpen(false); setEditItem(null) }}
          onSave={() => { setAddOpen(false); setEditItem(null); onRefresh() }}
        />
      )}
    </div>
  )
}

function MenuItemModal({ item, headers, onClose, onSave }) {
  const isEdit = !!item
  const [form, setForm] = useState({
    name: item?.name || '',
    category: item?.category || 'Veg Starters',
    price: item?.price || '',
    description: item?.description || '',
    imageUrl: item?.imageUrl || '',
    tags: item?.tags?.join(', ') || '',
    allergens: item?.allergens?.join(', ') || '',
    available: item?.available ?? true,
    popularScore: item?.popularScore || 0.5,
  })
  const [loading, setLoading] = useState(false)

  const CATEGORIES = [
    'Veg Starters', 'Non-Veg Starters', 'Mains (Veg)',
    'Mains (Non-Veg)', 'Breads & Rice', 'Desserts',
    'Beverages (Hot)', 'Beverages (Cold)', 'Combos & Deals'
  ]

  async function save() {
    if (!form.name || !form.price) return alert('Name and price are required')
    setLoading(true)
    const payload = {
      ...form,
      price: Number(form.price),
      popularScore: Number(form.popularScore),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      allergens: form.allergens.split(',').map(a => a.trim()).filter(Boolean),
    }
    try {
      if (isEdit) {
        await axios.patch(`${API}/api/admin/menu/${item.id}`, payload, { headers })
      } else {
        await axios.post(`${API}/api/admin/menu`, payload, { headers })
      }
      onSave()
    } catch (e) {
      alert(e.response?.data?.error || 'Error saving item')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,107,53,0.2)', borderRadius: '10px',
    padding: '11px 14px', color: '#fff5f0', fontSize: '14px',
    outline: 'none', marginBottom: '12px', boxSizing: 'border-box',
    fontFamily: 'sans-serif'
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1a1220, #201628)',
        border: '1px solid rgba(255,107,53,0.25)',
        borderRadius: '20px', padding: '28px',
        width: '100%', maxWidth: '440px',
        maxHeight: '85vh', overflowY: 'auto'
      }}>
        <h3 style={{
          color: '#fff5f0', fontSize: '20px', fontWeight: 700,
          marginBottom: '20px'
        }}>{isEdit ? '✏️ Edit Item' : '+ Add New Item'}</h3>

        <input placeholder="Item name *" value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          style={inputStyle} />

        <select value={form.category}
          onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
          style={{ ...inputStyle, cursor: 'pointer' }}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <input type="number" placeholder="Price (₹) *" value={form.price}
          onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
          style={inputStyle} />

        <textarea placeholder="Description (max 120 chars)" value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          maxLength={120}
          style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />

        <input placeholder="Image URL" value={form.imageUrl}
          onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
          style={inputStyle} />

        <input placeholder="Tags (comma separated: spicy, veg, bestseller)"
          value={form.tags}
          onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
          style={inputStyle} />

        <input placeholder="Allergens (comma separated: dairy, gluten)"
          value={form.allergens}
          onChange={e => setForm(p => ({ ...p, allergens: e.target.value }))}
          style={inputStyle} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <label style={{ color: '#c8a49a', fontSize: '14px' }}>Available</label>
          <button
            onClick={() => setForm(p => ({ ...p, available: !p.available }))}
            style={{
              background: form.available ? 'rgba(74,222,128,0.15)' : 'rgba(255,100,100,0.1)',
              border: `1px solid ${form.available ? 'rgba(74,222,128,0.3)' : 'rgba(255,100,100,0.2)'}`,
              color: form.available ? '#4ade80' : '#ff6b6b',
              padding: '6px 14px', borderRadius: '8px',
              fontSize: '13px', cursor: 'pointer'
            }}
          >{form.available ? '✓ Yes' : '✗ No'}</button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={save} disabled={loading} style={{
            flex: 1,
            background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            border: 'none', color: '#fff', padding: '14px',
            borderRadius: '12px', fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', opacity: loading ? 0.6 : 1
          }}>{loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Item'}</button>

          <button onClick={onClose} style={{
            flex: 1, background: 'transparent',
            border: '1px solid rgba(255,107,53,0.2)',
            color: '#7a5f58', padding: '14px',
            borderRadius: '12px', fontSize: '14px', cursor: 'pointer'
          }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}