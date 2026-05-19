# Mike (local-only fork)

A fully local fork of [willchen96/mike](https://github.com/willchen96/mike) — all credit to Will for the original project, which is genuinely awesome.

This fork swaps out the cloud dependencies (Supabase Postgres, Supabase Auth, Cloudflare R2) for local equivalents — a JSON file for state and the local filesystem for document storage. Nothing leaves your machine except calls to the LLM provider you configure.

**Why?** I'm a personal injury lawyer. I sometimes work with contracts, settlement docs, and client materials I'd rather not push to a third-party cloud bucket while I'm just experimenting with a tool. This version lets you kick the tires entirely on your own laptop. If you want the full multi-user / production setup, use Will's upstream repo — it's the right tool for that job.

Licensed AGPL-3.0 (same as upstream).

---

Open-source release containing the Mike frontend and backend.

## Contents

- `frontend/` - Next.js application
- `backend/` - Express API, local persistence, local document storage, and document processing
- `backend/migrations/000_one_shot_schema.sql` - historical Supabase schema kept for reference

## Setup

Install dependencies:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Create local env files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Add at least one model-provider API key to `backend/.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENROUTER_API_KEY=sk-or-v1-...
```

If you use `OpenRouter Auto` in the app, Mike sends requests with
`model=openrouter/auto`, so OpenRouter picks the model at request time.

Start the backend:

```bash
npm run dev --prefix backend
```

Start the frontend:

```bash
npm run dev --prefix frontend
```

Open `http://localhost:3000`.

## Local Data

- JSON database: `backend/data/local-db.json`
- Document bytes: `backend/data/storage/`
- Default local user: `local@mike.local`

No Supabase database, Supabase Auth project, or R2/S3 bucket is required.

## Required Services

- Anthropic API key for Claude models, or OpenRouter API key for OpenRouter models
- Optional Gemini API key only if you choose Gemini models
- LibreOffice for DOC/DOCX to PDF conversion

## Checks

```bash
npm run build --prefix backend
npm run build --prefix frontend
npm run lint --prefix frontend
```

## License

AGPL-3.0-only. See `LICENSE`.
