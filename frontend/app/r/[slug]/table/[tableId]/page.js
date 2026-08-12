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

export default function RestaurantTablePage() {
  const { slug, tableId } = useParams()
  const { setSession, setMenu, session, initDevice } = useStore()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initDevice()
    async function init() {
      try {
        // Get restaurant info
        const { data: rest } = await axios.get(`${API}/api/admin/restaurant/${slug}`)
        setRestaurant(rest)

        // Get session with restaurantId
        const { data: sess } = await axios.get(
          `${API}/api/table/${tableId}/session?restaurantSlug=${slug}`
        )
        setSession(sess)

        // Get restaurant-specific menu
        const { data: menu } = await axios.get(
          `${API}/api/menu?restaurantId=${rest.id}`
        )
        setMenu(menu)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [slug, tableId])

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0d0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px'
    }}>
      <div style={{ fontSize: '64px' }}>🍛</div>
      <p style={{
        background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        fontSize: '18px', fontWeight: 600
      }}>Loading {restaurant?.name || 'Restaurant'}...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '120px', paddingTop: '68px' }}>
      {/* Header with restaurant branding */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(13,10,15,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,107,53,0.12)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {restaurant?.logo && (
            <img src={restaurant.logo} alt={restaurant.name}
              style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
          )}
          <div>
            <h1 style={{
              background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              fontSize: '20px', fontWeight: 700, lineHeight: 1.2, margin: 0
            }}>{restaurant?.name || 'Restaurant'}</h1>
            <p style={{ color: '#7a5f58', fontSize: '11px', margin: 0 }}>
              TABLE {tableId} • AI DINING
            </p>
          </div>
        </div>
        <CartDrawer />
      </header>

      <GroupBanner tableId={tableId} />
      <MenuGrid />
      <AIChat sessionId={session?.id} tableId={tableId} />
    </div>
  )
}