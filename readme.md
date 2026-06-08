# 🍛 Spice Garden — AI-Driven Smart Dining Assistant

> A production-grade, full-stack AI-first restaurant ordering system built with a multi-agent architecture, real-time group ordering, multilingual support, and a live admin dashboard.

![Node](https://img.shields.io/badge/Node.js-20+-green?style=flat-square&logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![LangChain](https://img.shields.io/badge/LangChain-JS-blue?style=flat-square)
![Groq](https://img.shields.io/badge/LLM-Groq%20llama3.1-orange?style=flat-square)
![Deploy](https://img.shields.io/badge/Deployed-Vercel%20%2B%20Render-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

---

## 🌐 Live Demo

| | URL |
|---|---|
| 🍽️ **Customer App** | https://smart-dinning-assistent.vercel.app/table/T1 |
| 🔐 **Admin Panel** | https://smart-dinning-assistent.vercel.app/admin |
| ⚙️ **Backend API** | https://smart-dinning-assistent.onrender.com |
| 💻 **GitHub** | https://github.com/ARTiwary/smart-dinning-assistent |

> Admin Password: `admin123` · Demo OTP: `123456`

---

## 🎯 What Makes This AI-First?

This is not a menu app with a chatbot widget bolted on. Every customer touchpoint is owned by a dedicated AI agent:

- **AI is the primary interaction layer** — natural language is the default input
- **8 specialized agents** coordinate through a central orchestrator
- **Agents share memory and context** — the system learns within a session
- **Multilingual by default** — English, Hinglish, Telugu-English all work natively
- **Upselling is contextual and intelligent** — not hardcoded banners

---

## ✨ Features

### 👤 Customer Side
- 📱 QR code scan → instant anonymous table session
- 🤖 **Zara** — AI dining assistant (Groq llama3.1-8b-instant)
- 🧠 8-agent orchestrator with LangChain routing
- 🌶️ Smart recommendations via semantic keyword search
- 🗣️ Multilingual NLU — Hinglish, Telugu-English, typos handled
- 👥 Real-time group ordering via Socket.io + Redis pub/sub
- 🛒 Per-device cart with optimistic UI updates
- 📲 OTP verification at checkout (Redis TTL, 3-attempt lockout)
- 🧾 Full bill with GST breakdown
- 📱 Fully mobile responsive — works on all screen sizes

### 🔐 Admin Panel
- 📊 Live dashboard — orders, revenue, active tables
- 🧾 Order management: Pending → Confirmed → Preparing → Ready → Delivered
- ✕ Cancel orders (admin and customer both can cancel)
- 🪑 Dynamic table management — add/remove tables
- 📱 QR code generation per table with download
- 🔒 Close/reset table sessions
- 🔄 Auto-refresh every 10 seconds

---

## 🏗️ System Architecture

```
User Phone (Browser)
        │ HTTPS / WebSocket
        ▼
┌─────────────────────────────────┐
│   Next.js 16 Frontend           │
│   Vercel · TailwindCSS · Zustand│
└──────────────┬──────────────────┘
               │ REST API + Socket.io
               ▼
┌─────────────────────────────────┐
│   Express Backend               │
│   Render · Node.js 20           │
│                                 │
│  ┌─────────────────────────┐    │
│  │  AI Orchestrator        │    │
│  │  LangChain + Groq       │    │
│  │  8 Specialized Agents   │    │
│  └─────────────────────────┘    │
└──────┬───────────┬──────────────┘
       │           │
       ▼           ▼
┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Redis   │
│ Supabase │  │ Upstash  │
│ Prisma   │  │ Sessions │
│ Orders   │  │ OTP      │
│ Menu     │  │ Pub/Sub  │
└──────────┘  └──────────┘
```

---

## 🤖 Multi-Agent Architecture

```
User Input
    │
    ▼
Multilingual NLU Agent ──► normalize & detect language + intent
    │
    ▼
Orchestrator (intent router)
    ├── GREET      ──► Greeter Agent
    ├── RECOMMEND  ──► Recommendation Agent + Context Memory
    ├── ADD_ITEM   ──► add_to_cart() tool
    ├── UPSELL     ──► Upsell Agent (async, non-blocking)
    ├── GROUP      ──► Group Coordinator Agent
    ├── CHECKOUT   ──► Order Validation Agent
    └── FALLBACK   ──► General LLM with menu context
    │
    ▼
JSON Response → Frontend renders suggestion cards
```

### Agent Responsibilities

| Agent | Responsibility |
|---|---|
| **Multilingual NLU** | Normalizes Hinglish/Telugu-English → structured `{intent, preferences, language}` JSON |
| **Greeter** | First message welcome, mood detection, session context setup |
| **Recommendation** | Keyword search + LLM ranking → top 3 menu suggestions with reasons |
| **Upsell** | Monitors cart — triggers "missing drinks?", combo threshold, evening specials |
| **Context Memory** | Redis-backed preference store — "no dairy" honored throughout session |
| **Group Coordinator** | Detects "we/our/4 people" → adjusts to shareable item suggestions |
| **Sentiment** | Detects frustration → adds empathetic prefix to response |
| **Order Validation** | Pre-checkout stock check and quantity validation |

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 16, TailwindCSS, Zustand | SSR, file-based routing, lightweight state |
| **Backend** | Node.js, Express | Fast, large ecosystem |
| **Real-time** | Socket.io + Redis pub/sub | Push updates, no polling |
| **Database** | PostgreSQL + Prisma | Relational data, type-safe queries |
| **Cache** | Redis (Upstash) | 0.1ms session reads, OTP TTL |
| **LLM (prod)** | Groq llama-3.1-8b-instant | Free, sub-second inference |
| **LLM (local)** | Ollama llama3.2 | Free, offline, same LangChain interface |
| **AI Framework** | LangChain.js | LLM abstraction, swap providers in 1 line |
| **Vector Search** | Keyword scoring (prod), ChromaDB (local) | No external API dependency on free tier |
| **Deployment** | Vercel + Render + Supabase + Upstash | $0 total cost |

---

## 🗄️ Database Schema

```
MenuItem ──< CartItem >── Session ──< Order ──< OrderItem >── MenuItem
                              │
                         preferences (JSONB)
                         conversationSummary
```

- **Session** — one table visit, 4hr TTL, stores user preferences
- **CartItem** — per device, links session + menu item + addedBy
- **Order** — placed order with customer details and total
- **OrderItem** — snapshot of items at order time with locked prices

---

## 🔄 Complete User Flow

```
1. Scan QR → /table/T1
2. Session created in PostgreSQL, cached in Redis
3. Menu loaded (35 items across 9 categories)
4. Zara greets user (Greeter Agent)
5. User chats → Multilingual NLU normalizes → Orchestrator routes
6. Recommendation Agent: keyword search → LLM ranking → suggestion cards
7. User adds item → optimistic UI update → PostgreSQL → Socket.io broadcast
8. Upsell Agent fires → "Missing drinks?" suggestion
9. Checkout → OTP sent → Redis TTL → verified → Order Validation Agent
10. Order saved → Socket.io notifies admin dashboard
11. Admin marks status: Pending → Confirmed → Preparing → Ready → Delivered
```

---

## 🚀 Getting Started (Local)

### Prerequisites
- Node.js 20+
- Docker Desktop
- Python 3.11+ (ChromaDB)
- [Ollama](https://ollama.ai)

### 1. Clone

```bash
git clone https://github.com/ARTiwary/smart-dinning-assistent
cd smart-dinning-assistent
```

### 2. Infrastructure

```bash
# PostgreSQL + Redis
docker run --name smart-dining-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=smart_dining \
  -p 5432:5432 -d postgres

docker run --name smart-dining-redis -p 6379:6379 -d redis

# Auto restart on reboot
docker update --restart always smart-dining-postgres
docker update --restart always smart-dining-redis
```

### 3. AI Models

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
pip install chromadb
```

### 4. Backend

```bash
cd backend
cp .env.example .env   # fill in values
npm install
npm run db:migrate
npm run db:seed
```

### 5. Frontend

```bash
cd frontend
npm install
```

### 6. Run

```bash
# Terminal 1
chroma run --host localhost --port 8000

# Terminal 2
ollama serve

# Terminal 3
cd backend && npm run dev

# Terminal 4
cd frontend && npm run dev
```

Or use one-click startup (Windows):
```bash
.\start.bat
```

### 7. Open

| URL | Description |
|---|---|
| http://localhost:3000/table/T1 | Customer app |
| http://localhost:3000/admin | Admin panel (password: admin123) |

---

## ⚙️ Environment Variables

### `backend/.env`

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/smart_dining
REDIS_URL=redis://localhost:6379
PORT=4000
GROQ_API_KEY=your_groq_key
HF_API_KEY=your_huggingface_key
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text
CHROMA_URL=http://localhost:8000
OTP_MODE=mock
FRONTEND_URL=http://localhost:3000
ADMIN_KEY=admin123
NODE_ENV=development
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
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
│   │   ├── orchestrator/
│   │   │   └── index.js          ← intent router
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
│   │   │   └── orderService.js
│   │   ├── lib/
│   │   │   ├── ollama.js          ← Groq + embeddings
│   │   │   ├── chroma.js          ← keyword/vector search
│   │   │   ├── redis.js
│   │   │   └── socket.js
│   │   ├── db/prisma.js
│   │   └── index.js
│   └── prisma/
│       ├── schema.prisma
│       └── seed.js               ← 35 menu items + images
├── frontend/
│   ├── app/
│   │   ├── table/[tableId]/page.js
│   │   ├── admin/page.js
│   │   ├── layout.js
│   │   └── globals.css            ← full responsive system
│   ├── components/
│   │   ├── MenuGrid.js
│   │   ├── CartDrawer.js
│   │   ├── AIChat.js
│   │   └── GroupBanner.js
│   └── lib/store.js               ← Zustand global state
└── start.bat                      ← one-click Windows startup
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/menu` | Full menu |
| GET | `/api/menu/search?q=` | Search menu |
| GET | `/api/table/:tableId/session` | Get or create session |
| GET | `/api/session/:id/cart` | Get cart |
| POST | `/api/session/:id/cart` | Add to cart |
| PATCH | `/api/session/:id/cart/:itemId` | Update quantity |
| DELETE | `/api/session/:id/cart/:itemId` | Remove item |
| POST | `/api/session/:id/ai/chat` | Chat with Zara |
| POST | `/api/otp/send` | Send OTP |
| POST | `/api/otp/verify` | Verify OTP |
| POST | `/api/session/:id/order` | Place order |
| PATCH | `/api/order/:id/cancel` | Cancel order (user) |
| GET | `/api/admin/orders` | All orders |
| GET | `/api/admin/stats` | Dashboard stats |
| PATCH | `/api/admin/orders/:id/status` | Update status |
| PATCH | `/api/admin/orders/:id/cancel` | Cancel order (admin) |
| PATCH | `/api/admin/sessions/:id/close` | Close table |

---

## 💡 Key Design Decisions

**Ollama locally → Groq in production**
Both use identical LangChain interface. Swapping is one env variable change. Groq gives free sub-second inference without GPU.

**Keyword search instead of vector embeddings in production**
Render free tier blocks outbound HTTP to HuggingFace/OpenAI embedding APIs. Keyword scoring with popularity weighting achieves accurate results with zero external dependencies. Swaps back to ChromaDB with one file change.

**Multi-agent over single monolithic prompt**
Each agent has its own token budget and responsibility. Cheaper, faster, easier to debug. Adding a new capability means adding one agent file, not modifying a giant prompt.

**Redis for sessions over PostgreSQL**
PostgreSQL reads take 5-50ms. Redis reads take 0.1ms. Cart updates must feel instant. Redis pub/sub also enables WebSocket broadcasting without a dedicated message broker.

**Per-device cart isolation**
Each phone at a table gets its own deviceId stored in localStorage. Cart items filtered by deviceId so two people at same table see only their own items while group banner shows everyone present.

---

## ⚠️ Trade-offs & Future Work

### Cut for time
- Real SMS OTP (using mock 123456 for demo)
- Kitchen display WebSocket screen
- PDF bill/receipt generation
- Cross-session memory via phone number

### Would add next
- [ ] Twilio SMS OTP
- [ ] pgvector embeddings on Supabase
- [ ] Kitchen display real-time screen
- [ ] PDF receipt generation
- [ ] Analytics — revenue charts, peak hours, popular items
- [ ] Multi-restaurant support
- [ ] React Native mobile app

---

## 💰 Total Deployment Cost

| Service | Provider | Cost |
|---|---|---|
| Frontend | Vercel | Free |
| Backend | Render | Free |
| PostgreSQL | Supabase | Free |
| Redis | Upstash | Free |
| LLM | Groq API | Free |
| **Total** | | **$0/month** |

---

## 🎯 Example AI Interactions

**Hinglish input:**
```
User: kuch spicy chahiye, dairy se allergy hai
Zara: Bilkul! Yeh lo — spicy bhi, dairy-free bhi!
→ Chilli Chicken Bites ₹220
→ Mushroom 65 ₹200
→ Prawn Pepper Fry ₹280
```

**Group ordering:**
```
User: we are 4 people, mix veg and non-veg
Zara: Perfect for a group! Here's a crowd-pleasing mix —
→ Paneer Tikka ₹220 (veg)
→ Starter Platter Non-Veg ₹560
→ Veg Thali ₹350
```

**Upsell trigger:**
```
User adds Butter Chicken to cart
Zara: Great choice! Looks like you're missing drinks —
      Mango Lassi pairs perfectly. Want to add it?
```

---

## 📝 License

MIT — free to use, modify, and distribute.

---

## 🙏 Built With

[Groq](https://groq.com) · [LangChain.js](https://js.langchain.com) · [Next.js](https://nextjs.org) · [Prisma](https://prisma.io) · [Supabase](https://supabase.com) · [Upstash](https://upstash.com) · [Socket.io](https://socket.io) · [Vercel](https://vercel.com) · [Render](https://render.com)

---

*Built for the AI-Driven Smart Dining Assistant Assignment — Ve-Lyra Labs Gen AI Intern · June 2026*
