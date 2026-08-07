'use client'

import { useState } from 'react'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
]

export default function LanguageSwitcher({ current, onChange }) {
  const [open, setOpen] = useState(false)
  const currentLang = LANGUAGES.find(l => l.code === current) || LANGUAGES[0]

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'rgba(255,107,53,0.1)',
          border: '1px solid rgba(255,107,53,0.2)',
          borderRadius: '20px', padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: '6px',
          cursor: 'pointer', color: '#ff8c69',
          fontSize: '13px', fontWeight: 600
        }}
      >
        <span>{currentLang.flag}</span>
        <span>{currentLang.label}</span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 98 }}
          />
          <div style={{
            position: 'absolute', top: '38px', right: 0,
            background: 'linear-gradient(145deg, #1a1220, #201628)',
            border: '1px solid rgba(255,107,53,0.2)',
            borderRadius: '14px', padding: '8px',
            zIndex: 99, minWidth: '140px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.2s both'
          }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { onChange(lang.code); setOpen(false) }}
                style={{
                  width: '100%', background: current === lang.code
                    ? 'rgba(255,107,53,0.15)' : 'transparent',
                  border: 'none', borderRadius: '10px',
                  padding: '10px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  color: current === lang.code ? '#ff8c69' : '#c8a49a',
                  fontSize: '14px', fontWeight: current === lang.code ? 700 : 400,
                  textAlign: 'left'
                }}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
                {current === lang.code && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}