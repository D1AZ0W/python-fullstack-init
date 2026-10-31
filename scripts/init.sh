#!/usr/bin/env bash
set -e

echo "🚀 Initializing TanStack Start + Django + PostgreSQL Stack..."

# 1. Start PostgreSQL
echo "🐘 Starting PostgreSQL via Docker Compose..."
docker compose up -d db

# 2. Setup Django Backend with uv & ruff
echo "🐍 Setting up Django backend with uv..."
cd backend
if [ ! -f "pyproject.toml" ]; then
    uv init --lib --no-readme --name backend
    uv add django psycopg2-binary ruff python-dotenv
fi
if [ ! -d "core" ]; then
    uv run django-admin startproject core .
    uv run python manage.py migrate
fi
cd ..

# 3. Setup Frontend with TanStack Start, Tailwind v4, React 19, TypeScript
echo "⚛️ Setting up TanStack Start frontend..."
cd frontend
if [ ! -f "package.json" ]; then
    # Initialize basic TanStack Start structure if empty
    cat << 'EOF' > package.json
{
  "name": "frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000",
    "build": "vite build",
    "check": "tsc --noEmit"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@tanstack/react-router": "^1.170.41",
    "@tanstack/react-start": "^1.168.60",
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "tailwindcss": "^4.3.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^6.1.1",
    "typescript": "^7.0.2",
    "vite": "^8.3.2"
  }
}
EOF
    cat << 'EOF' > vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
})
EOF
    mkdir -p src
    cat << 'EOF' > src/index.css
@import "tailwindcss";
EOF
    cat << 'EOF' > src/App.tsx
export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">TanStack Start + Django Stack</h1>
      <p className="text-zinc-400">Frontend running with Tailwind v4 & React 19.</p>
    </div>
  )
}
EOF
    cat << 'EOF' > src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
EOF
    cat << 'EOF' > index.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TanStack Start + Django</title>
  </head>
  <body class="bg-zinc-950 text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
    pnpm install || npm install
fi
cd ..

echo "✅ Stack initialized successfully!"
echo ""
echo "To run backend:"
echo "  cd backend && uv run python manage.py runserver"
echo ""
echo "To run frontend:"
echo "  cd frontend && pnpm dev (or npm run dev)"
