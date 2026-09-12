# Keel

A small TypeScript Next.js app (bun) with Convex as the backend. The UI is a shared notes board: Next.js renders the page, Convex stores the notes and pushes live updates.

## Stack

- **Frontend:** Next.js App Router + React
- **Backend:** Convex (`convex/` directory — queries, mutations, schema)
- **Package manager:** bun

Frontend code lives in `app/` and `components/`. Backend code lives in `convex/`. There is no separate Express/Node API.

## Prerequisites

- [bun](https://bun.sh) 1.3+
- A Convex account (needed to create a project and to deploy production). You can start locally without one.

```bash
bun install
```

---

## Local Convex setup

A git clone does **not** start a backend. Convex functions only exist on a *deployment* after the CLI pushes them. Locally you run a **dev** deployment (on your machine or a personal cloud one). Production is a different deployment.

### 1. Start the Convex backend (keep this running)

```bash
bun run dev:backend
# same as: bunx convex dev
```

The first run is interactive:

1. **Log in or stay local.** You can develop against a backend on your computer without an account. To use Convex Cloud (and later production), log in with GitHub.
2. **Create or select a project.** This is the Convex *project*. It owns:
   - one **production** deployment
   - a **dev** deployment per person (cloud)
   - optional **local** and **preview** deployments
3. **Use one shared project for the repo.** Select existing project `keel` on team `vaidik-bhardwaj-f936a`. Invite teammates to that Convex team so they can do the same. They still get **their own** local `.env.local` and data. Production is shared via GitHub Actions, not via copied keys.
4. The CLI writes `.env.local` (gitignored):

```bash
CONVEX_DEPLOYMENT=local:keel          # or dev:your-cloud-dev-name
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
```

`CONVEX_DEPLOYMENT` is which *dev* target this checkout talks to. `NEXT_PUBLIC_CONVEX_URL` is what the Next.js client uses.

Leave `convex dev` running. It watches `convex/`, typechecks, regenerates `convex/_generated/`, and pushes schema + functions to that dev deployment.

### Local vs personal cloud dev

| Command | What you get |
| --- | --- |
| `bunx convex deployment select local` then `bunx convex dev` | Backend process on your machine. Faster, no cloud quota. Stops when you stop `convex dev`. State is in `.convex/`. |
| `bunx convex deployment select dev` then `bunx convex dev` | Your personal **cloud** dev deployment. Survives closing the laptop. Other people do **not** share this data. |

Switch any time:

```bash
bunx convex deployment select local
bunx convex deployment select dev
```

Safari and Brave can block the dashboard from talking to localhost. Use another browser for the local dashboard, or allow localhost access in Brave.

### 2. Start Next.js (second terminal)

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). If `.env.local` was created after Next was already running, restart `bun run dev` so it picks up `NEXT_PUBLIC_CONVEX_URL`.

You should be able to post a note and see it appear immediately. That write went to Convex, not to Next.js.

### Everyday local loop

```text
terminal 1:  bun run dev:backend     # syncs convex/ → your dev deployment
terminal 2:  bun run dev              # Next.js at localhost:3000
```

Change a file under `convex/` → `convex dev` pushes it to **your** dev deployment only. Production is untouched.

---

## What happens when people commit

**Committing does not deploy Convex.** Git only stores source (`convex/*.ts`, `convex/schema.ts`). Each environment has its own database and function bundle:

```text
laptop A  --convex dev-->  local or cloud *dev* deployment A   (A's data)
laptop B  --convex dev-->  local or cloud *dev* deployment B   (B's data)
main branch --CI convex deploy-->  *production* deployment     (real users)
```

So:

- A teammate pulling your commit gets the new function *source*, not your notes.
- Their `bunx convex dev` pushes those functions to **their** dev deployment.
- Production keeps serving the last bundle that was explicitly deployed, until CI (or a person) runs `convex deploy`.

Never point local `.env.local` at production. `convex dev` is for development; `convex deploy` is for production.

---

## Pushing the backend to production Convex on commit

This repo deploys Convex production from GitHub Actions on every push to `main` (see `.github/workflows/deploy-convex.yml`).

**Already set up for this repo:**

- Convex project: [keel](https://dashboard.convex.dev/t/vaidik-bhardwaj-f936a/keel) (team `vaidik-bhardwaj-f936a`)
- Production deployment: [youthful-manatee-537](https://dashboard.convex.dev/d/youthful-manatee-537) → `https://youthful-manatee-537.convex.cloud`
- GitHub Actions secret `CONVEX_DEPLOY_KEY` on `vaidikcode/keel` (production key only; not in git)

Teammates do **not** put a prod key on their laptops. Invite them to the Convex team so they can `convex dev` against this same **project** with **their own local** `.env.local`. When they push to `main`, CI uses the repo secret and updates **this** production backend.

First-time local setup and prod-on-push (any agent): `.agents/skills/convex-prod-on-push/SKILL.md`.

Path from commit to prod backend:

```text
git push origin main
        │
        ▼
GitHub Action on ubuntu
        │  bun install
        │  bunx convex deploy     ← uses CONVEX_DEPLOY_KEY
        ▼
Convex production deployment
  • typechecks convex/
  • regenerates convex/_generated
  • bundles queries/mutations
  • pushes schema, indexes, and functions
```

Production data is **not** copied from anyone's laptop. Only the function code and schema go up. Existing production documents stay; schema changes must be backward-compatible (additive fields, etc.) or you migrate first.

Manually, from a logged-in machine (still do not use this during daily development):

```bash
bunx convex deploy
```

If `CONVEX_DEPLOYMENT` in `.env.local` is a *dev* deployment, `convex deploy` targets that project's **production** deployment. If `CONVEX_DEPLOY_KEY` is set (CI), it targets the deployment that key belongs to.

### Frontend (Next.js) is separate

`convex deploy` does not host the Next.js app. Typical split:

| Piece | Where it runs |
| --- | --- |
| Convex functions + database | Convex Cloud production |
| Next.js UI | Vercel, Netlify, or similar |

On the frontend host, set:

```bash
NEXT_PUBLIC_CONVEX_URL=https://youthful-manatee-537.convex.cloud
```

If the Next.js app still has a **dev** or localhost URL, the UI will talk to the wrong backend.

### Optional: deploy Convex during the Vercel build

If Next.js is on Vercel, you can push Convex in the same build instead of (or in addition to) GitHub Actions. Set Vercel's production env `CONVEX_DEPLOY_KEY` to the **production** key, and use a build command like:

```bash
bunx convex deploy --cmd 'bun run build'
```

That deploys Convex first, then builds Next.js with the production deployment URL injected. For Vercel **preview** deployments, use a **preview** deploy key in the Preview environment so each branch gets its own Convex preview instead of writing to production.

Do **not** put a production deploy key in Preview/PR environments.

---

## Project map

```text
app/                         Next.js UI (App Router)
  ConvexClientProvider.tsx   Convex React client
  page.tsx                   Notes board
components/NoteBoard.tsx     Create / list / delete notes
convex/
  schema.ts                  Tables + indexes
  notes.ts                   list, create, remove
  _generated/                Created by `convex dev` — commit these
.github/workflows/
  deploy-convex.yml          Production backend deploy on push to main
```

## Scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` | Next.js frontend |
| `bun run dev:backend` | Convex dev sync (`convex dev`, not `convex deploy`) |
| `bun run lint` | ESLint including Convex rules |
| `bun run typecheck` | `tsc --noEmit` |
| `bunx convex deploy` | Production only |

## Troubleshooting

- **“Convex not connected” on localhost:** `bunx convex dev` has not written `.env.local` yet, or Next.js was started before that file existed. Start the backend, then restart `bun run dev`.
- **Types missing under `convex/_generated`:** run `bunx convex dev` once; it generates them.
- **CI `convex deploy` fails on auth:** `CONVEX_DEPLOY_KEY` is missing or is a preview/dev key instead of a production key.
- **Prod UI shows empty / old data:** the Next.js host still has a *dev* `NEXT_PUBLIC_CONVEX_URL`, or Convex production was never deployed after the commit.
