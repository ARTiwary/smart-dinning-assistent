'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { io } from 'socket.io-client'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function GroupBanner({ tableId }) {
  const { session, fetchCart, deviceId } = useStore()
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (!tableId) return
    const socket = io(API, { query: { tableId } })

    const myId = deviceId || localStorage.getItem('deviceId') || 'You'
    socket.emit('user:join', { displayName: myId.slice(0, 6) })

    socket.on('session:user_joined', ({ displayName }) => {
      setUsers(prev => [...new Set([...prev, displayName])])
    })

    // Don't sync cart — each device manages its own
    return () => socket.disconnect()
  }, [tableId, deviceId])

  if (users.length === 0) return null

  return (
    <div style={{
      margin: '12px 16px 0',
      background: 'linear-gradient(135deg, rgba(255,107,157,0.1), rgba(196,77,255,0.08))',
      border: '1px solid rgba(255,107,157,0.2)',
      borderRadius: '14px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      <div style={{ display: 'flex' }}>
        {[...Array(Math.min(users.length + 1, 4))].map((_, i) => (
          <div key={i} style={{
            width: '28px', height: '28px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, hsl(${i * 60 + 10}, 80%, 65%), hsl(${i * 60 + 40}, 80%, 55%))`,
            border: '2px solid #0d0a0f',
            marginLeft: i > 0 ? '-8px' : '0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', color: '#fff', fontWeight: 700,
          }}>
            {i === 0 ? 'Y' : '?'}
          </div>
        ))}
      </div>
      <div>
        <p style={{ color: '#fff5f0', fontSize: '13px', fontWeight: 600 }}>
          {users.length + 1} people at Table {tableId}
        </p>
        <p style={{ color: '#7a5f58', fontSize: '11px' }}>
          Each person has their own cart
        </p>
      </div>
    </div>
  )
}