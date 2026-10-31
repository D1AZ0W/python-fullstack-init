# Stack Init: TanStack Start + Django + PostgreSQL

A production-ready stack template featuring:
- **Frontend**: TanStack Start, React 19, Tailwind CSS v4, TypeScript, Vite
- **Backend**: Django, `uv`, `ruff`, PostgreSQL
- **Database**: PostgreSQL (via Docker Compose)

## Quick Start

Create a new project anywhere without cloning:

```bash
npx create-stack-init
```

Or install globally:

```bash
npm install -g create-stack-init
create-stack-init
```

The CLI will prompt you for:
1. Project name
2. Setup type (full-stack, frontend only, backend only, or backend + database)

## What you get

- **Full-stack**: Frontend + Backend + PostgreSQL (Docker Compose)
- **Frontend only**: TanStack Start + React 19 + Tailwind CSS v4 + TypeScript
- **Backend only**: Django + uv + ruff
- **Backend + Database**: Django + PostgreSQL (Docker Compose)

## Development

Clone the repository, then run the init script:

```bash
chmod +x scripts/init.sh
./scripts/init.sh
```

## Running the Stack

1. **Database**:
   ```bash
   docker compose up -d db
   ```

2. **Backend**:
   ```bash
   cd backend
   uv run python manage.py runserver
   ```

3. **Frontend**:
   ```bash
   cd frontend
   pnpm dev
   ```
