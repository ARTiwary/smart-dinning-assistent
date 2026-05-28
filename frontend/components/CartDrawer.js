'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    session,
    fetchCart,
    updateQty,
    removeFromCart,
  } = useStore()

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

  const subtotal = cart.reduce(
    (s, i) => s + Number(i.menuItem?.price || 0) * i.quantity,
    0
  )

  const tax = subtotal * 0.05
  const total = subtotal + tax
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0)

  async function sendOtp() {
    if (!phone || !name) return

    setLoading(true)

    await axios.post(`${API}/api/otp/send`, { phone })

    setOtpSent(true)
    setLoading(false)
  }

  async function placeOrder() {
    setLoading(true)

    try {
      const { data: v } = await axios.post(`${API}/api/otp/verify`, {
        phone,
        otp,
      })

      if (!v.valid) {
        alert('Invalid OTP')
        setLoading(false)
        return
      }

      const { data: order } = await axios.post(
        `${API}/api/session/${session.id}/order`,
        {
          customerName: name,
          customerPhone: phone,
        }
      )

      setOrderPlaced(order)
      setCheckoutOpen(false)
      setCartOpen(false)
    } catch (e) {
      alert(e.response?.data?.error || 'Error placing order')
    }

    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,107,53,0.2)',
    borderRadius: '12px',
    padding: '13px 16px',
    color: '#fff5f0',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    marginBottom: '12px',
    boxSizing: 'border-box',
  }

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

              <p
                style={{
                  color: '#7a5f58',
                  fontSize: '14px',
                }}
              >
                Your cart is empty
              </p>

              <p
                style={{
                  color: '#7a5f58',
                  fontSize: '12px',
                }}
              >
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
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#1a1220',
                    border:
                      '1px solid rgba(255,107,53,0.12)',
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
                      background:
                        'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,157,0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      flexShrink: 0,
                    }}
                  >
                    🍽️
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

                    <p
                      style={{
                        color: '#7a5f58',
                        fontSize: '11px',
                        marginTop: '2px',
                      }}
                    >
                      by {item.addedBy}
                    </p>

                    <p
                      style={{
                        background:
                          'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontSize: '14px',
                        fontWeight: 700,
                        marginTop: '4px',
                      }}
                    >
                      ₹
                      {(
                        Number(item.menuItem?.price) *
                        item.quantity
                      ).toFixed(0)}
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
                        background:
                          'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                        borderRadius: '20px',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        onClick={() =>
                          updateQty(
                            session?.id,
                            item.id,
                            item.quantity - 1
                          )
                        }
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
                        onClick={() =>
                          updateQty(
                            session?.id,
                            item.id,
                            item.quantity + 1
                          )
                        }
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
                      onClick={() =>
                        removeFromCart(session?.id, item.id)
                      }
                      style={{
                        background:
                          'rgba(255,100,100,0.1)',
                        border:
                          '1px solid rgba(255,100,100,0.2)',
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
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div
            style={{
              padding: '20px',
              borderTop:
                '1px solid rgba(255,107,53,0.12)',
              background:
                'linear-gradient(0deg, rgba(255,107,53,0.05), transparent)',
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
                borderTop:
                  '1px solid rgba(255,107,53,0.12)',
              }}
            >
              <span
                style={{
                  color: '#fff5f0',
                  fontWeight: 700,
                  fontSize: '16px',
                }}
              >
                Total
              </span>

              <span
                style={{
                  background:
                    'linear-gradient(135deg, #ff6b35, #ff6b9d)',
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
                background:
                  'linear-gradient(135deg, #ff6b35, #ff6b9d)',
                border: 'none',
                color: '#fff',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow:
                  '0 6px 25px rgba(255,107,53,0.4)',
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

        background:
          'linear-gradient(145deg, #1a1220, #201628)',

        border:
          '1px solid rgba(255,107,53,0.25)',

        borderRadius: '24px',

        padding: '24px',

        boxShadow:
          '0 20px 80px rgba(0,0,0,0.55)',

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
        <span
          style={{
            color: '#ff8c69',
            fontWeight: 700,
          }}
        >
          ₹{total.toFixed(0)}
        </span>
      </p>

      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />

      <input
        type="tel"
        placeholder="Phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={inputStyle}
      />

      {otpSent && (
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={{
            ...inputStyle,
            letterSpacing: '0.2em',
          }}
        />
      )}

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
          background:
            'linear-gradient(135deg, #ff6b35, #ff6b9d)',

          border: 'none',
          color: '#fff',

          padding: '15px',

          borderRadius: '14px',

          fontSize: '15px',
          fontWeight: 700,

          cursor: 'pointer',

          opacity:
            loading || !phone || !name ? 0.6 : 1,

          boxShadow:
            '0 6px 20px rgba(255,107,53,0.35)',

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
    </>
  )
}