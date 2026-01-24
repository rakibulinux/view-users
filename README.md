# Users Dashboard (Full‑stack)

A small full‑stack application that displays a list of users with search, filtering, and a details view.

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui + React Query
- **Backend**: Express + TypeScript + Prisma 6.19.2 + MongoDB + OpenAPI/Swagger UI
- **Monorepo**: PNPM workspaces (`apps/frontend`, `apps/backend`)

---

## Setup

### Prerequisites

- **Node.js** (>= 22)
- **PNPM** (`npm install -g pnpm`)
- **MongoDB** (local instance on `mongodb://localhost:27017`)

> **Note on MongoDB**: Prisma’s MongoDB connector requires a replica set for writes.

### 1. Clone and install dependencies

```bash
git clone https://github.com/rakibulinux/view-users.git
cd view-users
pnpm install
```

### 2. Backend setup

```bash
cd apps/backend
cp .env.example .env  # or create .env with DATABASE_URL
```

Ensure `.env` contains:

```env
PORT=3030
DATABASE_URL="mongodb://localhost:27017/view_users?directConnection=true"
```

#### 2a. Push schema to MongoDB

```bash
pnpm prisma:push
```

#### 2b. (Optional) Seed demo users

```bash
# Option A: Use the provided JSON file
mongoimport --db view_users --collection User --file seed.json --jsonArray

# Option B: Run the seed script (requires replica set)
pnpm seed
```

#### 2c. Start the backend dev server

```bash
pnpm dev
```

API will be at `http://localhost:3030`.  
Swagger UI: `http://localhost:3030/docs`  
OpenAPI spec: `http://localhost:3030/openapi.json`

### 3. Frontend setup

```bash
cd apps/frontend
pnpm dev
```

Frontend will be at `http://localhost:5173`.

---

## What is done

### Backend

- **Express + TypeScript** server with CORS and JSON body parsing
- **Prisma 6.19.2** with MongoDB (`User` model: `id`, `name`, `email`, `role`, `active`, `createdAt`)
- **Endpoints**
  - `GET /users` — supports `search` (by name) and `role` filter
  - `GET /users/:id` — returns a single user
  - `PATCH /users/:id/toggle-active` — toggles the `active` flag (You need to use replica‑set for writes)
- **OpenAPI/Swagger** (`/docs`, `/openapi.json`)
- **Demo data** (`seed.json`) ready for `mongoimport`
- **JSON error handler** (no HTML error pages)

### Frontend

- **Vite + React + TypeScript** with Tailwind CSS and minimal shadcn/ui primitives
- **React Query** (`QueryClientProvider`) with:
  - Automatic request cancellation on fast typing (`signal` passed to `fetch`)
  - `placeholderData`/`keepPreviousData` for smooth loading states
  - Optimistic updates for `toggle-active`
- **Dashboard UI**
  - Search input (refetches on change)
  - Role filter dropdown (`all`/`admin`/`editor`/`viewer`)
  - Sort‑by‑name button (disabled while loading)
  - Users list (click to select)
  - User details panel with loading skeleton
  - “Viewing profile for X seconds” activity indicator
  - Toggle Active button (optimistic + error rollback)
- **Responsive layout** (grid on md+ screens)

---

## What is not (or optional)

I try to complete all part including bonus section.

---

## Development notes

- **Monorepo scripts** (run from repo root):
  - `pnpm dev` — runs both frontend and backend concurrently (you can also run them separately)
  - `pnpm build` — builds both apps
  - `pnpm lint` / `pnpm typecheck` — lint/type‑check both apps
- **Prisma**: `prisma generate` is run automatically; `prisma db push` updates the schema without migrations.
- **React Query**: All queries use `signal` for cancellation; the sort button is disabled while fetching to avoid race conditions.

---

## Quick start note

```bash
git clone https://github.com/rakibulinux/view-users.git && cd view-users && pnpm install && \
  (cd apps/backend && pnpm prisma:push && mongoimport --db view_users --collection User --file seed.json --jsonArray) && \
  pnpm dev
```

Then open `http://localhost:5173` (frontend) and `http://localhost:3030/docs` (API docs).
