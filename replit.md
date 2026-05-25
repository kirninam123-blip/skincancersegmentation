# DermaAI — Skin Cancer Detection Dashboard

AI-powered skin cancer detection and dermatology management platform built for Pakistan's medical community.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000/8080)
- `pnpm --filter @workspace/derma-ai run dev` — run the frontend (port 25899)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + pino logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Frontend: React + Vite + Tailwind v4 (dark-only theme)
- Charts: Recharts (LineChart, PieChart)
- State: TanStack Query v5
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas (from codegen)
- `lib/api-client-react/src/generated/` — generated React Query hooks (from codegen)
- `lib/db/src/schema/` — Drizzle DB schema (analyses, doctors, chat_messages)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/derma-ai/src/pages/` — React pages (Dashboard, Analyze, Doctors, History, Profile)
- `artifacts/derma-ai/src/index.css` — Tailwind v4 CSS vars (dark navy/purple theme)

## Architecture decisions

- Dark mode always forced via `document.documentElement.classList.add('dark')` in main.tsx — no toggle needed
- AI analysis is simulated server-side (no real ML model): random picks from 6 skin condition categories
- Doctors page falls back to hardcoded Pakistani doctors array if DB is empty
- Patient IDs format: `PMS-YYYY-XXXXX`, Report IDs: `REP-YYYY-XXXXX`
- All timestamps shown in PST (UTC+5) per Pakistan user requirement
- `@apply dark` does NOT work in Tailwind v4 — use JS classList.add instead

## Product

- Dashboard with live skin lesion upload + AI analysis (drag-and-drop)
- Pakistani doctors directory (city filtering, contact actions)
- Analysis history with search, date filtering, and detail view
- AI Doctor chatbot assistant
- Explainable AI panel (why this prediction)
- Risk factor inputs (sun exposure, skin type, family history)
- Risk progress prediction chart (timeline)
- Similar case finder
- Multi-image comparison (before/after)
- Emergency alerts for high-risk cases
- PDF report generation (with QR code verification)
- Profile management (settings, notifications, password, security)

## User preferences

- Pakistan-focused: all doctor data is Pakistani hospitals, PST timezone
- Dark-only theme (navy #0d1117 background, purple #7c3aed primary)
- Full-featured dashboard on a single page — not split across many micro-pages

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` whenever openapi.yaml changes
- Generated Zod schema names may differ from intuitive names — check `lib/api-zod/src/generated/api.ts` exports
- `@apply dark` throws in Tailwind v4 — set dark class via JavaScript
- `pnpm run build` requires workflow-provided `PORT` env var; use `typecheck` for CLI validation

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
