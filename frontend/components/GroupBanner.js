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

    socket.on('session:user_joined', ({ displayName }) => {
      addUser(displayName)
    })

    socket.on('cart:item_added', () => {
      if (session?.id) fetchCart(session.id)
    })

    return () => socket.disconnect()
  }, [tableId])

  if (users.length === 0) return null

  return (
    <div className="mx-4 my-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center gap-3">
      <span className="text-orange-400">👥</span>
      <p className="text-gray-400 text-sm">
        <span className="text-white font-medium">{users.length + 1} people</span> at this table
      </p>
    </div>
  )
}