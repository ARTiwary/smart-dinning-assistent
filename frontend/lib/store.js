import { create } from 'zustand'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function getDeviceId() {
  if (typeof window === 'undefined') return 'server'
  let id = localStorage.getItem('deviceId')
  if (!id) {
    id = `device-${Math.random().toString(36).slice(2)}`
    localStorage.setItem('deviceId', id)
  }
  return id
}

export const useStore = create((set, get) => ({
  session: null,
  menu: [],
  cart: [],
  cartOpen: false,
  users: [],
  deviceId: null,

  setSession: (session) => set({ session }),
  setMenu: (menu) => set({ menu }),
  setCart: (cart) => set({ cart }),
  setCartOpen: (open) => set({ cartOpen: open }),
  addUser: (user) => set(s => ({ users: [...s.users.filter(u => u !== user), user] })),

  initDevice: () => {
    const deviceId = getDeviceId()
    set({ deviceId })
    return deviceId
  },

  addToCart: async (sessionId, menuItemId, name, price, addedBy = 'You') => {
  if (!sessionId) return
  
  // Make sure deviceId is initialized
  let deviceId = get().deviceId
  if (!deviceId) {
    deviceId = getDeviceId()
    set({ deviceId })
  }

  // Optimistic update
  const existing = get().cart.find(c => c.menuItemId === menuItemId)
  if (existing) {
    set(s => ({
      cart: s.cart.map(c => c.menuItemId === menuItemId
        ? { ...c, quantity: c.quantity + 1 }
        : c
      )
    }))
  } else {
    set(s => ({ cart: [...s.cart, {
      id: `temp-${menuItemId}-${Date.now()}`,
      menuItemId,
      quantity: 1,
      addedBy: deviceId,
      menuItem: { name, price }
    }]}))
  }

  try {
    await axios.post(`${API}/api/session/${sessionId}/cart`, {
      menuItemId, qty: 1, addedBy: deviceId
    })
    await get().fetchCart(sessionId)
  } catch (e) {
    console.error('addToCart error:', e.response?.data || e.message)
    await get().fetchCart(sessionId)
  }
},

  removeFromCart: async (sessionId, cartItemId) => {
    set(s => ({ cart: s.cart.filter(c => c.id !== cartItemId) }))
    try {
      await axios.delete(`${API}/api/session/${sessionId}/cart/${cartItemId}`)
    } catch (e) {
      console.error(e)
      await get().fetchCart(sessionId)
    }
  },

  updateQty: async (sessionId, cartItemId, quantity) => {
    if (quantity < 1) return get().removeFromCart(sessionId, cartItemId)
    set(s => ({
      cart: s.cart.map(c => c.id === cartItemId ? { ...c, quantity } : c)
    }))
    try {
      await axios.patch(`${API}/api/session/${sessionId}/cart/${cartItemId}`, { quantity })
    } catch (e) {
      console.error(e)
      await get().fetchCart(sessionId)
    }
  },

  fetchCart: async (sessionId) => {
  if (!sessionId) return
  const deviceId = get().deviceId || getDeviceId()
  try {
    const { data } = await axios.get(`${API}/api/session/${sessionId}/cart`)
    // Show only this device's items
    const myItems = data.filter(item => 
      item.addedBy === deviceId || 
      item.addedBy === 'You' ||
      !item.addedBy
    )
    set({ cart: myItems })
  } catch (e) {
    console.error('fetchCart error:', e)
  }
},
}))