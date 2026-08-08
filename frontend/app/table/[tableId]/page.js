'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import MenuGrid from '@/components/MenuGrid'
import CartDrawer from '@/components/CartDrawer'
import AIChat from '@/components/AIChat'
import GroupBanner from '@/components/GroupBanner'
import { useStore } from '@/lib/store'
import ComboBuilder from '@/components/ComboBuilder'
import InstallPrompt from '@/components/InstallPrompt'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import DietaryProfile from '@/components/DietaryProfile'
import SmartReorder from '@/components/SmartReorder'
import TimePicks from '@/components/TimePicks'
import AllergyAlert from '@/components/AllergyAlert'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Tunable timing for the "AI Picks" best-seller fetch. Pulled out as
// constants instead of magic numbers scattered through the retry loop.
const PICKS_INITIAL_DELAY_MS = 3000
const PICKS_MAX_ATTEMPTS = 3
const PICKS_RETRY_DELAY_MS = 5000

export default function TablePage() {
  const { tableId } = useParams()
  const { setSession, session, initDevice, language, setLanguage, fetchMenu } = useStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const handleLanguageChange = useCallback(
    async (lang) => {
      setLanguage(lang)
      await fetchMenu(lang)
    },
    [setLanguage, fetchMenu]
  )

  const initSession = useCallback(
    async (lang) => {
      setLoading(true)
      setError(null)
      try {
        const { data: sess } = await axios.get(`${API}/api/table/${tableId}/session`)

        // Restore customer phone for cross-session memory.
        const savedPhone = localStorage.getItem('customerPhone')
        if (savedPhone && sess?.id) {
          await axios
            .patch(`${API}/api/session/${sess.id}/phone`, { phone: savedPhone })
            .catch(() => {})
        }

        setSession(sess)
        await fetchMenu(lang || 'en')
      } catch (e) {
        console.error(e)
        setError('We couldn’t load your table. Check your connection and try again.')
      } finally {
        setLoading(false)
      }
    },
    [tableId, setSession, fetchMenu]
  )

  useEffect(() => {
    initDevice()
    initSession(language)
    // Intentionally only re-run when the table changes; `initSession`
    // captures the current `language` value at call time so we don't
    // need it (or `initDevice`) in this dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId])

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={() => initSession(language)} />
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        paddingBottom: '120px',
        paddingTop: '68px', // offset for fixed header
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Header
        tableId={tableId}
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      <GroupBanner tableId={tableId} />
      <HeroSection sessionId={session?.id} />
      <MenuGrid />
      <AIChat sessionId={session?.id} tableId={tableId} />

      <InstallPrompt />
      {/* Allergy Alert Modal */}
      <AllergyAlertWrapper />
    </div>
  )
}

function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        zIndex: 9999,
      }}
    >
      <div style={{ fontSize: '64px' }} className="float">
        🍛
      </div>

      <p
        style={{
          background: 'var(--grad-hero)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '18px',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          margin: 0,
        }}
      >
        Setting up your experience...
      </p>

      <div style={{ display: 'flex', gap: '8px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--flame)',
              animation: `bounce-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        zIndex: 9999,
        padding: '24px',
        textAlign: 'center',
        maxWidth: '320px',
      }}
    >
      <div style={{ fontSize: '48px' }}>😕</div>
      <p
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, margin: 0,
        }}
      >
        {message}
      </p>
      <button
        onClick={onRetry}
        className="btn-press"
        style={{ background: 'var(--grad-btn)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, padding: '10px 24px', borderRadius: '20px', cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}

function Header({ tableId, language, onLanguageChange }) {
  return (
    <header
      role="banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'rgba(13,10,15,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,107,53,0.12)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div>
        <h1
          style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, background: 'var(--grad-hero)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2, margin: 0,
          }}
        >
          🍛 Spice Garden
        </h1>
        <p
          style={{
            color: 'var(--coral)',
            fontSize: '11px',
            marginTop: '2px',
            fontWeight: 500,
            letterSpacing: '0.05em',
          }}
        >
          TABLE {tableId} • AI DINING
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <LanguageSwitcher current={language} onChange={onLanguageChange} />
        <CartDrawer />
      </div>
    </header>
  )
}

function HeroSection({ sessionId }) {
  const [picks, setPicks] = useState([])
  const [phone, setPhone] = useState(null)
  const { addToCart, session, menu, setCartOpen } = useStore()

  // Read the stored phone once on mount, client-side only, instead of
  // re-reading localStorage inline in JSX on every render.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPhone(localStorage.getItem('customerPhone'))
    }
  }, [])

  useEffect(() => {
    if (!sessionId) return

    let cancelled = false

    async function fetchPicks() {
      await wait(PICKS_INITIAL_DELAY_MS)
      for (let attempt = 1; attempt <= PICKS_MAX_ATTEMPTS; attempt++) {
        if (cancelled) return
        try {
          const { data } = await axios.post(`${API}/api/session/${sessionId}/ai/chat`, {
            message: 'show me best sellers popular items',
            isFirstMessage: false,
          })
          if (!cancelled && data.suggestions?.length > 0) {
            setPicks(data.suggestions)
            return
          }
        } catch (e) {
          console.error('Failed to fetch AI picks', e)
        }
        if (attempt < PICKS_MAX_ATTEMPTS) await wait(PICKS_RETRY_DELAY_MS)
      }
    }

    fetchPicks()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  const handleAdd = useCallback(
    (item) => {
      if (!session?.id) return
      addToCart(session.id, item.itemId, item.name, item.price)
      setCartOpen(true)
      setTimeout(() => setCartOpen(false), 1200)
    },
    [session?.id, addToCart, setCartOpen]
  )

  return (
    <div style={{ padding: '16px 16px 10px' }}>
      <HeroBanner />

      {session?.customerPhone && (
        <DietaryProfile
          phone={session.customerPhone}
          onSave={(profile) => console.log('Dietary profile saved', profile)}
        />
      )}

      <SmartReorder phone={phone} sessionId={sessionId} />

      {/* Time-based picks */}
      <TimePicks sessionId={sessionId} />

      {picks.length > 0 && (
        <AiPicksCarousel picks={picks} menu={menu} onAdd={handleAdd} />
      )}

      <div style={{ marginTop: '20px' }}>
        <ComboBuilder sessionId={sessionId} />
      </div>
    </div>
  )
}

function HeroBanner() {
  return (
    <div
      style={{background:'linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(255,107,157,0.1) 50%, rgba(196,77,255,0.08) 100%)',border: '1px solid rgba(255,107,53,0.2)',borderRadius: '20px',padding: '20px',marginBottom: '20px',position: 'relative',overflow: 'hidden',
      }}
    >
      <div
        style={{ position: 'absolute', top: '-30px', right: '-20px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(255,107,53,0.2), transparent)', borderRadius: '50%',
        }}
      />
      <p
        style={{ color: 'var(--blush)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '6px',
        }}
      >
        ✨ WELCOME BACK
      </p>
      <h2
        style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '8px',
        }}
      >
        What&apos;s your mood
        <br />
        <span
          style={{
            background: 'var(--grad-btn)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          today?
        </span>
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
        Chat with Zara below or browse our menu 👇
      </p>
    </div>
  )
}

function AiPicksCarousel({ picks, menu, onAdd }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '16px' }}>⭐</span>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          AI Picks For You
        </h3>
      </div>

      <div
        style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}
        className="scrollbar-hide"
      >
        {picks.map((item, i) => {
          const menuItem = menu.find((m) => m.id === item.itemId)
          return (
            <PickCard
              key={item.itemId}
              item={item}
              imageUrl={menuItem?.imageUrl}
              delay={i * 0.1}
              onAdd={onAdd}
            />
          )
        })}
      </div>
    </div>
  )
}

function PickCard({ item, imageUrl, delay, onAdd }) {
  return (
    <div
      className="card-lift"
      style={{ minWidth: '160px', maxWidth: '160px', background: 'var(--grad-card)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '16px', overflow: 'hidden', animation: `slideUp 0.5s ${delay}s both`, flexShrink: 0,
      }}
    >
      <div
        style={{ width: '100%', height: '100px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,107,157,0.08))',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease',
            }}
            onError={(e) => {
              e.target.style.display = 'none'
              const fallback = e.target.parentNode.querySelector('.fallback-emoji')
              if (fallback) fallback.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="fallback-emoji"
          style={{ display: imageUrl ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: '36px', position: imageUrl ? 'absolute' : 'relative', top: 0, left: 0,
          }}
        >
          🍽️
        </div>
      </div>

      <div style={{ padding: '10px' }}>
        <p
          style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {item.name}
        </p>
        <p
          style={{ color: 'var(--coral)', fontSize: '11px', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {item.reason}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{ background: 'var(--grad-btn)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700, fontSize: '14px',
            }}
          >
            ₹{item.price}
          </span>
          <button
            onClick={() => onAdd(item)}
            className="btn-press"
            aria-label={`Add ${item.name} to cart`}
            style={{ background: 'var(--grad-btn)', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '5px 10px', borderRadius: '20px', cursor: 'pointer',
            }}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  )
}

function AllergyAlertWrapper() {
  const { allergyAlerts, allergyItemName, clearAllergyAlert, confirmAllergyAdd } = useStore()

  if (!allergyAlerts || allergyAlerts.length === 0) return null

  return (
    <AllergyAlert
      alerts={allergyAlerts}
      itemName={allergyItemName}
      onConfirm={confirmAllergyAdd}
      onCancel={clearAllergyAlert}
    />
  )
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}