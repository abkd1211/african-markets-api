# 🌍 African Markets

> The definitive data layer for African financial markets. 

[![Project Status: Active](https://img.shields.io/badge/Project%20Status-Active-brightgreen)](https://github.com/abkd1211/african-markets-api)
[![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Node.js%20%7C%20TS-blue)](https://github.com/abkd1211/african-markets-api)
[![Markets Support](https://img.shields.io/badge/Markets-GSE%20%7C%20NGX-orange)](https://github.com/abkd1211/african-markets-api)

**African Markets** is a high-performance, developer-first platform designed to bridge the data gap in African stock exchanges. It provides real-time and historical data for the **Ghana Stock Exchange (GSE)** and the **Nigerian Exchange (NGX)**, offering both a premium web dashboard and a robust API for builders.

---

## 🚀 Vision: The AI-Ready Data Layer
We are building more than just a dashboard. We are establishing the **standard data primitive** for African finance. 
- **Current Stage:** Web Dashboard + REST API
- **Upcoming Stage:** **MCP (Model Context Protocol)** — enabling AI agents (Claude, ChatGPT, etc.) to query African market data natively.

---

## 🛠 Features

### 📈 Comprehensive Market Data
- **Real-time Tickers:** Live prices and daily performance for GSE and NGX.
- **Historical Analysis:** 10+ years of historical price data with interactive charts.
- **Company Profiles:** In-depth information for listed companies.

### 🕸 Professional API
- **Scraper Adapters:** Intelligent, resilient scrapers built with `got-scraping` and `cheerio`.
- **Caching Layer:** High-speed in-memory caching to ensure sub-100ms response times.
- **RESTful Endpoints:** Clean, typed routes for tickers, history, and market summaries.

### 🎨 Premium Web Experience
- **Modern UI:** Built with Next.js 16+, Tailwind CSS 4, and Lucide Icons.
- **SEO Optimized:** Dynamic metadata, JSON-LD structured data, and automated sitemaps for every ticker.
- **Responsive Design:** Financial insights available on any device.

---

## 🏗 Architecture (Monorepo)

```text
african-markets/
├── apps/
│   ├── api/          # Node.js Express server (Data Aggregator)
│   └── web/          # Next.js App Router (User Dashboard)
├── package.json      # Workspace configuration
└── README.md         # You are here
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/abkd1211/african-markets-api.git
   cd african-markets-api
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
You can run both the API and Web applications concurrently:
```bash
npm run dev
```

- **API:** [http://localhost:3000](http://localhost:3000)
- **Web:** [http://localhost:3001](http://localhost:3001)

### Production Deployments
- **Frontend Dashboard:** [https://african-markets.vercel.app](https://african-markets.vercel.app)
- **Backend API:** [https://african-markets-api-muuy.onrender.com](https://african-markets-api-muuy.onrender.com)


---

## 🗺 Market Support

| Exchange | Country | Status | Ticker Count |
| :--- | :--- | :--- | :--- |
| **GSE** | Ghana | ✅ Live | 30+ |
| **NGX** | Nigeria | ✅ Live | 150+ |
| **BRVM** | West Africa | 🏗 Planned | - |
| **NSE** | Kenya | 🏗 Planned | - |

---

## 🤝 Contributing
We welcome contributions! Whether it's adding a new exchange adapter or improving the UI, please feel free to open a PR.

---

## 📄 License
ISC © [abkd1211](https://github.com/abkd1211)
