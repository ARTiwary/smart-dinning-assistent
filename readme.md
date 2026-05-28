# 🍛 Spice Garden — AI-Driven Smart Dining Assistant

> A full-stack, production-grade AI-powered restaurant ordering system with a multi-agent AI layer, real-time group ordering, and a live admin dashboard.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20+-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)
![Ollama](https://img.shields.io/badge/AI-Ollama%20%28Free%29-orange.svg)

---

## 🎯 What is this?

Spice Garden is not just a menu app. It is an **AI-first dining experience** where every customer touchpoint is powered by intelligent agents. Customers scan a QR code, chat with Zara (the AI assistant), and place orders — all without staff involvement.

---

## ✨ Features

### Customer Side
- 📱 QR code scan → instant table session
- 🤖 **Zara** — AI dining assistant powered by Ollama (free, local LLM)
- 🧠 Multi-agent architecture: Greeter, Recommendation, Upsell, Sentiment, Multilingual agents
- 🌶️ Smart recommendations with semantic search (ChromaDB + nomic-embed-text)
- 🗣️ Multilingual support — English, Hinglish, Telugu-English
- 👥 Real-time group ordering via WebSocket
- 🛒 Cart with add / remove / quantity controls
- 📲 OTP verification at checkout
- 🧾 Full bill breakdown with GST

### Admin Panel
- 📊 Live dashboard — today's orders, revenue, active orders
- 🧾 Order management with status flow (Pending → Confirmed → Preparing → Ready → Delivered)
- 🪑 Table management — add/remove tables, generate QR per table, download QR
- 🔒 Close table sessions
- 🔄 Auto-refresh every 10 seconds

---

## 🏗️ Architecture

```
Customer (Browser)
      │
      ▼
Next.js 16 Frontend (port 3000)
      │
      ▼
Express Backend (port 4000)
      ├── REST API (menu, cart, session, order, otp)
      ├── Socket.io (real-time group cart sync)
      └── AI Agent Orchestrator
              ├── Multilingual NLU Agent
              ├── Greeter Agent
              ├── Recommendation Agent (ChromaDB + Ollama)
              ├── Upsell Agent
              ├── Context Memory Agent
              ├── Group Coordinator Agent
              ├── Sentiment Agent
              └── Order Validation Agent
      │
      ▼
Data Layer
      ├── PostgreSQL + Prisma (orders, menu, sessions)
      ├── Redis (sessions, cart cache, pub/sub)
      └── ChromaDB (menu embeddings for semantic search)
```

---

## 🤖 AI Stack (100% Free & Local)

| Component | Technology |
|---|---|
| LLM | Ollama `llama3.2` |
| Embeddings | Ollama `nomic-embed-text` |
| Vector Store | ChromaDB |
| Orchestration | Custom router + LangChain.js |

No OpenAI API key needed. Everything runs locally on your machine.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TailwindCSS, Zustand |
| Backend | Node.js, Express, Socket.io |
| Database | PostgreSQL, Prisma ORM |
| Cache | Redis (ioredis) |
| AI | Ollama, LangChain.js, ChromaDB |
| Infra | Docker |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+ (for ChromaDB)
- Docker Desktop
- [Ollama](https://ollama.ai) for Windows/Mac/Linux

### 1. Clone the repo

```bash
git clone https://github.com/your-username/smart-dining-assistant
cd smart-dining-assistant
```

### 2. Start infrastructure

```bash
# Start PostgreSQL and Redis
docker run --name smart-dining-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=smart_dining -p 5432:5432 -d postgres
docker run --name smart-dining-redis -p 6379:6379 -d redis

# Set auto-restart
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

Or use the startup script (Windows):
```bash
.\start.bat
```

### 8. Open the app

| URL | Description |
|---|---|
| http://localhost:3000/table/T1 | Customer ordering page |
| http://localhost:3000/admin | Admin dashboard (password: admin123) |

---

## 📁 Project Structure

```
smart-dining-assistant/
├── backend/
│   ├── src/
│   │   ├── agents/          # AI agents (greeter, recommendation, upsell, etc.)
│   │   ├── orchestrator/    # Intent router + agent dispatcher
│   │   ├── routes/          # REST API routes
│   │   ├── services/        # Business logic (cart, session, order, otp)
│   │   ├── lib/             # Redis, Ollama, ChromaDB clients
│   │   └── db/              # Prisma client
│   └── prisma/
│       ├── schema.prisma    # Database schema
│       └── seed.js          # Menu seed data (35 items)
├── frontend/
│   ├── app/
│   │   ├── table/[tableId]/ # Customer ordering page
│   │   └── admin/           # Admin dashboard
│   ├── components/
│   │   ├── MenuGrid.js      # Menu with categories, filters, search
│   │   ├── CartDrawer.js    # Cart + checkout + OTP
│   │   ├── AIChat.js        # Zara AI chat interface
│   │   └── GroupBanner.js   # Real-time group ordering banner
│   └── lib/
│       └── store.js         # Zustand global state
└── start.bat                # One-click startup (Windows)
```

---

## 🧠 Agent Design

| Agent | Responsibility | Tools |
|---|---|---|
| **Multilingual NLU** | Normalise Hinglish/Telugu-English input to structured intent | Ollama |
| **Greeter** | Welcome user, detect mood, set session context | Ollama |
| **Recommendation** | Semantic menu search + LLM ranking | ChromaDB, Ollama |
| **Upsell** | Trigger contextual add-on suggestions | Prisma, Ollama |
| **Context Memory** | Maintain preferences + conversation history | Redis |
| **Group Coordinator** | Merge multi-user intents, detect conflicts | Socket.io |
| **Sentiment** | Detect frustration, adjust tone | Ollama |
| **Order Validation** | Final stock + quantity check before order | Prisma |

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
| POST | `/api/session/:id/ai/chat` | Send message to Zara |
| POST | `/api/otp/send` | Send OTP |
| POST | `/api/otp/verify` | Verify OTP |
| POST | `/api/session/:id/order` | Place order |
| GET | `/api/admin/orders` | All orders (admin) |
| GET | `/api/admin/stats` | Dashboard stats (admin) |
| PATCH | `/api/admin/orders/:id/status` | Update order status (admin) |

---

## ⚙️ Environment Variables

```env
# Backend (.env)
DATABASE_URL=postgresql://postgres:password@localhost:5432/smart_dining
REDIS_URL=redis://localhost:6379
PORT=4000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text
CHROMA_URL=http://localhost:8000
OTP_MODE=mock
FRONTEND_URL=http://localhost:3000
ADMIN_KEY=admin123

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🎨 Design Decisions

**Why Ollama instead of OpenAI?**
Fully free, runs locally, no API key, no usage limits. Perfect for demos and development. The architecture is identical — swap `OLLAMA_MODEL` for any OpenAI-compatible endpoint in production.

**Why ChromaDB?**
Local vector store with zero configuration. Menu items are embedded at startup using `nomic-embed-text` and searched with cosine similarity for accurate semantic recommendations.

**Why Redis for sessions?**
Sub-millisecond cart reads and pub/sub for real-time group ordering. Each table session has a 4-hour TTL.

**Why a multi-agent pattern?**
Each agent has a single responsibility, its own prompt, and its own token budget. This keeps latency low and makes the system easy to extend — add a new agent without touching existing ones.

---

## 🔮 What's Next

- [ ] Real food images via Cloudinary
- [ ] SMS OTP via Twilio / MSG91
- [ ] Kitchen display screen (WebSocket)
- [ ] PDF bill / receipt generation
- [ ] Analytics charts in admin
- [ ] Multi-restaurant support
- [ ] Mobile app (React Native)

---

## 📝 License

MIT — free to use, modify, and distribute.

---

## 🙏 Acknowledgements

Built with [Ollama](https://ollama.ai), [LangChain.js](https://js.langchain.com), [ChromaDB](https://trychroma.com), [Next.js](https://nextjs.org), [Prisma](https://prisma.io), and a lot of ☕.