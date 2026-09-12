<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Keel

Read and follow `.agents/skills/convex-prod-on-push/SKILL.md` for local Convex setup, Vercel env vars, and production deploys. That file is the repo skill for any coding agent.

Hard rules:

- Local: `bun install`, `bunx convex login`, `bunx convex deployment select local`, then `bun run dev:backend` + `bun run dev`. Select existing project `keel` on team `vaidik-bhardwaj-f936a`.
- Never commit `.env.local`, `.convex/`, or `CONVEX_DEPLOY_KEY`. Never copy someone else’s `.env.local`.
- Never run `convex deploy` unless the user explicitly asks to push production from this machine.
- Push to `main` deploys Convex production via GitHub Actions (`CONVEX_DEPLOY_KEY` is already set). Prod URL: `https://youthful-manatee-537.convex.cloud`.
- Vercel Production needs `NEXT_PUBLIC_CONVEX_URL=https://youthful-manatee-537.convex.cloud` as a single line, then a redeploy.
