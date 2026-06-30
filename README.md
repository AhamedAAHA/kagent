# KAgent — Sri Lanka's AI Life Shopping Concierge

> **"What's happening in your life?"** — not "What do you want to buy?"

KAgent is a multi-agent AI shopping platform built for Sri Lanka. Instead of search-and-add-to-cart, KAgent understands life situations and builds complete shopping plans using 7 specialised AI agents powered by the Anthropic API (Band of Agents).

---

## Live Demo Features

### 🧠 7-Agent Swarm (visible in real time)
| Agent | Role |
|---|---|
| 🎯 Concierge | Interprets your life situation and generates the final plan |
| 🌟 Life Event | Detects moving, birthday, university, hosting, etc. |
| 💾 Memory | Stores family preferences and purchase history |
| 🛒 Shopping | Searches **live Kapruka catalog** via MCP (flowers, gifts, hampers, cakes) |
| 🎉 Festival | Detects Avurudu, Vesak, Ramadan, Christmas (60-day window) |
| 💰 Budget | Optimises cart and builds 3 bundle tiers |
| 🚚 Delivery | Checks same-day vs scheduled delivery availability |

### 🎊 Sri Lankan Festival Intelligence
Automatically detects upcoming festivals within 60 days:
- **Sinhala & Tamil New Year (Avurudu)** — April 13/14
- **Vesak Poya** — May
- **Deepavali** — October
- **Ramadan & Eid** — March
- **Christmas** — December 25
- **Independence Day** — February 4

### 🛒 Life Situation → Complete Cart
- **"I'm moving"** → mattress, fan, rice cooker, curtains, cleaning supplies, extension cords
- **"I'm starting university"** → laptop, backpack, notebook, pens, water bottle, calculator
- **"My mother's birthday"** → flowers, chocolate, greeting card with personalized message
- **"I'm hosting 25 people"** → plates, drinks, kottu catering, ice, napkins, cake
- **"Surprise me with Rs. 5,000"** → curated surprise pack

### 💰 3-Tier Bundle System
Every life situation generates 3 ready-to-checkout bundles:
- **Budget** — essentials only
- **Recommended** — best value (most popular)
- **Complete** — everything, nothing left out

### 📱 Visual Agent Activity
Watch all 7 agents pulse and report in real time as they work. Not a chatbot — a swarm.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion + Canvas 2D (hero) |
| AI | Exa (`exa`) with OpenAI fallback |
| Catalog | **Kapruka MCP** — live products, delivery check, guest checkout |
| State | Zustand |
| Festivals | Sri Lankan calendar with live day-countdown |

---

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/AhamedAAHA/kagent.git
cd kagent
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```
EXA_API_KEY=your_exa_api_key_here
KAPRUKA_MCP_URL=https://mcp.kapruka.com/mcp   # optional; this is the default
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Kapruka MCP Integration

KAgent uses the [Kapruka MCP server](https://mcp.kapruka.com/mcp) for live catalog search, delivery checks, and real guest checkout.

| MCP tool | KAgent usage |
|---|---|
| `kapruka_search_products` | Shopping agent — live product cards with photos |
| `kapruka_check_delivery` | Delivery agent — Colombo/outstation rates |
| `kapruka_list_delivery_cities` | Checkout modal — city picker |
| `kapruka_create_order` | Cart → Kapruka pay link |
| `kapruka_track_order` | `/api/kapruka/track` |

**MCP server fork:** [github.com/AhamedAAHA/mcp](https://github.com/AhamedAAHA/mcp) (fork of [kapruka/mcp](https://github.com/kapruka/mcp))

Production uses the public endpoint (`https://mcp.kapruka.com/mcp`) — no API key required for the free tier (60 req/min). To self-host your fork:

```bash
git clone https://github.com/AhamedAAHA/mcp.git
cd mcp && python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env   # needs KAPRUKA_API_KEY from Kapruka
python cli.py server   # http://localhost:8000/mcp
```

Then set `KAPRUKA_MCP_URL=http://localhost:8000/mcp` in KAgent `.env.local` (or your deployed MCP URL on Railway/Fly).

See the fork's [deploy/README.md](https://github.com/AhamedAAHA/mcp/blob/main/deploy/README.md) for production VPS setup behind `mcp.kapruka.com`.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts           # Agent orchestration (SSE)
│   │   └── kapruka/                # Checkout, cities, delivery, track
│   ├── page.tsx                    # Full app UI
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── agents/AgentPanel.tsx  # Live agent status sidebar
│   ├── chat/
│   │   ├── MessageBubble.tsx  # Chat messages with products/bundles
│   │   └── ChatInput.tsx      # Input bar + quick prompts
│   ├── landing/HeroCanvas.tsx # Animated 3D-style hero (Canvas 2D)
│   └── ui/
│       ├── ProductCard.tsx    # Kapruka product card (live images)
│       ├── BundleCard.tsx     # 3-tier bundle selector
│       ├── CartSidebar.tsx    # Sliding cart + checkout
│       ├── CheckoutModal.tsx  # Kapruka guest checkout form
│       └── FestivalBanner.tsx # Festival alert banner
├── lib/
│   ├── agents.ts              # 7-agent orchestration
│   ├── kapruka.ts             # Kapruka MCP HTTP client
│   ├── kapruka-products.ts    # Catalog search + checkout helpers
│   ├── products.ts            # Local fallback catalog
│   ├── festivals.ts           # Sri Lankan festival intelligence
│   ├── store.ts               # Zustand global state
│   └── utils.ts               # Helpers
└── types/index.ts             # TypeScript types
```

---

## Sri Lankan Products Database

50+ real products from local vendors including:
- **Cargills, Keells Super, Before & Sons** — groceries
- **Dilmah, Elephant House, MD** — food & beverages
- **Abans, Softlogic, Singer, Damro** — electronics & furniture
- **Laksala, Flora Garden** — gifts, flowers, traditional items
- **Vijitha Yapa, Bookland** — stationery
- **Perera & Sons, Hotel Renuka** — food & catering

---

## Why KAgent Wins

Most hackathon submissions:
✗ Search → product list → add to cart

KAgent:
✅ Life situation → agent swarm activates → complete solution → one-click cart

---

## Built for Kapruka Agent Challenge

- **Live catalog** via Kapruka MCP — real products, photos, prices
- **Guest checkout** — cart → `kapruka_create_order` → pay on kapruka.com
- **7-agent swarm** — life events, bundles, delivery, festival intelligence

**Live demo:** [kagent-nine.vercel.app](https://kagent-nine.vercel.app)

**Subha Aluth Awuruddak Wewa! 🎉**
