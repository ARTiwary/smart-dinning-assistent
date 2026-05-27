'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, session, fetchCart, updateQty, removeFromCart } = useStore()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.id) fetchCart(session.id)
  }, [session])

  const subtotal = cart.reduce((s, i) => s + Number(i.menuItem?.price || 0) * i.quantity, 0)
  const tax = subtotal * 0.05
  const total = subtotal + tax

  async function sendOtp() {
    setLoading(true)
    await axios.post(`${API}/api/otp/send`, { phone })
    setOtpSent(true)
    setLoading(false)
  }

  async function placeOrder() {
    setLoading(true)
    try {
      const { data: v } = await axios.post(`${API}/api/otp/verify`, { phone, otp })
      if (!v.valid) return alert('Invalid OTP')
      const { data: order } = await axios.post(`${API}/api/session/${session.id}/order`, {
        customerName: name, customerPhone: phone
      })
      setOrderPlaced(order)
      setCheckoutOpen(false)
      setCartOpen(false)
    } catch (e) {
      alert(e.response?.data?.error || 'Error placing order')
    }
    setLoading(false)
  }

  return (
    <>
      {/* Cart button */}
      <button
        onClick={() => setCartOpen(true)}
        className="relative bg-orange-500 text-white px-4 py-2 rounded-full flex items-center gap-2"
      >
        🛒
        {cart.length > 0 && (
          <span className="bg-white text-orange-500 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
        )}
      </button>

      {/* Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-sm bg-[#0f0f0f] border-l border-[#2a2a2a] flex flex-col h-full">
            <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Your Cart</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">Your cart is empty</p>
              ) : cart.map(item => (
                <div key={item.id} className="bg-[#1a1a1a] rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{item.menuItem?.name}</p>
                    <p className="text-gray-500 text-xs">Added by {item.addedBy}</p>
                    <p className="text-orange-400 text-sm font-bold mt-1">
                      ₹{(Number(item.menuItem?.price) * item.quantity).toFixed(0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(session?.id, item.id, item.quantity - 1)}
                      className="w-7 h-7 bg-[#2a2a2a] text-white rounded-full flex items-center justify-center"
                    >−</button>
                    <span className="text-white w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(session?.id, item.id, item.quantity + 1)}
                      className="w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-[#2a2a2a]">
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>GST (5%)</span><span>₹{tax.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold">
                    <span>Total</span><span>₹{total.toFixed(0)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-bold text-lg mb-4">Complete Order</h3>
            <input
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white mb-3 focus:outline-none focus:border-orange-500"
            />
            <input
              placeholder="Phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white mb-3 focus:outline-none focus:border-orange-500"
            />
            {!otpSent ? (
              <button
                onClick={sendOtp}
                disabled={loading || !phone || !name}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            ) : (
              <>
                <input
                  placeholder="Enter OTP (123456)"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white mb-3 focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={placeOrder}
                  disabled={loading || !otp}
                  className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  {loading ? 'Placing...' : 'Confirm Order'}
                </button>
              </>
            )}
            <button
              onClick={() => setCheckoutOpen(false)}
              className="w-full text-gray-500 py-2 mt-2"
            >Cancel</button>
          </div>
        </div>
      )}

      {/* Order success */}
      {orderPlaced && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1a1a1a] border border-green-500/30 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-white font-bold text-xl mb-2">Order Placed!</h3>
            <p className="text-gray-400 text-sm mb-1">Order ID: {orderPlaced.id?.slice(0, 8)}...</p>
            <p className="text-orange-400 font-bold text-lg mb-4">₹{Number(orderPlaced.totalAmount).toFixed(0)}</p>
            <p className="text-gray-400 text-sm mb-4">Estimated wait: 15-20 mins</p>
            <button
              onClick={() => setOrderPlaced(null)}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold"
            >Done</button>
          </div>
        </div>
      )}
    </>
  )
}