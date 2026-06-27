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
| 🛒 Shopping | Searches 50+ real Sri Lankan products from local vendors |
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
| AI | Anthropic Claude (claude-sonnet-4-6) |
| State | Zustand |
| Product data | Curated Sri Lankan product database (50+ items) |
| Festivals | Sri Lankan calendar with live day-countdown |

---

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/kagent.git
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
Edit `.env.local` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=your_key_here
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts      # Main agent orchestration API
│   ├── page.tsx               # Full app UI
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── agents/AgentPanel.tsx  # Live agent status sidebar
│   ├── chat/
│   │   ├── MessageBubble.tsx  # Chat messages with products/bundles
│   │   └── ChatInput.tsx      # Input bar + quick prompts
│   ├── landing/HeroCanvas.tsx # Animated 3D-style hero (Canvas 2D)
│   └── ui/
│       ├── ProductCard.tsx    # Individual product card
│       ├── BundleCard.tsx     # 3-tier bundle selector
│       ├── CartSidebar.tsx    # Sliding cart
│       └── FestivalBanner.tsx # Festival alert banner
├── lib/
│   ├── agents.ts              # Band of Agents orchestration
│   ├── products.ts            # 50+ Sri Lankan products database
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

## Built for Kapruka Hackathon

This project demonstrates what's possible when AI goes beyond search to truly understand human life context in a Sri Lankan setting.

**Subha Aluth Awuruddak Wewa! 🎉**
