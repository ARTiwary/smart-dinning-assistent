import { create } from 'zustand'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const useStore = create((set, get) => ({
  session: null,
  menu: [],
  cart: [],
  cartOpen: false,
  users: [],

  setSession: (session) => set({ session }),
  setMenu: (menu) => set({ menu }),
  setCart: (cart) => set({ cart }),
  setCartOpen: (open) => set({ cartOpen: open }),
  addUser: (user) => set(s => ({ users: [...s.users.filter(u => u !== user), user] })),

  addToCart: async (sessionId, menuItemId, name, price, addedBy = 'You') => {
    if (!sessionId) return
    try {
      await axios.post(`${API}/api/session/${sessionId}/cart`, {
        menuItemId, qty: 1, addedBy
      })
      await get().fetchCart(sessionId)
    } catch (e) { console.error(e) }
  },

  removeFromCart: async (sessionId, cartItemId) => {
    try {
      await axios.delete(`${API}/api/session/${sessionId}/cart/${cartItemId}`)
      await get().fetchCart(sessionId)
    } catch (e) { console.error(e) }
  },

  updateQty: async (sessionId, cartItemId, quantity) => {
    if (quantity < 1) return get().removeFromCart(sessionId, cartItemId)
    try {
      await axios.patch(`${API}/api/session/${sessionId}/cart/${cartItemId}`, { quantity })
      await get().fetchCart(sessionId)
    } catch (e) { console.error(e) }
  },

  fetchCart: async (sessionId) => {
    try {
      const { data } = await axios.get(`${API}/api/session/${sessionId}/cart`)
      set({ cart: data })
    } catch (e) { console.error(e) }
  },
}))