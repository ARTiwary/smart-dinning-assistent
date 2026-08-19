<div align="center">

# 🍛 Spice Garden
### AI‑Driven Smart Dining Assistant

**A production‑grade, full‑stack AI‑first restaurant ordering system** — multi‑agent architecture, real RAG (pgvector + Cohere), real‑time group ordering, PWA support, and a 25+ feature admin dashboard.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](#)
[![Node](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?logo=postgresql&logoColor=white)](#)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#-license)
[![Cost](https://img.shields.io/badge/infra%20cost-%240%2Fmonth-brightgreen)](#-total-cost)

</div>

---

## 🌐 Live Demo

| | Link |
|---|---|
| 🍽️ Customer App | [smart-dinning-assistent.vercel.app/table/T1](https://smart-dinning-assistent.vercel.app/table/T1) |
| 🔐 Admin Panel | [smart-dinning-assistent.vercel.app/admin](https://smart-dinning-assistent.vercel.app/admin) |
| 🍳 Kitchen Display | [smart-dinning-assistent.vercel.app/kitchen](https://smart-dinning-assistent.vercel.app/kitchen) |
| 📅 Table Reservation | [smart-dinning-assistent.vercel.app/reserve](https://smart-dinning-assistent.vercel.app/reserve) |
| ⚙️ Backend API | [smart-dinning-assistent.onrender.com](https://smart-dinning-assistent.onrender.com) |
| 💻 GitHub | [github.com/ARTiwary/smart-dinning-assistent](https://github.com/ARTiwary/smart-dinning-assistent) |

> **Admin Password:** `admin123` &nbsp;·&nbsp; **Demo OTP:** `123456` (mock mode)

---

## 📑 Table of Contents

- [What Makes This AI‑First?](#-what-makes-this-ai-first)
- [Complete Feature List](#-complete-feature-list-25)
- [System Architecture](#️-system-architecture)
- [Multi-Agent Architecture](#-multi-agent-architecture)
- [Real RAG Pipeline](#-real-rag-pipeline)
- [Tech Stack](#️-tech-stack)
- [Database Schema](#️-database-schema-25-models)
- [Complete User Flow](#-complete-user-flow)
- [Getting Started](#-getting-started-local)
- [Environment Variables](#️-environment-variables)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Staff Roles & Permissions](#-staff-roles--permissions)
- [Multi-Restaurant URLs](#-multi-restaurant-urls)
- [Key Design Decisions](#-key-design-decisions)
- [Known Limitations](#️-known-limitations)
- [Total Cost](#-total-cost)
- [Example AI Interactions](#-example-ai-interactions)
- [License](#-license)

---

## 🎯 What Makes This AI‑First?

This is **not** a menu app with a chatbot bolted on. AI agents are the *primary* interaction layer.

- 🗣️ Natural language is the default — menus are the fallback
- 🤖 8 specialized agents coordinate via a central orchestrator
- 🔍 Real RAG — Cohere embeddings + pgvector cosine similarity search
- 🧠 Cross‑session memory — Zara remembers returning customers by phone
- 🌐 Multilingual by default — English, Hinglish, Telugu‑English natively
- 🥗 Dietary profile awareness — auto‑filters menu based on saved health conditions
- ⚠️ Allergy alerts — warns before adding allergen items to cart
- 🛒 Contextual upselling — triggered by cart state, not hardcoded banners
- 🎤 Voice input — speak to Zara using the Web Speech API
- ⏰ Time‑aware recommendations — breakfast/lunch/dinner picks by IST time

---

## ✨ Complete Feature List (25+)

### 👤 Customer Side

| | |
|---|---|
| 📱 | QR code scan → instant anonymous table session |
| 🤖 | **Zara** — AI dining assistant (Groq `llama-3.1-8b-instant`) |
| 🧠 | 8‑agent multi‑agent orchestrator with LangChain routing |
| 🔍 | Real RAG — Cohere embeddings + pgvector semantic search |
| 🗣️ | Multilingual NLU — Hinglish, Telugu‑English natively |
| 🎤 | Voice input — speak to Zara (Web Speech API, Chrome/Edge) |
| 🍽️ | AI Combo Builder — budget‑based full meal generator |
| ⏰ | Chef recommendations by time — breakfast/lunch/snacks/dinner |
| 🔄 | Smart Reorder — last order + favorites with one‑click reorder |
| 🥗 | Dietary Profile Saver — vegan, diabetic, celiac, halal etc. |
| ⚠️ | Allergy Alert System — high/medium/low severity with confirmation |
| 👥 | Real‑time group ordering via Socket.io + Redis pub/sub |
| 🛒 | Per‑device cart with optimistic UI |
| 🧾 | Full bill with GST breakdown |
| 📄 | PDF bill download (receipt format) |
| 🎟️ | Discount coupon codes at checkout |
| 💎 | Loyalty points — earn on orders, redeem at checkout |
| 🔁 | Cross‑session memory — personalized returning customer experience |
| 📍 | Live order tracking page |
| 🛵 | Real‑time delivery tracking with GPS map |
| 🌐 | Multi‑language menu — Hindi, Telugu, auto‑detect from Zara chat |
| ✕ | Cancel order option |
| 📱 | PWA — installable on phone home screen |
| 📅 | Table reservation system — 3‑step booking flow |
| 📲 | WhatsApp notifications — order, reservation, ready alerts |
| 💳 | Razorpay payment gateway — UPI, cards, cash option |
| 📱 | Fully responsive — all screen sizes 320px to 1440px+ |

### 🔐 Admin Panel

| | |
|---|---|
| 📊 | Live dashboard — orders, revenue, active tables |
| 📈 | Analytics — revenue charts, top items, category breakdown |
| 🔮 | Revenue forecasting — peak hours, weekly trends, top sellers |
| 🧾 | Order management — full status flow + cancel |
| 🍳 | Kitchen display screen with live order columns |
| 🪑 | Dynamic table management + QR generation |
| 🍽️ | Menu management — add, edit, delete, toggle, image upload |
| 📦 | Inventory management — stock tracking, auto‑disable at 0 |
| 🎟️ | Coupon management — create, toggle, delete |
| 💎 | Loyalty account management |
| 📅 | Reservation management — today/upcoming/cancelled views |
| 🛵 | Delivery driver assignment with live tracking |
| 👥 | Staff management — 4 roles with permission‑based access |
| 🏪 | Multi‑restaurant branch management |
| 🔒 | Close/reset table sessions |
| 🔄 | Auto‑refresh every 10 seconds |

---

## 🏗️ System Architecture

```
                    User Phone (Browser / PWA)
                              │
                     HTTPS / WebSocket
                              ▼
          ┌───────────────────────────────────────┐
          │   Next.js 16 Frontend (Vercel)         │
          │   TailwindCSS · Zustand · Axios        │
          │   Socket.io Client · PWA               │
          └───────────────────┬─────────────────────┘
                               │ REST API + WebSocket
                               ▼
          ┌───────────────────────────────────────┐
          │   Express Backend (Render)              │
          │   Node.js 20 · Socket.io Server         │
          │                                          │
          │  ┌───────────────────────────────────┐  │
          │  │   AI Orchestrator                  │  │
          │  │   LangChain.js + Groq              │  │
          │  │   8 Specialized Agents             │  │
          │  │   Real RAG Pipeline                │  │
          │  └───────────────────────────────────┘  │
          └────────┬───────────────┬─────────────────┘
                    │               │
                    ▼               ▼
          ┌──────────────┐   ┌───────────────┐
          │  PostgreSQL  │   │    Redis      │
          │  Supabase    │   │    Upstash    │
          │  + pgvector  │   │  Sessions     │
          │  Prisma ORM  │   │  OTP + TTL    │
          │  25+ models  │   │  Pub/Sub      │
          └──────┬───────┘   └───────────────┘
                  │
                  ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │  Cohere API  │  │  Cloudinary  │  │  WhatsApp    │
     │  Embeddings  │  │  Image CDN   │  │  Business    │
     │  384-dim     │  │  Menu photos │  │  Notifications│
     └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🤖 Multi-Agent Architecture

```
User Input
     │
     ▼
Multilingual NLU Agent ── normalize + detect intent + language
     │
     ▼
Orchestrator (intent router)
     ├── GREET      ──► Greeter Agent (+ cross-session memory + last order)
     ├── RECOMMEND  ──► Recommendation Agent
     │                  ├── Cohere embed query
     │                  ├── pgvector cosine search
     │                  ├── Dietary profile filter
     │                  └── Groq LLM ranking
     ├── UPSELL     ──► Upsell Agent (async, non-blocking)
     ├── MEMORY     ──► Context Memory Agent (Redis)
     ├── GROUP      ──► Group Coordinator Agent
     ├── SENTIMENT  ──► Sentiment Agent (background)
     └── CHECKOUT   ──► Order Validation Agent
     │
     ▼
JSON Response → Frontend renders suggestion cards with images + qty controls
```

### Agent Responsibilities

| Agent | Responsibility |
|---|---|
| **Multilingual NLU** | Normalizes Hinglish/Telugu → structured JSON intent |
| **Greeter** | Personalized welcome using cross‑session memory + last order |
| **Recommendation** | Cohere embed → pgvector → dietary filter → Groq rank → top 3 |
| **Upsell** | Cart monitoring — missing drinks, combo threshold, evening specials |
| **Context Memory** | Redis preference store — honors allergies throughout session |
| **Group Coordinator** | Detects group → adjusts to shareable suggestions |
| **Sentiment** | Detects frustration → adds empathetic response prefix |
| **Order Validation** | Pre‑checkout stock + quantity validation |

---

## 🔍 Real RAG Pipeline

```
INDEXING (startup)
  Menu Items → Cohere embed-english-light-v3.0 → 384-dim vectors → pgvector

RETRIEVAL (per message)
  User Query → Cohere embed → pgvector cosine similarity (<=>)
             → top 10 semantically similar items
             → dietary profile filter applied

GENERATION
  Top items + preferences + cart + time + profile → Groq LLM
  LLM picks best 3 with personalized reasons → JSON response
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TailwindCSS, Zustand, Socket.io client |
| Backend | Node.js 20, Express, Socket.io server |
| Database | PostgreSQL + Prisma + pgvector (Supabase) |
| Cache | Redis (Upstash) — sessions, OTP, pub/sub |
| LLM | Groq `llama-3.1-8b-instant` (free) |
| Embeddings | Cohere `embed-english-light-v3.0` (free) |
| Vector Search | pgvector on Supabase |
| AI Framework | LangChain.js |
| Local LLM | Ollama `llama3.2` |
| Images | Cloudinary CDN |
| Payments | Razorpay (UPI, cards, wallets) |
| Notifications | WhatsApp Business Cloud API |
| PDF | jsPDF (client‑side) |
| Voice | Web Speech API (browser native) |
| PWA | manifest.json + service worker |
| Deployment | Vercel + Render + Supabase + Upstash |

---

## 🗄️ Database Schema (25+ Models)

```
Restaurant ──< MenuItem ──< CartItem >── Session ──< Order ──< OrderItem
                 │                           │            │
             Inventory                DietaryProfile    Delivery
             MenuTranslation          CustomerProfile    Coupon
                                       LoyaltyAccount     Reservation
                                       LoyaltyTransaction Staff
```

---

## 🔄 Complete User Flow

1. Scan QR → `/table/T1` (or `/r/[slug]/table/T1` for multi‑restaurant)
2. Session created in PostgreSQL, cached in Redis
3. Menu + images loaded, Cohere embeddings initialized in pgvector
4. Zara greets (personalized if returning customer)
5. TimePicks shows time‑appropriate items (breakfast/lunch/dinner)
6. SmartReorder shows last order + favorites for returning customers
7. User types/speaks/selects quick button
8. Multilingual NLU normalizes → Orchestrator routes
9. Recommendation: Cohere embed → pgvector → dietary filter → Groq → cards
10. Allergy check fires if profile has allergens — warning modal shown
11. User adds item → optimistic UI → PostgreSQL → Socket.io broadcast
12. Upsell fires → contextual suggestion
13. User opens Combo Builder → budget/preference → Zara builds full meal
14. Checkout → enter coupon → apply loyalty points → OTP (`123456` mock)
15. Payment modal → Razorpay online or cash option
16. Order placed → Kitchen Display notified → WhatsApp confirmation sent
17. Customer tracks order at `/track/[orderId]`
18. Admin assigns driver → `/delivery/[orderId]` shows GPS tracking
19. Admin: Pending → Confirmed → Preparing → Ready → Delivered
20. WhatsApp "order ready" notification sent
21. PDF bill downloaded → Loyalty points earned

---

## 🚀 Getting Started (Local)

### Prerequisites

- Node.js 20+
- Docker Desktop
- Python 3.11+
- Ollama

### 1. Clone

```bash
git clone https://github.com/ARTiwary/smart-dinning-assistent.git
cd smart-dinning-assistent
```

### 2. Infrastructure

```bash
docker compose up -d   # PostgreSQL + Redis (or point .env at Supabase/Upstash)
```

### 3. AI Models

```bash
ollama pull llama3.2
```

### 4. Backend

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 5. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 6. Run

```bash
# from the project root, with both servers configured
npm run dev
```

**Windows one‑click:**

```bash
start.bat
```

### 7. Open

| URL | Description |
|---|---|
| `http://localhost:3000/table/T1` | Customer app |
| `http://localhost:3000/admin` | Admin panel (password: `admin123`) |
| `http://localhost:3000/kitchen` | Kitchen display |
| `http://localhost:3000/reserve` | Table reservation |

---

## ⚙️ Environment Variables

**`backend/.env`**

```env
DATABASE_URL=postgresql://user:password@host:5432/spicegarden
REDIS_URL=rediss://default:password@host:6379
GROQ_API_KEY=your_groq_key
COHERE_API_KEY=your_cohere_key
CLOUDINARY_URL=cloudinary://key:secret@cloud_name
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
WHATSAPP_TOKEN=your_whatsapp_token
JWT_SECRET=your_jwt_secret
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id
```

---

## 📁 Project Structure

```
smart-dinning-assistent/
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── greeterAgent.js
│   │   │   ├── recommendationAgent.js
│   │   │   ├── upsellAgent.js
│   │   │   ├── contextMemoryAgent.js
│   │   │   ├── groupCoordinatorAgent.js
│   │   │   ├── sentimentAgent.js
│   │   │   ├── multilingualAgent.js
│   │   │   └── orderValidationAgent.js
│   │   ├── orchestrator/index.js
│   │   ├── routes/
│   │   │   ├── menu.js
│   │   │   ├── session.js
│   │   │   ├── cart.js
│   │   │   ├── order.js
│   │   │   ├── otp.js
│   │   │   ├── ai.js
│   │   │   └── admin.js
│   │   ├── services/
│   │   │   ├── menuService.js
│   │   │   ├── sessionService.js
│   │   │   ├── cartService.js
│   │   │   ├── otpService.js
│   │   │   ├── orderService.js
│   │   │   ├── customerService.js
│   │   │   ├── loyaltyService.js
│   │   │   ├── inventoryService.js
│   │   │   ├── restaurantService.js
│   │   │   ├── translationService.js
│   │   │   ├── dietaryService.js
│   │   │   └── staffService.js
│   │   ├── lib/
│   │   │   ├── ollama.js
│   │   │   ├── chroma.js
│   │   │   ├── redis.js
│   │   │   ├── socket.js
│   │   │   ├── cloudinary.js
│   │   │   ├── whatsapp.js
│   │   │   └── razorpay.js
│   │   ├── db/prisma.js
│   │   └── index.js
│   └── prisma/
│       ├── schema.prisma
│       ├── seed.js
│       └── seedTranslations.js
├── frontend/
│   ├── app/
│   │   ├── table/[tableId]/page.js
│   │   ├── r/[slug]/table/[tableId]/page.js
│   │   ├── admin/page.js
│   │   ├── kitchen/page.js
│   │   ├── track/[orderId]/page.js
│   │   ├── delivery/[orderId]/page.js
│   │   ├── reserve/page.js
│   │   ├── layout.js
│   │   └── globals.css
│   ├── components/
│   │   ├── MenuGrid.js
│   │   ├── CartDrawer.js
│   │   ├── AIChat.js
│   │   ├── GroupBanner.js
│   │   ├── ComboBuilder.js
│   │   ├── InstallPrompt.js
│   │   ├── LanguageSwitcher.js
│   │   ├── DietaryProfile.js
│   │   ├── SmartReorder.js
│   │   ├── TimePicks.js
│   │   ├── AllergyAlert.js
│   │   └── PaymentModal.js
│   ├── lib/store.js
│   └── public/
│       ├── manifest.json
│       ├── icon-192.png
│       └── icon-512.png
└── start.bat
```

---

## 🔌 API Reference

<details>
<summary><strong>Menu & Session</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/menu` | Full menu |
| GET | `/api/menu/translated?lang=hi` | Translated menu |
| GET | `/api/table/:tableId/session` | Get or create session |

</details>

<details>
<summary><strong>Cart & AI Chat</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/session/:id/cart` | Get cart |
| POST | `/api/session/:id/cart` | Add to cart |
| PATCH | `/api/session/:id/cart/:id` | Update quantity |
| DELETE | `/api/session/:id/cart/:id` | Remove item |
| POST | `/api/session/:id/ai/chat` | Chat with Zara |
| GET | `/api/session/:id/ai/time-picks` | Time‑based picks |
| POST | `/api/session/:id/ai/combo` | Build AI combo |

</details>

<details>
<summary><strong>OTP, Orders & Allergens</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/otp/send` | Send OTP |
| POST | `/api/otp/verify` | Verify OTP |
| POST | `/api/session/:id/order` | Place order |
| GET | `/api/order/:orderId` | Track order |
| PATCH | `/api/order/:id/cancel` | Cancel order |
| POST | `/api/allergen-check` | Check allergens |

</details>

<details>
<summary><strong>Coupons & Loyalty</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/coupon/verify` | Verify coupon |
| POST | `/api/coupon/apply` | Apply coupon |
| GET | `/api/loyalty/:phone` | Get loyalty account |
| POST | `/api/loyalty/redeem/verify` | Verify redemption |

</details>

<details>
<summary><strong>Reservations, Payments & Delivery</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reservations` | Create reservation |
| GET | `/api/reservations/slots` | Get available slots |
| POST | `/api/payment/create` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify and place order |
| GET | `/api/delivery/:orderId` | Get delivery status |
| PATCH | `/api/delivery/:orderId/location` | Update driver location |

</details>

<details>
<summary><strong>Dietary & Customer Profile</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dietary/:phone` | Get dietary profile |
| POST | `/api/dietary/:phone` | Save dietary profile |
| GET | `/api/customer/:phone/last-order` | Last order |
| GET | `/api/customer/:phone/favorites` | Favorite items |

</details>

<details>
<summary><strong>Admin</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/orders` | All orders |
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/forecast` | Revenue forecast |
| PATCH | `/api/admin/orders/:id/status` | Update status |
| GET | `/api/admin/menu` | All menu items |
| POST | `/api/admin/menu` | Add item |
| POST | `/api/admin/menu/upload-image` | Upload to Cloudinary |
| GET | `/api/admin/inventory` | Inventory status |
| POST | `/api/admin/inventory/:id/restock` | Restock item |
| GET | `/api/admin/coupons` | All coupons |
| POST | `/api/admin/coupons` | Create coupon |
| GET | `/api/admin/staff` | All staff |
| POST | `/api/admin/staff/login` | Staff login |
| GET | `/api/admin/restaurants` | All branches |
| POST | `/api/admin/restaurants` | Create branch |
| GET | `/api/admin/kitchen/orders` | Kitchen orders |
| PATCH | `/api/admin/kitchen/orders/:id/ready` | Mark ready |
| POST | `/api/admin/delivery/assign` | Assign driver |

</details>

---

## 👥 Staff Roles & Permissions

| Role | Access |
|---|---|
| 👑 Owner | Everything — all tabs, all actions |
| 🎯 Manager | All except staff management |
| 💳 Cashier | Dashboard, orders, tables, reservations |
| 🍳 Kitchen | Kitchen display + orders only |

**Default owner:** `owner@spicegarden.com` / `admin123`

---

## 🏪 Multi-Restaurant URLs

| Branch | Customer URL |
|---|---|
| Main Branch | `/table/T1` |
| Delhi Branch | `/r/spice-garden-delhi/table/T1` |
| Mumbai Branch | `/r/spice-garden-mumbai/table/T1` |

Each branch has its own menu, staff, sessions, and orders.

---

## 💡 Key Design Decisions

- **Real RAG with pgvector** — no separate vector DB. Embeddings stored alongside menu in Supabase. Cohere's free API works from Render, unlike HuggingFace which is blocked on the free tier.
- **Mock OTP (`123456`)** — real SMS OTP requires telecom DLT registration in India. MSG91 keys are configured and ready to activate. Mock mode works perfectly for demos.
- **Multi‑agent over monolithic prompt** — each agent has its own token budget. Adding a new capability = one new file, zero changes to existing agents.
- **Per‑device cart isolation** — two phones at the same table see their own cart via `deviceId` in `localStorage`. Group banner shows everyone present.
- **Optimistic UI** — cart updates instantly before API confirms, and reverts on failure.
- **Cross‑session memory** — phone number links `CustomerProfile` + `LoyaltyAccount` + `DietaryProfile`. Everything persists across visits and tables.
- **Keyword search fallback** — if Cohere is unavailable, falls back to keyword scoring. Zero downtime.

---

## ⚠️ Known Limitations

| Feature | Status | Reason |
|---|---|---|
| Real SMS OTP | Mock (`123456`) | Requires telecom DLT registration in India |
| WhatsApp notifications | Mock (logs to console) | Requires Meta Business verification |
| Kitchen sound alerts | Silent | Browser autoplay policy blocks audio |
| Render cold start | ~60s delay | Free tier sleeps after 15 min inactivity |

---

## 💰 Total Cost

| Service | Provider | Cost |
|---|---|---|
| Frontend | Vercel | Free |
| Backend | Render | Free |
| PostgreSQL + pgvector | Supabase | Free |
| Redis | Upstash | Free |
| LLM | Groq API | Free |
| Embeddings | Cohere API | Free |
| Images | Cloudinary | Free (25GB) |
| Payments | Razorpay | Free (2% per transaction) |
| WhatsApp | Meta Cloud API | Free (1000 conv/month) |
| **Total infrastructure** | | **$0/month** |

---

## 🎯 Example AI Interactions

**Hinglish with allergen**

```
User: kuch spicy chahiye, dairy se allergy hai
Zara: Bilkul! Yeh lo — spicy bhi, dairy-free bhi!
      → Chilli Chicken Bites  ₹220
      → Mushroom 65            ₹200
      → Prawn Pepper Fry       ₹280
```

**Date planning**

```
User: We're on a date, budget ₹700, girlfriend is veg, I eat chicken
Zara: Perfect romantic evening picks within ₹700!
      → Paneer Tikka        ₹220  (veg, instagram-worthy)
      → Chilli Chicken Bites ₹220  (non-veg, bold)
      → Fresh Lime Soda      ₹70 × 2
```

**Returning customer**

```
Zara: Welcome back Ayush! 🎉 Last time you had Butter Chicken
      and Garlic Naan — want the same again or try something new?
```

**Dietary detection**

```
User: I'm diabetic and vegan
Zara: Got it! I've saved your profile. I'll show you
      vegan options and avoid high-sugar items going forward.
```

**Allergy alert**

```
User adds Dal Makhani (contains dairy)
System: ⚠️ Allergen Warning! Contains dairy which you're allergic to.
        [ Go Back ]   [ I understand — Add Anyway ☑️ ]
```

---

## 📝 License

MIT — free to use, modify, and distribute.

---

## 🙏 Built With

Groq · Cohere · LangChain.js · Next.js · Prisma · Supabase · pgvector · Upstash · Cloudinary · Razorpay · Socket.io · Vercel · Render

<div align="center">

*Built for Ve‑Lyra Labs — Gen AI Intern Assignment · June 2026*

</div>