# 🍛 Spice Garden — AI-Driven Smart Dining Assistant

> A production-grade, full-stack AI-first restaurant ordering system with a multi-agent architecture, real RAG using pgvector + Cohere embeddings, real-time group ordering, multilingual support, and a live admin dashboard.

![Node](https://img.shields.io/badge/Node.js-20+-green?style=flat-square&logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![LangChain](https://img.shields.io/badge/LangChain-JS-blue?style=flat-square)
![Groq](https://img.shields.io/badge/LLM-Groq%20llama3.1-orange?style=flat-square)
![RAG](https://img.shields.io/badge/RAG-pgvector%20%2B%20Cohere-purple?style=flat-square)
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

This is not a menu app with a chatbot bolted on. AI agents are first-class citizens that own every customer touchpoint:

- **Natural language is the default input** — menus are the fallback
- **8 specialized agents** coordinate through a central orchestrator
- **Real RAG** — Cohere embeddings + pgvector cosine similarity search
- **Agents share memory** — preferences persist throughout the session
- **Multilingual by default** — English, Hinglish, Telugu-English natively
- **Contextual upselling** — not hardcoded banners, triggered by cart state

---

## ✨ Features

### 👤 Customer Side
- 📱 QR code scan → instant anonymous table session (no login)
- 🤖 **Zara** — AI dining assistant powered by Groq llama-3.1-8b-instant
- 🧠 8-agent multi-agent orchestrator with LangChain routing
- 🔍 Real RAG — Cohere embeddings + pgvector semantic search
- 🌶️ Smart recommendations grounded in actual menu data
- 🗣️ Multilingual NLU — Hinglish, Telugu-English, typos all handled
- 👥 Real-time group ordering via Socket.io + Redis pub/sub
- 🛒 Per-device cart with optimistic UI — instant feel
- 📲 OTP verification (Redis TTL, 3-attempt lockout)
- 🧾 Full bill breakdown with GST (5%)
- ✕ Cancel order option for customer
- 📱 Fully responsive — all screen sizes from 320px to 1440px+

### 🔐 Admin Panel
- 📊 Live dashboard — today's orders, revenue, active orders
- 🧾 Order management with full status flow
  - Pending → Confirmed → Preparing → Ready → Delivered
- ✕ Cancel orders (admin + customer both)
- 🪑 Dynamic table management — add/remove tables
- 📱 QR code generation per table with download
- 🔒 Close/reset table sessions
- 🔄 Auto-refresh every 10 seconds
- 🔐 Password protected login

---

## 🏗️ System Architecture

```
User Phone (Browser)
        │ HTTPS / WebSocket
        ▼
┌─────────────────────────────────────┐
│   Next.js 16 Frontend (Vercel)      │
│   TailwindCSS · Zustand · Axios     │
│   Socket.io Client                  │
└──────────────┬──────────────────────┘
               │ REST API + WebSocket
               ▼
┌─────────────────────────────────────┐
│   Express Backend (Render)          │
│   Node.js 20 · Socket.io Server     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │    AI Orchestrator            │  │
│  │    LangChain.js + Groq        │  │
│  │    8 Specialized Agents       │  │
│  │    Real RAG Pipeline          │  │
│  └───────────────────────────────┘  │
└────────┬──────────────┬─────────────┘
         │              │
         ▼              ▼
┌──────────────┐  ┌───────────────┐
│  PostgreSQL  │  │    Redis      │
│  Supabase    │  │    Upstash    │
│  + pgvector  │  │  Sessions    │
│  Prisma ORM  │  │  OTP + TTL   │
│  Menu, Orders│  │  Pub/Sub     │
└──────────────┘  └───────────────┘
         │
         ▼
┌──────────────┐
│   Cohere API │
│  Embeddings  │
│  384-dim     │
│  vectors     │
└──────────────┘
```

---

## 🤖 Multi-Agent Architecture

```
User Input
    │
    ▼
Multilingual NLU Agent
    │ {intent, preferences, language, groupSize}
    ▼
Orchestrator (intent router)
    ├── GREET      ──► Greeter Agent
    ├── RECOMMEND  ──► Recommendation Agent
    │                  └── Cohere embed query
    │                  └── pgvector cosine search
    │                  └── Groq LLM ranking
    ├── UPSELL     ──► Upsell Agent (async)
    ├── MEMORY     ──► Context Memory Agent (Redis)
    ├── GROUP      ──► Group Coordinator Agent
    ├── SENTIMENT  ──► Sentiment Agent (background)
    └── CHECKOUT   ──► Order Validation Agent
    │
    ▼
JSON Response → Frontend renders suggestion cards
```

### Agent Responsibilities

| Agent | Responsibility | Tools |
|---|---|---|
| **Multilingual NLU** | Normalizes Hinglish/Telugu → structured JSON intent | Groq |
| **Greeter** | First message welcome, mood detection | Groq |
| **Recommendation** | Cohere embed → pgvector search → LLM rank → top 3 | Cohere + pgvector + Groq |
| **Upsell** | Cart monitoring — missing drinks, combo threshold, evening specials | Prisma + Groq |
| **Context Memory** | Redis preference store — honors "no dairy" throughout session | Redis |
| **Group Coordinator** | Detects group size → adjusts to shareable suggestions | Groq |
| **Sentiment** | Detects frustration → adds empathetic prefix | Groq |
| **Order Validation** | Pre-checkout stock + quantity validation | Prisma |

---

## 🔍 Real RAG Pipeline

```
INDEXING (run once at startup):
Menu Items → Cohere embed-english-light-v3.0 → 384-dim vectors → pgvector

RETRIEVAL (every user message):
User Query → Cohere embed → 384-dim vector
           → pgvector cosine similarity (<=> operator)
           → top 10 most semantically similar items

GENERATION:
Top 10 items + user preferences + cart state → Groq LLM prompt
LLM selects best 3 with personalized reasons → JSON response
```

**Why this beats keyword search:**
- "Something tangy and bold" → finds **Prawn Pepper Fry** even though those words don't appear in the description
- "Meetha chahiye" → finds **Gulab Jamun** via semantic meaning, not word match
- Allergen filters applied after retrieval — safe items only

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 16, TailwindCSS, Zustand | SSR, file routing, lightweight state |
| **Backend** | Node.js 20, Express | Fast, large ecosystem |
| **Real-time** | Socket.io + Redis pub/sub | Push updates, no polling |
| **Database** | PostgreSQL + Prisma + pgvector | Relational data + vector search in one DB |
| **Cache** | Redis (Upstash) | 0.1ms sessions, OTP TTL, pub/sub |
| **LLM** | Groq llama-3.1-8b-instant | Free, sub-second inference |
| **Embeddings** | Cohere embed-english-light-v3.0 | Free tier, 384-dim, accurate |
| **Vector Search** | pgvector (Supabase extension) | No separate vector DB needed |
| **AI Framework** | LangChain.js | LLM abstraction, swap providers easily |
| **Local Dev LLM** | Ollama llama3.2 | Free, offline |
| **Deployment** | Vercel + Render + Supabase + Upstash | $0/month total |

---

## 🗄️ Database Schema

```
MenuItem ──< CartItem >── Session ──< Order ──< OrderItem >── MenuItem
              (deviceId)      │
                         preferences
                         (JSONB)
```

**MenuItem** — 35 items, 9 categories, tags, allergens, popularScore, **384-dim embedding vector**

**Session** — one table visit, 4hr TTL, JSONB preferences, per-tableId

**CartItem** — per device (deviceId), links session + menuItem, quantity, specialInstructions

**Order** — placed order, customer name + phone, totalAmount, taxAmount, status

**OrderItem** — snapshot of items at order time with locked prices

---

## 🔄 Complete User Flow

```
1.  Scan QR → /table/T1
2.  Session created in PostgreSQL, cached in Redis (4hr TTL)
3.  Menu loaded with images (Unsplash URLs)
4.  Cohere embeddings initialized for menu items in pgvector
5.  Zara greets user (Greeter Agent)
6.  User types/selects quick button
7.  Multilingual NLU normalizes → Orchestrator routes
8.  Recommendation Agent:
    → Cohere embeds user query
    → pgvector cosine similarity search
    → Top 10 semantically similar items
    → Groq LLM picks best 3 with reasons
    → Suggestion cards rendered with images + Add buttons
9.  User adds item → optimistic UI → PostgreSQL → Socket.io broadcast
10. Upsell Agent fires → contextual suggestion
11. Context Memory saves preferences to Redis
12. Checkout → OTP sent → Redis TTL 5min → verified
13. Order Validation Agent checks stock
14. Order saved → Socket.io notifies admin dashboard
15. Admin: Pending → Confirmed → Preparing → Ready → Delivered
```

---

## 🚀 Getting Started (Local)

### Prerequisites
- Node.js 20+
- Docker Desktop
- Python 3.11+ (ChromaDB for local dev)
- [Ollama](https://ollama.ai)

### 1. Clone

```bash
git clone https://github.com/ARTiwary/smart-dinning-assistent
cd smart-dinning-assistent
```

### 2. Infrastructure

```bash
docker run --name smart-dining-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=smart_dining \
  -p 5432:5432 -d postgres

docker run --name smart-dining-redis -p 6379:6379 -d redis

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
cp .env.example .env
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
# Terminal 1 — ChromaDB (local dev)
chroma run --host localhost --port 8000

# Terminal 2 — Ollama
ollama serve

# Terminal 3 — Backend
cd backend && npm run dev

# Terminal 4 — Frontend
cd frontend && npm run dev
```

**Windows one-click:**
```bash
.\start.bat
```

### 7. Open

| URL | |
|---|---|
| http://localhost:3000/table/T1 | Customer app |
| http://localhost:3000/admin | Admin (password: admin123) |

---

## ⚙️ Environment Variables

### `backend/.env`

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/smart_dining
DIRECT_URL=postgresql://postgres:password@localhost:5432/smart_dining

# Cache
REDIS_URL=redis://localhost:6379

# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ADMIN_KEY=admin123

# AI — Local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text
CHROMA_URL=http://localhost:8000

# AI — Production
GROQ_API_KEY=your_groq_key
COHERE_API_KEY=your_cohere_key

# OTP
OTP_MODE=mock
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
│   │   │   ├── recommendationAgent.js   ← RAG pipeline
│   │   │   ├── upsellAgent.js
│   │   │   ├── contextMemoryAgent.js
│   │   │   ├── groupCoordinatorAgent.js
│   │   │   ├── sentimentAgent.js
│   │   │   ├── multilingualAgent.js
│   │   │   └── orderValidationAgent.js
│   │   ├── orchestrator/
│   │   │   └── index.js                 ← intent router
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
│   │   │   ├── ollama.js                ← Groq + Cohere
│   │   │   ├── chroma.js                ← pgvector RAG
│   │   │   ├── redis.js
│   │   │   └── socket.js
│   │   ├── db/prisma.js
│   │   └── index.js
│   └── prisma/
│       ├── schema.prisma                ← pgvector extension
│       └── seed.js                      ← 35 items + images
├── frontend/
│   ├── app/
│   │   ├── table/[tableId]/page.js      ← customer page
│   │   ├── admin/page.js                ← admin dashboard
│   │   ├── layout.js
│   │   └── globals.css                  ← full responsive CSS
│   ├── components/
│   │   ├── MenuGrid.js                  ← categories + filters
│   │   ├── CartDrawer.js                ← cart + OTP + bill
│   │   ├── AIChat.js                    ← Zara interface
│   │   └── GroupBanner.js               ← group ordering
│   └── lib/store.js                     ← Zustand state
└── start.bat                            ← Windows one-click
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/menu` | Full menu with images |
| GET | `/api/menu/search?q=` | Text search |
| GET | `/api/table/:tableId/session` | Get or create session |
| GET | `/api/session/:id/cart` | Get cart items |
| POST | `/api/session/:id/cart` | Add item |
| PATCH | `/api/session/:id/cart/:itemId` | Update quantity |
| DELETE | `/api/session/:id/cart/:itemId` | Remove item |
| POST | `/api/session/:id/ai/chat` | Chat with Zara |
| POST | `/api/otp/send` | Send OTP |
| POST | `/api/otp/verify` | Verify OTP |
| POST | `/api/session/:id/order` | Place order |
| PATCH | `/api/order/:id/cancel` | Cancel order (user) |
| GET | `/api/admin/orders` | All orders |
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/tables` | Active sessions |
| PATCH | `/api/admin/orders/:id/status` | Update status |
| PATCH | `/api/admin/orders/:id/cancel` | Cancel (admin) |
| PATCH | `/api/admin/sessions/:id/close` | Close table |

---

## 💡 Key Design Decisions

**Real RAG with pgvector instead of ChromaDB**
pgvector is a PostgreSQL extension — no separate vector database server needed. Embeddings stored alongside menu data in the same Supabase instance. Cohere's free embedding API works from Render (unlike HuggingFace which is blocked on free tier).

**Groq instead of OpenAI**
Same LangChain interface — one env variable change to swap. Free tier gives sub-second llama3.1-8b-instant responses. No billing setup required for demo/internship purposes.

**Multi-agent over single monolithic prompt**
Each agent has its own token budget and responsibility. Cheaper, faster, easier to debug. Adding a new capability = adding one agent file without touching existing agents.

**Redis for sessions over PostgreSQL**
PostgreSQL reads take 5-50ms. Redis reads take 0.1ms. Cart updates must feel instant. Redis pub/sub also handles WebSocket broadcasting without a dedicated message broker.

**Per-device cart isolation**
Each phone gets a unique deviceId in localStorage. Cart items filtered by deviceId so two people at the same table see only their own items. Group banner still shows everyone present via Socket.io join events.

**Optimistic UI for cart**
Cart updates instantly on screen before API confirms. If API fails, cart reverts to server state via fetchCart. Makes the app feel snappy on slow connections.

---

## ⚠️ Trade-offs & Future Work

### Cut for time
- Real Twilio SMS OTP (using mock 123456)
- Kitchen display WebSocket screen
- PDF bill generation
- Cross-session memory via phone number
- Voice input for Zara

### Would add next
- [ ] Kitchen display real-time screen
- [ ] Order tracking live status for customer
- [ ] Twilio SMS OTP
- [ ] PDF receipt download
- [ ] Analytics dashboard (revenue, peak hours, popular items)
- [ ] Menu management in admin (add/edit/delete items)
- [ ] Voice input via Web Speech API
- [ ] Smart combo builder AI feature
- [ ] Loyalty points system
- [ ] Multi-restaurant support

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
| **Total** | | **$0/month** |

---

## 🎯 Example AI Interactions

**Hinglish with allergen:**
```
User:  kuch spicy chahiye, dairy se allergy hai
Zara:  Bilkul! Yeh lo — spicy bhi, dairy-free bhi!
       → Chilli Chicken Bites ₹220
       → Mushroom 65 ₹200
       → Prawn Pepper Fry ₹280
```

**Semantic RAG in action:**
```
User:  something tangy and bold
Zara:  For bold flavours, try these —
       → Prawn Pepper Fry ₹280 (bold black pepper)
       → Veg Kolhapuri ₹240 (fiery and tangy)
       → Mutton Rogan Josh ₹380 (bold Kashmiri spices)

Why: "tangy bold" semantically similar to item
descriptions even with no word overlap
```

**Group ordering:**
```
User:  we are 4 people, mix veg and non-veg
Zara:  Perfect for a group! Here's a crowd-pleasing mix —
       → Starter Platter Veg ₹480 (shareable)
       → Starter Platter Non-Veg ₹560 (shareable)
       → Veg Thali ₹350
```

**Upsell trigger:**
```
User adds Butter Chicken (mains, no beverage in cart)
Zara:  Looks like you're missing drinks!
       Mango Lassi pairs perfectly — want to add it?
```

---

## 📝 License

MIT — free to use, modify, and distribute.

---

## 🙏 Built With

[Groq](https://groq.com) · [Cohere](https://cohere.com) · [LangChain.js](https://js.langchain.com) · [Next.js](https://nextjs.org) · [Prisma](https://prisma.io) · [Supabase](https://supabase.com) · [pgvector](https://github.com/pgvector/pgvector) · [Upstash](https://upstash.com) · [Socket.io](https://socket.io) · [Vercel](https://vercel.com) · [Render](https://render.com)

---

*Built for Ve-Lyra Labs — Gen AI Intern Assignment · June 2026*
