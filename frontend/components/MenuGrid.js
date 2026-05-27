'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/lib/store'

const CATEGORIES = [
  'All', 'Veg Starters', 'Non-Veg Starters', 'Mains (Veg)',
  'Mains (Non-Veg)', 'Breads & Rice', 'Desserts',
  'Beverages (Hot)', 'Beverages (Cold)', 'Combos & Deals'
]

const TAGS = ['spicy', 'light', 'veg', 'bestseller', 'sweet', 'filling']

export default function MenuGrid() {
  const { menu, addToCart, session } = useStore()
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeTag, setActiveTag] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return menu.filter(item => {
      const matchCat = activeCategory === 'All' || item.category === activeCategory
      const matchTag = !activeTag || item.tags?.includes(activeTag)
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchTag && matchSearch
    })
  }, [menu, activeCategory, activeTag, search])

  return (
    <div className="px-4">
      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search menu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
        <span className="absolute right-3 top-3 text-gray-500">🔍</span>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-orange-500 text-white'
                : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tag filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
        {TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className={`whitespace-nowrap px-3 py-1 rounded-full text-xs transition-all ${
              activeTag === tag
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500'
                : 'bg-[#1a1a1a] text-gray-500 border border-[#2a2a2a]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Menu items */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.map(item => (
          <MenuCard
            key={item.id}
            item={item}
            onAdd={() => addToCart(session?.id, item.id, item.name, item.price)}
          />
        ))}
      </div>
    </div>
  )
}

function MenuCard({ item, onAdd }) {
  return (
    <div className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex gap-3 ${!item.available ? 'opacity-50' : ''}`}>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs">{item.tags?.includes('veg') ? '🟢' : '🔴'}</span>
              <span className="text-white font-medium">{item.name}</span>
            </div>
            <p className="text-gray-500 text-xs mb-2">{item.description}</p>
            <div className="flex flex-wrap gap-1">
              {item.tags?.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs bg-[#2a2a2a] text-gray-400 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-white font-bold">₹{item.price}</span>
          <button
            onClick={onAdd}
            disabled={!item.available}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white text-sm px-4 py-1.5 rounded-full transition-all"
          >
            {item.available ? '+ Add' : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  )
}