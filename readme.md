# 🍛 Spice Garden — AI-Driven Smart Dining Assistant

> A full-stack, production-grade AI-powered restaurant ordering system with a multi-agent AI layer, real-time group ordering, and a live admin dashboard.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20+-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)
![AI](https://img.shields.io/badge/AI-Groq%20%2B%20LangChain-orange.svg)
![Deploy](https://img.shields.io/badge/deployed-Vercel%20%2B%20Render-brightgreen.svg)

---

## 🌐 Live Demo

| | URL |
|---|---|
| 🍽️ **Customer App** | https://smart-dinning-assistent.vercel.app | | > T1 is a demo table. Each restaurant table has its own QR code and unique `/table/{TABLE_ID}` session.
| 🔐 **Admin Panel** | https://smart-dinning-assistent.vercel.app/admin |
| ⚙️ **Backend API** | https://smart-dinning-assistent.onrender.com |
| 💻 **GitHub** | https://github.com/ARTiwary/smart-dinning-assistent |

> Admin Password: `admin123`

---

## 🎯 What is this?

Spice Garden is not just a menu app. It is an **AI-first dining experience** where every customer touchpoint is powered by intelligent agents. Customers scan a QR code, chat with **Zara** (the AI assistant), and place orders — all without staff involvement.

The system is built around a **multi-agent orchestrator** where each agent has a single responsibility — greeting, recommending, upselling, handling multilingual input, managing group orders, and validating orders before checkout.

---

## ✨ Features

### 🧑‍💻 Customer Side
- 📱 QR code scan → instant table session (no login required)
- 🤖 **Zara** — AI dining assistant powered by Groq (llama-3.1-8b-instant)
- 🧠 Multi-agent architecture: 8 specialized AI agents
- 🌶️ Smart recommendations with keyword semantic search
- 🗣️ Multilingual support — English, Hinglish, Telugu-English
- 👥 Real-time group ordering via WebSocket (Socket.io)
- 🛒 Cart with add / remove / quantity controls (optimistic UI)
- 📲 OTP verification at checkout (demo OTP: 123456)
- 🧾 Full bill breakdown with GST (5%)
- 📱 Mobile-first responsive design for all screen sizes

### 🔐 Admin Panel
- 📊 Live dashboard — today's orders, revenue, active orders
- 🧾 Order management with full status flow
  - Pending → Confirmed → Preparing → Ready → Delivered
- 🪑 Table management — add/remove tables dynamically
- 📱 QR code generation per table with download option
- 🔒 Close/reset table sessions
- 🔄 Auto-refresh every 10 seconds
- 🔐 Password protected admin login

---

## 🏗️ Architecture

```
Customer (Mobile Browser)
        │
        ▼
Vercel (Next.js 16 Frontend)
        │ HTTPS / WebSocket
        ▼
Render (Express Backend — Node.js)
        ├── REST API
        │     ├── Menu API
        │     ├── Cart API (optimistic)
        │     ├── Session API
        │     ├── Order API
        │     ├── OTP API
        │     └── Admin API
        │
        ├── Socket.io (real-time group cart sync)
        │
        └── AI Agent Orchestrator
                ├── Multilingual NLU Agent
                ├── Greeter Agent
                ├── Recommendation Agent
                ├── Upsell Agent
                ├── Context Memory Agent
                ├── Group Coordinator Agent
                ├── Sentiment Agent
                └── Order Validation Agent
        │
        ▼
Data Layer
        ├── Supabase PostgreSQL (orders, menu, sessions)
        ├── Upstash Redis (sessions, cart cache, pub/sub)
        └── In-Memory Vector Store (keyword semantic search)
```

---

## 🤖 AI Stack

| Component | Local Dev | Production |
|---|---|---|
| LLM | Ollama `llama3.2` | Groq `llama-3.1-8b-instant` |
| Embeddings | Ollama `nomic-embed-text` | Keyword search (no external API) |
| Vector Store | ChromaDB | In-memory store |
| Orchestration | LangChain.js + custom router | Same |

**Why Ollama locally + Groq in production?**
Both use the same LangChain interface — swapping is one environment variable change. Groq gives free, fast (sub-second) inference in production without GPU requirements.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TailwindCSS, Zustand |
| Backend | Node.js, Express, Socket.io |
| Database | PostgreSQL (Supabase), Prisma ORM |
| Cache | Redis (Upstash / ioredis) |
| AI LLM | Groq API (llama-3.1-8b-instant) |
| AI Local | Ollama (llama3.2) |
| Orchestration | LangChain.js |
| Deployment | Vercel (frontend), Render (backend) |

---

## 🧠 Agent Design

| Agent | Responsibility | Tools |
|---|---|---|
| **Multilingual NLU** | Normalise Hinglish/Telugu-English → structured intent | Groq LLM |
| **Greeter** | Welcome user, detect mood, set session context | Groq LLM |
| **Recommendation** | Keyword search + LLM ranking of menu items | In-memory search, Groq LLM |
| **Upsell** | Trigger contextual add-on suggestions post cart action | Prisma, Groq LLM |
| **Context Memory** | Maintain preferences + conversation history per session | Redis |
| **Group Coordinator** | Merge multi-user intents, detect conflicts | Socket.io |
| **Sentiment** | Detect frustration, adjust response tone | Groq LLM |
| **Order Validation** | Final stock + quantity check before order submission | Prisma |

### Agent Interaction Flow

```
User Input
    │
    ▼
Multilingual NLU Agent ← normalise & detect language/intent
    │
    ▼
Orchestrator (custom router)
    ├── Greeter Agent (first message only)
    ├── Context Memory Agent (always — read/write session state)
    ├── Recommendation Agent (intent = browse/ask)
    ├── Upsell Agent (post add-to-cart trigger)
    ├── Group Coordinator Agent (multi-user events)
    ├── Sentiment Agent (background monitor)
    └── Order Validation Agent (pre-checkout)
    │
    ▼
Formatted Response → Frontend
```

---

## 🚀 Getting Started (Local)

### Prerequisites
- Node.js 20+
- Python 3.11+ (for ChromaDB)
- Docker Desktop
- Ollama (https://ollama.ai)

### 1. Clone the repo

```bash
git clone https://github.com/ARTiwary/smart-dinning-assistent
cd smart-dinning-assistent
```

### 2. Start infrastructure

```bash
# PostgreSQL + Redis via Docker
docker run --name smart-dining-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=smart_dining \
  -p 5432:5432 -d postgres

docker run --name smart-dining-redis -p 6379:6379 -d redis

# Auto-restart on PC reboot
docker update --restart always smart-dining-postgres
docker update --restart always smart-dining-redis
```

### 3. Pull Ollama models

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

### 4. Install ChromaDB

```bash
pip install chromadb
```

### 5. Setup backend

```bash
cd backend
cp .env.example .env
# Fill in your values
npm install
npm run db:migrate
npm run db:seed
```

### 6. Setup frontend

```bash
cd frontend
npm install
```

### 7. Run everything

Open 4 terminals:

```bash
# Terminal 1 — ChromaDB
chroma run --host localhost --port 8000

# Terminal 2 — Ollama
ollama serve

# Terminal 3 — Backend
cd backend && npm run dev

# Terminal 4 — Frontend
cd frontend && npm run dev
```

Or use the one-click startup script (Windows):
```bash
.\start.bat
```

### 8. Open the app

| URL | Description |
|---|---|
| http://localhost:3000/table/T1 | Customer ordering page |
| http://localhost:3000/admin | Admin dashboard |

---

## ⚙️ Environment Variables

### Backend `.env`

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

### Frontend `.env.local`

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
│   │   │   └── index.js
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
│   │   │   ├── ollama.js      ← Groq + embeddings
│   │   │   ├── chroma.js      ← keyword search
│   │   │   ├── redis.js
│   │   │   └── socket.js
│   │   ├── db/
│   │   │   └── prisma.js
│   │   └── index.js
│   └── prisma/
│       ├── schema.prisma
│       └── seed.js            ← 35 menu items with images
├── frontend/
│   ├── app/
│   │   ├── table/[tableId]/
│   │   │   └── page.js        ← customer ordering page
│   │   ├── admin/
│   │   │   └── page.js        ← admin dashboard
│   │   ├── layout.js
│   │   ├── page.js
│   │   └── globals.css        ← full responsive system
│   ├── components/
│   │   ├── MenuGrid.js        ← menu with categories + filters
│   │   ├── CartDrawer.js      ← cart + OTP checkout + bill
│   │   ├── AIChat.js          ← Zara AI chat interface
│   │   └── GroupBanner.js     ← real-time group ordering
│   └── lib/
│       └── store.js           ← Zustand global state
└── start.bat                  ← one-click startup (Windows)
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/menu` | Full menu with availability |
| GET | `/api/menu/search?q=` | Search menu items |
| GET | `/api/table/:tableId/session` | Get or create table session |
| GET | `/api/session/:id/cart` | Get cart items |
| POST | `/api/session/:id/cart` | Add item to cart |
| PATCH | `/api/session/:id/cart/:itemId` | Update quantity |
| DELETE | `/api/session/:id/cart/:itemId` | Remove item |
| POST | `/api/session/:id/ai/chat` | Send message to Zara |
| POST | `/api/otp/send` | Send OTP to phone |
| POST | `/api/otp/verify` | Verify OTP |
| POST | `/api/session/:id/order` | Place order |
| GET | `/api/order/:orderId` | Get order status |
| GET | `/api/popular?time=` | Get popular items by time |
| GET | `/api/admin/orders` | All orders (admin) |
| GET | `/api/admin/stats` | Dashboard stats (admin) |
| GET | `/api/admin/tables` | Active table sessions (admin) |
| PATCH | `/api/admin/orders/:id/status` | Update order status (admin) |
| PATCH | `/api/admin/sessions/:id/close` | Close table session (admin) |

---

## 🚀 Deployment

### Production Stack

| Service | Provider | Cost |
|---|---|---|
| Frontend | Vercel | Free |
| Backend | Render | Free |
| PostgreSQL | Supabase | Free |
| Redis | Upstash | Free |
| LLM | Groq API | Free |
| **Total** | | **$0** |

### Deploy Steps

1. Push to GitHub
2. Supabase → create project → get DATABASE_URL
3. Upstash → create Redis → get REDIS_URL
4. Groq → get API key
5. Render → new Web Service → connect GitHub
   - Root: `backend`
   - Build: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start: `npm start`
6. Vercel → new Project → connect GitHub
   - Root: `frontend`
7. Seed production DB locally:
   ```powershell
   $env:DATABASE_URL="your-supabase-url"
   node prisma/seed.js
   ```

---

## 💡 Design Decisions

**Why keyword search in production?**
Render free tier blocks outbound HTTP to embedding APIs. Keyword search with popularity scoring achieves accurate recommendations with zero external dependencies. In production with budget, this swaps back to vector embeddings in one file change.

**Why Redis for sessions?**
Sub-millisecond cart reads and pub/sub for real-time group ordering. Each table session has a 4-hour TTL matching restaurant service windows.

**Why a multi-agent pattern?**
Each agent has single responsibility, its own prompt, and its own token budget. This keeps latency low and makes the system extensible — add a new agent without touching existing ones.

**Why Socket.io for group ordering?**
Enables real-time cart sync across multiple phones at the same table. When one person adds an item, all phones update instantly without polling.

---

## ⚠️ Trade-offs & What's Next

### What was cut (time constraints)
- Real SMS OTP (using mock 123456 for demo)
- Kitchen display screen (orders go to admin panel instead)
- PDF bill generation
- Cross-session user memory (phone-based personalization)

### What would be added with more time
- [ ] Twilio SMS OTP
- [ ] Kitchen display WebSocket screen
- [ ] PDF receipt generation
- [ ] Analytics charts (revenue, popular items, peak hours)
- [ ] Multi-restaurant support
- [ ] Real food images via Cloudinary
- [ ] React Native mobile app
- [ ] Loyalty points system

---

## 🎯 Example AI Prompts

### Hinglish input
```
User: "kuch spicy chahiye, dairy se allergy hai"
Zara: Bilkul! Yeh lo — spicy bhi, dairy-free bhi!
→ Chilli Chicken Bites (₹220)
→ Mushroom 65 (₹200)
→ Prawn Pepper Fry (₹280)
```

### Group ordering
```
User: "we are 4 people, 2 veg and 2 non-veg"
Zara: Perfect for a group! Here's a mix for everyone:
→ Paneer Tikka (veg) ₹220
→ Veg Thali (veg) ₹350
→ Chilli Chicken Bites (non-veg) ₹220
→ Butter Chicken (non-veg) ₹320
```

### Upsell trigger
```
User adds Chilli Chicken Bites
Zara: Great pick! Looks like you're missing drinks —
      Mango Lassi pairs perfectly with this. Want to add it?
```

---

## 📝 License

MIT — free to use, modify, and distribute.

---

## 🙏 Acknowledgements

Built with [Groq](https://groq.com), [LangChain.js](https://js.langchain.com), [Next.js](https://nextjs.org), [Prisma](https://prisma.io), [Supabase](https://supabase.com), [Socket.io](https://socket.io), and a lot of ☕.

---

*Built for the AI-Driven Smart Dining Assistant | May 2026*