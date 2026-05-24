# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace layout

npm workspaces monorepo with two packages: `client/` (React + Vite + TS) and `server/` (Express + TS). Root `package.json` exposes orchestrator scripts; individual package scripts live in `client/package.json` and `server/package.json`.

```bash
# From repo root — runs the right workspace:
npm run dev:client      # Vite dev server on :3000 (proxies /api → :4000)
npm run dev:server      # tsx watch, Express on :4000
npm run build:client    # tsc -b && vite build → client/dist
npm run build:server    # tsc → server/dist (emitted ESM)
npm run test            # client tests, then server tests
npm run test:client     # vitest --run, jsdom
npm run test:server     # vitest --run, node

# Single test file / test name (run inside the workspace dir, not root):
cd client && npx vitest run src/hooks/useDrag.test.ts
cd server && npx vitest run -t 'login returns 401'
```

There is no separate lint step — type errors surface only via `build:client`/`build:server` or via `tsc --noEmit` in each package.

## Architecture

### Server (`server/src/`)

- `index.ts` mounts route modules under `/api/{portfolio,services,testimonials,about,newsletter,auth}` plus a static handler for `/api/uploads/portfolio`. CORS is locked to `http://localhost:3000` with `credentials: true` (cookies must round-trip). `app.listen` is skipped when `process.env.VITEST` is set, so the same `app` is exported for supertest.
- **Persistence is flat JSON files** in `server/data/` (`portfolio.json`, `services.json`, `about.json`, `testimonials.json`, `newsletter.json`). There is no database. All access goes through `store/JSONStore.ts`, which does an atomic write (`writeFile` to `.tmp` then `rename`) and treats `ENOENT` as "return defaults". Every route reads the entire file, mutates, writes it back — fine for the data volumes here, but be aware there is no write-locking, so don't introduce concurrent writers.
- **Auth = single hardcoded admin** (`ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars, defaulting to dev values in `routes/auth.ts`). Login issues a JWT signed with `JWT_SECRET` (24h) and sets it as an `httpOnly`, `sameSite: 'strict'` cookie named `token`. `middleware/auth.ts#requireAuth` reads `req.cookies.token` and gates every write endpoint. `/api/auth/verify` is what the client polls to decide whether to show the admin UI.
- **Image upload**: `POST /api/portfolio/upload` (auth required) uses multer disk storage to `data/portfolio-images/`, filename `Portfolio_<uuid>.<ext>`, 5 MB cap, mimetype/extension whitelist (jpeg|jpg|png|webp|avif). Returns `{ url: '/api/uploads/portfolio/<filename>' }`. The static mount in `index.ts` serves that path.
- Server `tsconfig.json` has `noUnusedLocals` / `noUnusedParameters` **on** and is ESM — internal imports must use `.js` extensions (`import { JSONStore } from '../store/JSONStore.js';`) even though the source is `.ts`. Tests and `src/__tests__` are excluded from the build.

### Client (`client/src/`)

- **Two UI modes, one site.** `context/ModeContext.tsx` stores `'desktop' | 'classic'` in `localStorage` under key `3drioja-nav-mode` via `hooks/useLocalStorage.ts`. `App.tsx` routes `/` to `PublicSite`, which picks `DesktopMode` (Win95 windowing) or `ClassicMode` (single-page scroll) based on that. Both modes consume the same `hooks/useApiData.ts` and render the same `components/sections/*` (Hero, About, Services, Portfolio, Testimonials, Contact, Footer). When editing a section, both modes pick up the change.
- **Admin lives on separate routes**: `/admin/` (login) and `/admin/dashboard` (protected). `AuthProvider` is mounted per-route inside `App.tsx`, not globally, so the public site never triggers `/api/auth/verify`. `ProtectedRoute` reads `useAuthContext` and redirects on `!isAuthenticated`.
- **Window system (desktop mode)**: `context/WindowContext.tsx` is a `useReducer` with actions `OPEN | CLOSE | MINIMIZE | MAXIMIZE | RESTORE | MOVE | RESIZE | FOCUS`. `OPEN` is idempotent — re-opening an existing id just re-focuses it. `FOCUS` works by bumping `zIndex` to `max+1`; `focusedWindowId` is derived as the highest-z window. `components/win95/Window.tsx` wires `hooks/useDrag.ts` (title bar) and `hooks/useResize.ts` (edge-detected from element bounds) to dispatch `MOVE`/`RESIZE` on pointerup. Both hooks use refs (`positionRef`, `isDraggingRef`, etc.) to avoid stale closures inside pointer event handlers — preserve that pattern when modifying them.
- **API layer**: `services/api.ts` is the only place `fetch` is called. Every call goes through `request<T>()`, which always sends `credentials: 'include'` (needed for the auth cookie) and always returns `ApiResponse<T> = { success, data?, error? }` — never throws. The upload endpoint is the one exception (it skips the JSON `Content-Type` so multer can set the multipart boundary). New endpoints should follow the same shape.
- **Styling**: per-component CSS Modules (`*.module.css`) plus global stylesheets in `src/styles/` (`reset.css`, `global.css`, `responsive.css`, `win95-theme.css`). The Win95 look is hand-rolled — no UI library.
- Client `tsconfig.json` is **bundler-mode** (`allowImportingTsExtensions: true`, `noEmit: true`), and `noUnusedLocals`/`noUnusedParameters` are **off** — the inverse of the server. JSX is `react-jsx` (no `import React` needed at runtime, but most files include it).

### Shared conventions

- **UI language is Spanish.** All user-facing strings, error messages, route labels, and validation messages are in Spanish. Match that when adding new copy.
- **Types are duplicated** between `client/src/types/index.ts` and `server/src/types/index.ts` (PortfolioProject, Service, Testimonial, AboutSection, NewsletterEmail, ApiResponse). When you change a shape, change both — there is no shared package.
- `ApiResponse<T>` is the contract. Clients check `res.success` before reading `res.data`. Don't throw across the wire.

## Tests

- **vitest** in both packages. Client uses `environment: 'jsdom'`, `globals: true`, with `src/test-setup.ts` providing a localStorage mock and `@testing-library/jest-dom` matchers. Server uses `environment: 'node'`.
- **Property-based tests** with `fast-check` live in `client/src/__tests__/*.property.test.{ts,tsx}` and `server/src/__tests__/*.property.test.ts` — they assert invariants of the window reducer, validators, the JSONStore, etc. When changing those modules, check whether existing properties still hold before adding example-based tests.
- **Server integration tests** (`server/src/__tests__/integration.test.ts`) construct a fresh Express app pointed at a tempdir via `mkdtemp` rather than importing the live `app` — that pattern isolates filesystem state between tests. Follow it for new route tests that mutate JSON stores.
- Tests live next to source (`Foo.tsx` + `Foo.test.tsx`); both tsconfigs explicitly exclude `**/*.test.*` and `src/__tests__` from the build.

## Environment

The server reads `PORT` (default 4000), `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` from `process.env`, all with dev defaults baked into the source — override them in production. There is no `.env` loader; whatever runs `node dist/index.js` is responsible for exporting them.

## Out-of-tree assets and scripts

- `img/` (repo root) and `client/public/images/` hold static assets used by the site; `client/index.html` and CSS reference `/images/...`.
- `scripts/scrape-reviews.mjs` is a standalone Node script that overwrites `server/data/testimonials.json` from a Google Maps fetch. Fragile (HTML-scraping); has a Playwright path commented out as the documented upgrade.
- `scripts/github-backup.sh` is a Raspberry Pi cron script that commits and pushes `main` — referenced in `backup.log` (the `chore: automated weekly backup ... [skip ci]` commits). Don't manually replicate those commits.
- `.gitignore` excludes Docker/nginx files (`docker-compose.yml`, `client/Dockerfile`, `server/Dockerfile`, `client/nginx.conf`) and `.kiro` / `.vscode` — deployment config is intentionally not in the repo.
