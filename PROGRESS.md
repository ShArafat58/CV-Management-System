# CV Management System — Project Progress

**Itransition Training Programme — Course Project**
**Student:** Shahriar Hossain Arafat
**GitHub:** https://github.com/ShArafat58/CV-Management-System
**Live (Render):** https://cv-management-system-zlfk.onrender.com

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
| Realtime | Socket.IO (later, Step 9) | For discussions |
| Deploy | Render (single web service) | Server serves the built client |

**Key libraries added:** axios, react-router-dom, react-i18next, lucide-react, react-markdown, react-tag-autocomplete, date-fns

---

## DONE (Step 1-8)

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
- Tested locally: both providers login + /me + protected route
- NOTE: sessions are in-memory, so a server restart logs everyone out (fine for dev)

### Step 4 — App Shell (frontend structure)
- `client/src/lib/api.ts` -> axios instance (`baseURL: /api`, `withCredentials: true`)
- Vite proxy: `/api` -> `localhost:3000` (preserves cookies)
- Tailwind v4 dark mode: `@custom-variant dark (&:where(.dark, .dark *))`
- `AuthContext` -> frontend knows who is logged in (user, loading, refresh, logout)
- `ThemeContext` -> light/dark, remembered in localStorage
- i18n (react-i18next) -> English (default) + Bengali, language remembered in localStorage
- `Header` -> logo, nav links, full-text search box (UI ready, wired later), theme toggle, language toggle, login dropdown (Google/GitHub), logout
- `Layout` -> Header + `<Outlet/>`, responsive, light+dark
- Routing (react-router) -> Home, Positions, Profile, MyCvs, Search, NotFound, Attributes, /cvs/:id
- Removed gradient for clean sky-blue (to match Pavel's taste)
- Tested full login flow from the frontend

### Step 5 — Killer Feature #1: Attribute Library
- **Backend** `server/src/attributeRoutes.ts` (mounted at `/api/attributes`):
  - GET `/` -> list, prefix search (`startsWith` insensitive), category filter, uses `select` (no SELECT *)
  - GET `/recent` -> 5 latest
  - POST/PUT/DELETE -> RECRUITER+ADMIN only (`requireRole`)
  - Validation: unique name, category/dataType enum check, ONE_OF_MANY requires non-empty options
  - Errors: duplicate -> 409, not found -> 404
  - DELETE blocks built-in attributes (403) — added in Step 6
- **Frontend** `client/src/pages/AttributeLibrary.tsx` + `components/attributes/`:
  - **Table view** (not gallery/tiles — requirement)
  - **No buttons in rows** — checkbox select + toolbar above (requirement, else -20%)
  - Toolbar: 0 selected -> New; 1 selected -> Edit+Delete; >1 -> Delete
  - Modal form (create/edit), shows options editor when ONE_OF_MANY
  - Search (debounced) + category filter
  - Role check: candidates see read-only, toolbar hidden
- Tested: create, edit, delete, prefix search, category filter, duplicate (409)

### Step 6 — Personal Profile
- **Schema change:** added `isBuiltIn Boolean @default(false)` to Attribute (migration `add_builtin_flag`)
- **Seed** `server/prisma/seed.ts` -> 4 built-in attributes (First Name, Last Name, Location, Personal Photo) using `upsert` (safe to re-run). Run with `npx tsx prisma/seed.ts`
- **Backend** `server/src/profileRoutes.ts` (mounted at `/api/profile`, all requireAuth, own profile only except ADMIN can pass userId):
  - GET `/` -> full profile (values + attribute info + projects) + builtInAttributes list; creates empty profile if missing; uses include/select (no SELECT *)
  - PUT `/values` -> **auto-save with optimistic locking**: checks body.version against profile.version inside a `$transaction`; on mismatch returns 409 `version_conflict` + currentVersion and saves nothing; on match upserts values and increments version
  - POST/PUT/DELETE `/projects` -> project CRUD with ownership check
  - GET `/project-tags` -> distinct sorted tags for autocomplete (no query inside loop)
- **Frontend** `client/src/pages/Profile.tsx` + `components/profile/ProjectsTab.tsx`:
  - 3 tabs: Me (built-in attrs), Info (library attrs + add-attribute picker), Projects
  - ProfileField component renders the right input per dataType (text/textarea/number/date/checkbox/select)
  - **Auto-save:** debounced ~2s after typing stops (NOT every keystroke); shows "Saving..."/"Saved" indicator
  - **Conflict handling:** on 409, shows a red non-dismissible banner with a Reload button; auto-save halts until reload
  - **Projects:** table view + selection toolbar (no row buttons), modal with date range, markdown description (react-markdown live preview), tag autocomplete (react-tag-autocomplete, suggestions from /project-tags)
- Tested: auto-save persists after refresh, optimistic locking, project create/edit/delete, markdown preview, tags

### Step 7 — Killer Feature #2: Positions
- **Backend** `server/src/positionRoutes.ts` (mounted at `/api/positions`):
  - GET `/` -> list with `?search=` (title contains), includes `_count.cvs` (no query in loop), select only (no SELECT *)
  - GET `/:id` -> full detail: scalars + accessRules + attributes joined to Attribute, ordered by sortOrder
  - POST `/` -> create (RECRUITER/ADMIN), creates PositionAttribute rows in a `$transaction`
  - POST `/:id/duplicate` -> copy all fields ("Copy of ..."), reset version, copy attributes, in a `$transaction`
  - PUT `/:id` -> update with **optimistic locking** (version check in `$transaction`, 409 on mismatch); attributeIds = full replacement (deleteMany then createMany)
  - DELETE `/:id` -> cascade removes PositionAttribute/Cv/Post
  - Positions are SHARED (any recruiter/admin can edit/delete, no ownership)
- **Frontend** `client/src/pages/Positions.tsx` + `components/positions/`:
  - **Table view** + selection toolbar (no row buttons): 0 -> New; 1 -> Edit/Duplicate/Delete; >1 -> Delete
  - PositionModal: title, description, Public/Restricted toggle, attribute picker, project settings (maxProjects, projectTags)
  - **AccessRuleEditor:** operators depend on attribute dataType (NUMERIC -> >,>=,<,<=,= ; BOOLEAN/ONE_OF_MANY -> = ; STRING/TEXT -> contains,= ; DATE -> >,<,=); value input adapts (number/select/date/checkbox)
  - On edit: loads full detail via GET /:id; handles 409 version_conflict
- Tested: create, access rules (operator/value change by type), duplicate, edit, refresh persists

### Step 8 — Killer Feature #3: CV Generation
- **Backend** `server/src/cvRoutes.ts` (mounted at `/api/cvs`, all requireAuth):
  - Helper `candidateMeetsAccessRules(profileValues, accessRules)` -> numeric ops parse both sides as numbers; "=" numeric-or-case-insensitive-string; "contains" substring; ALL rules AND
  - GET `/` -> my CVs (position title + `_count.likes`)
  - GET `/available-positions` -> positions that are public OR pass access rules, excluding ones I already have a CV for (loads profile + positions ONCE, filters in memory — no query in loop)
  - POST `/` -> create CV; checks eligibility (403 not_eligible), one-per-position (409 cv_exists); adds position's attributes to profile with empty value via `createMany skipDuplicates` (computed in memory, no loop query)
  - GET `/:id` -> assembled CV: owner/admin/recruiter may view; `canEdit` = owner or admin; attributes with profile value ("" if missing); projects filtered by position.projectTags, limited to maxProjects
  - PUT `/:id/value` -> in-place edit writes the **master value into the owner's profile** (upsert AttributeValue); owner/admin only
  - DELETE `/:id` -> owner/admin only
- **Frontend** `client/src/pages/MyCvs.tsx`, `pages/CvView.tsx`, `components/cvs/`:
  - My CVs: **table** + toolbar (no row buttons); New CV modal lists available positions; handles not_eligible / cv_exists
  - CvView: structured CV document (not a table); each attribute inline-editable per dataType when canEdit, read-only for recruiters; saves on blur via PUT /:id/value
  - **Empty values highlighted in RED** (editable and read-only) — requirement
  - Projects section: read-only, markdown description via react-markdown, tags as chips
- Tested: create CV (auto-fill), in-place edit reflects on Profile page (master value), table/toolbar, empty highlighting

---

## IMPORTANT FIX (Step 8) — Express req.user / req.isAuthenticated types
- The `server/` folder had NO `tsconfig.json`, so TypeScript didn't load Passport/Express types -> `req.user`, `req.isAuthenticated` showed "does not exist" errors.
- Fix: created `server/tsconfig.json` with `"types": ["node", "express", "passport"]`.
- Augmented `Express.User` interface (id, email, role, etc.) inside a `declare global` block in `server/src/middleware.ts` (a real module that every route imports), NOT a standalone `.d.ts` (which wasn't being picked up).
- `verbatimModuleSyntax` requires `import type { Request, Response, NextFunction }` in middleware.ts.

---

## REMAINING (Step 9-12)

### Step 9 — Discussions + Likes
- Each position has a Discussion tab, Markdown posts, chronological
- Real-time updates in 2-5 seconds (Socket.IO — already done in Battleship)
- Likes: recruiters only, once per CV, count shown

### Step 10 — Main Page
- Latest positions (table), Most popular (top 5 by CV count)
- Tag cloud (technology tags)
- Statistics (CVs in last 24h, total positions/candidates/recruiters/CVs)

### Step 11 — Full-text Search
- Wire up the header search box
- Postgres native full-text search (no raw SELECT *)

### Step 12 — Polish + Optional (extra credit)
- PDF export + QR code
- Form auth + email confirmation
- Badges/achievements (SVG panel)
- Field tuning (length limit, regex, range)
- CV -> CSV/Excel export

---

## Important Rules (breaking these loses marks)

- NO [Edit][Delete] buttons in table rows -> -20% (use checkbox+toolbar)
- NO gallery/tiles view for positions/CVs -> -20% (use tables)
- NO raw `SELECT *` -> DON'T (use Prisma `select`)
- NO DB queries inside loops -> DON'T
- NO uploading images to own server/DB -> DON'T (use cloud storage)
- YES header search on every page
- YES optimistic locking (attr, position, profile auto-save)
- YES 2 languages, light/dark theme, responsive, ORM, full-text search
- YES use ready-made components (Markdown renderer, tag input, image uploader) — don't copy-paste
- YES **most important:** understand every line you write — they will ask you to change code live

---

## Workflow Notes

- Git: `git status` -> `git add .` -> `git commit` -> `git push origin main` (Windows/PowerShell)
- `.env` is never pushed (in gitignore) — credentials stay secret
- Prisma commands always run from the `server/` folder
- Two terminals: one for server (`npm run dev`), one for client (`npm run dev`)
- Build UI with the Antigravity agent, but verify every part (for defense)
- If agent imports a library, make sure it's installed (`npm install <lib>`) or Vite throws "Failed to resolve import"
- Watch import paths from the agent (e.g. `../../../lib/api` vs `../../lib/api`)
- After the agent creates a new file, if the editor shows "Cannot find module", run "TypeScript: Restart TS Server" (Ctrl+Shift+P)
- For req.params.id type errors, use `req.params.id as string`
- Render free instance sleeps when idle, first load takes 30-50 seconds

---

*Last updated: Step 8 (CV Generation) complete. 8/12 done — all three killer features built. Next: live deploy update OR Step 9 (Discussions + Likes).*
