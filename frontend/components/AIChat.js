'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useStore } from '@/lib/store'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const QUICK_BUTTONS = [
  { label: '🌶️ Spicy', message: 'show me spicy options' },
  { label: '🥗 Light', message: 'something light to eat' },
  { label: '🍽️ Filling', message: 'I want something really filling' },
  { label: '🍰 Desserts', message: 'what desserts do you have' },
  { label: '🍹 Drinks', message: 'recommend some drinks' },
  { label: '⭐ Best Sellers', message: 'what are your best sellers' },
  { label: '👥 For Groups', message: 'we are a group, suggest shareable dishes' },
  { label: '👨‍🍳 Chef Special', message: 'what is the chef special today' },
]

function SuggestionImage({ itemId, fallback }) {
  const { menu } = useStore()
  const [error, setError] = useState(false)

  const menuItem = menu?.find(m => m.id === itemId)
  const imageUrl = menuItem?.imageUrl

  if (imageUrl && !error) {
    return (
      <img
        src={imageUrl}
        alt=""
        onError={() => setError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    )
  }

  return (
    <span style={{ fontSize: '22px' }}>
      {fallback}
    </span>
  )
}

export default function AIChat({ sessionId }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm Zara 👋 Your AI dining companion. What are you in the mood for today?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(false)
  const bottomRef = useRef(null)
  const messagesRef = useRef(messages)
  const { addToCart, session, setCartOpen } = useStore()

  useEffect(() => { messagesRef.current = messages }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    const msg = text || input.trim()
    if (!msg) return

    if (!sessionId) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Reconnecting... please try again in a moment! 🔄"
      }])
      return
    }

    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post(`${API}/api/session/${sessionId}/ai/chat`, {
        message: msg, isFirstMessage: false
      })

      const aiMsg = {
        role: 'assistant',
        text: data.message,
        suggestions: data.suggestions || [],
      }
      setMessages(prev => [...prev, aiMsg])
      if (!open) setUnread(true)

      if (data.upsell) {
        setTimeout(() => {
          const upsellSuggestion = data.upsell.suggestion;
          setMessages(prev => [...prev, {
            role: 'assistant',
            text: data.upsell.message,
            suggestions: upsellSuggestion ? [{
              ...upsellSuggestion,
              itemId: upsellSuggestion.itemId || upsellSuggestion.id
            }] : []
          }])
        }, 800)
      }
    } catch (e) {
      console.error('AI Error:', e)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "I'm back! Sorry about that. What can I get you? 🍽️"
      }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Floating Zara Button & Tooltip Container */}
      {!open && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '16px',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}>
          {/* Ripple rings */}
          <div style={{
            position: 'absolute', inset: '-8px',
            borderRadius: '50%',
            border: '2px solid rgba(255,107,157,0.4)',
            animation: 'pulse-ring 2s ease-out infinite',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', inset: '-16px',
            borderRadius: '50%',
            border: '2px solid rgba(255,107,157,0.2)',
            animation: 'pulse-ring 2s ease-out 0.4s infinite',
            pointerEvents: 'none'
          }} />

          {/* Tooltip */}
          <div style={{
            position: 'absolute',
            bottom: '72px',
            right: '0',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #ff6b9d, #ff6b35)',
            color: '#fff',
            fontSize: '12px', fontWeight: 600,
            padding: '8px 14px',
            borderRadius: '16px 16px 4px 16px',
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 24px rgba(255,107,157,0.4)',
            animation: 'floatTooltip 3s ease-in-out infinite',
            fontFamily: 'var(--font-body)',
            pointerEvents: 'none',
            minWidth: 'max-content',
          }}>
            ✨ May I suggest something?
            <div style={{
              position: 'absolute',
              bottom: '-6px', right: '18px',
              width: '10px', height: '10px',
              background: '#ff6b35',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            }} />
          </div>

          {/* Main FAB button */}
          <button
            className="zara-fab"
            onClick={() => {
              setOpen(true)
              setUnread(false)
            }}
            style={{
              position: 'relative',
              width: '62px', height: '62px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff6b9d 0%, #ff6b35 50%, #ffaa40 100%)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(255,107,157,0.5)',
              animation: 'zaraFloat 3s ease-in-out infinite',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.12)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,107,157,0.7)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,107,157,0.5)'
            }}
          >
            🧑‍🍳
            {unread && (
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2px solid var(--rose)',
                }}
              />
            )}
          </button>
        </div>
      )}

      {/* Chat Fullscreen View */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, #0d0a0f 0%, #1a1220 100%)',
          animation: 'slideUp 0.3s both'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,107,53,0.12)',
            display: 'flex', alignItems: 'center', gap: '14px',
            background: 'linear-gradient(135deg, rgba(255,107,157,0.12), rgba(255,107,53,0.08))'
          }}>
            <div style={{
              width: '46px', height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff6b9d 0%, #ff6b35 50%, #ffaa40 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 15px rgba(255,107,157,0.4)',
              flexShrink: 0
            }}>🧑‍🍳</div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
                fontSize: '18px', fontWeight: 700
              }}>Zara</p>
              <p style={{
                fontSize: '11px', fontWeight: 600,
                letterSpacing: '0.05em',
                background: 'linear-gradient(135deg, #ff6b9d, #ffaa40)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                ● AI DINING ASSISTANT
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: '36px', height: '36px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                color: 'var(--text-secondary)',
                fontSize: '16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >✕</button>
          </div>

          {/* Messages Container */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }} className="scrollbar-hide">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'slideUp 0.3s both'
                }}>
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: '30px', height: '30px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ff6b9d, #ff6b35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px',
                      marginRight: '8px',
                      flexShrink: 0,
                      alignSelf: 'flex-end'
                    }}>🧑‍🍳</div>
                  )}

                  <div style={{ maxWidth: '78%' }}>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user'
                        ? '20px 20px 4px 20px'
                        : '20px 20px 20px 4px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #ff6b9d, #ff6b35)'
                        : 'var(--bg-card)',
                      border: msg.role === 'assistant'
                        ? '1px solid rgba(255,107,157,0.15)'
                        : 'none',
                      color: 'var(--text-primary)',
                      fontSize: '14px', lineHeight: 1.5,
                    }}>
                      {msg.text}
                    </div>

                    {/* Suggestions Section */}
                    {msg.suggestions?.length > 0 && (
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {msg.suggestions.map((s, j) => (
                          <div key={j} style={{
                            background: 'var(--bg-card2)',
                            border: '1px solid rgba(255,107,157,0.2)',
                            borderRadius: '14px',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            animation: `slideUp 0.4s ${j * 0.1}s both`
                          }}>
                            <div style={{
                              width: '52px', height: '52px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, rgba(255,107,157,0.2), rgba(255,107,53,0.15))',
                              overflow: 'hidden',
                              flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <SuggestionImage itemId={s.itemId || s.id} fallback="🍽️" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                color: 'var(--text-primary)',
                                fontSize: '13px', fontWeight: 600,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                              }}>{s.name}</p>
                              {s.reason && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                                  {s.reason}
                                </p>
                              )}
                              <p style={{
                                background: 'linear-gradient(135deg, #ff6b9d, #ff6b35)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontWeight: 700, fontSize: '13px', marginTop: '2px'
                              }}>₹{s.price}</p>
                            </div>
                            <button
                              onClick={() => {
                                const sid = session?.id || sessionId
                                if (!sid) return
                                addToCart(sid, s.itemId || s.id, s.name, s.price)
                                setCartOpen(true)
                                setTimeout(() => setCartOpen(false), 1200)
                              }}
                              className="btn-press"
                              style={{
                                background: 'linear-gradient(135deg, #ff6b9d, #ff6b35)',
                                border: 'none', color: '#fff',
                                fontSize: '12px', fontWeight: 700,
                                padding: '7px 12px', borderRadius: '20px',
                                cursor: 'pointer', flexShrink: 0,
                                fontFamily: 'var(--font-body)',
                                boxShadow: '0 4px 12px rgba(255,107,157,0.3)'
                              }}
                            >+ Add</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading Dots */}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff6b9d, #ff6b35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px'
                  }}>🧑‍🍳</div>
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(255,107,157,0.15)',
                    borderRadius: '20px 20px 20px 4px',
                    padding: '14px 18px',
                    display: 'flex', gap: '6px', alignItems: 'center'
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: '7px', height: '7px',
                        borderRadius: '50%',
                        background: 'var(--rose)',
                        animation: `bounce-dot 1.4s ease-in-out ${i * 0.16}s infinite`
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Quick Buttons Chips */}
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(255,107,157,0.08)',
            display: 'flex', gap: '8px', overflowX: 'auto'
          }} className="scrollbar-hide">
            {QUICK_BUTTONS.map(btn => (
              <button
                key={btn.label}
                onClick={() => sendMessage(btn.message)}
                className="btn-press"
                style={{
                  whiteSpace: 'nowrap',
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(255,107,157,0.15)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px', fontWeight: 500,
                  padding: '8px 12px', borderRadius: '20px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,107,157,0.5)'
                  e.currentTarget.style.color = 'var(--rose)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,107,157,0.15)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >{btn.label}</button>
            ))}
          </div>

          {/* Input Chat Area */}
          <div style={{
            padding: '12px 16px 20px',
            display: 'flex', gap: '10px',
            borderTop: '1px solid rgba(255,107,157,0.1)'
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
              placeholder="Ask Zara anything... (e.g. kuch spicy chahiye)"
              style={{
                flex: 1,
                background: 'var(--bg-card)',
                border: '1px solid rgba(255,107,157,0.15)',
                borderRadius: '16px',
                padding: '14px 16px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,107,157,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,107,157,0.15)'}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="btn-press"
              style={{
                width: '48px', height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ff6b9d, #ff6b35)',
                border: 'none', color: '#fff',
                fontSize: '18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: (loading || !input.trim()) ? 0.5 : 1,
                boxShadow: '0 4px 15px rgba(255,107,157,0.35)',
                flexShrink: 0
              }}
            >➤</button>
          </div>
        </div>
      )}
    </>
  )
}