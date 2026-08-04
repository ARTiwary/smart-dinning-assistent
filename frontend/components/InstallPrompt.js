'use client'

import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Check if already dismissed
    if (localStorage.getItem('pwa_dismissed')) return

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show after 30 seconds
      setTimeout(() => setShowPrompt(true), 30000)
    })
  }, [])

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  function dismiss() {
    setShowPrompt(false)
    localStorage.setItem('pwa_dismissed', '1')
  }

  if (!showPrompt) return null

  return (
    <div style={{
      position: 'fixed', bottom: '100px', left: '16px', right: '16px',
      zIndex: 9999,
      background: 'linear-gradient(145deg, #1a1220, #201628)',
      border: '1px solid rgba(255,107,53,0.3)',
      borderRadius: '20px', padding: '16px 20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      animation: 'slideUp 0.4s both',
      display: 'flex', alignItems: 'center', gap: '14px'
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', flexShrink: 0
      }}>🍛</div>

      <div style={{ flex: 1 }}>
        <p style={{ color: '#fff5f0', fontWeight: 700, fontSize: '14px', margin: '0 0 2px' }}>
          Add to Home Screen
        </p>
        <p style={{ color: '#7a5f58', fontSize: '12px', margin: 0 }}>
          Get faster access to Spice Garden
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={dismiss}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: '#7a5f58', padding: '8px 12px', borderRadius: '10px',
            fontSize: '12px', cursor: 'pointer'
          }}
        >Later</button>
        <button
          onClick={install}
          style={{
            background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
            border: 'none', color: '#fff',
            padding: '8px 14px', borderRadius: '10px',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer'
          }}
        >Install</button>
      </div>
    </div>
  )
}