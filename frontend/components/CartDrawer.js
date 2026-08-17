'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import axios from 'axios'
import PaymentModal from '@/components/PaymentModal'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function CartDrawer() {
  const {
    cart,
    menu, // Added menu lookup from useStore
    cartOpen,
    setCartOpen,
    session,
    fetchCart,
    updateQty,
    removeFromCart,
    setCart,
  } = useStore()

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentTotal, setPaymentTotal] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [cancelling, setCancelling] = useState(false)
  
  // Local state to keep track of any images that fail to load
  const [failedImages, setFailedImages] = useState({})

  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // Loyalty states
  const [loyaltyAccount, setLoyaltyAccount] = useState(null)
  const [redeemPoints, setRedeemPoints] = useState(0)
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)
  const [loyaltyLoading, setLoyaltyLoading] = useState(false)
  
  useEffect(() => {
    if (session?.id) fetchCart(session.id)
  }, [session])

  // Pre-fill phone and name from localStorage on mount
  useEffect(() => {
    const savedPhone = localStorage.getItem('customerPhone')
    const savedName = localStorage.getItem('customerName')
    if (savedPhone) {
      setPhone(savedPhone)
      if (savedPhone.length === 10) fetchLoyalty(savedPhone)
    }
    if (savedName) setName(savedName)
  }, [])

  const subtotal = cart.reduce(
    (s, i) => s + Number(i.menuItem?.price || 0) * i.quantity,
    0
  )

  const tax = subtotal * 0.05
  const total = subtotal + tax
  const finalTotal = total - (coupon?.discount || 0) - loyaltyDiscount
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0)

  async function fetchLoyalty(phone) {
    if (!/^[6-9]\d{9}$/.test(phone)) return
    try {
      setLoyaltyLoading(true)
      const { data } = await axios.get(`${API}/api/loyalty/${phone}`)
      setLoyaltyAccount(data)
    } catch (e) {
    } finally {
      setLoyaltyLoading(false)
    }
  }

  async function sendOtp() {
    const e = {}
    if (!name.trim() || name.trim().length < 2) e.name = 'Enter a valid name'
    if (!/^[6-9]\d{9}$/.test(phone)) e.phone = 'Enter valid 10-digit mobile number'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setLoading(true)
    try {
      await axios.post(`${API}/api/otp/send`, { phone })
      setOtpSent(true)
    } catch (err) {
      setErrors({ general: 'Failed to send OTP' })
    }
    setLoading(false)
  }

  async function verifyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const { data } = await axios.post(`${API}/api/coupon/verify`, {
        code: couponCode.toUpperCase(),
        orderTotal: total
      })
      setCoupon(data)
    } catch (e) {
      setCouponError(e.response?.data?.error || 'Invalid coupon')
      setCoupon(null)
    }
    setCouponLoading(false)
  }

  function validateOtp() {
    if (!/^\d{6}$/.test(otp)) {
      setErrors(p => ({ ...p, otp: 'Enter a valid 6-digit OTP' }))
      return false
    }
    return true
  }

  async function placeOrder() {
    if (!validateOtp()) return
    setLoading(true)
    try {
      const { data: v } = await axios.post(`${API}/api/otp/verify`, { phone, otp })
      if (!v.valid) {
        setErrors({ otp: 'Invalid OTP. Try again.' })
        setLoading(false)
        return
      }
      // Place order directly here — no second verify
      const { data: order } = await axios.post(`${API}/api/session/${session.id}/order`, {
        customerName: name, customerPhone: phone
      })
      setOrderPlaced(order)
      setCheckoutOpen(false)
      setCartOpen(false)
      setCart([])
      setName(''); setPhone(''); setOtp('')
      setOtpSent(false); setErrors({})
      setCoupon && setCoupon(null)
    } catch (e) {
      setErrors({ general: e.response?.data?.error || 'Something went wrong.' })
    }
    setLoading(false)
  }

  async function cancelOrder(orderId) {
    if (!confirm('Cancel your order?')) return
    setCancelling(true)
    try {
      await axios.patch(`${API}/api/order/${orderId}/cancel`)
      setOrderPlaced(null)
      // Restore cart view
      if (session?.id) fetchCart(session.id)
      setCartOpen(true)
    } catch (e) {
      alert('Could not cancel order')
    }
    setCancelling(false)
  }

  async function downloadBill(order) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200]  // Receipt width
    })

    const W = 80
    let y = 10

    // Header
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('SPICE GARDEN', W / 2, y, { align: 'center' })
    y += 6

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('AI-Powered Dining Experience', W / 2, y, { align: 'center' })
    y += 4
    doc.text('www.spicegarden.com', W / 2, y, { align: 'center' })
    y += 8

    // Divider
    doc.setLineWidth(0.3)
    doc.line(5, y, W - 5, y)
    y += 6

    // Order info
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(`Order: #${order.id?.slice(0, 8).toUpperCase()}`, 5, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.text(`Customer: ${order.customerName}`, 5, y)
    y += 5
    doc.text(`Phone: ${order.customerPhone}`, 5, y)
    y += 5
    doc.text(`Table: ${order.session?.tableId || 'T1'}`, 5, y)
    y += 5
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString('en-IN')}`, 5, y)
    y += 8

    // Divider
    doc.line(5, y, W - 5, y)
    y += 5

    // Items header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('Item', 5, y)
    doc.text('Qty', 48, y)
    doc.text('Price', 58, y)
    doc.text('Total', 68, y)
    y += 4

    doc.line(5, y, W - 5, y)
    y += 5

    // Items
    doc.setFont('helvetica', 'normal')
    order.orderItems?.forEach(oi => {
      const name = oi.menuItem?.name || 'Item'
      const qty = oi.quantity
      const price = Number(oi.price)
      const total = price * qty

      // Wrap long names
      const lines = doc.splitTextToSize(name, 40)
      doc.text(lines, 5, y)
      doc.text(String(qty), 48, y)
      doc.text(`${price}`, 58, y)
      doc.text(`${total}`, 68, y)
      y += lines.length * 5 + 2
    })

    y += 3
    doc.line(5, y, W - 5, y)
    y += 6

    // Totals
    const billSubtotal = Number(order.totalAmount) - Number(order.taxAmount)
    doc.setFont('helvetica', 'normal')
    doc.text('Subtotal:', 5, y)
    doc.text(`Rs.${billSubtotal.toFixed(0)}`, W - 5, y, { align: 'right' })
    y += 5

    doc.text('GST (5%):', 5, y)
    doc.text(`Rs.${Number(order.taxAmount).toFixed(0)}`, W - 5, y, { align: 'right' })
    y += 5

    if (order.discountAmount > 0) {
      doc.text('Discount:', 5, y)
      doc.text(`-Rs.${Number(order.discountAmount).toFixed(0)}`, W - 5, y, { align: 'right' })
      y += 5
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('TOTAL:', 5, y)
    doc.text(`Rs.${(Number(order.totalAmount) - Number(order.discountAmount || 0)).toFixed(0)}`, W - 5, y, { align: 'right' })
    y += 8

    // Divider
    doc.setLineWidth(0.3)
    doc.line(5, y, W - 5, y)
    y += 6

    // Footer
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Thank you for dining with us!', W / 2, y, { align: 'center' })
    y += 5
    doc.text('Please visit again 🍛', W / 2, y, { align: 'center' })
    y += 5
    doc.text('Powered by Zara AI', W / 2, y, { align: 'center' })

    // Save
    doc.save(`SpiceGarden-Bill-${order.id?.slice(0, 8).toUpperCase()}.pdf`)
  }

  const inputStyle = (hasError) => ({
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${hasError ? '#ff6b6b' : 'rgba(255,107,53,0.2)'}`,
    borderRadius: '12px',
    padding: '13px 16px',
    color: '#fff5f0',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    marginBottom: hasError ? '6px' : '12px',
    boxSizing: 'border-box',
  })

  return (
    <>
      {/* Cart FAB */}
      <button
        onClick={() => setCartOpen(true)}
        style={{
          background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow:
            itemCount > 0
              ? '0 4px 20px rgba(255,107,53,0.4)'
              : 'none',
        }}
      >
        <span style={{ fontSize: '18px' }}>🛒</span>

        {itemCount > 0 && (
          <span
            style={{
              background: '#fff',
              color: '#ff6b35',
              fontSize: '12px',
              fontWeight: 800,
              borderRadius: '12px',
              padding: '1px 7px',
            }}
          >
            {itemCount}
          </span>
        )}

        {subtotal > 0 && (
          <span
            style={{
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            ₹{subtotal.toFixed(0)}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 49,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Drawer */}
      <div
        className="cart-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '380px',
          height: '100vh',
          zIndex: 50,
          background:
            'linear-gradient(180deg, #0d0a0f 0%, #1a1220 100%)',
          borderLeft: '1px solid rgba(255,107,53,0.15)',
          display: 'flex',
          flexDirection: 'column',
          transform: cartOpen
            ? 'translateX(0)'
            : 'translateX(100%)',
          transition:
            'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid rgba(255,107,53,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,107,157,0.05))',
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 700,
                color: '#fff5f0',
              }}
            >
              Your Cart 🛒
            </h2>

            <p
              style={{
                color: '#ff8c69',
                fontSize: '12px',
                marginTop: '2px',
              }}
            >
              {itemCount} item{itemCount !== 1 ? 's' : ''} selected
            </p>
          </div>

          <button
            onClick={() => setCartOpen(false)}
            style={{
              width: '36px',
              height: '36px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,107,53,0.15)',
              borderRadius: '50%',
              color: '#c8a49a',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
          }}
        >
          {cart.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '48px' }}>🍽️</span>

              <p style={{ color: '#7a5f58', fontSize: '14px' }}>
                Your cart is empty
              </p>

              <p style={{ color: '#7a5f58', fontSize: '12px' }}>
                Add some delicious items!
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {cart.map((item) => {
                // Cross-reference menu items from store to get the imageUrl
                const matchedMenu = menu.find(m => m.id === item.menuItemId);
                const imageUrl = matchedMenu?.imageUrl;
                const hasImageError = failedImages[item.id];

                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#1a1220',
                      border: '1px solid rgba(255,107,53,0.12)',
                      borderRadius: '16px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,157,0.1))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        flexShrink: 0,
                        overflow: 'hidden', // Ensures images don't clip outside rounded borders
                      }}
                    >
                      {imageUrl && !hasImageError ? (
                        <img
                          src={imageUrl}
                          alt={item.menuItem?.name || 'Food image'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={() => {
                            setFailedImages(prev => ({ ...prev, [item.id]: true }))
                          }}
                        />
                      ) : (
                        '🍽️'
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          color: '#fff5f0',
                          fontSize: '13px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.menuItem?.name}
                      </p>

                      <p style={{ color: '#7a5f58', fontSize: '11px', marginTop: '2px' }}>
                        by {item.addedBy}
                      </p>

                      <p
                        style={{
                          background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          fontSize: '14px',
                          fontWeight: 700,
                          marginTop: '4px',
                        }}
                      >
                        ₹{(Number(item.menuItem?.price) * item.quantity).toFixed(0)}
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                          borderRadius: '20px',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => updateQty(session?.id, item.id, item.quantity - 1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            fontSize: '16px',
                            cursor: 'pointer',
                          }}
                        >
                          −
                        </button>

                        <span
                          style={{
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '13px',
                            minWidth: '16px',
                            textAlign: 'center',
                          }}
                        >
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQty(session?.id, item.id, item.quantity + 1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            fontSize: '16px',
                            cursor: 'pointer',
                          }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(session?.id, item.id)}
                        style={{
                          background: 'rgba(255,100,100,0.1)',
                          border: '1px solid rgba(255,100,100,0.2)',
                          borderRadius: '8px',
                          color: '#ff6b6b',
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div
            style={{
              padding: '20px',
              borderTop: '1px solid rgba(255,107,53,0.12)',
              background: 'linear-gradient(0deg, rgba(255,107,53,0.05), transparent)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                color: '#7a5f58',
                fontSize: '13px',
              }}
            >
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(0)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                color: '#7a5f58',
                fontSize: '13px',
              }}
            >
              <span>GST (5%)</span>
              <span>₹{tax.toFixed(0)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255,107,53,0.12)',
              }}
            >
              <span style={{ color: '#fff5f0', fontWeight: 700, fontSize: '16px' }}>
                Total
              </span>

              <span
                style={{
                  background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 800,
                  fontSize: '18px',
                }}
              >
                ₹{total.toFixed(0)}
              </span>
            </div>

            <button
              onClick={() => setCheckoutOpen(true)}
              style={{
                width: '100%',
                marginTop: '16px',
                background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                border: 'none',
                color: '#fff',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 25px rgba(255,107,53,0.4)',
              }}
            >
              Place Order 🎉
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            padding: '16px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              background: 'linear-gradient(145deg, #1a1220, #201628)',
              border: '1px solid rgba(255,107,53,0.25)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 80px rgba(0,0,0,0.55)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'popupScale 0.25s ease',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 700,
                color: '#fff5f0',
                marginBottom: '8px',
                textAlign: 'center',
              }}
            >
              Complete Order 🎉
            </h3>

            <p
              style={{
                color: '#7a5f58',
                fontSize: '13px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              Total:{' '}
              <span style={{ color: '#ff8c69', fontWeight: 700 }}>
                ₹{finalTotal.toFixed(0)}
              </span>
            </p>
            {errors.general && (
              <div style={{
                background: 'rgba(255,100,100,0.1)',
                border: '1px solid rgba(255,100,100,0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '12px',
                color: '#ff6b6b',
                fontSize: '13px'
              }}>
                ⚠ {errors.general}
              </div>
            )}

            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors(p => ({ ...p, name: '' }))
              }}
              style={inputStyle(!!errors.name)}
            />
            {errors.name && <p style={{ color: '#ff6b6b', fontSize: '11px', marginBottom: '8px' }}>⚠ {errors.name}</p>}

            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={e => {
                const val = e.target.value
                setPhone(val)
                setErrors(p => ({ ...p, phone: '' }))
                if (val.length === 10) fetchLoyalty(val)
              }}
              style={inputStyle(!!errors.phone)}
            />
            {errors.phone && <p style={{ color: '#ff6b6b', fontSize: '11px', marginBottom: '8px' }}>⚠ {errors.phone}</p>}

            {/* Coupon code */}
            {!otpSent && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Coupon code (optional)"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCoupon(null); setCouponError('') }}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${coupon ? 'rgba(74,222,128,0.4)' : 'rgba(255,107,53,0.2)'}`,
                      borderRadius: '12px', padding: '13px 16px',
                      color: '#fff5f0', fontSize: '14px',
                      fontFamily: 'var(--font-body)', outline: 'none',
                      letterSpacing: '0.05em'
                    }}
                  />
                  <button
                    onClick={verifyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    style={{
                      background: 'rgba(255,107,53,0.15)',
                      border: '1px solid rgba(255,107,53,0.3)',
                      color: '#ff8c69', padding: '13px 14px',
                      borderRadius: '12px', fontSize: '13px',
                      fontWeight: 700, cursor: 'pointer',
                      flexShrink: 0, fontFamily: 'var(--font-body)'
                    }}
                  >{couponLoading ? '...' : 'Apply'}</button>
                </div>

                {/* Coupon success */}
                {coupon && (
                  <div style={{
                    background: 'rgba(74,222,128,0.08)',
                    border: '1px solid rgba(74,222,128,0.25)',
                    borderRadius: '10px', padding: '10px 14px',
                    marginTop: '8px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ color: '#4ade80', fontSize: '13px', fontWeight: 700, margin: 0 }}>
                        ✓ {coupon.code} applied!
                      </p>
                      <p style={{ color: '#888', fontSize: '11px', margin: '2px 0 0' }}>
                        {coupon.type === 'percentage' ? `${coupon.percentage}% off` : `₹${coupon.discount} off`}
                      </p>
                    </div>
                    <p style={{
                      background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      fontSize: '16px', fontWeight: 800, margin: 0
                    }}>-₹{coupon.discount.toFixed(0)}</p>
                  </div>
                )}

                {/* Coupon error */}
                {couponError && (
                  <p style={{ color: '#ff6b6b', fontSize: '11px', marginTop: '6px', paddingLeft: '4px' }}>
                    ⚠ {couponError}
                  </p>
                )}
              </div>
            )}

            {/* Loyalty Points */}
            {loyaltyAccount && loyaltyAccount.points >= (loyaltyAccount.minRedeem || 50) && !otpSent && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,170,64,0.06))',
                border: '1px solid rgba(255,215,0,0.2)',
                borderRadius: '14px', padding: '14px', marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <p style={{ color: '#ffd166', fontSize: '14px', fontWeight: 700, margin: 0 }}>
                      💎 {loyaltyAccount.points} Points Available
                    </p>
                    <p style={{ color: '#7a5f58', fontSize: '11px', margin: '2px 0 0' }}>
                      1 point = ₹{loyaltyAccount.pointValue || 0.5}
                    </p>
                  </div>
                  {loyaltyDiscount > 0 && (
                    <span style={{
                      background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)',
                      color: '#ffd166', fontSize: '13px', fontWeight: 700,
                      padding: '4px 10px', borderRadius: '8px'
                    }}>-₹{loyaltyDiscount.toFixed(0)}</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min="0"
                    max={Math.min(loyaltyAccount.points, Math.floor(total / (loyaltyAccount.pointValue || 0.5)))}
                    step="10"
                    value={redeemPoints}
                    onChange={e => {
                      const pts = Number(e.target.value)
                      setRedeemPoints(pts)
                      setLoyaltyDiscount(pts * (loyaltyAccount.pointValue || 0.5))
                    }}
                    style={{ flex: 1, accentColor: '#ffd166' }}
                  />
                  <span style={{ color: '#ffd166', fontSize: '13px', fontWeight: 700, minWidth: '60px' }}>
                    {redeemPoints} pts
                  </span>
                </div>

                {redeemPoints > 0 && (
                  <p style={{ color: '#888', fontSize: '11px', marginTop: '6px' }}>
                    Using {redeemPoints} points for ₹{loyaltyDiscount.toFixed(0)} discount
                  </p>
                )}
              </div>
            )}

            {/* Show points to be earned */}
            {phone.length === 10 && !loyaltyAccount && (
              <p style={{ color: '#7a5f58', fontSize: '11px', marginBottom: '10px' }}>
                💎 You'll earn ~{Math.floor(total * 0.1)} points from this order!
              </p>
            )}

            {loyaltyAccount && redeemPoints === 0 && (
              <p style={{ color: '#7a5f58', fontSize: '11px', marginBottom: '10px' }}>
                💎 You'll earn ~{Math.floor((total - (coupon?.discount || 0)) * 0.1)} more points!
              </p>
            )}

            {/* Updated total with discount and loyalty */}
            {(coupon || loyaltyDiscount > 0) && (
              <div style={{
                background: 'rgba(255,107,53,0.06)',
                border: '1px solid rgba(255,107,53,0.15)',
                borderRadius: '10px', padding: '10px 14px', marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7a5f58', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Original total</span><span>₹{total.toFixed(0)}</span>
                </div>
                {coupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80', fontSize: '12px', marginBottom: '4px' }}>
                    <span>Coupon ({coupon.code})</span><span>-₹{coupon.discount.toFixed(0)}</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffd166', fontSize: '12px', marginBottom: '4px' }}>
                    <span>💎 Loyalty ({redeemPoints} pts)</span>
                    <span>-₹{loyaltyDiscount.toFixed(0)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff5f0', fontSize: '14px', fontWeight: 700 }}>
                  <span>Final total</span>
                  <span style={{
                    background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                  }}>₹{finalTotal.toFixed(0)}</span>
                </div>
              </div>
            )}

            {otpSent && (
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value)
                  setErrors(p => ({ ...p, otp: '' }))
                }}
                style={{ ...inputStyle(!!errors.otp), letterSpacing: '0.2em' }}
              />
            )}
            {errors.otp && <p style={{ color: '#ff6b6b', fontSize: '11px', marginBottom: '8px' }}>⚠ {errors.otp}</p>}

            <button
              onClick={otpSent ? placeOrder : sendOtp}
              disabled={
                loading ||
                !phone ||
                !name ||
                (otpSent && !otp)
              }
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                border: 'none',
                color: '#fff',
                padding: '15px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: loading || !phone || !name ? 0.6 : 1,
                boxShadow: '0 6px 20px rgba(255,107,53,0.35)',
                marginBottom: '10px',
              }}
            >
              {loading
                ? '...'
                : otpSent
                ? '✓ Confirm Order'
                : 'Send OTP →'}
            </button>

            <button
              onClick={() => {
                setCheckoutOpen(false)
                setOtpSent(false)
                setOtp('')
              }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#7a5f58',
                padding: '10px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {paymentOpen && (
        <PaymentModal
          sessionId={session?.id}
          customerName={name}
          customerPhone={phone}
          total={paymentTotal}
          couponCode={coupon?.code}
          loyaltyDiscount={loyaltyDiscount}
          onSuccess={(order) => {
            setPaymentOpen(false)
            setCart([])
            setOrderPlaced(order)
            setName(''); setPhone(''); setOtp('')
            setOtpSent(false); setCoupon(null)
            setLoyaltyDiscount(0); setRedeemPoints(0)
          }}
          onCancel={() => {
            setPaymentOpen(false)
            setCheckoutOpen(true)
          }}
        />
      )}

      {orderPlaced && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(16px)',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(145deg, #1a1220, #201628)',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: '28px',
              width: '100%',
              maxWidth: '360px',
              padding: '36px 28px',
              textAlign: 'center',
              boxShadow: '0 20px 80px rgba(0,0,0,0.55)',
              transform: 'translateY(0)',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '12px' }}>🎉</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: '#fff5f0', marginBottom: '6px' }}>Order Placed!</h3>
            <p style={{ color: '#7a5f58', fontSize: '12px', marginBottom: '6px' }}>#{orderPlaced.id?.slice(0, 8).toUpperCase()}</p>
            <p style={{ background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '30px', fontWeight: 800, marginBottom: '16px' }}>
              ₹{Number(orderPlaced.totalAmount - (orderPlaced.discountAmount || 0)).toFixed(0)}
            </p>
            <p style={{ color: '#7a5f58', fontSize: '13px', marginBottom: '14px' }}>
              ⏱️ Estimated wait: <span style={{ color: '#ffd166', fontWeight: 600 }}>15–20 mins</span>
            </p>
            <div style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,107,157,0.08))', border: '1px solid rgba(255,107,157,0.2)', borderRadius: '14px', padding: '14px', marginBottom: '20px' }}>
              <p style={{ color: '#ffb3c6', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                🙏 Thank you, {orderPlaced.customerName?.split(' ')[0]}!
              </p>
              <p style={{ color: '#7a5f58', fontSize: '12px', lineHeight: 1.6 }}>
                Your food is being prepared with love. Want to explore more while you wait?
              </p>
            </div>
            <button 
              onClick={() => { window.open(`/track/${orderPlaced.id}`, '_blank') }}
              style={{
                width: '100%', marginBottom: '10px',
                background: 'rgba(255,107,53,0.1)', 
                border: '1px solid rgba(255,107,53,0.3)',
                color: '#ff8c69', padding: '12px', borderRadius: '14px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >📍 Track My Order</button>

            {/* Download Bill button */}
            <button
              onClick={() => downloadBill(orderPlaced)}
              style={{
                width: '100%', marginBottom: '10px',
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.25)',
                color: '#4ade80', padding: '13px', borderRadius: '14px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >📄 Download Bill (PDF)</button>

            <button 
              onClick={() => setOrderPlaced(null)} 
              style={{
                width: '100%', marginBottom: '10px',
                background: 'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                border: 'none', color: '#fff', padding: '15px', borderRadius: '14px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              }}
            >🍽️ Explore More Menu</button>
            {orderPlaced.status === 'pending' && (
              <button
                onClick={() => cancelOrder(orderPlaced.id)}
                disabled={cancelling}
                style={{
                  width: '100%', marginBottom: '10px',
                  background: 'transparent',
                  border: '1px solid rgba(255,100,100,0.3)',
                  color: '#ff6b6b', padding: '12px', borderRadius: '14px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}
              >{cancelling ? 'Cancelling...' : '✕ Cancel Order'}</button>
            )}
            <button 
              onClick={() => setOrderPlaced(null)} 
              style={{
                width: '100%', background: 'transparent', border: 'none',
                color: '#7a5f58', padding: '8px', cursor: 'pointer', fontSize: '13px',
              }}
            >Close</button>

          </div>
        </div>
      )}
    </>
  )
}