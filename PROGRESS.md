# CV Management System — Project Progress

**Itransition Training Programme — Course Project**
**Student:** Shahriar Hossain Arafat
**GitHub:** https://github.com/ShArafat58/CV-Management-System
**Live (Render):** https://cv-management-system-zlfk.onrender.com

**STATUS: ALL 12 STEPS COMPLETE — core done + optional extras + live deployed.**

---

## Tech Stack (locked)

| Layer | Choice | Why (for defense) |
|-------|--------|-------------------|
| Frontend | React + Vite + TypeScript | React required for JS group; Vite is fast |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | Easy responsive + dark mode |
| Backend | Node + Express 5 + TypeScript | Single service, same-origin auth |
| ORM | Prisma 6 | Type-safe, clean migrations |
| Database | Neon PostgreSQL | Relational, native full-text search |
| Auth | Passport.js (Google + GitHub OAuth) | Industry-standard, 2 providers |
| Realtime | Socket.IO | For discussions |
| Deploy | Render (single web service) | Server serves the built client |

**Key libraries added:** axios, react-router-dom, react-i18next, lucide-react, react-markdown, react-tag-autocomplete, date-fns, socket.io / socket.io-client, papaparse (CSV), jspdf (PDF), qrcode (QR)

---

## DONE (all 12 steps)

### Step 1 — Scaffold + Hello World Deploy
- Monorepo: `client/` (React+Vite+TS) + `server/` (Express+TS)
- Tailwind v4 setup (`@import "tailwindcss"`, vite plugin)
- Express server serves static files from `client/dist`
- Express 5 SPA fallback uses `app.use()` (NOT `app.get("*")`)
- GitHub repo + live deploy on Render
- Root `package.json` build script: install server -> install client -> build client

### Step 2 — Database Schema (Prisma)
- 10 models: User, Profile, Attribute, AttributeValue, Project, Position, PositionAttribute, Cv, Post, Like
- Key design decisions:
  - `@@unique([userId, positionId])` on Cv -> one candidate can have only one CV per position
  - `@@unique([cvId, recruiterId])` on Like -> one recruiter can like a CV only once
  - `version Int` on Profile and Position -> for **optimistic locking**
  - `accessRules Json` and `options String[]` -> flexible structure
  - `onDelete: Cascade` -> deleting a User removes all related data
- Migration applied to Neon (`prisma migrate dev --name init`)
- `server/src/db.ts` -> single shared PrismaClient instance

### Step 3 — Authentication + Roles
- Passport.js with Google + GitHub OAuth (2 providers, requirement)
- `server/src/auth.ts` -> strategies + findOrCreateUser (auto-creates an empty Profile with each new user)
- `server/src/authRoutes.ts` -> /google, /github, /callback, /me, /logout
- `express-session` -> session cookie; serialize/deserialize stores only the user id
- `server/src/middleware.ts` -> `requireAuth` and `requireRole(...roles)`, both check for blocked users
- 3 roles: CANDIDATE (default), RECRUITER, ADMIN
- NOTE: sessions are in-memory, so a server restart logs everyone out (fine for dev/course)

### Step 4 — App Shell (frontend structure)
- `client/src/lib/api.ts` -> axios instance (`baseURL: /api`, `withCredentials: true`)
- Vite proxy: `/api` -> `localhost:3000` (preserves cookies)
- Tailwind v4 dark mode: `@custom-variant dark (&:where(.dark, .dark *))`
- `AuthContext` -> who is logged in (user, loading, refresh, logout)
- `ThemeContext` -> light/dark, remembered in localStorage
- i18n (react-i18next) -> English (default) + Bengali, language remembered in localStorage
- `Header` -> logo, nav links, full-text search box, theme toggle, language toggle, login dropdown (Google/GitHub), logout
- `Layout` -> Header + `<Outlet/>`, responsive, light+dark
- Routing -> Home, Positions, Profile, MyCvs, Search, NotFound, Attributes, /cvs/:id, /positions/:id

### Step 5 — Killer Feature #1: Attribute Library
- **Backend** `server/src/attributeRoutes.ts` (`/api/attributes`):
  - GET `/` -> list, prefix search (`startsWith` insensitive), category filter, `select` (no SELECT *)
  - GET `/recent` -> 5 latest
  - POST/PUT/DELETE -> RECRUITER+ADMIN only (`requireRole`)
  - Validation: unique name, enum check, ONE_OF_MANY requires non-empty options; duplicate -> 409, not found -> 404; DELETE blocks built-in (403)
- **Frontend** `client/src/pages/AttributeLibrary.tsx` + `components/attributes/`:
  - **Table view** (not tiles); **no buttons in rows** — checkbox + toolbar (0 -> New; 1 -> Edit+Delete; >1 -> Delete)
  - Modal form, options editor for ONE_OF_MANY; search + category filter; candidates read-only

### Step 6 — Personal Profile
- **Schema change:** added `isBuiltIn Boolean @default(false)` to Attribute (migration `add_builtin_flag`)
- **Seed** `server/prisma/seed.ts` -> 4 built-in attributes (First Name, Last Name, Location, Personal Photo) via `upsert`; run `npx tsx prisma/seed.ts`
- **Backend** `server/src/profileRoutes.ts` (`/api/profile`, requireAuth):
  - GET `/` -> full profile + builtInAttributes; creates empty profile if missing
  - PUT `/values` -> **auto-save with optimistic locking** ($transaction, 409 version_conflict)
  - POST/PUT/DELETE `/projects`; GET `/project-tags` (distinct, no loop query)
- **Frontend** `client/src/pages/Profile.tsx` + `components/profile/ProjectsTab.tsx`:
  - 3 tabs: Me (built-in), Info (library attrs + picker), Projects
  - Auto-save debounced ~2s ("Saving"/"Saved"); 409 -> red banner + Reload
  - Projects: table + toolbar, markdown description (react-markdown preview), tag autocomplete

### Step 7 — Killer Feature #2: Positions
- **Backend** `server/src/positionRoutes.ts` (`/api/positions`):
  - GET `/` (?search, `_count.cvs`, no loop query), GET `/:id` (attributes by sortOrder)
  - POST `/` ($transaction), POST `/:id/duplicate`, PUT `/:id` (**optimistic locking**, attributeIds full replace), DELETE
  - Positions are SHARED (any recruiter/admin edits/deletes)
- **Frontend** `client/src/pages/Positions.tsx` + `components/positions/`:
  - Table + toolbar (no row buttons)
  - PositionModal: title, description, Public/Restricted, attribute picker, maxProjects, projectTags
  - **AccessRuleEditor:** operators depend on dataType (NUMERIC >,>=,<,<=,= ; BOOLEAN/ONE_OF_MANY = ; STRING/TEXT contains,= ; DATE >,<,=); value input adapts

### Step 8 — Killer Feature #3: CV Generation
- **Backend** `server/src/cvRoutes.ts` (`/api/cvs`, requireAuth):
  - Helper `candidateMeetsAccessRules` -> numeric/=/contains, ALL rules AND
  - GET `/` (my CVs + `_count.likes`); GET `/available-positions` (public OR passes rules, no loop query)
  - POST `/` (403 not_eligible, 409 cv_exists, adds missing attrs to profile via createMany skipDuplicates)
  - GET `/:id` (assembled CV, `canEdit`, projects filtered by tags + maxProjects)
  - PUT `/:id/value` -> writes **master value into owner's profile**; DELETE owner/admin only
- **Frontend** `client/src/pages/MyCvs.tsx`, `pages/CvView.tsx`, `components/cvs/`:
  - My CVs: table + toolbar; New CV modal (available positions; handles not_eligible/cv_exists)
  - CvView: structured CV doc; inline edit per dataType when canEdit, read-only for recruiters
  - **Empty values highlighted RED**; projects read-only with markdown + tag chips

### Step 9 — Discussions + Likes
- **Socket.IO:** Express wrapped in `createServer(app)`, Socket.IO with CORS; `httpServer.listen`; helper `server/src/socket.ts` (`setIo`/`getIo`)
- Rooms `position:<id>` (join/leave) -> broadcasts reach only that position's viewers
- **Backend** `discussionRoutes.ts` (`/api/discussions`): GET/POST `/:positionId`; POST broadcasts `new_post` to the room
- **Backend** `likeRoutes.ts` (`/api/likes`): POST `/:cvId/toggle` (RECRUITER/ADMIN), GET `/:cvId`; `@@unique([cvId, recruiterId])` = one like per recruiter per CV at DB level
- **Frontend:** `lib/socket.ts` singleton; `PositionDetail.tsx` (Details + Discussion tabs); `Discussion.tsx` (join/leave room, append `new_post` dedup by id, markdown); CvView like heart (recruiter toggle, candidate read-only)
- **Duplicate avoidance:** sender relies on the socket broadcast, not local append

### Step 10 — Main Page
- **Backend** `server/src/homeRoutes.ts` (`/api/home`): single GET returns stats (totals + cvsLast24h via `count()` in `Promise.all`), latestPositions (5, `_count.cvs`), popularPositions (top 5 by cv count, sorted in memory), tagCloud (Position.projectTags + Project.tags counted in a Map, no loop query)
- **Frontend** `client/src/pages/Home.tsx`: 5 stat cards, Latest + Most popular tables (links to /positions/:id), tag cloud with font size scaled by count; tags link to /search?tag=...

### Step 11 — Full-text Search
- **Backend** `server/src/searchRoutes.ts` (`/api/search?q=`): Postgres full-text via `to_tsvector` + `websearch_to_tsquery` + `ts_rank`, run with **parameterized** `prisma.$queryRaw` (no string concat -> SQL-injection safe); positions (title + shortDescription) and attributes (name); tags matched case-insensitively in memory
- **Frontend** `client/src/pages/Search.tsx`: reads `?q=` (header box) and `?tag=` (tag cloud); shows positions table, attributes table, tag pills; header search box navigates here on Enter
- websearch_to_tsquery does stemming + stop-word removal + phrase/exclusion syntax (better than LIKE)

### Step 12 — Optional extras (extra credit)
- **CSV export** (`CvView.tsx`): "Download CSV" button; builds an array-of-arrays and uses `Papa.unparse` (papaparse) for correct escaping; downloads via Blob + temporary `<a>` (no browser storage)
- **PDF export + QR** (`CvView.tsx`): "Download PDF" button; jsPDF builds a formatted CV (title, details, projects) with `splitTextToSize` wrapping and manual page-break (`checkPageBreak` -> `addPage`); QR code generated with `QRCode.toDataURL(window.location.origin + "/cvs/" + id)` and placed via `addImage` -> scanning opens the live CV
- (Not done, still optional: form auth + email confirmation, badges/SVG, field tuning regex/range)

---

## IMPORTANT FIX — Express req.user / req.isAuthenticated types (Step 8)
- `server/` had NO `tsconfig.json` -> Passport/Express types not loaded -> `req.user`, `req.isAuthenticated` "does not exist" errors.
- Fix: created `server/tsconfig.json` with `"types": ["node", "express", "passport"]`.
- Augmented `Express.User` (id, email, role, etc.) in a `declare global` block inside `server/src/middleware.ts` (a real module every route imports), NOT a standalone `.d.ts`.
- `verbatimModuleSyntax` requires `import type { Request, Response, NextFunction }`.

---

## Important Rules (breaking these loses marks)
- NO [Edit][Delete] buttons in table rows -> -20% (use checkbox+toolbar)
- NO gallery/tiles view for positions/CVs -> -20% (use tables)
- NO raw `SELECT *` (use Prisma `select`); NO DB queries inside loops; NO image upload to own server/DB (cloud only)
- YES header search, optimistic locking, 2 languages, light/dark, responsive, ORM, full-text search
- YES use ready-made components (Markdown, tag input) — don't copy-paste
- YES **most important:** understand every line — they will ask you to change code live

---

## DEPLOYMENT — Live on Render

Live and verified at https://cv-management-system-zlfk.onrender.com — Google + GitHub login, all features, real-time discussions, CSV/PDF/QR all work in production.

**Production differs from dev:** Render runs ONE web service (server serves built `client/dist`), same-origin — no `:5173`, no Vite proxy.

**Key fixes that made deployment work (good for defense):**
- **Strict production build:** `tsc -b && vite build` caught what dev ignored — `FormEvent` needed `import type`; unused `onClickTitle` prop removed. Always `npm run build` locally before deploying.
- **Prisma on Render:** `"postinstall": "prisma generate"` in `server/package.json` (fresh install doesn't generate the client otherwise -> "did not initialize" crash).
- **OAuth callback over HTTPS:** Render is behind a proxy (http inside, https outside). Passport built `http://` callbacks -> `redirect_uri_mismatch`. Fixed with (1) `app.set("trust proxy", 1)` in index.ts, (2) absolute callback URLs in auth.ts from `process.env.SERVER_URL || "http://localhost:3000"`.
- **Socket.IO in production:** client connects to `import.meta.env.DEV ? "http://localhost:3000" : window.location.origin`.
- **Render env vars (no quotes):** DATABASE_URL, GOOGLE_CLIENT_ID/SECRET, GITHUB_CLIENT_ID/SECRET, SESSION_SECRET, CLIENT_URL (live URL), SERVER_URL (live URL). Local `.env` keeps localhost; code reads process.env so each env differs.
- **Google OAuth:** keep BOTH localhost and live URIs. **GitHub OAuth:** separate app for production (its credentials live in Render).
- If auto-deploy misses a commit, use Manual Deploy -> Deploy latest commit.

---

## Workflow Notes
- Git: `git status` -> `git add .` -> `git commit` -> `git push origin main` (push auto-deploys to Render)
- `.env` never pushed (gitignore)
- Prisma commands run from `server/`; two terminals (server + client `npm run dev`)
- Build UI with the Antigravity agent, but verify every part (for defense)
- Agent imports a library -> make sure it's installed, or Vite throws "Failed to resolve import"
- New file -> "Cannot find module" -> "TypeScript: Restart TS Server" (Ctrl+Shift+P)
- `req.params.id as string` for route params
- Render free instance sleeps when idle, first load 30-50s

---

*Last updated: ALL 12 STEPS COMPLETE — core + optional CSV/PDF/QR done, live deployed and verified. Next focus: defense prep (understand every line; be ready to change code live).*
