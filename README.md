# MovieVerse

An industry-grade IMDb + Letterboxd + Rotten Tomatoes clone with AI-powered recommendations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS, Framer Motion |
| **Backend** | NestJS, Node.js, GraphQL (Apollo), REST |
| **Database** | PostgreSQL (Prisma ORM), Redis |
| **Search** | Elasticsearch |
| **Auth** | Clerk |
| **Storage** | AWS S3 + CloudFront |
| **AI** | OpenAI / Google Gemini |
| **Payments** | Stripe |
| **Analytics** | GA4, Mixpanel |
| **Deployment** | Vercel (frontend), AWS (backend) |

## Getting Started

### Prerequisites
- Node.js 20+ (LTS)
- PostgreSQL 15+
- Redis 7+
- TMDB API key ([get free key](https://www.themoviedb.org/settings/api))

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd movieverse

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
movieverse/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/            # Auth pages (sign-in, sign-up)
│   │   ├── (main)/            # Main app layout
│   │   │   ├── page.tsx       # Home page
│   │   │   ├── movies/        # Movie browse & detail
│   │   │   ├── tv/            # TV show browse & detail
│   │   │   ├── person/        # Celebrity profiles
│   │   │   ├── search/        # Search results
│   │   │   ├── watchlist/     # User watchlist
│   │   │   ├── lists/         # Custom lists
│   │   │   ├── reviews/       # Reviews feed
│   │   │   ├── news/          # Entertainment news
│   │   │   └── awards/        # Awards & nominations
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Base UI (Button, Input, Card, etc.)
│   │   ├── movie/             # Movie-specific components
│   │   ├── person/            # Celebrity components
│   │   ├── review/            # Review components
│   │   ├── layout/            # Header, Sidebar, Footer
│   │   └── shared/            # Shared (Rating, Carousel, etc.)
│   ├── lib/                   # Utilities & API clients
│   │   ├── tmdb.ts            # TMDB API client
│   │   ├── prisma.ts          # Prisma client instance
│   │   ├── redis.ts           # Redis client
│   │   └── utils.ts           # Helper functions
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # State management (Zustand)
│   ├── styles/                # CSS & design tokens
│   │   └── design-tokens.css  # CSS custom properties
│   └── types/                 # TypeScript type definitions
│       └── index.ts           # All types
├── public/                    # Static assets
├── .env.example               # Environment variables template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

## Core Features

- 🎬 **Browse & Discover** — Movies, TV shows with advanced filters
- ⭐ **Dual Ratings** — IMDb-style (1-10) + Rotten Tomatoes-style (%)
- 📝 **Reviews** — Write, read, vote on reviews
- 📋 **Watchlist & Lists** — Personal watchlist + custom lists
- 🤖 **AI Recommendations** — "Because you watched X" engine
- 🔍 **Smart Search** — Elasticsearch-powered with autocomplete
- 📺 **Where to Watch** — OTT platform availability
- 🏆 **Awards** — Oscar, Emmy, Golden Globe data
- 👥 **Social** — Follow users, activity feed
- 🌙 **Dark/Light Mode** — Theme toggle
- 📊 **Admin Dashboard** — Analytics, content & user management
- 💎 **Premium Tier** — Ad-free, advanced AI features

## API Data Source

This project uses [TMDB (The Movie Database)](https://www.themoviedb.org/) API for movie, TV show, and celebrity data.

> This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

MIT
