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
  const { setSession, setMenu, session } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
      <div className="text-center">
        <div className="text-4xl mb-4">🍽️</div>
        <p className="text-orange-400 text-lg animate-pulse">Setting up your table...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f0f0f]/95 backdrop-blur border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">🍛 Spice Garden</h1>
          <p className="text-orange-400 text-xs">Table {tableId}</p>
        </div>
        <CartDrawer />
      </div>

      <GroupBanner tableId={tableId} />

      {/* AI Pick Section */}
      <AIPickSection sessionId={session?.id} />

      <MenuGrid />
      <AIChat sessionId={session?.id} tableId={tableId} />
    </div>
  )
}

function AIPickSection({ sessionId }) {
  const [picks, setPicks] = useState([])
  const { addToCart, session } = useStore()

  useEffect(() => {
    if (!sessionId) return
    async function fetchPicks() {
      try {
        const { data } = await axios.post(`${API}/api/session/${sessionId}/ai/chat`, {
          message: '', isFirstMessage: true
        })
        if (data.suggestions?.length > 0) setPicks(data.suggestions)
      } catch (e) {}
    }
    fetchPicks()
  }, [sessionId])

  if (picks.length === 0) return null

  return (
    <div className="px-4 py-4">
      <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
        <span>⭐</span> AI Pick for You
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {picks.map(item => (
          <div key={item.itemId} className="min-w-[200px] bg-[#1a1a1a] border border-orange-500/30 rounded-xl p-3">
            <p className="text-white font-medium text-sm">{item.name}</p>
            <p className="text-orange-400 text-xs mt-1">{item.reason}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-white font-bold">₹{item.price}</span>
              <button
                onClick={() => addToCart(session?.id, item.itemId, item.name, item.price)}
                className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}