'use client'

import { useState } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const TIMES = [
  { label: '12:00 PM', value: '12:00' },
  { label: '12:30 PM', value: '12:30' },
  { label: '1:00 PM', value: '13:00' },
  { label: '1:30 PM', value: '13:30' },
  { label: '2:00 PM', value: '14:00' },
  { label: '2:30 PM', value: '14:30' },
  { label: '7:00 PM', value: '19:00' },
  { label: '7:30 PM', value: '19:30' },
  { label: '8:00 PM', value: '20:00' },
  { label: '8:30 PM', value: '20:30' },
  { label: '9:00 PM', value: '21:00' },
]

export default function ReservePage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', phone: '', date: '', time: '', guests: 2, note: ''
  })
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [confirmed, setConfirmed] = useState(null)

  function getTomorrow() {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  function getMaxDate() {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  }

  async function checkSlots() {
    if (!form.date) return
    setLoading(true)
    try {
      const { data } = await axios.get(`${API}/api/reservations/slots`, {
        params: { date: form.date, guests: form.guests }
      })
      setSlots(data)
    } catch (e) {}
    setLoading(false)
  }

  function validate() {
    const e = {}
    if (!form.name.trim() || form.name.length < 2) e.name = 'Enter your full name'
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit mobile number'
    if (!form.date) e.date = 'Select a date'
    if (!form.time) e.time = 'Select a time slot'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submitReservation() {
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await axios.post(`${API}/api/reservations`, {
        ...form,
        tableId: `T${Math.floor(Math.random() * 10) + 1}`
      })
      setConfirmed(data)
      setStep(3)
    } catch (e) {
      setErrors({ general: e.response?.data?.error || 'Booking failed. Try again.' })
    }
    setLoading(false)
  }

  const inputStyle = (field) => ({
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${errors[field] ? '#ff6b6b' : 'rgba(255,107,53,0.2)'}`,
    borderRadius: '12px',
    padding: '13px 16px',
    color: '#fff5f0',
    fontSize: '14px',
    fontFamily: 'sans-serif',
    outline: 'none',
    marginBottom: errors[field] ? '4px' : '14px',
    boxSizing: 'border-box',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0a0f',
      fontFamily: 'sans-serif',
      padding: '0',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,157,0.1))',
        borderBottom: '1px solid rgba(255,107,53,0.15)',
        padding: '20px 20px',
        textAlign: 'center',
      }}>
        <h1 style={{
          background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontSize: '26px', fontWeight: 800, margin: '0 0 4px'
        }}>🍛 Spice Garden</h1>
        <p style={{ color: '#7a5f58', fontSize: '13px', margin: 0 }}>
          Reserve your table in seconds
        </p>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Progress */}
        {step < 3 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
            {['Details', 'Time Slot', 'Confirm'].map((s, i) => (
              <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  height: '4px', borderRadius: '2px', marginBottom: '6px',
                  background: i < step
                    ? 'linear-gradient(90deg, #ff6b35, #ff6b9d)'
                    : 'rgba(255,255,255,0.08)'
                }} />
                <p style={{
                  color: i < step ? '#ff8c69' : '#555',
                  fontSize: '11px', fontWeight: i < step ? 600 : 400, margin: 0
                }}>{s}</p>
              </div>
            ))}
          </div>
        )}

        {/* Step 1 — Details */}
        {step === 1 && (
          <div style={{ animation: 'slideUp 0.4s both' }}>
            <h2 style={{ color: '#fff5f0', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
              Your Details
            </h2>

            {errors.general && (
              <div style={{
                background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)',
                borderRadius: '10px', padding: '10px 14px', marginBottom: '14px',
                color: '#ff6b6b', fontSize: '13px'
              }}>⚠ {errors.general}</div>
            )}

            <input placeholder="Full name" value={form.name}
              onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })) }}
              style={inputStyle('name')} />
            {errors.name && <p style={{ color: '#ff6b6b', fontSize: '11px', marginBottom: '10px' }}>⚠ {errors.name}</p>}

            <input placeholder="Mobile number" value={form.phone} type="tel"
              onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: '' })) }}
              style={inputStyle('phone')} />
            {errors.phone && <p style={{ color: '#ff6b6b', fontSize: '11px', marginBottom: '10px' }}>⚠ {errors.phone}</p>}

            {/* Guests */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#c8a49a', fontSize: '14px', display: 'block', marginBottom: '10px', fontWeight: 600 }}>
                Number of Guests
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <button key={n} onClick={() => setForm(p => ({ ...p, guests: n }))} style={{
                    width: '44px', height: '44px', borderRadius: '10px',
                    border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
                    background: form.guests === n
                      ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)'
                      : 'rgba(255,255,255,0.04)',
                    color: form.guests === n ? '#fff' : '#7a5f58',
                  }}>{n}</button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#c8a49a', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Select Date
              </label>
              <input type="date"
                min={getTomorrow()} max={getMaxDate()}
                value={form.date}
                onChange={e => { setForm(p => ({ ...p, date: e.target.value, time: '' })); setErrors(p => ({ ...p, date: '' })) }}
                style={{
                  ...inputStyle('date'),
                  colorScheme: 'dark',
                  marginBottom: errors.date ? '4px' : '0'
                }} />
              {errors.date && <p style={{ color: '#ff6b6b', fontSize: '11px', marginTop: '4px' }}>⚠ {errors.date}</p>}
            </div>

            <textarea placeholder="Special requests (optional)" value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              style={{ ...inputStyle(), minHeight: '80px', resize: 'vertical', marginBottom: '20px' }} />

            <button
              onClick={async () => {
                const e = {}
                if (!form.name.trim()) e.name = 'Enter your name'
                if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid mobile number'
                if (!form.date) e.date = 'Select a date'
                setErrors(e)
                if (Object.keys(e).length > 0) return
                await checkSlots()
                setStep(2)
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                border: 'none', color: '#fff', padding: '16px',
                borderRadius: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer'
              }}
            >Check Available Slots →</button>
          </div>
        )}

        {/* Step 2 — Time slot */}
        {step === 2 && (
          <div style={{ animation: 'slideUp 0.4s both' }}>
            <button onClick={() => setStep(1)} style={{
              background: 'transparent', border: 'none',
              color: '#7a5f58', fontSize: '14px', cursor: 'pointer',
              marginBottom: '16px', padding: 0
            }}>← Back</button>

            <h2 style={{ color: '#fff5f0', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
              Pick a Time
            </h2>
            <p style={{ color: '#7a5f58', fontSize: '13px', marginBottom: '20px' }}>
              {new Date(form.date + 'T00:00:00').toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long'
              })} · {form.guests} guest{form.guests > 1 ? 's' : ''}
            </p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#7a5f58' }}>
                <p style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</p>
                <p>Checking availability...</p>
              </div>
            ) : (
              <>
                <p style={{ color: '#c8a49a', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
                  🌞 Lunch
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  {TIMES.filter(t => t.value < '16:00').map(slot => {
                    const available = slots.find(s => s.time === slot.value)
                    const isSelected = form.time === slot.value
                    return (
                      <button key={slot.value}
                        onClick={() => available && setForm(p => ({ ...p, time: slot.value }))}
                        style={{
                          padding: '12px 8px', borderRadius: '12px',
                          border: isSelected ? 'none' : '1px solid rgba(255,107,53,0.15)',
                          cursor: available ? 'pointer' : 'not-allowed',
                          background: isSelected
                            ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)'
                            : available ? 'rgba(255,107,53,0.06)' : 'rgba(255,255,255,0.02)',
                          opacity: available ? 1 : 0.3,
                        }}>
                        <p style={{ color: isSelected ? '#fff' : '#c8a49a', fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>
                          {slot.label}
                        </p>
                        <p style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : '#555', fontSize: '10px', margin: 0 }}>
                          {available ? `${available.availableTables} tables` : 'Full'}
                        </p>
                      </button>
                    )
                  })}
                </div>

                <p style={{ color: '#c8a49a', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
                  🌙 Dinner
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
                  {TIMES.filter(t => t.value >= '16:00').map(slot => {
                    const available = slots.find(s => s.time === slot.value)
                    const isSelected = form.time === slot.value
                    return (
                      <button key={slot.value}
                        onClick={() => available && setForm(p => ({ ...p, time: slot.value }))}
                        style={{
                          padding: '12px 8px', borderRadius: '12px',
                          border: isSelected ? 'none' : '1px solid rgba(255,107,53,0.15)',
                          cursor: available ? 'pointer' : 'not-allowed',
                          background: isSelected
                            ? 'linear-gradient(135deg, #ff6b35, #ff6b9d)'
                            : available ? 'rgba(255,107,53,0.06)' : 'rgba(255,255,255,0.02)',
                          opacity: available ? 1 : 0.3,
                        }}>
                        <p style={{ color: isSelected ? '#fff' : '#c8a49a', fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>
                          {slot.label}
                        </p>
                        <p style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : '#555', fontSize: '10px', margin: 0 }}>
                          {available ? `${available.availableTables} tables` : 'Full'}
                        </p>
                      </button>
                    )
                  })}
                </div>

                {errors.time && (
                  <p style={{ color: '#ff6b6b', fontSize: '12px', marginBottom: '12px' }}>⚠ {errors.time}</p>
                )}

                <button
                  onClick={submitReservation}
                  disabled={loading || !form.time}
                  style={{
                    width: '100%',
                    background: !form.time ? 'rgba(255,107,53,0.3)' : 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                    border: 'none', color: '#fff', padding: '16px',
                    borderRadius: '14px', fontSize: '15px', fontWeight: 700,
                    cursor: form.time ? 'pointer' : 'not-allowed'
                  }}
                >{loading ? '⏳ Booking...' : 'Confirm Reservation →'}</button>
              </>
            )}
          </div>
        )}

        {/* Step 3 — Confirmed */}
        {step === 3 && confirmed && (
          <div style={{ textAlign: 'center', animation: 'slideUp 0.5s both' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{
              background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              fontSize: '28px', fontWeight: 800, marginBottom: '8px'
            }}>Reservation Confirmed!</h2>
            <p style={{ color: '#7a5f58', fontSize: '13px', marginBottom: '24px' }}>
              See you soon, {confirmed.name.split(' ')[0]}! 👋
            </p>

            <div style={{
              background: 'linear-gradient(145deg, #1a1220, #201628)',
              border: '1px solid rgba(255,107,53,0.2)',
              borderRadius: '20px', padding: '24px',
              textAlign: 'left', marginBottom: '24px'
            }}>
              {[
                ['📅 Date', new Date(confirmed.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
                ['⏰ Time', TIMES.find(t => t.value === confirmed.time)?.label || confirmed.time],
                ['👥 Guests', `${confirmed.guests} person${confirmed.guests > 1 ? 's' : ''}`],
                ['🪑 Table', confirmed.tableId],
                ['📋 Booking ID', `#${confirmed.id.slice(0, 8).toUpperCase()}`],
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255,107,53,0.08)'
                }}>
                  <span style={{ color: '#7a5f58', fontSize: '13px' }}>{label}</span>
                  <span style={{ color: '#fff5f0', fontSize: '13px', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
              {confirmed.note && (
                <div style={{ marginTop: '4px' }}>
                  <span style={{ color: '#7a5f58', fontSize: '12px' }}>📝 Note: {confirmed.note}</span>
                </div>
              )}
            </div>

            <div style={{
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: '14px', padding: '14px', marginBottom: '20px'
            }}>
              <p style={{ color: '#4ade80', fontSize: '13px', margin: 0 }}>
                ✓ Confirmation sent to +91{confirmed.phone}
              </p>
            </div>

            <a href={`/table/${confirmed.tableId}`} style={{
              display: 'block', width: '100%',
              background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
              color: '#fff', padding: '16px', borderRadius: '14px',
              fontSize: '15px', fontWeight: 700, textDecoration: 'none',
              textAlign: 'center', marginBottom: '12px'
            }}>🍽️ Browse Menu Now</a>

            <button onClick={() => { setStep(1); setForm({ name:'', phone:'', date:'', time:'', guests:2, note:'' }); setConfirmed(null) }}
              style={{
                width: '100%', background: 'transparent',
                border: '1px solid rgba(255,107,53,0.2)',
                color: '#7a5f58', padding: '12px',
                borderRadius: '14px', fontSize: '13px', cursor: 'pointer'
              }}
            >Make Another Reservation</button>
          </div>
        )}
      </div>
    </div>
  )
}