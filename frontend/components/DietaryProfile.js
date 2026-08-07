'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const CONDITIONS = [
  { id: 'diabetic', label: 'Diabetic', icon: '🩺' },
  { id: 'hypertensive', label: 'High BP', icon: '❤️' },
  { id: 'celiac', label: 'Celiac', icon: '🌾' },
  { id: 'lactose-intolerant', label: 'Lactose Intolerant', icon: '🥛' },
]

const DIET_TYPES = [
  { id: null, label: 'No restriction', icon: '🍽️' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🌿' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'jain', label: 'Jain', icon: '☮️' },
  { id: 'halal', label: 'Halal', icon: '☪️' },
  { id: 'keto', label: 'Keto', icon: '🥩' },
]

const ALLERGENS = [
  { id: 'dairy', label: 'Dairy', icon: '🧀' },
  { id: 'gluten', label: 'Gluten', icon: '🌾' },
  { id: 'nuts', label: 'Nuts', icon: '🥜' },
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
  { id: 'fish', label: 'Fish', icon: '🐟' },
]

export default function DietaryProfile({ phone, onSave }) {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState({
    conditions: [],
    dietType: null,
    allergies: [],
    preferences: [],
    avoidIngredients: '',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (phone && open) fetchProfile()
  }, [phone, open])

  async function fetchProfile() {
    try {
      const { data } = await axios.get(`${API}/api/dietary/${phone}`)
      if (data) {
        setProfile({
          conditions: data.conditions || [],
          dietType: data.dietType || null,
          allergies: data.allergies || [],
          preferences: data.preferences || [],
          avoidIngredients: data.avoidIngredients?.join(', ') || '',
        })
      }
    } catch (e) {}
  }

  async function saveProfile() {
    if (!phone) return
    setLoading(true)
    try {
      await axios.post(`${API}/api/dietary/${phone}`, {
        ...profile,
        avoidIngredients: profile.avoidIngredients.split(',').map(s => s.trim()).filter(Boolean)
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      onSave && onSave(profile)
    } catch (e) {}
    setLoading(false)
  }

  function toggle(array, item) {
    return array.includes(item) ? array.filter(i => i !== item) : [...array, item]
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'rgba(255,107,53,0.08)',
          border: '1px solid rgba(255,107,53,0.2)',
          borderRadius: '12px', padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: '8px',
          cursor: 'pointer', width: '100%', marginBottom: '12px',
        }}
      >
        <span style={{ fontSize: '20px' }}>🥗</span>
        <div style={{ textAlign: 'left' }}>
          <p style={{ color: '#fff5f0', fontWeight: 600, fontSize: '14px', margin: 0 }}>
            Dietary Profile
          </p>
          <p style={{ color: '#7a5f58', fontSize: '12px', margin: '2px 0 0' }}>
            {profile.dietType || profile.allergies.length > 0 || profile.conditions.length > 0
              ? `${profile.dietType || 'Custom'} · ${profile.allergies.length} allergens`
              : 'Set your dietary needs for personalized menu'}
          </p>
        </div>
        <span style={{ marginLeft: 'auto', color: '#ff8c69' }}>→</span>
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 70,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1a1220, #201628)',
            borderTop: '1px solid rgba(255,107,53,0.25)',
            borderTopLeftRadius: '28px', borderTopRightRadius: '28px',
            padding: '12px 24px 40px',
            width: '100%', maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Handle */}
            <div style={{
              width: '40px', height: '4px',
              background: 'rgba(255,107,53,0.3)',
              borderRadius: '2px', margin: '0 auto 20px'
            }} />

            <h3 style={{
              color: '#fff5f0', fontSize: '22px',
              fontWeight: 700, marginBottom: '6px'
            }}>🥗 Your Dietary Profile</h3>
            <p style={{ color: '#7a5f58', fontSize: '13px', marginBottom: '24px' }}>
              Tell us your needs — Zara will remember forever
            </p>

            {/* Diet type */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#c8a49a', fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                Diet Type
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {DIET_TYPES.map(d => (
                  <button key={String(d.id)} onClick={() => setProfile(p => ({ ...p, dietType: d.id }))} style={{
                    padding: '8px 14px', borderRadius: '20px', border: 'none',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    background: profile.dietType === d.id
                      ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)'
                      : 'rgba(255,255,255,0.04)',
                    color: profile.dietType === d.id ? '#fff' : '#7a5f58',
                    border: profile.dietType === d.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  }}>{d.icon} {d.label}</button>
                ))}
              </div>
            </div>

            {/* Medical conditions */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#c8a49a', fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                Medical Conditions
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CONDITIONS.map(c => (
                  <button key={c.id} onClick={() => setProfile(p => ({ ...p, conditions: toggle(p.conditions, c.id) }))} style={{
                    padding: '8px 14px', borderRadius: '20px',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    background: profile.conditions.includes(c.id)
                      ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.04)',
                    color: profile.conditions.includes(c.id) ? '#60a5fa' : '#7a5f58',
                    border: profile.conditions.includes(c.id)
                      ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  }}>{c.icon} {c.label}</button>
                ))}
              </div>
            </div>

            {/* Allergens */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#c8a49a', fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                Allergens to Avoid
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ALLERGENS.map(a => (
                  <button key={a.id} onClick={() => setProfile(p => ({ ...p, allergies: toggle(p.allergies, a.id) }))} style={{
                    padding: '8px 14px', borderRadius: '20px',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    background: profile.allergies.includes(a.id)
                      ? 'rgba(255,100,100,0.15)' : 'rgba(255,255,255,0.04)',
                    color: profile.allergies.includes(a.id) ? '#ff6b6b' : '#7a5f58',
                    border: profile.allergies.includes(a.id)
                      ? '1px solid rgba(255,100,100,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}>{a.icon} {a.label}</button>
                ))}
              </div>
            </div>

            {/* Avoid ingredients */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#c8a49a', fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Avoid Ingredients (comma separated)
              </label>
              <input
                placeholder="e.g. onion, garlic, mushroom"
                value={profile.avoidIngredients}
                onChange={e => setProfile(p => ({ ...p, avoidIngredients: e.target.value }))}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,107,53,0.2)',
                  borderRadius: '12px', padding: '13px 16px',
                  color: '#fff5f0', fontSize: '14px',
                  fontFamily: 'sans-serif', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Save */}
            <button
              onClick={saveProfile}
              disabled={loading || !phone}
              style={{
                width: '100%',
                background: saved ? 'rgba(74,222,128,0.3)' : 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                border: 'none', color: '#fff', padding: '16px',
                borderRadius: '14px', fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', marginBottom: '10px',
              }}
            >
              {loading ? '⏳ Saving...' : saved ? '✓ Saved!' : '💾 Save My Profile'}
            </button>

            {!phone && (
              <p style={{ color: '#ff6b6b', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>
                ⚠ Place an order first to save your profile (requires phone number)
              </p>
            )}

            <button
              onClick={() => setOpen(false)}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                color: '#7a5f58', padding: '8px', cursor: 'pointer', fontSize: '13px'
              }}
            >Close</button>
          </div>
        </div>
      )}
    </>
  )
}