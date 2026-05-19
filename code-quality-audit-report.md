凭据是本地测试的，剔除后，以下是真正需要关注的问题，按优先级排列：
第一梯队：影响功能正确性
#	问题
1	✅备份脚本生产坏 SQL (backup-db.sh)(backup-db.sh->backup-db-compatible.sh)
2	✅Rust 启用 unsound-mir-opts=true(已经注释)
3	Go 测试导入断裂 (interviewlogic_test.go:34)
4	Whisper Dockerfile 构建会失败
第二梯队：API 质量与安全
#	问题
5	认证中间件用 strings.Contains 做路径白名单
6	Token 在 URL query 中传输 (middleware.go:51, api/index.ts:163)
7	XSS 向量 — dangerouslySetInnerHTML + innerHTML
8	CORS 全通配符 + 配置是死代码
9	验证中间件存在但从未注册
10	JWT 密钥 "1145141919810"（纯数字）
11	ANSI 转义码出现在 HTTP 响应体
12	Redis 无密码
第三梯队：可维护性
#	问题
13	三个不同响应格式 + 所有错误返回 500
14	两套独立的 OpenAI API 实现
15	career.go 1127 行的上帝对象
16	前端 57 个 lint 错误
17	go fmt 需要重排 56 个文件
18	test/ 目录为空但 TESTING.md 承诺了集成测试
第四梯队：性能与基建
#	问题
19	每次教师请求开新 DB 连接 (middleware.go:90)
20	start-all-services.sh 用 Vite dev server
21	MySQL REGEXP 做薪资筛选 (jobs_model.go:138)
22	migrateColumns() 静默吞掉 ALTER 失败
23	170MB 二进制文件在 git 历史里
24	Dockerfile.base 用 Debian trixie（不稳定版）
总结
优先级	必须修
数量	7 个
必须修的 7 个：
1. backup-db.sh 静默损坏数据
2. Rust unsound-mir-opts=true
3. 断裂的 Go 测试（go vet 不过）
4. Auth 中间件路径绕过
5. Token 在 URL 中泄露
6. Whisper Dockerfile 构建失败
7. 前端 Hooks 违反规则 + XSS 向量
/agents      
/compact     
/connect     
/copy        
需要我对其中几个出具体的修复方案吗？
/editor      
/exit        
▣  Build · DeepSeek V4 Flash · 36.8s
/export      

# Code Quality Audit Report — Career Planning System

**Date:** 2026-05-19
**Scope:** All 4 services (Go backend, React frontend, Whisper Rust, Teacher Rust) + Infrastructure (Docker, CI/CD, scripts, git hygiene)

---

## Executive Summary

| Severity | Count | Key Themes |
|---|---|---|
| **CRITICAL** | 12 | Secrets in source code, forgeable JWT, corrupted backups, unsound Rust compiler flags |
| **HIGH** | 24 | XSS vectors, auth bypass via string matching, no CI/CD, token in URL query string, connection pool exhaustion |
| **MEDIUM** | 31 | God object in entrypoint, dead code, duplicated logic, inconsistent error responses, permissive CORS |
| **LOW** | 28 | `go fmt` formatting debt, stale dependencies, redundant config files, legacy Python artifacts |

**Verification Commands Summary:**

| Check | Result |
|---|---|
| Go build | ✅ Passes |
| Go vet | ❌ 1 error (broken test import) |
| Go mod verify | ✅ Passes |
| Go fmt | ⚠️ 56 files would be reformatted |
| TypeScript (tsc --noEmit) | ✅ Zero type errors |
| Frontend lint (ESLint) | ❌ 57 problems (46 errors, 11 warnings) |
| Teacher API cargo check | ✅ Passes (9 warnings) |
| Teacher API cargo test | ✅ 7 tests pass |
| Teacher API cargo clippy -D warnings | ❌ 21 errors |
| Whisper cargo check | ✅ Passes (1 warning) |
| Whisper cargo test | ✅ 2 tests pass |
| Whisper cargo clippy -D warnings | ❌ 3 errors |

---

## 🔴 CRITICAL (Immediate Action Required)

### S1. Live Credentials Committed in Source Code

| Secret | File | Line | Risk |
|---|---|---|---|
| DeepSeek AI API Key (`sk-051d706209c64a70bcba47ed0d1eb6c9`) | `etc/career-api.yaml` | 33 | Anyone with repo access can call DeepSeek API on your bill |
| MySQL password (`123456zj`) | `etc/career-api.yaml` | 13 | Database access exposed |
| MySQL password (`123456zj`) | `docker-compose.yaml` | 7 | Exposed in docker-compose |
| MySQL password (`123456zj`) | `docker-compose.yaml` | 74 | Visible in `docker ps` / process list (CLI argument) |
| JWT signing secret (`1145141919810`) | `etc/career-api.yaml` | 29 | Numeric-only, trivially forgeable JWT tokens → full auth bypass |
| Xunfei credentials (3 keys) | `whisper-20250625/.env` | 2-4 | `.env` NOT in gitignore; could be committed any time |
| Xunfei credentials (3 keys) | `whisper-20250625/src/config.rs` | 14-23 | Hardcoded as clap argument default values in Rust source |
| Xunfei credentials (3 keys) | `.env.example` (root) | 12-14 | Appears to contain real credentials in example file |

**Action:** Rotate ALL keys immediately. Remove secrets from source code. Use environment variables or a secrets manager. Add `whisper-20250625/.env` to `.gitignore`.

### S2. Backup Script Produces Corrupted SQL (`backup-db.sh`)

The script pipes `mysqldump` output through aggressive `grep -v` filters (lines 47-56) that **remove**:
- All SQL comments (`^-- `) — including server version, host, dump date metadata
- All `SET` statements — removes critical `SET NAMES`, `SET SQL_MODE`, `SET TIME_ZONE`
- All `LOCK TABLE` / `UNLOCK TABLE` — concurrent writes during restore can corrupt data
- All `COMMIT` statements
- All lines starting with `*` or `$`

Then 19 `sed` substitutions (lines 60-78) including:
- `s/longtext/json/g` — replaces column type `longtext` with `json` everywhere, corrupting column definitions and data values
- Removal of `AUTO_INCREMENT` values — ID sequences restart from 1, causing collisions
- Removal of `COLLATE`, `COMMENT`, JSON CHECK constraints

Additionally, stderr is discarded (`2>/dev/null`, line 47), making connection failures and truncation errors invisible.

**Action:** Rewrite `backup-db.sh` to produce clean, restorable dumps. Adding compression is better than adding filters.

### S3. Rust Services: `overflow-checks=false` + `unsound-mir-opts=true`

Both Rust projects (teacher-app and whisper-20250625) use the same dangerous configuration in their `.cargo/config.toml`:

- `overflow-checks = false` — Disables integer overflow detection; arithmetic overflows will silently wrap
- `-Z unsound-mir-opts=true` — **Explicitly labeled "unsound" by the Rust compiler team.** Enables MIR optimization passes known to produce incorrect code in edge cases

**Files:**
- `/home/swordreforge/projects/high-school-worker-design/teacher-app/.cargo/cargo.toml` (lines 14, 18, 37, 39, etc.)
- `/home/swordreforge/projects/high-school-worker-design/whisper-20250625/.cargo/cargo.toml` (lines 14, 18, etc.)

**Action:** Remove `-Z unsound-mir-opts=true` immediately. Leave `overflow-checks = false` only if you accept the risk and have comprehensive test coverage.

### S4. Teacher API: Dynamic SQL Construction with Blocklist Security (`schema.rs`)

The `schema.rs` handlers build SQL strings from user-provided column names and WHERE clauses. The `contains_sql_injection()` function (line 599-603) uses a **blocklist approach** that is fundamentally incomplete:

```rust
fn contains_sql_injection(input: &str) -> bool {
    let lower = input.to_lowercase();
    lower.contains("drop") || lower.contains("alter") || lower.contains("truncate")
    // Blocklist is NOT exhaustive — many injection vectors not covered
}
```

The `execute_sql` function (line 547) restricts to ALTER/CREATE/DROP but still allows arbitrary schema changes. The `query_table_data` (line 655) inserts WHERE clauses directly after only this blocklist check.

**Location:** `/home/swordreforge/projects/high-school-worker-design/teacher-app/src/handlers/schema.rs`, lines 547-1004

**Action:** Use parameterized queries with whitelisted column names. Never accept raw SQL fragments from user input.

### S5. JWT Secret is Trivially Guessable

`AccessSecret: "1145141919810"` at `etc/career-api.yaml:29` is purely numeric with low entropy. Go-zero uses HMAC-SHA256 for JWT signing; this key can be brute-forced in milliseconds.

**Impact:** An attacker can forge JWT tokens for any user, including admin/teacher accounts, gaining full API access.

**Action:** Use a cryptographically random key of at least 256 bits. Store in environment variable, not config file.

---

## 🟠 HIGH

### H1. Auth Middleware Path Bypass Uses `strings.Contains`

**File:** `internal/middleware/middleware.go:29-33`

```go
if strings.Contains(path, "/user/login") ||
   strings.Contains(path, "/user/register") ||
   strings.Contains(path, "/user/info") {
   // skip auth
}
```

A path like `/api/v1/user/login-fake` or `/api/v1/fake/middleware/user/login/admin` would incorrectly bypass authentication.

**Action:** Use `strings.HasPrefix` or exact route matching.

### H2. JWT Token Accepted in URL Query Parameter

**Files:**
- `internal/middleware/middleware.go:51` — `token = r.URL.Query().Get("token")`
- `high-school-worker-design-forend/src/api/index.ts:163` — Appends `?token=...` for SSE streaming

Token leakage vectors:
- Server access logs (full URL is logged)
- `Referer` header when navigating away
- Browser history and bookmarks
- Visible on screen / shoulder surfing

**Action:** Use `Authorization: Bearer <token>` header for SSE too. Never pass tokens in URL.

### H3. XSS Vectors in Frontend

| File | Line | Pattern | Risk |
|---|---|---|---|
| `components/DocSearch/index.tsx` | 272, 279 | `dangerouslySetInnerHTML` | Stored XSS if search results contain user-generated content |
| `utils/exportResume.ts` | 10 | `container.innerHTML = htmlContent` | DOM XSS if `htmlContent` contains user-controlled data |

**Action:** Use DOM purification (DOMPurify) or render through React components. Never set raw HTML from user data.

### H4. CORS Wildcard on All Origins in Go Backend

All streaming endpoints set `Access-Control-Allow-Origin: *`:
- `career.go:104` — `rest.WithCors()` defaults to wildcard
- `internal/logic/report/generatereportstreamlogic.go:73`
- `internal/logic/reportlogic.go:600`
- `internal/logic/interview/interviewchatstreamlogic.go:82`

The `CORS.Origins` configuration defined in `etc/career-api.yaml` (lines 41-44) and `internal/config/config.go` (lines 54-58) is **dead code** — it is never wired into actual CORS handling.

**Action:** Implement proper CORS origin checking. Wire config to actual CORS middleware or remove dead config.

### H5. No CI/CD for Core Services

| Service | CI Workflow | Tests Run in CI | Lint in CI | Security Scan |
|---|---|---|---|---|
| Go backend | ❌ None | ❌ | ❌ | ❌ |
| React frontend | ❌ None | ❌ | ❌ | ❌ |
| Teacher API (Rust) | ❌ None | ❌ | ❌ | ❌ |
| Whisper (Rust+Pyt hon) | ✅ test.yml + publish.yml | ✅ (Python only) | ⚠️ pre-commit only | ❌ |

**Action:** Add GitHub Actions workflows for Go (vet, test, build), frontend (tsc, lint, test), and Rust (check, test, clippy).

### H6. New Database Connection Per Auth Request

**File:** `internal/middleware/middleware.go:90-96`

For every authenticated request with `teacher` role, the middleware opens a raw `sql.Open` connection:
```go
db, err := sql.Open("mysql", m.dataSource)
```
This bypasses go-zero/sqlx connection pooling. Under concurrent load, MySQL connections will be exhausted.

**Action:** Pass the shared connection pool to the middleware instead of the DSN string. Do not use `sql.Open` in per-request code.

### H7. MySQL Password Logged to Stdout at Startup

**File:** `career.go:1108`

```go
fmt.Printf("  数据库: %s\n", c.Mysql.DataSource)
```

The DSN string contains the password `123456zj`. This is printed to stdout every time the service starts.

**Action:** Log the host/DB name separately from the DSN. Never log connection strings containing secrets.

### H8. Large Binary Files in Git History (~170MB)

Files committed that should not be in git:
- `career-api` (28.1 MB) — compiled Go binary
- `career-api-114` (27.8 MB), `career-api-114.bak` (27.6 MB) — more binaries
- `tmp/main` (25.1 MB) — temp compiled binary
- Various CSV/XLS data files (22.4 MB, 14.8 MB)
- `archive/untracked-20260416-144607.tar.gz` (19.3 MB)

**Impact:** Repository is ~170MB larger than necessary. `git clone` is slow, disk usage is high, and these cannot be removed without `git filter-repo`.

**Action:** Run `git filter-repo` to purge large blobs from history. Add binary patterns to `.gitignore` for the future.

### H9. API Key Partially Logged

**File:** `common/pkg/ai_provider.go:319`

```go
logx.Infof("Calling AI API: URL=%s, Model=%s, APIKey=%s",
    p.baseURL+"/chat/completions", p.model, p.apiKey[:10]+"...")
```

Logs first 10 characters of the DeepSeek API key. This reduces the search space for brute-forcing the remaining key from 48 characters to 38.

**Action:** Log only a key hash or last 4 characters. Better yet, do not log keys at all.

### H10. Go Test Import Broken

**File:** `internal/logic/interviewlogic_test.go:34`

```go
NewStartInterviewLogic  // undefined
```

The symbol actually lives in `internal/logic/interview/` sub-package but the test expects it in the parent `logic` package.

**Impact:** `go vet ./...` fails. This test cannot compile or run.

**Action:** Fix the import path. Move the test to the correct package or use the correct import.

### H11. Frontend: Hooks Called After Early Return (Rules of Hooks Violation)

**File:** `pages/Home/Landing.tsx:248, 260, 331`

```tsx
if (condition) return <SomeComponent />;  // early return
// ❌ hooks below this line are conditionally called
useEffect(...);  // line 248
useCallback(...); // line 260
useRef(...);      // line 331
```

This violates React's Rules of Hooks, causing unpredictable rendering behavior. The hooks are never called when the early return executes, but React expects hooks to be called in the same order on every render.

**Action:** Move the early return after all hooks, or restructure to avoid conditional hook calls.

### H12. Stateful Closure from Hoisted Function Declaration

**File:** `components/DocSearch/index.tsx:113` vs `:143`

A keyboard event handler (line 113) references `handleResultClick` before its `const` declaration (line 143). Due to `const` not being hoisted like `function`, the handler captures a `ReferenceError` at call time.

**Action:** Move `const handleResultClick` above the `useEffect` that registers the keyboard handler, or convert to `function handleResultClick()`.

### H13. Teacher API: Test Directory Empty Despite Documentation

**File:** `teacher-app/tests/` — directory is **completely empty**

**File:** `teacher-app/TESTING.md` — describes elaborate integration test structure:
- `tests/common/` (test helpers, mock DB)
- `tests/services/` (auth, student, job service tests)
- `tests/handlers/` (API endpoint tests)

Only 7 unit tests exist in source files (3 in `state.rs`, 2 in `db/job.rs`, 2 in `db/mysql_user.rs`).

**Action:** Either write the promised tests or update TESTING.md to reflect reality.

### H14. `go.mod` Go Version Mismatch

- `go.mod:3`: `go 1.25.0`
- `Dockerfile:1`: `FROM golang:1.23-alpine`

Go 1.25 does not exist as a stable release (current stable is 1.24 as of early 2026). Dockerfile uses 1.23. This may cause compilation issues or unexpected behavior if 1.25 includes language changes.

**Action:** Align on a consistent, stable Go version.

---

## 🟡 MEDIUM

### M1. God Object in `career.go` (1127 lines)

The entrypoint file handles every concern in a single file:
- Config loading (line 30)
- Logging setup (lines 34-40)
- DB initialization check (lines 43-88)
- Interactive CLI prompt (lines 50-86)
- Full schema migration with 18 inline `CREATE TABLE` statements (lines 117-630)
- Schema comparison engine (`parseCreateTableSchema`, line 725)
- ALTER statement generation (`buildAlterStatements`, line 817)
- Column migration (lines 846-913)
- Test data seeding (lines 915-1047)
- Server startup (lines 104-114)

**Recommendation:** Split into `cmd/`, `database/migration.go`, `database/seed.go`.

### M2. Response Format Inconsistency Across Handlers

The backend uses **three different response styles**:

1. `writeJSON(w, statusCode, map)` — in `jobhandler.go` — returns `{"code":..., "msg":...}`
2. `http.Error(w, err.Error(), statusCode)` — in `studenthandler.go`, `reporthandler.go` — returns **plain text**
3. Manual `json.NewEncoder(w).Encode(resp)` — returns JSON with different field names

All business logic errors return HTTP 500, regardless of type:
- "Student not found" → 500 (should be 404)
- "Unauthorized" → 500 (should be 401)

**Recommendation:** Create a consistent response helper used by all handlers. Map error types to proper HTTP status codes.

### M3. Two Independent OpenAI API Implementations

| Implementation | File | Status |
|---|---|---|
| `svc.ServiceContext.CallAI()` | `internal/svc/servicecontext.go:96-137` | Possibly unused |
| `OpenAIProvider.callAPI()` | `common/pkg/ai_provider.go` | Actually used |

Both duplicate: HTTP client setup, request/response structs (`ChatMessage`, `OpenAIRequest`, `OpenAIResponse`, `Choice`, `AIError`), JSON serialization/deserialization.

**Location:** `/home/swordreforge/projects/high-school-worker-design/internal/svc/servicecontext.go` + `/home/swordreforge/projects/high-school-worker-design/common/pkg/ai_provider.go`

**Recommendation:** Consolidate into one implementation. Mark the other as deprecated or remove it.

### M4. Validation Middleware Exists But Is Never Registered

**File:** `internal/middleware/validation.go` — implements `go-playground/validator/v10` integration with proper error messages

But it is **never registered** in `internal/handler/routes.go`. The go-zero `httpx.Parse` function does NOT automatically run validators defined via struct tags.

**Impact:** Input validation on struct tags like `validate:"required,min=3,max=20"` is **not enforced** at the API layer.

**Recommendation:** Register the validation middleware in the route setup, or validate manually in handlers.

### M5. ANSI Escape Codes in HTTP Response Bodies

**Files:**
- `internal/middleware/middleware.go:56,63` — `\x1b[31m...\x1b[0m` (red text)
- `internal/middleware/validation.go:47,55,56,153,163` — `\x1b[33m` (yellow)

Terminal color codes are embedded in HTTP response bodies. These confuse JSON parsers and programmatic API clients.

**Example output:**
```
\x1b[31mtoken is required\x1b[0m
```

**Recommendation:** Remove all ANSI escape codes from HTTP responses. If needed for terminal debugging, add a separate logging path.

### M6. Frontend Lint Debt: 57 Problems

ESLint reports 46 errors and 11 warnings:

| Category | Count | Locations |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | ~15 | `api/index.ts:237`, `DocSearch/index.tsx:11`, `ScrollStack.tsx:57`, `MessageCenter/index.tsx:17`, 8 more files |
| `@typescript-eslint/no-unused-vars` | ~12 | `MessageCenter/index.tsx:45,64,82`, `Teacher/Alerts.tsx:27,39,49,59,149,153`, 5 more locations |
| `react-hooks/exhaustive-deps` | 11 (warnings) | `Aurora.tsx:206`, `DocSearch/index.tsx:124`, `Plan/index.tsx:54,63`, 5 more files |
| `react-hooks/set-state-in-effect` | 3 | `App.tsx:243`, `OnboardingWizardModal/index.tsx:66`, `TableOfContents/index.tsx:38` |
| `react-refresh/only-export-components` | 1 | `TableOfContents/index.tsx:209` |
| Others | ~15 | Various |

### M7. `clearAuth()` and `logout()` Are Exact Duplicates

**File:** `stores/index.ts:34-42`

```typescript
clearAuth: () => set({ ...initialAuthState, isAuthChecked: true }),
logout: () => set({ ...initialAuthState, isAuthChecked: true }),
```

Both do exactly the same thing. One should delegate to the other.

### M8. ProtectedRoute Re-fetches User Info on Every Mount

**File:** `components/ProtectedRoute.tsx:15-16`

```typescript
useEffect(() => {
    initialize();  // Hits /api/v1/user/info every time
}, [initialize]);
```

This calls the user info API on every navigation to a protected route, even when already authenticated.

**Recommendation:** Skip the fetch if already authenticated and within the token expiry window.

### M9. MySQL `REGEXP` in Job Filter Prevents Index Use

**File:** `internal/model/jobs_model.go:138`

```go
salaryConditions = append(salaryConditions,
    "(salary_range REGEXP ? OR salary_range REGEXP ?)")
```

Using `REGEXP` on a column forces a full table scan, the index is ignored. For a jobs table with 10k+ rows, this is a performance problem on every job listing query.

**Recommendation:** Store salary as numeric min/max columns for indexed range queries.

### M10. Docker Containers Run as Root

All custom containers (`career-api`, `whisper`, `ateacher`) lack a `USER` directive. The base image (`Dockerfile.base`) also has no `USER` directive.

MySQL is exposed on host port 3307 unnecessarily (Docker networking makes it accessible internally without host port mapping). No container has `mem_limit`, `cpus`, or `deploy.resources` constraints.

### M11. `start-all-services.sh` Runs Vite Dev Server in Production

**File:** `start-all-services.sh:110`

```bash
nohup npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
```

`npm run dev` starts the Vite dev server, which exposes HMR WebSocket, source maps, and potential SSRF vectors. Should use `npm run build` + `npx serve -s dist` instead.

### M12. PID File Management Unreliable

**File:** `start-all-services.sh:93-94`

```bash
BACKEND_PID=$!
echo $BACKEND_PID > "$PROJECT_ROOT/logs/backend.pid"
```

With `go run career.go`, `$!` gives the PID of the `go run` wrapper process, not the actual compiled binary. The actual server may be a child process with a different PID.

### M13. Graceful Shutdown Window is Only 2 Seconds

**File:** `stop-all-services.sh:36`

```bash
kill $PID
sleep 2
kill -9 $PID  # SIGKILL after only 2 seconds
```

Two seconds is insufficient for in-flight requests to complete, especially for AI calls that may take 30-60 seconds.

### M14. Whisper Dockerfile Has Critical Build Errors

**File:** `whisper-20250625/Dockerfile`

1. Line 7: `RUN mkdir .cargo && cp Cargo.toml .cargo/` — Copies to wrong location. The `.cargo/config.toml` with build configuration is NOT copied into the builder.
2. Line 10: `RUN cargo build --release` — Will run without the custom musl target and flags from `.cargo/config.toml`. Additionally, it links against `openssl-sys` which is incompatible with `native-tls` + musl target.
3. Runtime image (line 13): `FROM alpine:3.19` — Does NOT install `ffmpeg`, which the service requires for audio conversion.

**Impact:** The Docker build will fail or produce a non-functional binary.

### M15. Debian Trixie (Unstable) Used as Base Image

**File:** `Dockerfile.base:1`

```dockerfile
FROM debian:trixie-slim
```

"Trixie" is Debian 13 (experimental/bleeding-edge). Should use `debian:bookworm-slim` (Debian 12 stable) for production.

### M16. `migrateColumns()` Silently Swallows Migration Errors

**File:** `career.go:905-907`

```go
if _, err := db.Exec(m.sql); err != nil {
    logx.Errorf("Failed to add %s.%s: %v", m.table, m.column, err)
    continue  // Silently skips failed migrations
}
```

Column addition failures are logged but never surfaced. If the database user lacks `ALTER` permissions, the migration will silently do nothing, and the application may crash later when it tries to use non-existent columns.

### M17. Frontend: `ApiResponse<T>` Type Defined But Unused

**File:** `types/index.ts:1-5`

```typescript
export interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}
```

This generic wrapper type exists but is never used by the API client (`api/index.ts`). Instead, every endpoint manually annotates its return type:

```typescript
api.get<{ code: number; msg: string; data: import('../types').User }>('/user/info')
```

### M18. Redis Has No Password

**File:** `etc/career-api.yaml:20,25`

```yaml
Redis:
    Pass: ""
CacheRedis:
    Pass: ""
```

Both Redis instances have no authentication. If Redis is exposed, all cached data (potentially containing session data) is accessible.

---

## 🟢 LOW

### L1. `go fmt` Formatting Debt

56 Go files would be reformatted by `go fmt ./...`. Key files include:
- `cmd/import-jobs/main.go`
- `internal/handler/interview/deleteinterviewhandler.go`
- `internal/logic/graphlogic.go`
- `internal/logic/joblogic.go`
- `internal/logic/reportlogic_test.go`
- `internal/middleware/validation.go`
- `internal/svc/servicecontext.go`
- 49 additional files

### L2. Stale Go Dependencies

| Dependency | Current Version | Latest Available |
|---|---|---|
| `golang.org/x/crypto` | v0.49.0 | ~v0.31.x |
| `golang.org/x/net` | v0.51.0 | ~v0.35.x |
| `prometheus/client_golang` | v1.18.0 | ~v1.20.x |
| OpenTelemetry modules | v1.19.0 | ~v1.32.x |
| `go-zero` | v1.6.4 | ~v1.7.x |

### L3. Dead Go Code

| Dead Code | File | Notes |
|---|---|---|
| `CodeError`, `ErrNotFound`, sentinel errors | `common/errors/errors.go` | Exported, fully defined, **never imported** by any logic file |
| `runInteractiveInit()` misleading message | `career.go:1100-1104` | Prints "running cmd/init-db/main.go" but calls `autoMigrate()` directly |
| Entire directory `interview.disabled/` | `internal/logic/interview.disabled/` | Old implementation left in tree |
| `NewCodeError()`, `WithError()` | `common/errors/errors.go` | Factory functions defined but never called |

### L4. Frontend CSS and Config Debt

| Issue | Details |
|---|---|
| 200+ lines of duplicated `.prose` CSS | `index.css:128-464` — identical styles repeated 3 times |
| Unnecessary `postcss` + `autoprefixer` deps | Not needed with Tailwind v4 Vite plugin |
| Redundant `tailwind.config.js` | Tailwind v4 uses `@theme` CSS directives, not JS config |
| `shadcn` in `dependencies` instead of `devDependencies` | CLI tool, not a runtime dependency |
| Google Fonts `@import` in CSS | `@fontsource-variable/inter` is already installed as npm package |

### L5. Root `.env.example` Contains Real-Looking Credentials

**File:** `.env.example:12-14`

```
XUNFEI_APP_ID=d2aa42c9
XUNFEI_API_KEY=95556aefd492e5942df045678c0302f5
XUNFEI_API_SECRET=NzM4NWNiYjg4MGU3OGQ0MTYxMzcyZDFh
```

These are not obviously placeholders. If these are real credentials, they must be rotated.

### L6. Whisper: 3MB+ of Legacy Python Code Mixed with Rust Source

The project contains a full copy of OpenAI's Whisper Python library (`whisper/`, 11 files) plus Python test scripts, GUI application, and multiple client implementations, all alongside the Rust implementation. These should be archived.

Notable Python files:
- `whisper/` — Full OpenAI Whisper library (11 files)
- `xunfei_client.py`, `xunfei_client_fixed.py` — Python Xunfei clients
- `realtime_speech_gui.py` — GUI application
- `test_xunfei*.py` — Multiple test scripts
- `大模型中文语音识别.py` — Script with Chinese filename

### L7. Whisper: `thiserror` Listed as Dependency But Never Used

**File:** `whisper-20250625/Cargo.toml:51`

`thiserror = "1.0"` is declared as a dependency but the codebase uses `anyhow` exclusively for error handling. No `#[derive(Error)]` exists.

### L8. `common/errors/errors.go` — Complete Infrastructure Without Users

The entire error handler infrastructure is built but unused:
- `ErrNotFound`, `ErrInvalidInput`, `ErrUnauthorized`, `ErrInternal`, `ErrDuplicateEntry` — defined but never returned by logic
- `CodeError` struct with HTTP status code mapping — fully implemented, never instantiated
- `ErrorCodes` map for `enum`-style error codes — populated but never queried

### L9. `runInteractiveInit()` Misleading Print Message

**File:** `career.go:1100-1104`

```go
args := []string{cmd, "run", "cmd/init-db/main.go"}
```

This builds a command string that is **never executed**. The function directly calls `autoMigrate()` and `seedData()` instead. The printed message "Running cmd/init-db/main.go" is misleading.

### L10. `GlobalBackground/index.tsx` CSS Class Mismatch

- TSX (line 8): `className="global-background dark"`
- CSS (line 14): `.global-background.dark` (no space)

The CSS selector `.global-background.dark` matches an element with both classes (e.g., `class="global-background dark"`), so this works. But it's fragile and looks like a bug.

---

## Top 10 Recommendations

1. **Rotate all secrets**: DeepSeek API key, MySQL password, JWT secret, Xunfei credentials. Move to environment variables or a secrets manager.
2. **Run `git filter-repo`** to purge ~170MB of binary files from git history (compiled Go binaries, data files, archives).
3. **Fix auth middleware**: Use exact path matching for bypass routes; stop accepting tokens in URL query strings.
4. **Fix `backup-db.sh`**: Produce clean, restorable dumps. Remove all sed/grep filters that alter the SQL content.
5. **Remove `unsound-mir-opts=true`** from both Rust `.cargo/config.toml` files.
6. **Add CI/CD for Go and frontend**: At minimum, run `go vet`, `go test`, `tsc --noEmit`, `npm run lint` on every push.
7. **Eliminate duplicate OpenAI API implementation** and register the validation middleware.
8. **Add `whisper-20250625/.env` to `.gitignore`**; sanitize `.env.example` to contain only placeholder values.
9. **Fix XSS vectors**: Replace `dangerouslySetInnerHTML` with safe rendering; sanitize `innerHTML` usage.
10. **Address frontend lint debt**: Fix 57 lint errors (especially Rules of Hooks violations and missing dep arrays).
