# Russia History Timeline

A bilingual Astro site showing Russian history from early Slavic and Rus' origins through the present day.

The first screen is the product: a side-by-side historical timeline with rulers on one side and major events on the other, switchable between English and Russian.

## Commands

```sh
npm install
npm run dev
npm run build
npm run preview
```

## Stack

- Astro 7
- Static HTML/CSS with a small language-toggle script
- Docker + CapRover deployment via `captain-definition`

## Content Notes

Timeline copy is intentionally concise. Expand entries in `src/data/timeline.ts` rather than editing rendered markup directly.

Hero image: `public/varangians.jpg`, a public-domain Wikimedia Commons reproduction of *Calling of the Varangians*.
