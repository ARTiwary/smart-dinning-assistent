'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useStore } from '@/lib/store'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function TimePicks({ sessionId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToCart, session, cart, updateQty } = useStore()

  useEffect(() => {
    if (!sessionId) return
    fetchTimePicks()
  }, [sessionId])

  async function fetchTimePicks() {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API}/api/session/${sessionId}/ai/time-picks`)
      setData(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function getCartItem(itemId) {
    return cart.find(c => c.menuItemId === itemId)
  }

  if (loading) return (
    <div style={{
      background: 'rgba(255,107,53,0.04)',
      border: '1px solid rgba(255,107,53,0.1)',
      borderRadius: '20px', padding: '20px',
      marginBottom: '16px', textAlign: 'center'
    }}>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#ff6b35',
            animation: `bounce-dot 1.4s ease-in-out ${i * 0.16}s infinite`
          }} />
        ))}
      </div>
    </div>
  )

  if (!data || data.items?.length === 0) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(196,77,255,0.06))',
      border: '1px solid rgba(255,107,53,0.15)',
      borderRadius: '20px', padding: '18px',
      marginBottom: '16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '22px' }}>{data.emoji}</span>
          <div>
            <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '15px', margin: 0 }}>
              {data.timeSlot} Picks
            </p>
            <p style={{ color: '#7a5f58', fontSize: '12px', margin: '2px 0 0' }}>
              {data.message}
            </p>
          </div>
        </div>
        <button
          onClick={fetchTimePicks}
          style={{
            background: 'transparent', border: 'none',
            color: '#7a5f58', fontSize: '18px',
            cursor: 'pointer', padding: '4px'
          }}
          title="Refresh"
        >🔄</button>
      </div>

      {/* Items grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px'
      }}>
        {data.items?.map((item, i) => {
          const cartItem = getCartItem(item.itemId)
          return (
            <div key={i} style={{
              background: 'rgba(13,10,15,0.6)',
              border: '1px solid rgba(255,107,53,0.1)',
              borderRadius: '14px', overflow: 'hidden',
              animation: `slideUp 0.4s ${i * 0.08}s both`
            }}>
              {/* Image */}
              <div style={{
                width: '100%', height: '80px', overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,107,157,0.08))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '30px' }}>🍽️</span>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '10px' }}>
                <p style={{
                  color: '#fff5f0', fontSize: '12px', fontWeight: 600,
                  margin: '0 0 2px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>{item.name}</p>
                <p style={{ color: '#7a5f58', fontSize: '10px', margin: '0 0 6px' }}>
                  {item.reason}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text', fontWeight: 700, fontSize: '13px'
                  }}>₹{item.price}</span>

                  {cartItem ? (
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                      borderRadius: '16px', overflow: 'hidden'
                    }}>
                      <button
                        onClick={() => updateQty(session?.id, cartItem.id, cartItem.quantity - 1)}
                        style={{
                          width: '24px', height: '24px', background: 'transparent',
                          border: 'none', color: '#fff', fontSize: '14px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>−</button>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: '12px', minWidth: '14px', textAlign: 'center' }}>
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(session?.id, cartItem.id, cartItem.quantity + 1)}
                        style={{
                          width: '24px', height: '24px', background: 'transparent',
                          border: 'none', color: '#fff', fontSize: '14px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(session?.id, item.itemId, item.name, item.price)}
                      style={{
                        background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                        border: 'none', color: '#fff',
                        fontSize: '10px', fontWeight: 700,
                        padding: '5px 10px', borderRadius: '16px',
                        cursor: 'pointer'
                      }}
                    >+ Add</button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Time indicator */}
      <div style={{
        marginTop: '12px', paddingTop: '12px',
        borderTop: '1px solid rgba(255,107,53,0.08)',
        display: 'flex', gap: '4px', justifyContent: 'center'
      }}>
        {['🌅 Breakfast', '☀️ Lunch', '🌤️ Snacks', '🌙 Dinner'].map((slot, i) => {
          const slots = ['Breakfast', 'Lunch', 'Evening Snacks', 'Dinner']
          const active = slots[i] === data.timeSlot || (data.timeSlot === 'Late Night' && i === 3)
          return (
            <div key={slot} style={{
              flex: 1, textAlign: 'center',
              padding: '4px 2px',
              borderRadius: '8px',
              background: active ? 'rgba(255,107,53,0.15)' : 'transparent',
            }}>
              <p style={{
                color: active ? '#ff8c69' : '#555',
                fontSize: '9px', fontWeight: active ? 700 : 400,
                margin: 0
              }}>{slot}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}