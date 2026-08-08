'use client'

import { useState } from 'react'

const SEVERITY_STYLES = {
  high: {
    bg: 'rgba(255,100,100,0.12)',
    border: 'rgba(255,100,100,0.4)',
    color: '#ff6b6b',
    icon: '🚨'
  },
  medium: {
    bg: 'rgba(255,170,64,0.12)',
    border: 'rgba(255,170,64,0.4)',
    color: '#ffaa40',
    icon: '⚠️'
  },
  low: {
    bg: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.3)',
    color: '#60a5fa',
    icon: 'ℹ️'
  }
}

export default function AllergyAlert({ alerts, itemName, onConfirm, onCancel }) {
  const [confirmed, setConfirmed] = useState(false)

  const highAlerts = alerts.filter(a => a.severity === 'high')
  const hasHighAlert = highAlerts.length > 0

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      background: 'rgba(0,0,0,0.88)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1a1220, #201628)',
        border: `1px solid ${hasHighAlert ? 'rgba(255,100,100,0.4)' : 'rgba(255,170,64,0.3)'}`,
        borderRadius: '24px', padding: '28px',
        width: '100%', maxWidth: '360px',
        animation: 'slideUp 0.4s both',
        boxShadow: hasHighAlert
          ? '0 20px 60px rgba(255,100,100,0.2)'
          : '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>
            {hasHighAlert ? '🚨' : '⚠️'}
          </div>
          <h3 style={{
            color: '#fff5f0', fontSize: '20px', fontWeight: 700,
            margin: '0 0 4px'
          }}>
            {hasHighAlert ? 'Allergen Warning!' : 'Dietary Alert'}
          </h3>
          <p style={{ color: '#7a5f58', fontSize: '13px', margin: 0 }}>
            {itemName}
          </p>
        </div>

        {/* Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {alerts.map((alert, i) => {
            const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low
            return (
              <div key={i} style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '12px', padding: '12px 14px',
                display: 'flex', gap: '10px', alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{style.icon}</span>
                <p style={{ color: style.color, fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                  {alert.message}
                </p>
              </div>
            )
          })}
        </div>

        {/* Confirmation for high alerts */}
        {hasHighAlert && (
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            marginBottom: '16px', cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              style={{ marginTop: '2px', accentColor: '#ff6b35', width: '16px', height: '16px' }}
            />
            <span style={{ color: '#c8a49a', fontSize: '13px', lineHeight: 1.5 }}>
              I understand the risk and want to add this item anyway
            </span>
          </label>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, background: 'transparent',
              border: '1px solid rgba(255,107,53,0.2)',
              color: '#c8a49a', padding: '14px',
              borderRadius: '14px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer'
            }}
          >← Go Back</button>

          <button
            onClick={onConfirm}
            disabled={hasHighAlert && !confirmed}
            style={{
              flex: 1,
              background: hasHighAlert
                ? (confirmed ? 'rgba(255,100,100,0.2)' : 'rgba(255,255,255,0.05)')
                : 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
              border: hasHighAlert ? '1px solid rgba(255,100,100,0.3)' : 'none',
              color: hasHighAlert ? (confirmed ? '#ff6b6b' : '#555') : '#fff',
              padding: '14px', borderRadius: '14px',
              fontSize: '14px', fontWeight: 700,
              cursor: (hasHighAlert && !confirmed) ? 'not-allowed' : 'pointer',
            }}
          >
            {hasHighAlert ? '⚠️ Add Anyway' : '✓ Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}