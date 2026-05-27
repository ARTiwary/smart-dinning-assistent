'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useStore } from '@/lib/store'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const QUICK_BUTTONS = [
  { label: '🌶 Spicy', message: 'show me spicy options' },
  { label: '🥗 Light', message: 'something light to eat' },
  { label: '🍽 Filling', message: 'I want something filling' },
  { label: '🍰 Dessert', message: 'what desserts do you have' },
  { label: '🍹 Drinks', message: 'recommend some drinks' },
  { label: '⭐ Best Sellers', message: 'what are your best sellers' },
]

export default function AIChat({ sessionId }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm Zara 👋 What are you in the mood for today?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(false)
  const bottomRef = useRef(null)
  const { addToCart, session } = useStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    const msg = text || input.trim()
    if (!msg || !sessionId) return

    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post(`${API}/api/session/${sessionId}/ai/chat`, {
        message: msg, isFirstMessage: false
      })

      const aiMsg = {
        role: 'assistant',
        text: data.message,
        suggestions: data.suggestions || [],
        upsell: data.upsell
      }
      setMessages(prev => [...prev, aiMsg])
      if (!open) setUnread(true)

      // Upsell message
      if (data.upsell) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: data.upsell.message,
          suggestions: data.upsell.suggestion ? [data.upsell.suggestion] : []
        }])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I had a hiccup! Try again?" }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(true); setUnread(false) }}
        className="fixed bottom-6 right-6 z-40 bg-orange-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl"
      >
        💬
        {unread && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />}
      </button>

      {/* Chat drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0f0f0f]">
          {/* Header */}
          <div className="p-4 border-b border-[#2a2a2a] flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-lg">🤖</div>
            <div className="flex-1">
              <p className="text-white font-bold">Zara</p>
              <p className="text-green-400 text-xs">● Online</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 text-xl">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.role === 'user'
                  ? 'bg-orange-500 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-[#1a1a1a] text-white rounded-2xl rounded-tl-sm'} px-4 py-3`}>
                  <p className="text-sm">{msg.text}</p>

                  {/* Suggestion cards */}
                  {msg.suggestions?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.suggestions.map((s, j) => (
                        <div key={j} className="bg-[#2a2a2a] rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm font-medium">{s.name}</p>
                            {s.reason && <p className="text-gray-400 text-xs">{s.reason}</p>}
                            <p className="text-orange-400 font-bold text-sm">₹{s.price}</p>
                          </div>
                          <button
                            onClick={() => addToCart(session?.id, s.itemId, s.name, s.price)}
                            className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded-full ml-2"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick buttons */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-t border-[#2a2a2a]">
            {QUICK_BUTTONS.map(btn => (
              <button
                key={btn.label}
                onClick={() => sendMessage(btn.message)}
                className="whitespace-nowrap bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 text-xs px-3 py-1.5 rounded-full"
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#2a2a2a] flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask Zara anything..."
              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading}
              className="bg-orange-500 text-white px-4 rounded-xl disabled:opacity-50"
            >➤</button>
          </div>
        </div>
      )}
    </>
  )
}