---
name: convex-prod-on-push
description: >-
  First-time Keel local setup (bun, Convex login, local .env.local), Vercel
  production env vars, and deploying Convex to shared production on push to
  main. Use when starting the project, onboarding, cloning, Convex login,
  Vercel secrets, NEXT_PUBLIC_CONVEX_URL, CONVEX_DEPLOY_KEY, committing,
  pushing, or GitHub Actions.
---

# Convex: first-time setup and prod on push

Repo skill for any coding agent (Cursor, Claude Code, Codex, Copilot, Gemini, Amp, etc.). Canonical path: `.agents/skills/convex-prod-on-push/SKILL.md`.

Keel is one Convex **project** (`vaidik-bhardwaj-f936a` / `keel`):

| Who | Deployment | Credentials |
| --- | --- | --- |
| Each developer, laptop | **Local** backend | Their own `.env.local` after `convex login` + `convex dev` |
| Everyone, after push to `main` | **One shared production** | GitHub Actions secret `CONVEX_DEPLOY_KEY` (already set) |

Teammates **must log in to Convex** to run a local backend against this project. They do **not** need the production key on disk. They do **not** share local data. Pushes to `main` all update the same prod: `https://youthful-manatee-537.convex.cloud`.

## First-time local setup

Walk a new checkout through this. Do not skip Convex login. Do not copy another person's `.env.local`. Do not put `CONVEX_DEPLOY_KEY` in `.env.local`.

### Prerequisites

- [bun](https://bun.sh) 1.3+
- GitHub access to `vaidikcode/keel`
- Membership on Convex team `vaidik-bhardwaj-f936a` (project owner invites from [the dashboard](https://dashboard.convex.dev/t/vaidik-bhardwaj-f936a/keel)). Needed so they select **existing** project `keel`, not create a new one.

### Steps

1. Clone and install:

```bash
git clone git@github.com:vaidikcode/keel.git
cd keel
bun install
```

2. Log in to Convex (browser GitHub OAuth):

```bash
bunx convex login
```

3. Point this checkout at a **local** deployment of project `keel`, then start the backend and leave it running:

```bash
bunx convex deployment select local
bun run dev:backend
```

First `convex dev` may ask which team/project: choose **existing** `keel` on `vaidik-bhardwaj-f936a`, **local** (not production, not a new project).

The CLI writes gitignored `.env.local` (this is the local “key”; Convex cannot mint deploy keys for local backends):

```bash
CONVEX_DEPLOYMENT=local:<name>
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
```

4. In a **second** terminal, start Next.js:

```bash
bun run dev
```

Open the printed localhost URL. If Next started before `.env.local` existed, restart `bun run dev`.

### Everyday after that

```text
terminal 1:  bun run dev:backend     # convex dev — required while using the app
terminal 2:  bun run dev              # Next.js
```

`convex/` edits sync only to **this laptop’s** local deployment. Production is untouched until push to `main`.

### Setup pitfalls

- **“Convex not connected”:** backend not running, or Next missing `NEXT_PUBLIC_CONVEX_URL`. Start `dev:backend`, restart `dev`.
- **Wrong project created:** they were not on the team, or they chose “new project”. Delete that extra project, get invited, select existing `keel`.
- **Safari/Brave dashboard vs localhost:** use another browser, or allow localhost in Brave.

## Rules for agents

- First-time / “how do I run this”: follow **First-time local setup** above.
- Local work: `bun run dev:backend` (`convex dev`). Never `convex deploy` unless the user explicitly asks to push production from this machine.
- A commit does not talk to Convex. **Push to `main`** runs `.github/workflows/deploy-convex.yml`.
- Never commit `.env.local`, `.convex/`, or any `CONVEX_DEPLOY_KEY`.
- Never put the production key in the repo, chat, or a teammate’s `.env.local`.
- Hosted Next.js (Vercel, etc.) needs `NEXT_PUBLIC_CONVEX_URL=https://youthful-manatee-537.convex.cloud` (one line, no duplicates).

## Prod key (already in GitHub Actions)

Repo secret on `vaidikcode/keel`:

- Name: `CONVEX_DEPLOY_KEY`
- Production deploy key for `keel` / `youthful-manatee-537`
- **Already set.** Teammates do not create or paste this. Do not recreate unless it was rotated or CI auth fails.

```text
git push origin main
  → GitHub Action
  → bunx convex deploy   (env CONVEX_DEPLOY_KEY)
  → https://youthful-manatee-537.convex.cloud
```

Other branches do not deploy prod. `workflow_dispatch` on that workflow can deploy main’s current tree.

## Vercel production env vars

Vercel hosts **Next.js only**. Convex prod already exists; GitHub Actions already deploys functions on push to `main`.

In Vercel → Project → Settings → Environment Variables, **Production** only:

| Name | Value | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | `https://youthful-manatee-537.convex.cloud` | No (public client URL). **Required.** One line only — do not paste it twice or include a blank line. Then **redeploy** (this value is baked in at build). |

That is enough for the live site to talk to prod Convex.

Optional — only if the Vercel **Build Command** is `bunx convex deploy --cmd 'bun run build'` so Vercel also pushes Convex during the frontend build:

| Name | Value | Environment |
| --- | --- | --- |
| `CONVEX_DEPLOY_KEY` | A **production** deploy key from Convex dashboard → `keel` production (`youthful-manatee-537`) → Generate deploy key | **Production only** (uncheck Preview and Development) |

Do **not** paste the GitHub Actions key into Preview. For Vercel Preview, create a separate **preview** deploy key and attach it only to Preview. Never put a production deploy key on Preview.

Leave Vercel Development empty for Convex keys; laptops use `.env.local`.

## If CI fails on Convex deploy

1. Confirm secret `CONVEX_DEPLOY_KEY` exists (GitHub → Settings → Secrets). It should already be there.
2. Confirm it is a **production** key, not a preview/dev key.
3. Rotate only if needed: `bunx convex deployment token create github-actions --deployment prod` then `gh secret set CONVEX_DEPLOY_KEY` (do not print or commit the value).
