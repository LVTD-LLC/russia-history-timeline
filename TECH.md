# TECH.md

## Stack

- Astro `^7.0.6`
- Node `>=22.12.0`
- Static rendering only
- Docker multi-stage build for CapRover

## Commands

```
npm install
npm run dev
npm run build
npm run preview
```

## Deployment

CapRover uses `captain-definition`, which points at `Dockerfile`.

The Docker build:

1. Installs dependencies with `npm ci`.
2. Runs `npm run build`.
3. Serves `dist/` from Nginx.

## Constraints

- Do not add a client framework unless a feature cannot be solved cleanly with Astro and small browser scripts.
- Keep timeline content in `src/data/timeline.ts`.
- Keep deploy files at the repo root because CapRover expects them there.
