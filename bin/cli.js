#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(chalk.cyan.bold('\n🚀 TanStack + Django Stack Init CLI\n'));

async function main() {
  try {
    // Step 1: Project name
    const { projectName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'my-fullstack-app',
        validate: (input) => {
          if (!input.trim()) return 'Project name cannot be empty';
          if (!/^[a-zA-Z0-9_-]+$/.test(input)) return 'Project name can only contain letters, numbers, dashes, and underscores';
          return true;
        }
      }
    ]);

    // Step 2: Setup type
    const { setupType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'setupType',
        message: 'What would you like to set up?',
        choices: [
          { name: 'Full-stack (Frontend + Backend + Database)', value: 'fullstack' },
          { name: 'Frontend only (TanStack Start + React + Tailwind)', value: 'frontend' },
          { name: 'Backend only (Django + uv + ruff)', value: 'backend' },
          { name: 'Backend + Database (Django + PostgreSQL)', value: 'backend-db' }
        ]
      }
    ]);

    const targetDir = path.resolve(process.cwd(), projectName);

    if (fs.existsSync(targetDir)) {
      console.log(chalk.red(`\n❌ Directory '${projectName}' already exists!\n`));
      process.exit(1);
    }

    fs.mkdirSync(targetDir, { recursive: true });
    console.log(chalk.green(`\n✓ Created directory: ${projectName}\n`));

    // Setup based on selection
    if (setupType === 'fullstack') {
      await setupFullStack(targetDir, projectName);
    } else if (setupType === 'frontend') {
      await setupFrontend(targetDir, projectName);
    } else if (setupType === 'backend') {
      await setupBackend(targetDir, projectName);
    } else if (setupType === 'backend-db') {
      await setupBackendWithDB(targetDir, projectName);
    }

    // Initialize git
    const spinner = ora('Initializing git repository...').start();
    try {
      execSync('git init', { cwd: targetDir, stdio: 'ignore' });
      execSync('git config user.email "dev@localhost"', { cwd: targetDir, stdio: 'ignore' });
      execSync('git config user.name "Developer"', { cwd: targetDir, stdio: 'ignore' });
      execSync('git add .', { cwd: targetDir, stdio: 'ignore' });
      execSync('git commit -m "Initial commit: Project scaffolding"', { cwd: targetDir, stdio: 'ignore' });
      spinner.succeed('Git repository initialized');
    } catch (err) {
      spinner.fail('Git initialization failed (optional)');
    }

    console.log(chalk.green.bold('\n✨ Project scaffolding complete!\n'));
    console.log(chalk.cyan(`📁 Navigate to your project:`));
    console.log(chalk.gray(`   cd ${projectName}\n`));

    if (setupType.includes('backend') || setupType === 'fullstack') {
      console.log(chalk.cyan(`🐍 Backend (Django):`));
      console.log(chalk.gray(`   cd backend && uv run python manage.py runserver\n`));
    }

    if (setupType === 'fullstack' || setupType === 'backend-db') {
      console.log(chalk.cyan(`🐘 Start PostgreSQL:`));
      console.log(chalk.gray(`   docker compose up -d db\n`));
    }

    if (setupType.includes('frontend') || setupType === 'fullstack') {
      console.log(chalk.cyan(`⚛️ Frontend (TanStack Start):`));
      console.log(chalk.gray(`   cd frontend && pnpm dev\n`));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

async function setupFullStack(targetDir, projectName) {
  console.log(chalk.blue('\n📦 Setting up Full-Stack...\n'));

  // Docker Compose
  await createDockerCompose(targetDir, projectName);

  // Backend
  await createBackend(targetDir, projectName);

  // Frontend
  await createFrontend(targetDir, projectName);
}

async function setupFrontend(targetDir, projectName) {
  console.log(chalk.blue('\n📦 Setting up Frontend...\n'));
  await createFrontend(targetDir, projectName);
}

async function setupBackend(targetDir, projectName) {
  console.log(chalk.blue('\n📦 Setting up Backend...\n'));
  await createBackend(targetDir, projectName);
}

async function setupBackendWithDB(targetDir, projectName) {
  console.log(chalk.blue('\n📦 Setting up Backend + Database...\n'));
  await createDockerCompose(targetDir, projectName);
  await createBackend(targetDir, projectName);
}

async function createDockerCompose(targetDir, projectName) {
  const spinner = ora('Creating Docker Compose configuration...').start();

  const dockerComposeContent = `version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: ${projectName}_postgres
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
`;

  fs.writeFileSync(path.join(targetDir, 'docker-compose.yml'), dockerComposeContent);
  spinner.succeed('Docker Compose created');
}

async function createBackend(targetDir, projectName) {
  const spinner = ora('Setting up Django backend...').start();

  const backendDir = path.join(targetDir, 'backend');
  fs.mkdirSync(backendDir, { recursive: true });

  try {
    execSync('uv init --lib --no-readme --name backend', { cwd: backendDir, stdio: 'pipe' });
    spinner.text = 'Installing backend dependencies...';
    execSync('uv add django psycopg2-binary ruff python-dotenv', { cwd: backendDir, stdio: 'pipe' });
    spinner.text = 'Initializing Django project...';
    execSync('uv run django-admin startproject core .', { cwd: backendDir, stdio: 'pipe' });

    // Create .env.example
    const envContent = `DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/appdb
`;
    fs.writeFileSync(path.join(backendDir, '.env.example'), envContent);
    fs.copyFileSync(path.join(backendDir, '.env.example'), path.join(backendDir, '.env'));

    // Create .gitignore
    const gitignoreContent = `.venv/
*.pyc
__pycache__/
db.sqlite3
.env
.DS_Store
`;
    fs.writeFileSync(path.join(backendDir, '.gitignore'), gitignoreContent);

    spinner.succeed('Django backend created successfully');
  } catch (err) {
    spinner.fail('Backend setup failed');
    console.error(chalk.red('Make sure `uv` is installed: https://docs.astral.sh/uv/getting-started/'));
    throw err;
  }
}

async function createFrontend(targetDir, projectName) {
  const spinner = ora('Setting up TanStack Start frontend...').start();

  const frontendDir = path.join(targetDir, 'frontend');
  fs.mkdirSync(frontendDir, { recursive: true });
  fs.mkdirSync(path.join(frontendDir, 'src'), { recursive: true });

  // Package.json
  const packageJsonContent = {
    name: `${projectName}-frontend`,
    private: true,
    type: "module",
    scripts: {
      dev: "vite --host 0.0.0.0 --port 3000",
      build: "vite build",
      preview: "vite preview --host 0.0.0.0 --port 3000",
      check: "tsc --noEmit"
    },
    dependencies: {
      "@tailwindcss/vite": "^4.3.3",
      "@tanstack/react-router": "^1.170.41",
      "@tanstack/react-start": "^1.169.4",
      "react": "^19.3.0",
      "react-dom": "^19.3.0",
      "tailwindcss": "^4.3.3"
    },
    devDependencies: {
      "@vitejs/plugin-react": "^6.1.1",
      "typescript": "^7.0.2",
      "vite": "^8.3.2"
    }
  };
  fs.writeFileSync(path.join(frontendDir, 'package.json'), JSON.stringify(packageJsonContent, null, 2));

  // Vite config
  const viteConfigContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/api/, '')
      }
    }
  }
})
`;
  fs.writeFileSync(path.join(frontendDir, 'vite.config.ts'), viteConfigContent);

  // tsconfig.json
  const tsconfigContent = {
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      resolveJsonModule: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true
    }
  };
  fs.writeFileSync(path.join(frontendDir, 'tsconfig.json'), JSON.stringify(tsconfigContent, null, 2));

  // Tailwind CSS
  fs.writeFileSync(path.join(frontendDir, 'src', 'index.css'), `@import "tailwindcss";\n`);

  // React App
  const appTsxContent = `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          TanStack Start + Django
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          Full-stack scaffolding with Tailwind CSS v4, React 19 & TypeScript
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-400">Frontend</p>
            <p className="text-lg font-semibold">⚛️ React 19</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-400">Backend</p>
            <p className="text-lg font-semibold">🐍 Django</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-400">Styling</p>
            <p className="text-lg font-semibold">🎨 Tailwind v4</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-400">Database</p>
            <p className="text-lg font-semibold">🐘 PostgreSQL</p>
          </div>
        </div>
      </div>
    </div>
  )
}
`;
  fs.writeFileSync(path.join(frontendDir, 'src', 'App.tsx'), appTsxContent);

  // Main
  const mainTsxContent = `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
`;
  fs.writeFileSync(path.join(frontendDir, 'src', 'main.tsx'), mainTsxContent);

  // HTML
  const indexHtmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TanStack Start + Django</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  fs.writeFileSync(path.join(frontendDir, 'index.html'), indexHtmlContent);

  // .gitignore
  const gitignoreContent = `node_modules/
dist/
*.log
.DS_Store
.env.local
`;
  fs.writeFileSync(path.join(frontendDir, '.gitignore'), gitignoreContent);

  spinner.text = 'Installing frontend dependencies...';
  try {
    execSync('pnpm install 2>&1 || npm install 2>&1', { cwd: frontendDir, stdio: 'pipe' });
    spinner.succeed('Frontend created successfully');
  } catch (err) {
    spinner.warn('Frontend files created, but dependency installation had issues');
    console.log(chalk.yellow('Run `pnpm install` or `npm install` manually in the frontend directory'));
  }
}

main();
