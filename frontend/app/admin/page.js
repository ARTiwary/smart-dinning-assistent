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

const ALL_TABS = [
  { id: 'dashboard', label: '📊 Dashboard', permission: 'dashboard' },
  { id: 'analytics', label: '📈 Analytics', permission: 'analytics' },
  { id: 'forecast', label: '🔮 Forecast', permission: 'forecast' },
  { id: 'loyalty', label: '💎 Loyalty', permission: 'analytics' },
  { id: 'orders', label: '🧾 Orders', permission: 'orders' },
  { id: 'reservations', label: '📅 Reservations', permission: 'reservations' },
  { id: 'tables', label: '🪑 Tables & QR', permission: 'tables' },
  { id: 'menu', label: '🍽️ Menu', permission: 'menu' },
  { id: 'coupons', label: '🎟️ Coupons', permission: 'coupons' },
  { id: 'inventory', label: '📦 Inventory', permission: 'inventory' },
  { id: 'staff', label: '👥 Staff', permission: 'staff' },
  { id: 'restaurants', label: '🏪 Branches', permission: 'staff' },
]

export default function AdminPanel() {
  const [tab, setTab] = useState('dashboard')
  const [orders, setOrders] = useState([])
  const [reservations, setReservations] = useState([])
  const [stats, setStats] = useState(null)
  const [loyaltyStats, setLoyaltyStats] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [tables, setTables] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [coupons, setCoupons] = useState([])
  const [inventory, setInventory] = useState([])
  const [lowStockAlerts, setLowStockAlerts] = useState([])
  const [qrMap, setQrMap] = useState({})
  const [tableCount, setTableCount] = useState(10)
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [staffSession, setStaffSession] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [restaurants, setRestaurants] = useState([])

  useEffect(() => {
    const stored = localStorage.getItem('staff_session')
    if (stored) {
      const session = JSON.parse(stored)
      setStaffSession(session)
      setAuthed(true)
    }
  }, [])

  function handleLogin() {
    const stored = localStorage.getItem('staff_session')
    if (stored) setStaffSession(JSON.parse(stored))
    setAuthed(true)
  }

  function logout() {
    localStorage.removeItem('staff_session')
    localStorage.removeItem('admin_authed')
    setAuthed(false)
    setStaffSession(null)
  }

  // Helper to check permission
  function can(permission) {
    if (!staffSession) return false
    return staffSession.permissions?.includes(permission)
  }

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, statsRes, tablesRes, loyaltyRes] = await Promise.all([
        axios.get(`${API}/api/admin/orders`, { headers }),
        axios.get(`${API}/api/admin/stats`, { headers }),
        axios.get(`${API}/api/admin/tables`, { headers }),
        axios.get(`${API}/api/admin/loyalty/stats`, { headers }),
      ])
      setOrders(ordersRes.data)
      setStats(statsRes.data)
      setTables(tablesRes.data)
      setLoyaltyStats(loyaltyRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  async function fetchReservations() {
    try {
      const { data } = await axios.get(`${API}/api/reservations`, { headers })
      setReservations(data)
    } catch (e) {
      console.error(e)
    }
  }

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

  async function fetchForecast() {
    try {
      const { data } = await axios.get(`${API}/api/admin/forecast`, { headers })
      setForecast(data)
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchInventory() {
    try {
      const [invRes, alertRes] = await Promise.all([
        axios.get(`${API}/api/admin/inventory`, { headers }),
        axios.get(`${API}/api/admin/inventory/alerts`, { headers })
      ])
      setInventory(invRes.data)
      setLowStockAlerts(alertRes.data)
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchRestaurants() {
  try {
    const { data } = await axios.get(`${API}/api/admin/restaurants`, { headers })
    setRestaurants(data)
  } catch (e) {}
}

  useEffect(() => {
    if (!authed) return
    fetchData()
    fetchReservations()
    fetchMenuItems()
    fetchCoupons()
    fetchForecast()
    fetchInventory()
    fetchRestaurants()
    const interval = setInterval(() => {
      fetchData()
      fetchReservations()
      fetchMenuItems()
      fetchCoupons()
      fetchForecast()
      fetchInventory()
      fetchRestaurants()
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

  if (!authed) return <LoginScreen onLogin={handleLogin} />

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
          {staffSession && (
            <div style={{
              background: 'rgba(255,107,53,0.1)',
              border: '1px solid rgba(255,107,53,0.2)',
              borderRadius: '20px', padding: '6px 12px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ fontSize: '14px' }}>
                {staffSession.role === 'owner' ? '👑' :
                 staffSession.role === 'manager' ? '🎯' :
                 staffSession.role === 'cashier' ? '💳' : '🍳'}
              </span>
              <span style={{ color: '#ff8c69', fontSize: '13px', fontWeight: 600 }}>
                {staffSession.name}
              </span>
              <span style={{ color: '#7a5f58', fontSize: '11px', textTransform: 'capitalize' }}>
                {staffSession.role}
              </span>
            </div>
          )}
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
          <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 600 }}>LIVE</span>
          <button
            onClick={logout}
            style={{ marginLeft: '12px', background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.2)', color: '#ff6b6b', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}
          >Logout</button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '16px 24px 0', borderBottom: '1px solid rgba(255,107,53,0.1)', overflowX: 'auto' }}>
        {ALL_TABS.filter(t => can(t.permission)).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)',
            background: tab === t.id ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)' : 'transparent',
            color: tab === t.id ? '#fff' : '#7a5f58',
            borderRadius: '10px 10px 0 0',
            whiteSpace: 'nowrap',
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
            {tab === 'dashboard' && <Dashboard stats={stats} loyaltyStats={loyaltyStats} orders={orders} onStatusChange={updateStatus} onSelectOrder={setSelectedOrder} />}
            {tab === 'analytics' && <Analytics orders={orders} stats={stats} />}
            {tab === 'forecast' && <Forecast forecast={forecast} />}
            {tab === 'loyalty' && <LoyaltyView loyaltyStats={loyaltyStats} />}
            {tab === 'orders' && <Orders orders={orders} onStatusChange={updateStatus} onSelectOrder={setSelectedOrder} />}
            {tab === 'reservations' && (
              <ReservationsPanel reservations={reservations} onRefresh={fetchReservations} headers={headers} />
            )}
            {tab === 'tables' && <Tables tables={tables} tableCount={tableCount} setTableCount={setTableCount} qrMap={qrMap} onGenerateQR={generateQR} onCloseTable={closeTable} />}
            {tab === 'menu' && (
              <MenuManagement
                menuItems={menuItems}
                onRefresh={fetchMenuItems}
                headers={headers}
              />
            )}
            {tab === 'coupons' && <CouponManager coupons={coupons} onRefresh={fetchCoupons} headers={headers} />}
            {tab === 'inventory' && (
              <InventoryManager
                inventory={inventory}
                lowStockAlerts={lowStockAlerts}
                menuItems={menuItems}
                onRefresh={fetchInventory}
                headers={headers}
              />
            )}
            {tab === 'staff' && can('staff') && (
              <StaffManager headers={headers} />
            )}
            {tab === 'restaurants' && can('staff') && (
              <RestaurantManager restaurants={restaurants} onRefresh={fetchRestaurants} headers={headers} />
              )}
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

function RestaurantManager({ restaurants, onRefresh, headers }) {
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [branchStats, setBranchStats] = useState({})
  const [form, setForm] = useState({
    name: '', slug: '', address: '', phone: '', logo: '', active: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    restaurants.forEach(async r => {
      try {
        const { data } = await axios.get(`${API}/api/admin/restaurants/${r.id}/stats`, { headers })
        setBranchStats(prev => ({ ...prev, [r.id]: data }))
      } catch (e) {}
    })
  }, [restaurants])

  async function save() {
    if (!form.name || !form.slug) return alert('Name and slug required')
    setLoading(true)
    try {
      if (editItem) {
        await axios.patch(`${API}/api/admin/restaurants/${editItem.id}`, form, { headers })
      } else {
        await axios.post(`${API}/api/admin/restaurants`, form, { headers })
      }
      setAddOpen(false); setEditItem(null)
      setForm({ name: '', slug: '', address: '', phone: '', logo: '', active: true })
      onRefresh()
    } catch (e) {
      alert(e.response?.data?.error || 'Error saving restaurant')
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ color: '#fff5f0', fontSize: '20px', fontWeight: 700, margin: 0 }}>
            Restaurant Branches
          </h3>
          <p style={{ color: '#7a5f58', fontSize: '13px', margin: '4px 0 0' }}>
            {restaurants.length} branch{restaurants.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <button onClick={() => { setEditItem(null); setAddOpen(true) }} style={{
          background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
          border: 'none', color: '#fff', padding: '10px 20px',
          borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
        }}>+ Add Branch</button>
      </div>

      {/* Branch cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {restaurants.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1', textAlign: 'center',
            padding: '40px', color: '#7a5f58'
          }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>🏪</p>
            <p>No branches yet. Add your first restaurant!</p>
          </div>
        ) : restaurants.map(r => {
          const stats = branchStats[r.id]
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          return (
            <div key={r.id} style={{
              background: 'linear-gradient(145deg, #1a1220, #201628)',
              border: `1px solid ${r.active ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: '20px', padding: '20px',
              opacity: r.active ? 1 : 0.6
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', flexShrink: 0, overflow: 'hidden'
                }}>
                  {r.logo
                    ? <img src={r.logo} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '🍛'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '16px', margin: 0 }}>{r.name}</p>
                  <p style={{ color: '#7a5f58', fontSize: '12px', margin: '2px 0 0' }}>/{r.slug}</p>
                </div>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: r.active ? '#4ade80' : '#555',
                  boxShadow: r.active ? '0 0 8px #4ade80' : 'none'
                }} />
              </div>

              {/* Stats */}
              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                  {[
                    { label: "Today's Orders", value: stats.todayOrders, color: '#ff8c69' },
                    { label: 'Revenue', value: `₹${Math.round(stats.todayRevenue)}`, color: '#4ade80' },
                    { label: 'Active Tables', value: stats.activeTables, color: '#60a5fa' },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: 'rgba(255,107,53,0.05)', borderRadius: '10px', padding: '8px', textAlign: 'center'
                    }}>
                      <p style={{ color: s.color, fontWeight: 700, fontSize: '16px', margin: '0 0 2px' }}>{s.value}</p>
                      <p style={{ color: '#555', fontSize: '9px', margin: 0 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Info */}
              {r.address && (
                <p style={{ color: '#7a5f58', fontSize: '12px', marginBottom: '6px' }}>
                  📍 {r.address}
                </p>
              )}
              {r.phone && (
                <p style={{ color: '#7a5f58', fontSize: '12px', marginBottom: '10px' }}>
                  📞 {r.phone}
                </p>
              )}

              {/* Customer URL */}
              <div style={{
                background: 'rgba(255,107,53,0.06)',
                border: '1px solid rgba(255,107,53,0.12)',
                borderRadius: '10px', padding: '8px 12px',
                marginBottom: '12px'
              }}>
                <p style={{ color: '#7a5f58', fontSize: '10px', margin: '0 0 2px' }}>Customer URL</p>
                <p style={{ color: '#ff8c69', fontSize: '11px', margin: 0, wordBreak: 'break-all' }}>
                  {appUrl}/r/{r.slug}/table/T1
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={`/r/${r.slug}/table/T1`} target="_blank" style={{
                  flex: 1, textAlign: 'center',
                  background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)',
                  color: '#ff8c69', padding: '8px',
                  borderRadius: '10px', fontSize: '12px',
                  fontWeight: 600, textDecoration: 'none'
                }}>👁️ Preview</a>
                <button onClick={() => {
                  setEditItem(r)
                  setForm({ name: r.name, slug: r.slug, address: r.address || '', phone: r.phone || '', logo: r.logo || '', active: r.active })
                  setAddOpen(true)
                }} style={{
                  flex: 1, background: 'rgba(255,107,53,0.1)',
                  border: '1px solid rgba(255,107,53,0.2)',
                  color: '#ff8c69', padding: '8px',
                  borderRadius: '10px', fontSize: '12px',
                  fontWeight: 600, cursor: 'pointer'
                }}>✏️ Edit</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add/Edit Modal */}
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
            width: '100%', maxWidth: '420px',
            maxHeight: '85vh', overflowY: 'auto'
          }}>
            <h3 style={{ color: '#fff5f0', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
              {editItem ? '✏️ Edit Branch' : '🏪 Add New Branch'}
            </h3>

            <input placeholder="Restaurant name *" value={form.name}
              onChange={e => {
                const name = e.target.value
                const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                setForm(p => ({ ...p, name, slug: editItem ? p.slug : slug }))
              }}
              style={inputStyle} />

            <input placeholder="URL slug (e.g. spice-garden-delhi) *" value={form.slug}
              onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              style={inputStyle} />

            <input placeholder="Address" value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              style={inputStyle} />

            <input placeholder="Phone number" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              style={inputStyle} />

            <input placeholder="Logo URL" value={form.logo}
              onChange={e => setForm(p => ({ ...p, logo: e.target.value }))}
              style={inputStyle} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <p style={{ color: '#c8a49a', fontSize: '14px', fontWeight: 600, margin: 0 }}>Active</p>
              <button onClick={() => setForm(p => ({ ...p, active: !p.active }))} style={{
                width: '48px', height: '26px', borderRadius: '13px', border: 'none',
                background: form.active ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)' : '#2a2a2a',
                cursor: 'pointer', position: 'relative'
              }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '3px',
                  left: form.active ? '25px' : '3px', transition: 'left 0.2s'
                }} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={save} disabled={loading} style={{
                flex: 1, background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                border: 'none', color: '#fff', padding: '14px',
                borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', opacity: loading ? 0.6 : 1
              }}>{loading ? 'Saving...' : editItem ? 'Update' : 'Create Branch'}</button>
              <button onClick={() => { setAddOpen(false); setEditItem(null) }} style={{
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

function Forecast({ forecast }) {
  if (!forecast) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#7a5f58' }}>
      <p style={{ fontSize: '40px', marginBottom: '12px' }}>🔮</p>
      <p>Not enough data yet. Place some orders first!</p>
    </div>
  )

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const maxRevenue = Math.max(...forecast.weeklyTrend.map(d => d.revenue), 1)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#fff5f0', fontSize: '20px', fontWeight: 700, margin: '0 0 4px' }}>
          🔮 Revenue Forecast
        </h3>
        <p style={{ color: '#7a5f58', fontSize: '13px', margin: 0 }}>
          Based on last 30 days of order data
        </p>
      </div>

      {/* Tomorrow prediction */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,107,53,0.12), rgba(196,77,255,0.08))',
        border: '1px solid rgba(255,107,53,0.2)',
        borderRadius: '20px', padding: '22px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '24px' }}>📅</span>
          <div>
            <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '16px', margin: 0 }}>
              Tomorrow ({forecast.tomorrow.day})
            </p>
            <p style={{ color: '#7a5f58', fontSize: '12px', margin: '2px 0 0' }}>
              AI prediction based on historical patterns
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Expected Revenue', value: `₹${forecast.tomorrow.expectedRevenue.toLocaleString()}`, color: '#4ade80', icon: '💰' },
            { label: 'Expected Orders', value: forecast.tomorrow.expectedOrders, color: '#60a5fa', icon: '🧾' },
            { label: '7-Day Growth', value: `${forecast.growthRate > 0 ? '+' : ''}${forecast.growthRate}%`, color: forecast.growthRate >= 0 ? '#4ade80' : '#ff6b6b', icon: forecast.growthRate >= 0 ? '📈' : '📉' },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '14px', textAlign: 'center'
            }}>
              <p style={{ fontSize: '20px', margin: '0 0 4px' }}>{kpi.icon}</p>
              <p style={{ color: kpi.color, fontSize: '18px', fontWeight: 800, margin: '0 0 4px' }}>
                {kpi.value}
              </p>
              <p style={{ color: '#7a5f58', fontSize: '10px', margin: 0 }}>{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Peak hours */}
        <div>
          <p style={{ color: '#c8a49a', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
            🔥 Expected Peak Hours
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {forecast.tomorrow.peakHours.map((ph, i) => (
              <div key={i} style={{
                flex: 1, background: i === 0 ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${i === 0 ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px', padding: '10px', textAlign: 'center'
              }}>
                <p style={{ color: i === 0 ? '#ff8c69' : '#c8a49a', fontSize: '14px', fontWeight: 700, margin: '0 0 2px' }}>
                  {ph.label}
                </p>
                <p style={{ color: '#7a5f58', fontSize: '11px', margin: 0 }}>
                  ~{ph.expectedOrders} orders
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly revenue chart */}
      <div style={{
        background: 'linear-gradient(145deg, #1a1220, #201628)',
        border: '1px solid rgba(255,107,53,0.12)',
        borderRadius: '20px', padding: '20px',
        marginBottom: '20px'
      }}>
        <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '15px', marginBottom: '20px' }}>
          📊 Weekly Revenue Pattern
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
          {forecast.weeklyTrend.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              {d.revenue > 0 && (
                <p style={{ color: '#ff8c69', fontSize: '9px', fontWeight: 600, margin: 0 }}>
                  ₹{d.revenue >= 1000 ? `${(d.revenue/1000).toFixed(1)}k` : d.revenue}
                </p>
              )}
              <div style={{
                width: '100%',
                height: `${Math.max((d.revenue / maxRevenue) * 100, 4)}px`,
                background: d.orders > 0
                  ? 'linear-gradient(180deg, #ff6b9d, #ff6b35)'
                  : '#2a2a2a',
                borderRadius: '6px 6px 0 0',
                minHeight: '4px',
                transition: 'height 0.5s ease'
              }} />
              <p style={{ color: '#7a5f58', fontSize: '10px', margin: 0 }}>{d.day}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top items forecast */}
      <div style={{
        background: 'linear-gradient(145deg, #1a1220, #201628)',
        border: '1px solid rgba(255,107,53,0.12)',
        borderRadius: '20px', padding: '20px',
        marginBottom: '20px'
      }}>
        <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '15px', marginBottom: '16px' }}>
          🏆 Predicted Top Sellers Tomorrow
        </p>
        {forecast.topItems.length === 0 ? (
          <p style={{ color: '#7a5f58', textAlign: 'center', padding: '20px' }}>No data yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {forecast.topItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: i === 0 ? 'linear-gradient(135deg, #ffd700, #ffaa40)'
                    : i === 1 ? 'linear-gradient(135deg, #c0c0c0, #888)'
                    : i === 2 ? 'linear-gradient(135deg, #cd7f32, #8b4513)'
                    : '#2a2a2a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 800, color: '#fff', flexShrink: 0
                }}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#fff5f0', fontSize: '14px', fontWeight: 600, margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </p>
                  <div style={{ height: '5px', background: '#2a2a2a', borderRadius: '3px' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      background: 'linear-gradient(90deg, #ff6b35, #ff6b9d)',
                      width: `${(item.count / forecast.topItems[0].count) * 100}%`
                    }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ color: '#ff8c69', fontSize: '13px', fontWeight: 700, margin: 0 }}>
                    {item.count}x
                  </p>
                  <p style={{ color: '#7a5f58', fontSize: '11px', margin: '2px 0 0' }}>
                    ₹{Math.round(item.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {[
          { label: 'Orders (30 days)', value: forecast.totalOrders30d, icon: '📦', color: '#60a5fa' },
          { label: 'Avg Order Value', value: `₹${forecast.avgOrderValue}`, icon: '💳', color: '#c44dff' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'linear-gradient(145deg, #1a1220, #201628)',
            border: `1px solid ${s.color}25`,
            borderRadius: '16px', padding: '18px'
          }}>
            <p style={{ fontSize: '24px', margin: '0 0 8px' }}>{s.icon}</p>
            <p style={{ color: s.color, fontSize: '22px', fontWeight: 800, margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ color: '#7a5f58', fontSize: '12px', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReservationsPanel({ reservations, onRefresh, headers }) {
  const [filter, setFilter] = useState('upcoming')

  const today = new Date().toISOString().split('T')[0]

  const filtered = reservations.filter(r => {
    if (filter === 'upcoming') return r.date >= today && r.status !== 'cancelled'
    if (filter === 'today') return r.date === today && r.status !== 'cancelled'
    if (filter === 'cancelled') return r.status === 'cancelled'
    return true
  })

  async function cancel(id) {
    if (!confirm('Cancel this reservation?')) return
    await axios.patch(`${API}/api/reservations/${id}/cancel`, {}, { headers })
    onRefresh()
  }

  const TIMES = {
    '12:00':'12:00 PM','12:30':'12:30 PM','13:00':'1:00 PM',
    '13:30':'1:30 PM','14:00':'2:00 PM','14:30':'2:30 PM',
    '19:00':'7:00 PM','19:30':'7:30 PM','20:00':'8:00 PM',
    '20:30':'8:30 PM','21:00':'9:00 PM'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#fff5f0', fontSize: '20px', fontWeight: 700, margin: 0 }}>
          Table Reservations
        </h3>
        <p style={{ color: '#7a5f58', fontSize: '13px', margin: 0 }}>
          {reservations.filter(r => r.date === today && r.status !== 'cancelled').length} today
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { id: 'today', label: "Today" },
          { id: 'upcoming', label: "Upcoming" },
          { id: 'all', label: "All" },
          { id: 'cancelled', label: "Cancelled" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '7px 16px', borderRadius: '20px', border: 'none',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            background: filter === f.id ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)' : 'rgba(255,255,255,0.05)',
            color: filter === f.id ? '#fff' : '#7a5f58',
          }}>{f.label}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7a5f58' }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>📅</p>
            <p>No reservations found</p>
          </div>
        ) : filtered.map(r => (
          <div key={r.id} style={{
            background: 'linear-gradient(145deg, #1a1220, #201628)',
            border: `1px solid ${r.status === 'cancelled' ? 'rgba(255,100,100,0.15)' : 'rgba(255,107,53,0.12)'}`,
            borderRadius: '16px', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '16px',
            opacity: r.status === 'cancelled' ? 0.6 : 1
          }}>
            {/* Date block */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '12px',
              background: r.date === today
                ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)'
                : 'rgba(255,107,53,0.1)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <p style={{
                color: r.date === today ? '#fff' : '#ff8c69',
                fontSize: '18px', fontWeight: 800, margin: 0, lineHeight: 1
              }}>
                {new Date(r.date + 'T00:00:00').getDate()}
              </p>
              <p style={{
                color: r.date === today ? 'rgba(255,255,255,0.8)' : '#7a5f58',
                fontSize: '10px', margin: 0, textTransform: 'uppercase'
              }}>
                {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}
              </p>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <p style={{ color: '#fff5f0', fontSize: '15px', fontWeight: 700, margin: 0 }}>
                  {r.name}
                </p>
                {r.status === 'cancelled' && (
                  <span style={{
                    background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.2)',
                    color: '#ff6b6b', fontSize: '10px', padding: '2px 6px', borderRadius: '6px'
                  }}>CANCELLED</span>
                )}
              </div>
              <p style={{ color: '#7a5f58', fontSize: '12px', margin: '0 0 4px' }}>
                ⏰ {TIMES[r.time] || r.time} · 👥 {r.guests} guests · 🪑 {r.tableId}
              </p>
              <p style={{ color: '#7a5f58', fontSize: '12px', margin: 0 }}>
                📱 +91{r.phone}
              </p>
              {r.note && (
                <p style={{ color: '#555', fontSize: '11px', margin: '4px 0 0' }}>
                  📝 {r.note}
                </p>
              )}
            </div>

            {/* Cancel button */}
            {r.status !== 'cancelled' && (
              <button onClick={() => cancel(r.id)} style={{
                background: 'rgba(255,100,100,0.08)',
                border: '1px solid rgba(255,100,100,0.2)',
                color: '#ff6b6b', padding: '8px 14px',
                borderRadius: '10px', fontSize: '12px',
                fontWeight: 600, cursor: 'pointer', flexShrink: 0
              }}>Cancel</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function LoyaltyView({ loyaltyStats }) {
  if (!loyaltyStats) return null

  return (
    <div>
      <h3 style={{ color: '#fff5f0', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
        💎 Customer Loyalty Overview
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px', marginBottom: '28px'
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #1a1220, #201628)',
          border: '1px solid rgba(255,209,102,0.3)',
          borderRadius: '16px', padding: '20px'
        }}>
          <p style={{ color: '#7a5f58', fontSize: '12px', margin: '0 0 6px' }}>Total Active Points</p>
          <p style={{ color: '#ffd166', fontSize: '28px', fontWeight: 800, margin: 0 }}>
            {loyaltyStats.totalPoints?.points || 0}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(145deg, #1a1220, #201628)',
          border: '1px solid rgba(74,222,128,0.3)',
          borderRadius: '16px', padding: '20px'
        }}>
          <p style={{ color: '#7a5f58', fontSize: '12px', margin: '0 0 6px' }}>Lifetime Points Earned</p>
          <p style={{ color: '#4ade80', fontSize: '28px', fontWeight: 800, margin: 0 }}>
            {loyaltyStats.totalPoints?.totalEarned || 0}
          </p>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(145deg, #1a1220, #201628)',
        border: '1px solid rgba(255,107,53,0.15)',
        borderRadius: '16px', padding: '20px'
      }}>
        <h4 style={{ color: '#fff5f0', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
          🏆 Top Loyalty Members
        </h4>

        {(!loyaltyStats.topAccounts || loyaltyStats.topAccounts.length === 0) ? (
          <p style={{ color: '#7a5f58', fontSize: '13px' }}>No loyalty accounts found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loyaltyStats.topAccounts.map((acc, index) => (
              <div key={acc.id || index} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div>
                  <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '14px', margin: '0 0 2px' }}>
                    {acc.phone || `Customer #${index + 1}`}
                  </p>
                  <p style={{ color: '#7a5f58', fontSize: '12px', margin: 0 }}>
                    Lifetime Earned: {acc.totalEarned || 0} pts
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    color: '#ffd166', fontWeight: 800, fontSize: '16px',
                    background: 'rgba(255,209,102,0.1)', padding: '4px 10px', borderRadius: '8px'
                  }}>
                    {acc.points || 0} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Dashboard({ stats, loyaltyStats, orders, onStatusChange, onSelectOrder }) {
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
          { label: 'Loyalty Points Issued', value: loyaltyStats?.totalPoints?.totalEarned || 0, icon: '💎', color: '#ffd166' },
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

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useAdminKey, setUseAdminKey] = useState(false)
  const [adminKey, setAdminKey] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      if (useAdminKey) {
        // Legacy admin key login
        if (adminKey === 'admin123') {
          localStorage.setItem('staff_session', JSON.stringify({
            name: 'Admin', role: 'owner',
            permissions: ['dashboard','orders','tables','menu','inventory',
              'coupons','reservations','analytics','forecast','staff','kitchen']
          }))
          onLogin()
        } else {
          setError('Invalid admin key')
        }
      } else {
        // Staff login
        const { data } = await axios.post(`${API}/api/admin/staff/login`, { email, password })
        localStorage.setItem('staff_session', JSON.stringify(data))
        onLogin()
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid credentials')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1a1220, #201628)',
        border: '1px solid rgba(255,107,53,0.2)',
        borderRadius: '24px', padding: '40px',
        width: '100%', maxWidth: '380px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍛</div>
          <h2 style={{
            background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontSize: '24px', fontWeight: 800, margin: '0 0 4px'
          }}>Spice Garden</h2>
          <p style={{ color: '#7a5f58', fontSize: '13px', margin: 0 }}>Staff Login</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)',
            borderRadius: '10px', padding: '10px 14px',
            color: '#ff6b6b', fontSize: '13px', marginBottom: '16px'
          }}>⚠ {error}</div>
        )}

        {/* Toggle login type */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button onClick={() => setUseAdminKey(false)} style={{
            flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            background: !useAdminKey ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)' : 'rgba(255,255,255,0.04)',
            color: !useAdminKey ? '#fff' : '#7a5f58'
          }}>👤 Staff Login</button>
          <button onClick={() => setUseAdminKey(true)} style={{
            flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            background: useAdminKey ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)' : 'rgba(255,255,255,0.04)',
            color: useAdminKey ? '#fff' : '#7a5f58'
          }}>🔑 Admin Key</button>
        </div>

        {useAdminKey ? (
          <input type="password" placeholder="Admin key"
            value={adminKey} onChange={e => setAdminKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,107,53,0.2)', borderRadius: '12px',
              padding: '13px 16px', color: '#fff5f0', fontSize: '14px',
              outline: 'none', marginBottom: '14px', boxSizing: 'border-box'
            }} />
        ) : (
          <>
            <input type="email" placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,107,53,0.2)', borderRadius: '12px',
                padding: '13px 16px', color: '#fff5f0', fontSize: '14px',
                outline: 'none', marginBottom: '12px', boxSizing: 'border-box'
              }} />
            <input type="password" placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,107,53,0.2)', borderRadius: '12px',
                padding: '13px 16px', color: '#fff5f0', fontSize: '14px',
                outline: 'none', marginBottom: '14px', boxSizing: 'border-box'
              }} />
          </>
        )}

        <button onClick={handleLogin} disabled={loading} style={{
          width: '100%', background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
          border: 'none', color: '#fff', padding: '15px', borderRadius: '14px',
          fontSize: '15px', fontWeight: 700, cursor: 'pointer',
          opacity: loading ? 0.7 : 1, marginBottom: '12px'
        }}>{loading ? '⏳ Logging in...' : 'Login →'}</button>

        <p style={{ color: '#7a5f58', fontSize: '11px', textAlign: 'center' }}>
          Default: owner@spicegarden.com / admin123
        </p>
      </div>
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
    publicId: item?.publicId || '',
    tags: item?.tags?.join(', ') || '',
    allergens: item?.allergens?.join(', ') || '',
    available: item?.available ?? true,
    popularScore: item?.popularScore || 0.5,
  })
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)

  const CATEGORIES = [
    'Veg Starters', 'Non-Veg Starters', 'Mains (Veg)',
    'Mains (Non-Veg)', 'Breads & Rice', 'Desserts',
    'Beverages (Hot)', 'Beverages (Cold)', 'Combos & Deals'
  ]

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploadLoading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const { data } = await axios.post(
        `${API}/api/admin/menu/upload-image`,
        formData,
        {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      setForm(p => ({ ...p, imageUrl: data.imageUrl, publicId: data.publicId }))
    } catch (e) {
      alert('Upload failed: ' + (e.response?.data?.error || e.message))
    }
    setUploadLoading(false)
  }

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

        {/* Image upload */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#c8a49a', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
            Food Image
          </label>

          {/* Preview */}
          {form.imageUrl && (
            <div style={{
              width: '100%', height: '160px',
              borderRadius: '12px', overflow: 'hidden',
              marginBottom: '10px', position: 'relative',
              background: 'rgba(255,107,53,0.08)'
            }}>
              <img
                src={form.imageUrl}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                onClick={() => setForm(p => ({ ...p, imageUrl: '', publicId: '' }))}
                style={{
                  position: 'absolute', top: '8px', right: '8px',
                  background: 'rgba(0,0,0,0.6)', border: 'none',
                  color: '#fff', borderRadius: '50%',
                  width: '28px', height: '28px',
                  cursor: 'pointer', fontSize: '14px'
                }}
              >✕</button>
            </div>
          )}

          {/* Upload button */}
          {!form.imageUrl && (
            <label style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '120px', borderRadius: '12px',
              border: '2px dashed rgba(255,107,53,0.3)',
              cursor: 'pointer', marginBottom: '10px',
              background: 'rgba(255,107,53,0.04)',
              transition: 'border-color 0.2s'
            }}>
              <span style={{ fontSize: '32px', marginBottom: '8px' }}>📸</span>
              <span style={{ color: '#7a5f58', fontSize: '13px' }}>
                {uploadLoading ? 'Uploading...' : 'Click to upload image'}
              </span>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </label>
          )}

          {/* Or URL input */}
          <input
            placeholder="Or paste image URL"
            value={form.imageUrl}
            onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
            style={inputStyle}
          />
        </div>

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
function InventoryManager({ inventory, lowStockAlerts, menuItems, onRefresh, headers }) {
  const [editItem, setEditItem] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const inventoryMap = {}
  inventory.forEach(i => { inventoryMap[i.menuItemId] = i })

  const enriched = menuItems.map(item => ({
    ...item,
    inventory: inventoryMap[item.id] || null
  }))

  const filtered = enriched.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    const inv = item.inventory
    if (filter === 'tracked') return matchSearch && inv?.trackStock
    if (filter === 'low') return matchSearch && inv?.trackStock && inv?.stock <= inv?.lowStockAt
    if (filter === 'out') return matchSearch && (!item.available || inv?.stock === 0)
    return matchSearch
  })

  function getStockStatus(item) {
    const inv = item.inventory
    if (!inv || !inv.trackStock) return { label: 'Not Tracked', color: '#555', bg: 'rgba(255,255,255,0.04)' }
    if (inv.stock === 0) return { label: 'Out of Stock', color: '#ff6b6b', bg: 'rgba(255,100,100,0.1)' }
    if (inv.stock <= inv.lowStockAt) return { label: `Low: ${inv.stock}`, color: '#ffaa40', bg: 'rgba(255,170,64,0.1)' }
    return { label: `In Stock: ${inv.stock}`, color: '#4ade80', bg: 'rgba(74,222,128,0.08)' }
  }

  async function quickRestock(menuItemId, amount) {
    await axios.post(`${API}/api/admin/inventory/${menuItemId}/restock`,
      { amount }, { headers })
    onRefresh()
  }

  return (
    <div>
      {/* Low stock alerts */}
      {lowStockAlerts.length > 0 && (
        <div style={{
          background: 'rgba(255,170,64,0.08)',
          border: '1px solid rgba(255,170,64,0.3)',
          borderRadius: '16px', padding: '16px', marginBottom: '20px'
        }}>
          <p style={{ color: '#ffaa40', fontWeight: 700, fontSize: '14px', margin: '0 0 10px' }}>
            ⚠️ {lowStockAlerts.length} item{lowStockAlerts.length > 1 ? 's' : ''} running low
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {lowStockAlerts.map(alert => (
              <div key={alert.id} style={{
                background: 'rgba(255,170,64,0.1)',
                border: '1px solid rgba(255,170,64,0.2)',
                borderRadius: '10px', padding: '6px 12px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <span style={{ color: '#ffaa40', fontSize: '13px', fontWeight: 600 }}>
                  {alert.menuItem?.name}
                </span>
                <span style={{ color: '#7a5f58', fontSize: '12px' }}>
                  {alert.stock} left
                </span>
                <button
                  onClick={() => quickRestock(alert.menuItemId, 50)}
                  style={{
                    background: 'rgba(255,170,64,0.2)',
                    border: 'none', color: '#ffaa40',
                    padding: '3px 8px', borderRadius: '6px',
                    fontSize: '11px', cursor: 'pointer', fontWeight: 600
                  }}
                >+50</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: '#fff5f0', fontSize: '20px', fontWeight: 700, margin: 0 }}>
          Inventory Management
        </h3>
        <p style={{ color: '#7a5f58', fontSize: '13px', margin: 0 }}>
          {inventory.filter(i => i.trackStock).length} items tracked
        </p>
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
        {['all', 'tracked', 'low', 'out'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 14px', borderRadius: '20px', border: 'none',
            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            background: filter === f ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)' : 'rgba(255,255,255,0.05)',
            color: filter === f ? '#fff' : '#7a5f58',
          }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(item => {
          const status = getStockStatus(item)
          const inv = item.inventory
          return (
            <div key={item.id} style={{
              background: 'linear-gradient(145deg, #1a1220, #201628)',
              border: '1px solid rgba(255,107,53,0.1)',
              borderRadius: '14px', padding: '14px',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              {/* Image */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '10px',
                overflow: 'hidden', flexShrink: 0,
                background: 'rgba(255,107,53,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '20px' }}>🍽️</span>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#fff5f0', fontSize: '14px', fontWeight: 600, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </p>
                <p style={{ color: '#7a5f58', fontSize: '12px', margin: '0 0 6px' }}>{item.category}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: status.bg, borderRadius: '8px',
                    padding: '3px 8px', color: status.color,
                    fontSize: '11px', fontWeight: 600
                  }}>{status.label}</span>
                  {inv?.trackStock && inv?.stock > 0 && (
                    <div style={{
                      flex: 1, maxWidth: '100px', height: '4px',
                      background: '#2a2a2a', borderRadius: '2px'
                    }}>
                      <div style={{
                        height: '100%', borderRadius: '2px',
                        background: inv.stock <= inv.lowStockAt
                          ? '#ffaa40' : '#4ade80',
                        width: `${Math.min((inv.stock / (inv.lowStockAt * 3)) * 100, 100)}%`
                      }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {inv?.trackStock && (
                  <button
                    onClick={() => quickRestock(item.id, 10)}
                    style={{
                      background: 'rgba(74,222,128,0.1)',
                      border: '1px solid rgba(74,222,128,0.2)',
                      color: '#4ade80', padding: '6px 10px',
                      borderRadius: '8px', fontSize: '12px',
                      cursor: 'pointer', fontWeight: 600
                    }}
                  >+10</button>
                )}
                <button
                  onClick={() => setEditItem(item)}
                  style={{
                    background: 'rgba(255,107,53,0.1)',
                    border: '1px solid rgba(255,107,53,0.2)',
                    color: '#ff8c69', padding: '6px 10px',
                    borderRadius: '8px', fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >⚙️ Set</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit modal */}
      {editItem && (
        <StockModal
          item={editItem}
          headers={headers}
          onClose={() => setEditItem(null)}
          onSave={() => { setEditItem(null); onRefresh() }}
        />
      )}
    </div>
  )
}

function StockModal({ item, headers, onClose, onSave }) {
  const inv = item.inventory
  const [form, setForm] = useState({
    stock: inv?.stock || 0,
    lowStockAt: inv?.lowStockAt || 10,
    trackStock: inv?.trackStock || false,
  })
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    try {
      await axios.patch(
        `${API}/api/admin/inventory/${item.id}`,
        form, { headers }
      )
      onSave()
    } catch (e) {
      alert(e.response?.data?.error || 'Error updating stock')
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1a1220, #201628)',
        border: '1px solid rgba(255,107,53,0.25)',
        borderRadius: '20px', padding: '28px',
        width: '100%', maxWidth: '360px'
      }}>
        <h3 style={{ color: '#fff5f0', fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
          📦 {item.name}
        </h3>
        <p style={{ color: '#7a5f58', fontSize: '13px', marginBottom: '20px' }}>
          Set stock level and tracking
        </p>

        {/* Track stock toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <p style={{ color: '#c8a49a', fontSize: '14px', fontWeight: 600, margin: 0 }}>Track Stock</p>
            <p style={{ color: '#7a5f58', fontSize: '12px', margin: '2px 0 0' }}>Auto-disable when stock hits 0</p>
          </div>
          <button
            onClick={() => setForm(p => ({ ...p, trackStock: !p.trackStock }))}
            style={{
              width: '48px', height: '26px', borderRadius: '13px', border: 'none',
              background: form.trackStock ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)' : '#2a2a2a',
              cursor: 'pointer', position: 'relative', transition: 'background 0.2s'
            }}
          >
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
              position: 'absolute', top: '3px',
              left: form.trackStock ? '25px' : '3px',
              transition: 'left 0.2s'
            }} />
          </button>
        </div>

        {form.trackStock && (
          <>
            {/* Current stock */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#c8a49a', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Current Stock
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setForm(p => ({ ...p, stock: Math.max(0, p.stock - 10) }))} style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)',
                  color: '#ff8c69', fontSize: '18px', cursor: 'pointer'
                }}>−</button>
                <input type="number" value={form.stock}
                  onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,107,53,0.2)', borderRadius: '10px',
                    padding: '10px', color: '#fff5f0', fontSize: '18px',
                    fontWeight: 700, textAlign: 'center', outline: 'none'
                  }} />
                <button onClick={() => setForm(p => ({ ...p, stock: p.stock + 10 }))} style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)',
                  color: '#ff8c69', fontSize: '18px', cursor: 'pointer'
                }}>+</button>
              </div>
            </div>

            {/* Low stock threshold */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#c8a49a', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Low Stock Alert at
              </label>
              <input type="number" value={form.lowStockAt}
                onChange={e => setForm(p => ({ ...p, lowStockAt: Number(e.target.value) }))}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,107,53,0.2)', borderRadius: '10px',
                  padding: '11px 14px', color: '#fff5f0', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box'
                }} />
              <p style={{ color: '#7a5f58', fontSize: '11px', margin: '4px 0 0' }}>
                Alert shows when stock drops to or below this number
              </p>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={save} disabled={loading} style={{
            flex: 1, background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            border: 'none', color: '#fff', padding: '14px',
            borderRadius: '12px', fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', opacity: loading ? 0.6 : 1
          }}>{loading ? 'Saving...' : 'Save'}</button>
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

function StaffManager({ headers }) {
  const [staff, setStaff] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'cashier', active:true })
  const [loading, setLoading] = useState(false)

  const ROLES = [
    { id: 'owner', label: 'Owner', icon: '👑', desc: 'Full access to everything' },
    { id: 'manager', label: 'Manager', icon: '🎯', desc: 'All except staff management' },
    { id: 'cashier', label: 'Cashier', icon: '💳', desc: 'Orders, tables, reservations' },
    { id: 'kitchen', label: 'Kitchen', icon: '🍳', desc: 'Kitchen display and orders only' },
  ]

  async function fetchStaff() {
    try {
      const { data } = await axios.get(`${API}/api/admin/staff`, { headers })
      setStaff(data)
    } catch (e) {}
  }

  useEffect(() => { fetchStaff() }, [])

  async function seedOwner() {
    try {
      await axios.post(`${API}/api/admin/staff/seed-owner`, {}, { headers })
      fetchStaff()
      alert('Owner account created: owner@spicegarden.com / admin123')
    } catch (e) {}
  }

  async function save() {
    setLoading(true)
    try {
      if (editItem) {
        await axios.patch(`${API}/api/admin/staff/${editItem.id}`, form, { headers })
      } else {
        await axios.post(`${API}/api/admin/staff`, form, { headers })
      }
      setAddOpen(false); setEditItem(null)
      setForm({ name:'', email:'', password:'', role:'cashier', active:true })
      fetchStaff()
    } catch (e) {
      alert(e.response?.data?.error || 'Error saving staff')
    }
    setLoading(false)
  }

  async function toggleActive(id, active) {
    await axios.patch(`${API}/api/admin/staff/${id}`, { active: !active }, { headers })
    fetchStaff()
  }

  async function deleteStaffMember(id, name) {
    if (!confirm(`Remove ${name} from staff?`)) return
    await axios.delete(`${API}/api/admin/staff/${id}`, { headers })
    fetchStaff()
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
        <div>
          <h3 style={{ color: '#fff5f0', fontSize: '20px', fontWeight: 700, margin: 0 }}>Staff Management</h3>
          <p style={{ color: '#7a5f58', fontSize: '13px', margin: '4px 0 0' }}>
            {staff.length} team members
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {staff.length === 0 && (
            <button onClick={seedOwner} style={{
              background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
              color: '#ffd166', padding: '10px 16px', borderRadius: '12px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer'
            }}>🌱 Seed Owner</button>
          )}
          <button onClick={() => { setEditItem(null); setAddOpen(true) }} style={{
            background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            border: 'none', color: '#fff', padding: '10px 20px',
            borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
          }}>+ Add Staff</button>
        </div>
      </div>

      {/* Role legend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '20px' }}>
        {ROLES.map(role => (
          <div key={role.id} style={{
            background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.1)',
            borderRadius: '12px', padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span style={{ fontSize: '18px' }}>{role.icon}</span>
            <div>
              <p style={{ color: '#fff5f0', fontSize: '13px', fontWeight: 600, margin: 0 }}>{role.label}</p>
              <p style={{ color: '#7a5f58', fontSize: '11px', margin: 0 }}>{role.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Staff list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {staff.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7a5f58' }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>👥</p>
            <p>No staff yet. Click "Seed Owner" to create the first account.</p>
          </div>
        ) : staff.map(member => {
          const role = ROLES.find(r => r.id === member.role) || ROLES[2]
          return (
            <div key={member.id} style={{
              background: 'linear-gradient(145deg, #1a1220, #201628)',
              border: '1px solid rgba(255,107,53,0.1)',
              borderRadius: '14px', padding: '14px',
              display: 'flex', alignItems: 'center', gap: '12px',
              opacity: member.active ? 1 : 0.5
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,107,157,0.15))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', flexShrink: 0
              }}>{role.icon}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <p style={{ color: '#fff5f0', fontSize: '14px', fontWeight: 700, margin: 0 }}>
                    {member.name}
                  </p>
                  <span style={{
                    background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)',
                    color: '#ff8c69', fontSize: '10px', padding: '2px 6px', borderRadius: '6px',
                    textTransform: 'capitalize'
                  }}>{member.role}</span>
                  {!member.active && (
                    <span style={{
                      background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.2)',
                      color: '#ff6b6b', fontSize: '10px', padding: '2px 6px', borderRadius: '6px'
                    }}>Inactive</span>
                  )}
                </div>
                <p style={{ color: '#7a5f58', fontSize: '12px', margin: '0 0 2px' }}>{member.email}</p>
                {member.lastLogin && (
                  <p style={{ color: '#555', fontSize: '11px', margin: 0 }}>
                    Last login: {new Date(member.lastLogin).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => toggleActive(member.id, member.active)} style={{
                  background: member.active ? 'rgba(74,222,128,0.1)' : 'rgba(255,100,100,0.1)',
                  border: `1px solid ${member.active ? 'rgba(74,222,128,0.3)' : 'rgba(255,100,100,0.2)'}`,
                  color: member.active ? '#4ade80' : '#ff6b6b',
                  padding: '5px 10px', borderRadius: '8px',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                }}>{member.active ? '✓ Active' : '✗ Inactive'}</button>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => { setEditItem(member); setForm({ name: member.name, email: member.email, password: '', role: member.role, active: member.active }); setAddOpen(true) }} style={{
                    flex: 1, background: 'rgba(255,107,53,0.1)',
                    border: '1px solid rgba(255,107,53,0.2)',
                    color: '#ff8c69', padding: '5px',
                    borderRadius: '8px', fontSize: '12px', cursor: 'pointer'
                  }}>✏️</button>
                  <button onClick={() => deleteStaffMember(member.id, member.name)} style={{
                    flex: 1, background: 'rgba(255,100,100,0.1)',
                    border: '1px solid rgba(255,100,100,0.2)',
                    color: '#ff6b6b', padding: '5px',
                    borderRadius: '8px', fontSize: '12px', cursor: 'pointer'
                  }}>🗑️</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add/Edit Modal */}
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
            width: '100%', maxWidth: '400px'
          }}>
            <h3 style={{ color: '#fff5f0', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
              {editItem ? '✏️ Edit Staff' : '+ Add Staff Member'}
            </h3>

            <input placeholder="Full name" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              style={inputStyle} />

            <input type="email" placeholder="Email address" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              style={inputStyle} />

            <input type="password" placeholder={editItem ? "New password (leave blank to keep)" : "Password"}
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              style={inputStyle} />

            {/* Role selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#c8a49a', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>
                Role
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {ROLES.map(role => (
                  <button key={role.id} onClick={() => setForm(p => ({ ...p, role: role.id }))} style={{
                    padding: '10px', borderRadius: '12px', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    background: form.role === role.id
                      ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
                    border: form.role === role.id
                      ? '1px solid rgba(255,107,53,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <p style={{ color: form.role === role.id ? '#ff8c69' : '#c8a49a', fontSize: '13px', fontWeight: 700, margin: '0 0 2px' }}>
                      {role.icon} {role.label}
                    </p>
                    <p style={{ color: '#555', fontSize: '10px', margin: 0 }}>{role.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={save} disabled={loading} style={{
                flex: 1, background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                border: 'none', color: '#fff', padding: '14px',
                borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', opacity: loading ? 0.6 : 1
              }}>{loading ? 'Saving...' : editItem ? 'Update' : 'Add Staff'}</button>
              <button onClick={() => { setAddOpen(false); setEditItem(null) }} style={{
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