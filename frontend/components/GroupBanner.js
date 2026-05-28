'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { io } from 'socket.io-client'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function GroupBanner({ tableId }) {
  const { users, addUser, session, fetchCart } = useStore()

  useEffect(() => {
    if (!tableId) return
    const socket = io(API, { query: { tableId } })
    socket.emit('user:join', { displayName: 'You' })
    socket.on('session:user_joined', ({ displayName }) => addUser(displayName))
    socket.on('cart:item_added', () => { if (session?.id) fetchCart(session.id) })
    return () => socket.disconnect()
  }, [tableId])

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
      animation: 'slideUp 0.4s both'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {[...Array(Math.min(users.length + 1, 4))].map((_, i) => (
          <div key={i} style={{
            width: '28px', height: '28px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, hsl(${i * 40 + 10}, 80%, 65%), hsl(${i * 40 + 40}, 80%, 55%))`,
            border: '2px solid var(--bg-deep)',
            marginLeft: i > 0 ? '-8px' : '0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: '#fff', fontWeight: 700
          }}>
            {i === 0 ? 'Y' : users[i - 1]?.[0]?.toUpperCase() || '?'}
          </div>
        ))}
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
        <span style={{ color: 'var(--blush)', fontWeight: 600 }}>{users.length + 1} people</span> at your table
      </p>
    </div>
  )
}