# AGENTS.md

This file is for coding agents working on `russia-history-timeline`.

## Project Summary

This is a bilingual Astro 7 static site about the history of Russia from early Slavic/Rus' origins to the present. The main product surface is `src/pages/index.astro`, backed by timeline content in `src/data/timeline.ts`.

## Commands

Install dependencies:

```
npm install
```

Run the local site:

```
npm run dev
```

Build for production:

```
npm run build
```

Preview the production build:

```
npm run preview
```

## Workflow

- Do not commit directly to `main`; create a branch and PR.
- Keep English and Russian copy in sync for every timeline entry.
- Keep historical claims concise and date-led. If adding contested interpretation, phrase it as interpretation rather than certainty.
- Update `CHANGELOG.md` for shipped changes.
- Before merge, run `npm run build` and use the Greptile/check-pr gate when configured on the PR.

## Structure

- `src/data/timeline.ts` contains the bilingual timeline data.
- `src/pages/index.astro` renders the page and owns styling/interaction.
- `public/` contains static assets served at the site root.
- `Dockerfile`, `nginx.conf`, and `captain-definition` define CapRover deployment.

## Documentation

Full Astro documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
