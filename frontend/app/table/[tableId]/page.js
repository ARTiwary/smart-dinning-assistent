'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import MenuGrid from '@/components/MenuGrid'
import CartDrawer from '@/components/CartDrawer'
import AIChat from '@/components/AIChat'
import GroupBanner from '@/components/GroupBanner'
import { useStore } from '@/lib/store'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function TablePage() {
  const { tableId } = useParams()
  const { setSession, setMenu, session, initDevice } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initDevice()
    async function init() {
      try {
        const { data: sess } = await axios.get(`${API}/api/table/${tableId}/session`)
        setSession(sess)
        const { data: menu } = await axios.get(`${API}/api/menu`)
        setMenu(menu)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [tableId])

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{ fontSize: '64px' }} className="float">🍛</div>
      <p style={{
        background: 'var(--grad-hero)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: '18px',
        fontFamily: 'var(--font-display)',
        fontWeight: 600
      }}>
        Setting up your experience...
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: '8px', height: '8px',
            borderRadius: '50%',
            background: 'var(--flame)',
            animation: `bounce-dot 1.4s ease-in-out ${i * 0.16}s infinite`
          }} />
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '120px', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, zIndex: 40,
        background: 'rgba(13,10,15,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,107,53,0.12)',
        padding: '12px 16px',    // ← smaller padding on mobile
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
        }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            fontWeight: 700,
            background: 'var(--grad-hero)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.2
          }}>
            🍛 Spice Garden
          </h1>
          <p style={{ color: 'var(--coral)', fontSize: '11px', marginTop: '2px', fontWeight: 500, letterSpacing: '0.05em' }}>
            TABLE {tableId} • AI DINING
          </p>
        </div>
        <CartDrawer />
      </header>

      <GroupBanner tableId={tableId} />
      <HeroSection sessionId={session?.id} />
      <MenuGrid />
      <AIChat sessionId={session?.id} tableId={tableId} />
    </div>
  )
}

function HeroSection({ sessionId }) {
  const [picks, setPicks] = useState([])
  const { addToCart, session } = useStore()

  useEffect(() => {
    if (!sessionId) return
    async function fetchPicks() {
      try {
        const { data } = await axios.post(`${API}/api/session/${sessionId}/ai/chat`, {
          message: 'show me your best sellers', isFirstMessage: false
        })
        if (data.suggestions?.length > 0) setPicks(data.suggestions)
      } catch (e) {}
    }
    fetchPicks()
  }, [sessionId])

  return (
    <div style={{ padding: '20px 20px 10px' }}>
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(255,107,157,0.1) 50%, rgba(196,77,255,0.08) 100%)',
        border: '1px solid rgba(255,107,53,0.2)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-30px', right: '-20px',
          width: '120px', height: '120px',
          background: 'radial-gradient(circle, rgba(255,107,53,0.2), transparent)',
          borderRadius: '50%'
        }} />
        <p style={{ color: 'var(--blush)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '6px' }}>
          ✨ WELCOME BACK
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px', fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.3, marginBottom: '8px'
        }}>
          What's your mood<br />
          <span style={{
            background: 'var(--grad-btn)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>today?</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          Chat with Zara below or browse our menu 👇
        </p>
      </div>

      {/* AI picks */}
      {picks.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '16px' }}>⭐</span>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px', fontWeight: 600,
              color: 'var(--text-primary)'
            }}>AI Picks For You</h3>
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }} className="scrollbar-hide">
            {picks.map((item, i) => (
              <div key={item.itemId} className="card-lift" style={{
                minWidth: '160px',
                background: 'var(--grad-card)',
                border: '1px solid rgba(255,107,53,0.2)',
                borderRadius: '16px',
                overflow: 'hidden',
                animation: `slideUp 0.5s ${i * 0.1}s both`
              }}>
                {/* Image placeholder */}
                <div className="shimmer" style={{
                  width: '100%', height: '100px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '32px'
                }}>
                  🍽️
                </div>
                <div style={{ padding: '10px' }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    {item.name}
                  </p>
                  <p style={{ color: 'var(--coral)', fontSize: '11px', marginBottom: '8px' }}>{item.reason}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      background: 'var(--grad-btn)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: 700, fontSize: '14px'
                    }}>₹{item.price}</span>
                    <button
                      onClick={() => addToCart(session?.id, item.itemId, item.name, item.price)}
                      className="btn-press"
                      style={{
                        background: 'var(--grad-btn)',
                        border: 'none', color: '#fff',
                        fontSize: '11px', fontWeight: 700,
                        padding: '5px 10px', borderRadius: '20px',
                        cursor: 'pointer'
                      }}
                    >+ Add</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}