# CV Management System

A full-stack web application for managing candidate CVs against recruiter-defined positions — built for the Itransition Training Programme.

**Live:** https://cv-management-system-zlfk.onrender.com

> ⚠️ **Note:** This is a training/course project. The source code is shared for review and evaluation purposes only. Please do not copy, redistribute, or reuse it as your own work.

---

## What is this?

CV Management System is a platform where **recruiters** define job *positions* with the exact fields they care about, and **candidates** generate tailored *CVs* for those positions from a single personal profile. Instead of every candidate writing free-form CVs, the system keeps one source of truth per person and assembles a structured, comparable CV for each position on demand.

The core idea: a CV is **almost virtual**. When a candidate creates a CV for a position, only a lightweight record is stored — the actual content (skills, values, projects) is always looked up live from the candidate's profile. Change a value once, and it updates everywhere it appears. This keeps every CV for a given position consistent and easy to compare, sort, and filter.

---

## Key Concepts

- **Attribute Library** — a global, shared collection of reusable fields (e.g. "English Level", "GPA", "IELTS Score"). Each attribute has a data type (text, number, date, boolean, single-choice, image). Recruiters and admins curate this library; candidates only fill attributes in, they don't create them.
- **Personal Profile** — every authenticated user has one profile with built-in fields (name, location, photo), library-based info fields, and a list of projects. This is the single source of truth for a person's data.
- **Position** — a CV template defined by a recruiter: a title, description, a set of attributes to include, project-tag filters, and optional access rules that control which candidates are eligible.
- **CV** — generated for a position from the candidate's profile. Empty fields are highlighted so candidates know what to complete. Editing a value inside a CV updates the master value on the profile (and therefore every CV).
- **Access Rules** — a position can be public or restricted by rules on attributes (e.g. "IELTS Score ≥ 7"). Only candidates whose profile satisfies the rules can generate a CV for that position.

---

## Roles

| Role | What they can do |
|------|------------------|
| **Candidate** (default) | Fill out their profile and projects, generate and edit CVs for eligible positions, join position discussions. |
| **Recruiter** | Everything a candidate can, plus: manage the attribute library, create/edit/duplicate positions, browse all CVs submitted for a position, and like CVs. |
| **Admin** | Everything, plus: manage users (change roles, block/unblock). |

Users register simply by logging in (Google or GitHub) and start as **Candidate**. Admins can elevate permissions when needed.

---

## Features

- **Google & GitHub login** (OAuth) — no passwords to manage.
- **Attribute Library** — searchable, categorized, type-aware fields shared across the whole system.
- **Personal Profile** — auto-saving fields, markdown project descriptions, tag autocomplete, and a real image upload for the personal photo (stored on cloud storage, not on the app server).
- **Positions** — created and shared by recruiters, with a visual access-rule builder whose operators adapt to each attribute's type.
- **CV Generation** — pick a position, get a structured CV assembled from your profile; edit inline; export it.
- **Real-time Discussions** — every position has a live discussion thread; new posts appear for everyone viewing that position within seconds.
- **Likes** — recruiters can like CVs (once each); counts are shown in listings.
- **Main dashboard** — live statistics, latest and most-popular positions, and a technology tag cloud.
- **Full-text search** — search positions, attributes, and tags from the header on any page, powered by PostgreSQL full-text search with relevance ranking.
- **Export** — download any CV as a **CSV** (for spreadsheets) or a formatted **PDF** that includes a **QR code** linking back to the live CV.
- **Admin user management** — list, search, promote/demote, and block/unblock users.
- **Public profiles** — view a user's public info and their CVs (used when recruiters click an author in a discussion).
- **Internationalization** — full English and Bengali interface.
- **Light & dark themes**, fully responsive.

---

## How to Use

### Getting started
1. Open the app and log in with **Google** or **GitHub**. Your account is created automatically as a **Candidate**.
2. Go to **Profile** and fill in your details:
   - **Me** — built-in fields (name, location, personal photo). Upload a photo by dropping or selecting an image.
   - **Info** — add and fill library attributes relevant to you.
   - **Projects** — add projects with a name, dates, markdown description, and technology tags.
   Everything auto-saves as you type.

### As a candidate — creating a CV
1. Go to **My CVs** → **New CV**.
2. Pick a position you're eligible for (public positions, or restricted ones your profile qualifies for).
3. The CV is generated from your profile. Any empty required fields are highlighted in red — fill them in directly on the CV (this also updates your profile).
4. Download the CV as **CSV** or **PDF** (the PDF includes a QR code to the online version), or join the position's **Discussion**.

### As a recruiter — managing positions
1. Curate the **Attribute Library** — add the fields positions will use.
2. Go to **Positions** → **New position**. Set the title, description, visibility (public or restricted), the attributes to include, and project-tag filters. For restricted positions, build **access rules** on attributes.
3. Open a position to see its **Details**, the live **Discussion**, and the **CVs** tab listing every candidate who applied — click through to review and **like** the best ones.
4. Duplicate an existing position to quickly create a similar one.

### As an admin — managing users
1. Open **Admin → User Management**.
2. Select a user to change their **role** (Candidate / Recruiter / Admin) or to **block/unblock** them.
3. Blocking a user revokes their access without deleting their account or data.

### Everywhere
- Use the **search bar** in the header to find positions, attributes, or tags from any page.
- Toggle **light/dark theme** and **English/Bengali** language from the header.
- The **home page** gives an at-a-glance overview: statistics, latest and popular positions, and a tag cloud you can click to search.

---

## Tech Stack

**Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, react-i18next
**Backend:** Node.js, Express, TypeScript
**Database & ORM:** PostgreSQL (Neon) with Prisma
**Authentication:** Passport.js (Google & GitHub OAuth) with session cookies
**Real-time:** Socket.IO
**Media:** Cloudinary (direct browser uploads for images)
**Export:** PapaParse (CSV), jsPDF + qrcode (PDF with QR)
**Deployment:** Render (single web service serving the built client)

---

## Notable Engineering Details

- **CV content is never duplicated** — it's assembled live from normalized, related tables (attributes referenced from CVs), so all CVs for a position stay compatible and comparable. No documents-with-arbitrary-fields, no on-the-fly tables.
- **Optimistic locking** on profiles and positions (a version field) prevents two users from silently overwriting each other's edits; conflicts surface a clear "reload" prompt.
- **Full-text search** uses PostgreSQL `to_tsvector` / `websearch_to_tsquery` with relevance ranking and safe, parameterized queries.
- **Images never touch the app server** — they're uploaded directly from the browser to cloud storage; only the resulting URL is stored.
- **Database-level guarantees** — unique constraints enforce "one CV per candidate per position" and "one like per recruiter per CV" regardless of application logic.

---

*Built as a course project for the Itransition Training Programme.*
