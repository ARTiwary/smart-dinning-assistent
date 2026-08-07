'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useStore } from '@/lib/store'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function SmartReorder({ phone, sessionId }) {
  const [lastOrder, setLastOrder] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [done, setDone] = useState(false)
  const [tab, setTab] = useState('last')
  const { addToCart, session } = useStore()

  useEffect(() => {
    if (!phone) return
    fetchData()
  }, [phone])

  async function fetchData() {
    setLoading(true)
    try {
      const [lastRes, favRes] = await Promise.all([
        axios.get(`${API}/api/customer/${phone}/last-order`),
        axios.get(`${API}/api/customer/${phone}/favorites`)
      ])
      setLastOrder(lastRes.data)
      setFavorites(favRes.data)
    } catch (e) {}
    setLoading(false)
  }

  async function reorderAll() {
    if (!lastOrder || !session?.id) return
    setReordering(true)
    for (const oi of lastOrder.orderItems) {
      if (oi.menuItem?.available) {
        await addToCart(session.id, oi.menuItemId, oi.menuItem.name, oi.menuItem.price)
      }
    }
    setDone(true)
    setTimeout(() => setDone(false), 3000)
    setReordering(false)
  }

  async function addFavorite(item) {
    if (!session?.id || !item) return
    await addToCart(session.id, item.id, item.name, item.price)
  }

  if (!phone || loading) return null
  if (!lastOrder && favorites.length === 0) return null

  const daysSince = lastOrder
    ? Math.floor((new Date() - new Date(lastOrder.createdAt)) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,107,157,0.06))',
      border: '1px solid rgba(255,107,53,0.2)',
      borderRadius: '20px', padding: '18px',
      marginBottom: '16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <span style={{ fontSize: '22px' }}>🔄</span>
        <div>
          <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '15px', margin: 0 }}>
            Welcome Back!
          </p>
          <p style={{ color: '#7a5f58', fontSize: '12px', margin: '2px 0 0' }}>
            {daysSince !== null
              ? daysSince === 0 ? 'You ordered today' : `Last ordered ${daysSince} day${daysSince > 1 ? 's' : ''} ago`
              : 'Your favorites are ready'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {lastOrder && (
          <button onClick={() => setTab('last')} style={{
            padding: '6px 14px', borderRadius: '20px', border: 'none',
            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            background: tab === 'last' ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)' : 'rgba(255,255,255,0.05)',
            color: tab === 'last' ? '#fff' : '#7a5f58',
          }}>🕐 Last Order</button>
        )}
        {favorites.length > 0 && (
          <button onClick={() => setTab('favorites')} style={{
            padding: '6px 14px', borderRadius: '20px', border: 'none',
            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            background: tab === 'favorites' ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)' : 'rgba(255,255,255,0.05)',
            color: tab === 'favorites' ? '#fff' : '#7a5f58',
          }}>⭐ Favorites</button>
        )}
      </div>

      {/* Last order */}
      {tab === 'last' && lastOrder && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {lastOrder.orderItems?.map((oi, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {oi.menuItem?.imageUrl ? (
                    <img src={oi.menuItem.imageUrl} alt={oi.menuItem.name}
                      style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: 'rgba(255,107,53,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px'
                    }}>🍽️</div>
                  )}
                  <div>
                    <p style={{ color: '#fff5f0', fontSize: '13px', fontWeight: 600, margin: 0 }}>
                      {oi.menuItem?.name}
                    </p>
                    <p style={{ color: '#7a5f58', fontSize: '11px', margin: '2px 0 0' }}>
                      ×{oi.quantity} · ₹{(Number(oi.price) * oi.quantity).toFixed(0)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => addFavorite(oi.menuItem)}
                  style={{
                    background: 'rgba(255,107,53,0.1)',
                    border: '1px solid rgba(255,107,53,0.2)',
                    color: '#ff8c69', padding: '5px 10px',
                    borderRadius: '8px', fontSize: '11px',
                    cursor: 'pointer', flexShrink: 0
                  }}
                >+ Add</button>
              </div>
            ))}
          </div>

          <button
            onClick={reorderAll}
            disabled={reordering}
            style={{
              width: '100%',
              background: done ? 'rgba(74,222,128,0.2)' : 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
              border: done ? '1px solid rgba(74,222,128,0.3)' : 'none',
              color: done ? '#4ade80' : '#fff',
              padding: '13px', borderRadius: '12px',
              fontSize: '14px', fontWeight: 700,
              cursor: reordering ? 'not-allowed' : 'pointer',
            }}
          >
            {reordering ? '⏳ Adding...' : done ? '✓ Added to Cart!' : '🔄 Reorder Everything'}
          </button>
        </div>
      )}

      {/* Favorites */}
      {tab === 'favorites' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {favorites.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name}
                    style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'rgba(255,107,53,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px'
                  }}>🍽️</div>
                )}
                <div>
                  <p style={{ color: '#fff5f0', fontSize: '13px', fontWeight: 600, margin: 0 }}>
                    {item.name}
                  </p>
                  <p style={{
                    background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    fontSize: '12px', fontWeight: 700, margin: '2px 0 0'
                  }}>₹{Number(item.price).toFixed(0)}</p>
                </div>
              </div>
              <button
                onClick={() => addFavorite(item)}
                style={{
                  background: 'rgba(255,107,53,0.1)',
                  border: '1px solid rgba(255,107,53,0.2)',
                  color: '#ff8c69', padding: '5px 10px',
                  borderRadius: '8px', fontSize: '11px',
                  cursor: 'pointer', flexShrink: 0
                }}
              >+ Add</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}