# InsureAgentLabs — web app

The single SvelteKit application (UI + JSON API + Swagger) for InsureAgentLabs.
See the repository root [`README.md`](../README.md) for the full overview, and
[`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for deployment.

## Commands

```sh
pnpm install
pnpm dev      # dev server → http://localhost:5173 (Swagger: /api-docs)
pnpm check    # svelte-check
pnpm lint     # prettier + eslint
pnpm test     # vitest (domain/service unit tests)
pnpm build    # production build (adapter-node → ./build)
```

Run the production build with `node build` (set `ORIGIN` to the public URL).
