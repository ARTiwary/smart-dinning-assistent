'use client'

import { useState } from 'react'
import axios from 'axios'
import { useStore } from '@/lib/store'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function ComboBuilder({ sessionId }) {
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)
  const [budget, setBudget] = useState(500)
  const [preference, setPreference] = useState('both')
  const [combo, setCombo] = useState(null)
  const [loading, setLoading] = useState(false)
  const { addToCart, session } = useStore()

async function buildCombo() {
  setLoading(true)
  setCombo(null)
  setError(null)

  // Try up to 2 times
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { data } = await axios.post(
        `${API}/api/session/${sessionId}/ai/combo`,
        { budget, preference }
      )
      if (data.items?.length > 0) {
        setCombo(data)
        break
      }
      if (attempt === 1) {
        await new Promise(r => setTimeout(r, 2000))
      }
    } catch (e) {
      if (attempt === 2) {
        setError('Could not generate combo. Please try again.')
      } else {
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }
  setLoading(false)
}

  async function addAllToCart() {
    if (!combo || !session?.id) return
    for (const item of combo.items) {
      await addToCart(session.id, item.itemId, item.name, item.price)
    }
    setOpen(false)
  }

  const CATEGORY_ICONS = {
    Starter: '🥗', Main: '🍖', Bread: '🍞',
    Drink: '🍹', Dessert: '🍮'
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,107,157,0.08))',
          border: '1px solid rgba(255,107,53,0.25)',
          borderRadius: '16px', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          cursor: 'pointer', marginBottom: '16px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,107,53,0.5)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,107,53,0.25)'}
      >
        <span style={{ fontSize: '28px' }}>🍽️</span>
        <div style={{ textAlign: 'left' }}>
          <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '15px', margin: 0 }}>
            AI Combo Builder
          </p>
          <p style={{ color: '#7a5f58', fontSize: '12px', margin: '2px 0 0' }}>
            Let Zara build the perfect meal for your budget
          </p>
        </div>
        <span style={{ marginLeft: 'auto', color: '#ff8c69', fontSize: '18px' }}>→</span>
      </button>

      {/* Modal */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1a1220, #201628)',
            border: '1px solid rgba(255,107,53,0.25)',
            borderTopLeftRadius: '28px', borderTopRightRadius: '28px',
            padding: '12px 24px 40px',
            width: '100%', maxWidth: '480px',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Handle */}
            <div style={{
              width: '40px', height: '4px',
              background: 'rgba(255,107,53,0.3)',
              borderRadius: '2px', margin: '0 auto 20px'
            }} />

            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px', fontWeight: 700,
              color: '#fff5f0', marginBottom: '6px'
            }}>🍽️ AI Combo Builder</h3>
            <p style={{ color: '#7a5f58', fontSize: '13px', marginBottom: '24px' }}>
              Tell Zara your budget and preference — she'll build the perfect meal!
            </p>

            {/* Budget slider */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ color: '#c8a49a', fontSize: '14px', fontWeight: 600 }}>
                  Budget
                </label>
                <span style={{
                  background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  fontWeight: 800, fontSize: '18px'
                }}>₹{budget}</span>
              </div>
              <input
                type="range"
                min="300" max="1500" step="50"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                style={{
                  width: '100%', accentColor: '#ff6b35',
                  height: '6px', cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: '#555', fontSize: '11px' }}>₹300</span>
                <span style={{ color: '#555', fontSize: '11px' }}>₹1500</span>
              </div>
            </div>

            {/* Preference */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#c8a49a', fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>
                Preference
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { value: 'veg', label: '🌿 Veg Only' },
                  { value: 'non-veg', label: '🍗 Non-Veg' },
                  { value: 'both', label: '🍽️ Both' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPreference(opt.value)}
                    style={{
                      flex: 1, padding: '10px 8px',
                      borderRadius: '12px', border: 'none',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                      background: preference === opt.value
                        ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)'
                        : 'rgba(255,255,255,0.04)',
                      color: preference === opt.value ? '#fff' : '#7a5f58',
                      border: preference === opt.value
                        ? 'none'
                        : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Build button */}
            <button
              onClick={buildCombo}
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(255,107,53,0.3)' : 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                border: 'none', color: '#fff', padding: '16px',
                borderRadius: '14px', fontSize: '15px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '16px', fontFamily: 'var(--font-body)'
              }}
            >
              {loading ? '🤖 Zara is thinking...' : '✨ Build My Combo'}
            </button>
            {error && (
              <p style={{ color: '#ff6b6b', fontSize: '13px', textAlign: 'center', marginTop: '8px' }}>
                ⚠ {error}
                </p>
              )}

            {/* Combo result */}
            {combo && (
              <div style={{ animation: 'slideUp 0.4s both' }}>
                {/* Message */}
                <div style={{
                  background: 'rgba(255,107,53,0.08)',
                  border: '1px solid rgba(255,107,53,0.2)',
                  borderRadius: '14px', padding: '14px',
                  marginBottom: '16px'
                }}>
                  <p style={{ color: '#ff8c69', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                    🤖 {combo.message}
                  </p>
                </div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {combo.items?.map((item, i) => (
                    <div key={i} style={{
                      background: '#1a1220',
                      border: '1px solid rgba(255,107,53,0.12)',
                      borderRadius: '14px', padding: '12px',
                      display: 'flex', alignItems: 'center', gap: '12px'
                    }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,157,0.1))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '22px', flexShrink: 0
                      }}>
                        {CATEGORY_ICONS[item.category] || '🍽️'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: '#fff5f0', fontSize: '14px', fontWeight: 600, margin: '0 0 2px' }}>
                          {item.name}
                        </p>
                        <p style={{ color: '#7a5f58', fontSize: '11px', margin: '0 0 2px' }}>
                          {item.category} · {item.reason}
                        </p>
                        <p style={{
                          background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                          fontSize: '13px', fontWeight: 700, margin: 0
                        }}>₹{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '16px',
                  padding: '12px 16px',
                  background: 'rgba(255,107,53,0.06)',
                  border: '1px solid rgba(255,107,53,0.12)',
                  borderRadius: '12px'
                }}>
                  <div>
                    <p style={{ color: '#7a5f58', fontSize: '12px', margin: '0 0 2px' }}>Total for combo</p>
                    <p style={{
                      background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      fontSize: '20px', fontWeight: 800, margin: 0
                    }}>₹{combo.totalPrice}</p>
                  </div>
                  {combo.savings > 0 && (
                    <div style={{
                      background: 'rgba(74,222,128,0.1)',
                      border: '1px solid rgba(74,222,128,0.2)',
                      borderRadius: '10px', padding: '6px 12px'
                    }}>
                      <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: 700, margin: 0 }}>
                        Saves ₹{combo.savings}!
                      </p>
                    </div>
                  )}
                </div>

                {/* Add all to cart */}
                <button
                  onClick={addAllToCart}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                    border: 'none', color: '#fff', padding: '16px',
                    borderRadius: '14px', fontSize: '15px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                    boxShadow: '0 6px 20px rgba(255,107,53,0.4)',
                    marginBottom: '10px'
                  }}
                >🛒 Add Full Combo to Cart</button>

                <button
                  onClick={buildCombo}
                  style={{
                    width: '100%', background: 'transparent',
                    border: '1px solid rgba(255,107,53,0.2)',
                    color: '#ff8c69', padding: '12px',
                    borderRadius: '14px', fontSize: '13px',
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                    marginBottom: '10px'
                  }}
                >🔄 Build Another Combo</button>
              </div>
            )}

            <button
              onClick={() => { setOpen(false); setCombo(null) }}
              style={{
                width: '100%', background: 'transparent',
                border: 'none', color: '#7a5f58',
                padding: '8px', cursor: 'pointer',
                fontSize: '13px', fontFamily: 'var(--font-body)'
              }}
            >Close</button>
          </div>
        </div>
      )}
    </>
  )
}