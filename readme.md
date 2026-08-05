# 🍛 Spice Garden — AI-Driven Smart Dining Assistant

> A production-grade, full-stack AI-first restaurant ordering system with multi-agent architecture, real RAG using pgvector + Cohere embeddings, real-time group ordering, PWA support, and a comprehensive admin dashboard.

![Node](https://img.shields.io/badge/Node.js-20+-green?style=flat-square&logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![LangChain](https://img.shields.io/badge/LangChain-JS-blue?style=flat-square)
![Groq](https://img.shields.io/badge/LLM-Groq%20llama3.1-orange?style=flat-square)
![RAG](https://img.shields.io/badge/RAG-pgvector%20%2B%20Cohere-purple?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-Installable-brightgreen?style=flat-square)
![Deploy](https://img.shields.io/badge/Deployed-Vercel%20%2B%20Render-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

---

## 🌐 Live Demo

| | URL |
|---|---|
| 🍽️ **Customer App** | https://smart-dinning-assistent.vercel.app/table/T1 |
| 🔐 **Admin Panel** | https://smart-dinning-assistent.vercel.app/admin |
| 🍳 **Kitchen Display** | https://smart-dinning-assistent.vercel.app/kitchen |
| ⚙️ **Backend API** | https://smart-dinning-assistent.onrender.com |
| 💻 **GitHub** | https://github.com/ARTiwary/smart-dinning-assistent |

> Admin Password: `admin123` · Demo OTP: `123456` (mock mode)

---

## 🎯 What Makes This AI-First?

This is not a menu app with a chatbot bolted on. AI agents are the primary interaction layer:

- **Natural language is the default** — menus are the fallback
- **8 specialized agents** coordinate via a central orchestrator
- **Real RAG** — Cohere embeddings + pgvector cosine similarity search
- **Cross-session memory** — Zara remembers returning customers by phone
- **Multilingual by default** — English, Hinglish, Telugu-English natively
- **Contextual upselling** — triggered by cart state, not hardcoded banners
- **Voice input** — speak to Zara using Web Speech API

---

## ✨ Complete Feature List

### 👤 Customer Side
- 📱 QR code scan → instant anonymous table session
- 🤖 **Zara** — AI dining assistant (Groq llama-3.1-8b-instant)
- 🧠 8-agent multi-agent orchestrator with LangChain routing
- 🔍 Real RAG — Cohere embeddings + pgvector semantic search
- 🗣️ Multilingual NLU — Hinglish, Telugu-English natively
- 🎤 Voice input — speak to Zara (Web Speech API, Chrome)
- 🍽️ AI Combo Builder — budget-based full meal generator
- 👥 Real-time group ordering via Socket.io + Redis pub/sub
- 🛒 Per-device cart with optimistic UI
- 🧾 Full bill with GST breakdown
- 📄 PDF bill download (receipt format)
- 🎟️ Discount coupon codes at checkout
- 💎 Loyalty points — earn on orders, redeem at checkout
- 🔁 Cross-session memory — personalized returning customer experience
- 📍 Live order tracking page
- ✕ Cancel order option
- 📱 PWA — installable on phone home screen
- 📱 Fully responsive — all screen sizes

### 🔐 Admin Panel
- 📊 Live dashboard — orders, revenue, active tables
- 📈 Analytics — revenue charts, top items, category breakdown
- 🧾 Order management — Pending → Confirmed → Preparing → Ready → Delivered
- ✕ Cancel orders (admin + customer)
- 🍳 Kitchen display screen with live order columns
- 🪑 Dynamic table management + QR generation per table
- 🍽️ Menu management — add, edit, delete, toggle availability
- 📸 Image upload via Cloudinary
- 🎟️ Coupon management — create, toggle, delete
- 💎 Loyalty account management
- 🔒 Close/reset table sessions
- 🔄 Auto-refresh every 10 seconds

---

## 🏗️ System Architecture

```
User Phone (Browser / PWA)
        │ HTTPS / WebSocket
        ▼
┌─────────────────────────────────────┐
│   Next.js 16 Frontend (Vercel)      │
│   TailwindCSS · Zustand · Axios     │
│   Socket.io Client · PWA            │
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
│  Prisma ORM  │  │  OTP cache   │
│  Menu+Orders │  │  Pub/Sub     │
│  Coupons     │  └───────────────┘
│  Loyalty     │
│  Profiles    │
└──────┬───────┘
       │
       ▼
┌──────────────┐    ┌──────────────┐
│  Cohere API  │    │  Cloudinary  │
│  Embeddings  │    │  Image CDN   │
│  384-dim     │    │  Menu photos │
└──────────────┘    └──────────────┘
```

---

## 🤖 Multi-Agent Architecture

```
User Input
    │
    ▼
Multilingual NLU Agent ── normalize + detect intent
    │
    ▼
Orchestrator (intent router)
    ├── GREET      ──► Greeter Agent (+ cross-session memory)
    ├── RECOMMEND  ──► Recommendation Agent
    │                  └── Cohere embed query
    │                  └── pgvector cosine search
    │                  └── Groq LLM ranking
    ├── UPSELL     ──► Upsell Agent (async, non-blocking)
    ├── MEMORY     ──► Context Memory Agent (Redis)
    ├── GROUP      ──► Group Coordinator Agent
    ├── SENTIMENT  ──► Sentiment Agent (background)
    └── CHECKOUT   ──► Order Validation Agent
    │
    ▼
JSON Response → Frontend renders suggestion cards
```

### Agent Responsibilities

| Agent | Responsibility |
|---|---|
| **Multilingual NLU** | Normalizes Hinglish/Telugu → structured JSON intent |
| **Greeter** | Personalized welcome using cross-session memory |
| **Recommendation** | Cohere embed → pgvector search → Groq ranking → top 3 |
| **Upsell** | Cart monitoring — missing drinks, combo threshold, evening specials |
| **Context Memory** | Redis preference store — honors allergies throughout session |
| **Group Coordinator** | Detects group → adjusts to shareable suggestions |
| **Sentiment** | Detects frustration → adds empathetic response prefix |
| **Order Validation** | Pre-checkout stock + quantity validation |

---

## 🔍 Real RAG Pipeline

```
INDEXING (startup):
Menu Items → Cohere embed-english-light-v3.0 → 384-dim vectors → pgvector

RETRIEVAL (per message):
User Query → Cohere embed → pgvector cosine similarity (<=>)
           → top 10 semantically similar items

GENERATION:
Top 10 items + preferences + cart + time → Groq LLM
LLM picks best 3 with reasons → JSON response
```

**Semantic search example:**
```
User: "something tangy and bold"
Finds: Prawn Pepper Fry
Why: semantic vectors similar even with no word overlap
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, TailwindCSS, Zustand, Socket.io client |
| **Backend** | Node.js 20, Express, Socket.io server |
| **Database** | PostgreSQL + Prisma + pgvector (Supabase) |
| **Cache** | Redis (Upstash) — sessions, OTP, pub/sub |
| **LLM** | Groq llama-3.1-8b-instant (free) |
| **Embeddings** | Cohere embed-english-light-v3.0 (free) |
| **Vector Search** | pgvector on Supabase |
| **AI Framework** | LangChain.js |
| **Local LLM** | Ollama llama3.2 |
| **Images** | Cloudinary CDN |
| **PDF** | jsPDF (client-side) |
| **Voice** | Web Speech API (browser native) |
| **PWA** | next-pwa |
| **Deployment** | Vercel + Render + Supabase + Upstash |

---

## 🗄️ Database Schema

```
MenuItem ──< CartItem >── Session ──< Order ──< OrderItem >── MenuItem
              (deviceId)      │
                         preferences      CustomerProfile
                         customerPhone ──► LoyaltyAccount
                                          LoyaltyTransaction
                                          Coupon
```

---

## 🔄 Complete User Flow

```
1.  Scan QR → /table/T1
2.  Session created in PostgreSQL, cached in Redis
3.  Menu + images loaded from Cloudinary
4.  Cohere embeddings initialized in pgvector
5.  Zara greets (personalized if returning customer)
6.  User types or speaks → Multilingual NLU → Orchestrator
7.  Recommendation: Cohere embed → pgvector → Groq → suggestion cards
8.  User adds item → optimistic UI → PostgreSQL → Socket.io
9.  Upsell fires → contextual suggestion
10. User opens Combo Builder → sets budget → Zara builds full meal
11. Checkout → enter coupon → apply loyalty points
12. Mock OTP verification (real SMS ready via MSG91)
13. Order placed → Kitchen Display notified → Customer tracking page
14. Admin: Pending → Confirmed → Preparing → Ready → Delivered
15. PDF bill downloaded → Loyalty points earned
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
# Terminal 1
chroma run --host localhost --port 8000

# Terminal 2
ollama serve

# Terminal 3
cd backend && npm run dev

# Terminal 4
cd frontend && npm run dev
```

Windows one-click:
```bash
.\start.bat
```

### 7. Open

| URL | Description |
|---|---|
| http://localhost:3000/table/T1 | Customer app |
| http://localhost:3000/admin | Admin panel |
| http://localhost:3000/kitchen | Kitchen display |

---

## ⚙️ Environment Variables

### `backend/.env`
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/smart_dining
DIRECT_URL=postgresql://postgres:password@localhost:5432/smart_dining
REDIS_URL=redis://localhost:6379
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ADMIN_KEY=admin123
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text
CHROMA_URL=http://localhost:8000
GROQ_API_KEY=your_groq_key
COHERE_API_KEY=your_cohere_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OTP_MODE=mock
```

### `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_OTP_MODE=mock
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
│   │   │   └── loyaltyService.js
│   │   ├── lib/
│   │   │   ├── ollama.js
│   │   │   ├── chroma.js
│   │   │   ├── redis.js
│   │   │   ├── socket.js
│   │   │   └── cloudinary.js
│   │   ├── db/prisma.js
│   │   └── index.js
│   └── prisma/
│       ├── schema.prisma
│       └── seed.js
├── frontend/
│   ├── app/
│   │   ├── table/[tableId]/page.js
│   │   ├── admin/page.js
│   │   ├── kitchen/page.js
│   │   ├── track/[orderId]/page.js
│   │   ├── layout.js
│   │   └── globals.css
│   ├── components/
│   │   ├── MenuGrid.js
│   │   ├── CartDrawer.js
│   │   ├── AIChat.js
│   │   ├── GroupBanner.js
│   │   ├── ComboBuilder.js
│   │   └── InstallPrompt.js
│   ├── lib/store.js
│   └── public/
│       ├── manifest.json
│       ├── icon-192.png
│       └── icon-512.png
└── start.bat
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/menu` | Full menu |
| GET | `/api/table/:tableId/session` | Get or create session |
| GET | `/api/session/:id/cart` | Get cart |
| POST | `/api/session/:id/cart` | Add to cart |
| PATCH | `/api/session/:id/cart/:id` | Update quantity |
| DELETE | `/api/session/:id/cart/:id` | Remove item |
| POST | `/api/session/:id/ai/chat` | Chat with Zara |
| POST | `/api/session/:id/ai/combo` | Build AI combo |
| POST | `/api/otp/send` | Send OTP |
| POST | `/api/otp/verify` | Verify OTP |
| POST | `/api/session/:id/order` | Place order |
| GET | `/api/order/:orderId` | Track order |
| PATCH | `/api/order/:id/cancel` | Cancel order |
| POST | `/api/coupon/verify` | Verify coupon |
| POST | `/api/coupon/apply` | Apply coupon |
| GET | `/api/loyalty/:phone` | Get loyalty account |
| POST | `/api/loyalty/redeem/verify` | Verify redemption |
| GET | `/api/admin/orders` | All orders |
| GET | `/api/admin/stats` | Dashboard stats |
| PATCH | `/api/admin/orders/:id/status` | Update status |
| PATCH | `/api/admin/orders/:id/cancel` | Cancel order |
| GET | `/api/admin/menu` | All menu items |
| POST | `/api/admin/menu` | Add menu item |
| PATCH | `/api/admin/menu/:id` | Edit menu item |
| DELETE | `/api/admin/menu/:id` | Delete menu item |
| POST | `/api/admin/menu/upload-image` | Upload to Cloudinary |
| GET | `/api/admin/coupons` | All coupons |
| POST | `/api/admin/coupons` | Create coupon |
| DELETE | `/api/admin/coupons/:id` | Delete coupon |
| GET | `/api/admin/kitchen/orders` | Kitchen orders |
| PATCH | `/api/admin/kitchen/orders/:id/ready` | Mark ready |

---

## 💡 Key Design Decisions

**Real RAG with pgvector**
No separate vector DB needed. Embeddings stored alongside menu data in Supabase. Cohere free API works from Render unlike HuggingFace which is blocked on free tier.

**Mock OTP (SMS skipped)**
Real SMS OTP requires telecom provider registration and approval in India — a regulatory process. Mock OTP (123456) is used for demo. The codebase is ready for MSG91 integration — just add API keys and set `OTP_MODE=msg91`.

**Multi-agent over monolithic prompt**
Each agent has its own token budget. Adding a new capability = one new agent file. Zero changes to existing agents.

**Per-device cart isolation**
Two phones at same table each see their own cart via `deviceId` in localStorage. Group banner shows everyone present.

**Optimistic UI**
Cart updates instantly before API confirms. Reverts on failure. Makes the app feel native.

**Cross-session memory**
Customer phone number links to a `CustomerProfile` — preferences, order history, loyalty points all persist across visits and tables.

---

## ⚠️ Known Limitations

| Feature | Status | Reason |
|---|---|---|
| Real SMS OTP | Mock (123456) | Requires telecom provider registration in India |
| ChromaDB in prod | In-memory/pgvector | Render free tier blocks outbound HTTP |
| Kitchen sound alerts | Silent | Browser autoplay policy blocks audio |

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
| PWA | next-pwa | Free |
| **Total** | | **$0/month** |

---

## 🎯 Example Interactions

**Hinglish with allergen:**
```
User:  kuch spicy chahiye, dairy se allergy hai
Zara:  Bilkul! Yeh lo — spicy bhi, dairy-free bhi!
       → Chilli Chicken Bites ₹220
       → Mushroom 65 ₹200
       → Prawn Pepper Fry ₹280
```

**Returning customer:**
```
Zara:  Welcome back Ayush! 🎉 Great to see you again.
       Last time you loved the spicy options —
       shall we go bold again today?
```

**Combo builder:**
```
Budget: ₹600, Preference: Non-Veg
Zara builds: Chilli Chicken (starter) + Butter Chicken (main)
             + Garlic Naan (bread) + Mango Lassi (drink)
Total: ₹580 — within budget!
```

**Upsell:**
```
User adds Butter Chicken to cart
Zara: Looks like you're missing drinks!
      Mango Lassi pairs perfectly — ₹100
```

---

## 📝 License

MIT — free to use, modify, and distribute.

---

## 🙏 Built With

[Groq](https://groq.com) · [Cohere](https://cohere.com) · [LangChain.js](https://js.langchain.com) · [Next.js](https://nextjs.org) · [Prisma](https://prisma.io) · [Supabase](https://supabase.com) · [pgvector](https://github.com/pgvector/pgvector) · [Upstash](https://upstash.com) · [Cloudinary](https://cloudinary.com) · [Socket.io](https://socket.io) · [Vercel](https://vercel.com) · [Render](https://render.com)

---

*Built for Ve-Lyra Labs — Gen AI Intern Assignment · June 2026*