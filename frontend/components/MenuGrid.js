'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useStore } from '@/lib/store'

const CATEGORIES = [
  { label: 'All', emoji: '🍽️' },
  { label: 'Veg Starters', emoji: '🥗' },
  { label: 'Non-Veg Starters', emoji: '🍗' },
  { label: 'Mains (Veg)', emoji: '🫕' },
  { label: 'Mains (Non-Veg)', emoji: '🍖' },
  { label: 'Breads & Rice', emoji: '🍞' },
  { label: 'Desserts', emoji: '🍮' },
  { label: 'Beverages (Hot)', emoji: '☕' },
  { label: 'Beverages (Cold)', emoji: '🧃' },
  { label: 'Combos & Deals', emoji: '🎁' },
]

const TAGS = [
  { label: '🌶️ Spicy', value: 'spicy' },
  { label: '🥬 Light', value: 'light' },
  { label: '🌿 Veg', value: 'veg' },
  { label: '⭐ Bestseller', value: 'bestseller' },
  { label: '🍰 Sweet', value: 'sweet' },
  { label: '💪 Filling', value: 'filling' },
]

const FOOD_EMOJIS = {
  'Veg Starters':      '🥙',
  'Non-Veg Starters':  '🍗',
  'Mains (Veg)':       '🫕',
  'Mains (Non-Veg)':   '🍖',
  'Breads & Rice':     '🍞',
  'Desserts':          '🍮',
  'Beverages (Hot)':   '☕',
  'Beverages (Cold)':  '🧃',
  'Combos & Deals':    '🎁',
}

export default function MenuGrid() {
  const { menu, addToCart, cart, session, updateQty } = useStore()
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

  const grouped = useMemo(() => {
    if (activeCategory !== 'All') return { [activeCategory]: filtered }
    return filtered.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {})
  }, [filtered, activeCategory])

  function getCartItem(itemId) {
  return cart.find(c => c.menuItemId === itemId || c.menuItem?.id === itemId)
}

  return (
    <div style={styles.menuContainer}>
      
      {/* GLOBAL RESPONSIVE DESIGN & INTERACTIVE POP-UP STYLES */}
      <style jsx global>{`
        .responsive-menu-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          padding: 10px 4px; /* Gives room for cards to pop out at the borders without clipping */
        }

        /* 🚀 Dynamic Pop-up & Glow Engine */
        .menu-card-pop {
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                      box-shadow 0.4s ease, 
                      border-color 0.4s ease !important;
          will-change: transform, box-shadow;
          z-index: 1;
        }

        .menu-card-pop:hover {
          transform: scale(1.04) translateY(-4px) !important;
          z-index: 10;
          border-color: rgba(255, 107, 53, 0.4) !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 
                      0 0 25px rgba(255, 107, 53, 0.15) !important;
        }

        /* Subtly zooms the image within the card block when the user hovers over the card */
        .menu-card-pop:hover .food-image-zoom {
          transform: scale(1.08);
        }
        
        @media (min-width: 640px) {
          .responsive-menu-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
          .dish-title-text {
            font-size: 18px !important;
          }
          .dish-desc-text {
            font-size: 14px !important;
          }
          .dish-tag-text {
            font-size: 11px !important;
            padding: 4px 10px !important;
          }
          .dish-price-text {
            font-size: 22px !important;
          }
        }
        
        @media (min-width: 1440px) {
          .responsive-menu-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 28px;
          }
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Search Bar */}
      <div style={styles.searchWrapper}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Craving something specific? Search here..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
          onFocus={e => e.target.style.borderColor = 'var(--coral, #ff6b35)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
        />
      </div>

      {/* Category Slider */}
      <div style={styles.scrollContainer} className="scrollbar-hide">
        {CATEGORIES.map(cat => {
          const isSelected = activeCategory === cat.label
          return (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              style={{
                ...styles.categoryPill,
                background: isSelected ? 'linear-gradient(135deg, #ff6b9d, #ff6b35)' : 'rgba(255,255,255,0.04)',
                color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                border: isSelected ? '1px solid transparent' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: isSelected ? '0 8px 20px rgba(255,107,53,0.3)' : 'none',
              }}
            >
              <span style={{ marginRight: '6px' }}>{cat.emoji}</span>
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Mood Tag Slider */}
      <div style={styles.scrollContainer} className="scrollbar-hide">
        {TAGS.map(tag => {
          const isSelected = activeTag === tag.value
          return (
            <button
              key={tag.value}
              onClick={() => setActiveTag(activeTag === tag.value ? null : tag.value)}
              style={{
                ...styles.moodPill,
                border: isSelected ? '1px solid #ff6b35' : '1px solid rgba(255,255,255,0.1)',
                background: isSelected ? 'rgba(255,107,53,0.15)' : 'transparent',
                color: isSelected ? '#ffaa40' : 'rgba(255,255,255,0.5)',
              }}
            >
              {tag.label}
            </button>
          )
        })}
      </div>

      {/* Dynamic Grid Sections */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} style={{ marginBottom: '48px' }}>
          <div style={styles.sectionHeader}>
            <span style={styles.headerEmoji}>{FOOD_EMOJIS[category] || '🍽️'}</span>
            <h3 style={styles.headerTitle}>{category}</h3>
            <div style={styles.headerLine} />
          </div>

          <div className="responsive-menu-grid">
            {items.map((item, i) => {
              const cartItem = getCartItem(item.id)
              return (
                <MenuCard
                  key={item.id}
                  item={item}
                  cartItem={cartItem}
                  index={i}
                  onAdd={() => addToCart(session?.id, item.id, item.name, item.price)}
                  onIncrease={() => updateQty(session?.id, cartItem?.id, (cartItem?.quantity || 0) + 1)}
                  onDecrease={() => updateQty(session?.id, cartItem?.id, (cartItem?.quantity || 1) - 1)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function MenuCard({ item, cartItem, index, onAdd, onIncrease, onDecrease }) {
  const [imgError, setImgError] = useState(false)
  const isInCart = !!cartItem
  const isVeg = item.tags?.includes('veg')

  return (
    <div
      className="menu-card-pop glow-border"
      style={{
        ...styles.premiumCard,
        opacity: item.available ? 1 : 0.4,
        animation: `slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.04}s both`,
      }}
    >
      {item.tags?.includes('bestseller') && (
        <div style={styles.bestsellerBadge}>
          <span style={{ fontSize: '10px' }}>⭐</span> BESTSELLER
        </div>
      )}

      <div style={styles.cardFlexContainer}>
        
        {/* Image space block */}
        <div className="image-block-responsive" style={styles.imageBlock}>
          {item.imageUrl && !imgError ? (
            <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 125px, 150px"
                onError={() => setImgError(true)}
                className="food-image-zoom"
                style={{
                  ...styles.foodImage,
                  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                priority={index < 4}
              />
            </div>
          ) : (
            <div style={styles.meshPlaceholder}>
              <span style={styles.placeholderEmoji}>
                {FOOD_EMOJIS[item.category] || '🍽️'}
              </span>
              <span style={styles.placeholderText}>Spice Garden</span>
              <div style={styles.placeholderAccentLine} />
            </div>
          )}

          {/* Veg / Non-Veg Indicator */}
          <div style={{
            ...styles.identityMarker,
            borderColor: isVeg ? '#10b981' : '#ef4444',
          }}>
            <div style={{
              ...styles.identityDot,
              background: isVeg ? '#10b981' : '#ef4444'
            }} />
          </div>
        </div>

        {/* Content Details Block */}
        <div style={styles.detailsBlock}>
          <div>
            <h4 className="dish-title-text" style={styles.dishTitle}>{item.name}</h4>
            <p className="dish-desc-text" style={styles.dishDescription}>{item.description}</p>

            <div style={styles.tagsContainer}>
              {item.tags?.slice(0, 2).map(tag => (
                <span key={tag} className="dish-tag-text" style={styles.dishTag}>{tag}</span>
              ))}
              {item.allergens?.length > 0 && (
                <span className="dish-tag-text" style={styles.allergenTag}>⚠️ {item.allergens[0]}</span>
              )}
            </div>
          </div>

          {/* Pricing Actions Row */}
          <div style={styles.actionRow}>
            <div style={styles.priceContainer}>
              <span style={styles.currencySymbol}>₹</span>
              <span className="dish-price-text" style={styles.priceAmount}>{item.price}</span>
              {!item.available && <span style={styles.soldOutText}>Sold Out</span>}
            </div>

            {/* Action Toggles */}
            {!item.available ? (
              <div style={styles.disabledActionPill}>Unavailable</div>
            ) : isInCart ? (
              <div style={styles.quantityEngine}>
                <button onClick={onDecrease} style={styles.engineBtn}>−</button>
                <span style={styles.engineQty}>{cartItem.quantity}</span>
                <button onClick={onIncrease} style={styles.engineBtn}>+</button>
              </div>
            ) : (
              <button
                onClick={onAdd}
                style={styles.primaryAddBtn}
              >
                + Add
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

const styles = {
  menuContainer: {
    padding: '24px 16px 60px',
    position: 'relative',
    zIndex: 1,
    maxWidth: '1280px',
    margin: '0 auto'
  },
  searchWrapper: {
    position: 'relative',
    marginBottom: '24px',
    maxWidth: '500px',
    margin: '0 auto 24px'
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '18px',
    opacity: 0.6,
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px',
    padding: '16px 16px 16px 48px',
    color: '#ffffff',
    fontSize: '15px',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  scrollContainer: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    paddingBottom: '10px',
    marginBottom: '14px',
    WebkitOverflowScrolling: 'touch',
    justifyContent: 'flex-start'
  },
  categoryPill: {
    whiteSpace: 'nowrap',
    padding: '11px 20px',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },
  moodPill: {
    whiteSpace: 'nowrap',
    padding: '9px 16px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '36px',
    marginBottom: '20px'
  },
  headerEmoji: {
    fontSize: '26px'
  },
  headerTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.02em'
  },
  headerLine: {
    flex: 1,
    height: '2px',
    background: 'linear-gradient(90deg, rgba(255,107,53,0.4), rgba(255,107,157,0.05), transparent)'
  },
  premiumCard: {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '24px',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    backdropFilter: 'blur(12px)',
  },
  cardFlexContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%'
  },
  bestsellerBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    zIndex: 3,
    background: 'linear-gradient(135deg, #ff9f43, #ff5252)',
    color: '#fff',
    fontSize: '9px',
    fontWeight: 900,
    padding: '4px 10px',
    borderRadius: '12px',
    letterSpacing: '0.06em',
    boxShadow: '0 4px 12px rgba(255,82,82,0.4)',
    textTransform: 'uppercase'
  },
  imageBlock: {
    width: '135px',
    minHeight: '155px',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  foodImage: {
    objectFit: 'cover',
  },
  meshPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(255,107,53,0.12) 0%, rgba(255,107,157,0.08) 50%, rgba(13,10,15,0.5) 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    minHeight: '155px'
  },
  placeholderEmoji: {
    fontSize: '40px',
    filter: 'drop-shadow(0 8px 16px rgba(255,107,53,0.3))'
  },
  placeholderText: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  },
  placeholderAccentLine: {
    width: '28px',
    height: '2px',
    background: 'linear-gradient(90deg, #ff6b35, #ff6b9d)',
    borderRadius: '4px',
    opacity: 0.4,
    marginTop: '2px'
  },
  identityMarker: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    width: '18px',
    height: '18px',
    borderRadius: '5px',
    border: '2px solid',
    background: '#0d0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    zIndex: 2
  },
  identityDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  detailsBlock: {
    flex: 1,
    padding: '16px 18px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minWidth: 0
  },
  dishTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '16px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '6px',
    lineHeight: 1.3,
    letterSpacing: '-0.01em'
  },
  dishDescription: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: '12.5px',
    lineHeight: 1.5,
    marginBottom: '12px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '12px'
  },
  dishTag: {
    fontSize: '10px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '8px',
    background: 'rgba(255,107,53,0.08)',
    color: '#ffaa40',
    border: '1px solid rgba(255,107,53,0.15)',
  },
  allergenTag: {
    fontSize: '10px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '8px',
    background: 'rgba(239,68,68,0.08)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.15)',
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.04)'
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px'
  },
  currencySymbol: {
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    fontWeight: 700,
    color: '#ff6b35'
  },
  priceAmount: {
    fontFamily: 'var(--font-display)',
    fontSize: '20px',
    fontWeight: 800,
    color: '#ffffff'
  },
  soldOutText: {
    color: '#ef4444',
    fontSize: '11px',
    marginLeft: '6px',
    fontWeight: 600
  },
  disabledActionPill: {
    padding: '8px 14px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.3)',
    fontSize: '13px',
    fontWeight: 500
  },
  quantityEngine: {
    display: 'flex',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #ff6b9d, #ff6b35)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 6px 16px rgba(255,107,53,0.25)',
  },
  engineBtn: {
    width: '38px',
    height: '38px',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '19px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  engineQty: {
    color: '#fff',
    fontWeight: 800,
    fontSize: '15px',
    minWidth: '26px',
    textAlign: 'center'
  },
  primaryAddBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,107,53,0.4)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    padding: '10px 24px',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-body)',
  }
}