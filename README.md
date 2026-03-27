# twosome.

> games for two humans ↗

A real-time game platform for two players. First game: **Story Builder** — build a story together, one word at a time.

## Architecture

pnpm monorepo with DDD + CQRS:

```
packages/
  shared/          → Types, errors, events, utilities (zero dependencies)
  domain/          → Entities, aggregates, repository interfaces
  application/     → Commands, queries, handlers, ports
  infrastructure/  → Supabase implementations, realtime adapter, auth adapter
  supabase/        → SQL migrations, seed data

apps/
  web/             → React Router + Vite + Tailwind + shadcn/ui
```

### Layer dependencies

```
shared ← domain ← application ← infrastructure
                                       ↑
                                    apps/web
```

Domain has zero infrastructure dependencies. Application defines ports (interfaces). Infrastructure implements them with Supabase.

## Getting started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Supabase CLI (for local development)
- A Supabase project (or run locally)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp apps/web/.env.example apps/web/.env
# Fill in your Supabase URL and anon key

# Run the migration against your Supabase project
pnpm db:migrate

# Start the dev server
pnpm dev
```

### Adding shadcn/ui components

```bash
cd apps/web
pnpx shadcn@latest add button
pnpx shadcn@latest add dialog
pnpx shadcn@latest add avatar
# etc.
```

## Tech stack

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces |
| Frontend | Vite + React 19 + TypeScript |
| Routing | React Router v7 |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Backend | Supabase (Postgres + Realtime + Auth) |
| Auth | Anonymous → Google/Apple social login |
| PWA | vite-plugin-pwa |
| Future native | Capacitor |

## Brand

- **Name:** twosome.
- **Accent:** Hot Coral `#F43F5E`
- **Fonts:** Outfit (display) + Space Mono (utility)
- **Vibe:** Bold, graphic, monochrome + one accent color
# twosome
