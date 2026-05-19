# AGENTS.md — Career Planning System

## Architecture: 4 Services in One Monorepo

| Service | Language | Port | Directory |
|---|---|---|---|
| Backend API | Go (go-zero) | 8088 | `.` (root) |
| Frontend | React 19 / Vite 8 | 5173 | `high-school-worker-design-forend/` |
| Voice (Whisper/Xunfei) | Rust (Axum) | 8000 | `whisper-20250625/` |
| Teacher API(actually admin-api) | Rust (Actix-web) | 8081 | `teacher-app/` |

The **root directory IS the Go backend**. Do not run frontend/rust commands from root.

## Key Commands by Service

**Backend (Go):**

- Run: `go run career.go -f etc/career-api.yaml`
- Run (skip DB prompts): `go run career.go -f etc/career-api.yaml -skip-all`
- Build: `go build -o career-api .`
- Test a package: `go test ./internal/...`
- Test single: `go test ./internal/pkg/jwt_test.go`
- AI connection test: `go run cmd/test-ai/main.go`
- Config: `etc/career-api.yaml`
- Entrypoint: `career.go`

**Frontend (React/Vite):**
- Run: `npm run dev` (inside `high-school-worker-design-forend/`)
- Build: `npm run build` (runs `tsc -b && vite build`)
- Staging build: `npm run build:staging`
- Lint: `npm run lint` (ESLint from `high-school-worker-design-forend/`)
- E2E: `npx playwright test`
- Path alias: `@/` → `./src/` (configured in vite.config.ts + tsconfig.json)
- Tauri desktop: `npm run tauri` + binary in `src-tauri/`

**Voice Service (Rust):**
- Run: `python3 web_app.py` (from `whisper-20250625/`)
- Rust server binary: `cargo run` (via `src/main.rs`)

**Teacher API (Rust/Actix):**
- Run: `cargo run --release -- --port 8081` (from `teacher-app/`)
- Or: `./target/release/teacher-api --port 8081`

**All services:** `./start-all-services.sh` (logs go to `logs/`)

## Database

- **MySQL** on `localhost:3306` (Docker maps `3307:3306`)
- Credentials: `root:123456zj@tcp(localhost:3306)/career_db`
- **Schema is defined inline** in `career.go` → `autoMigrate()` function creates all 20+ tables programmatically. No migration files exist. To change schema, edit career.go.
- On startup: auto-creates DB, runs migration, seeds test data (user `testuser`/`123456`, test school, 10 sample jobs)
- Docker compose starts MySQL with health check before API container

## API Structure

- go-zero API definitions in `api/*.api` (documentation/spec)
- Handlers in `internal/handler/`, logic in `internal/logic/`
- All endpoints under `/api/v1/` prefix
- JWT auth (Bearer token), configured in `etc/career-api.yaml`
- Key modules: jobs, students, match, reports, holland test, interview, chat, teachers

## Frontend Conventions

- **Ant Design v6** with custom Material 3-style theme (defined in `App.tsx`)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (not PostCSS v3 approach)
- State: **zustand** stores in `src/stores/`
- Routing: **react-router-dom v7** with `BrowserRouter`
- API client: axios wrapper in `src/api/index.ts`, base URL from `VITE_API_BASE_URL` env var (defaults to `/api/v1`)
- Framermotion + Lenis for animations

## Developer Notes

- DeepSeek AI API key in `etc/career-api.yaml` (live key — do not commit)
- Prometheus metrics on port 9091
- Redis used for caching (localhost:6379)
- Docs at `docs/` — but consult config + code as executable truth
- `elysia-doc/` is a separate Vitepress docs site, not part of the main app
- `cmd/` contains utility binaries: `import-jobs`, `init-db`, `test-ai`, `test-interview`, `test-stream`
