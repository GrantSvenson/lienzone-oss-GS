# Project Working Agreement

This project should be maintained with a conservative Git workflow.

## Git Workflow

- Keep `main` as the stable baseline branch.
- Before making changes, run `git status --short` and note any existing user changes.
- Make feature or fix branches for meaningful work, using names like `feature/document-search` or `fix/upload-error`.
- Keep commits focused and write clear commit messages.
- Prefer pull requests back into `main`, even for solo work, so changes have a reviewable history.
- Do not rewrite history or discard local changes unless the user explicitly asks for it.

## Sensitive Data

Never commit secrets, API keys, local documents, uploaded files, generated databases, or machine-specific config.

Files and directories that should stay local include:

- `backend/.env`
- `frontend/.env.local`
- `backend/data/`
- `node_modules/`
- `frontend/.next/`
- `backend/dist/`

Commit the checked-in examples and lockfiles:

- `backend/.env.example`
- `frontend/.env.local.example`
- `backend/package-lock.json`
- `frontend/package-lock.json`

## Verification

For installation or dependency changes, run the relevant checks before committing:

- `npm run build --prefix backend`
- `npm run build --prefix frontend`
- `npm run lint --prefix frontend` when lint status matters for the task

If a check fails because of known pre-existing issues, report that clearly and include the command output summary.

## Local Runtime

The normal local development commands are:

- `npm run dev --prefix backend`
- `npm run dev --prefix frontend`

The frontend runs at `http://localhost:3000` and the backend runs at `http://localhost:3001`.
