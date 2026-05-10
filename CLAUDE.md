# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project goal

The user is a Brazilian preparing for the Spanish A2 motorcycle driver's licence exam. The real exam is 20 questions with a maximum of 2 mistakes allowed. This app is their personal study tool — all feature and content decisions should serve that goal.

**Brazilian context matters.** When explaining questions or traffic rules, flag cases where Spanish law differs from Brazilian practice (e.g. speed limits, helmet rules, priority rules, alcohol limits, road signs). These are the highest-risk questions for a Brazilian candidate and should be called out explicitly.

## Commands

```bash
npm run dev      # Dev server at http://localhost:5173
npm run build    # TypeScript check + Vite production build → dist/
npm run preview  # Serve the production build locally
```

There are no tests. TypeScript compilation (`tsc`) is the primary correctness check — run it as part of `npm run build`.

## Architecture

React 18 + TypeScript PWA (Vite + vite-plugin-pwa). Deployed statically on Vercel. No backend — all data is static JSON loaded at runtime.

### Data flow

On startup, `AppContext` fetches two files from `public/questions/`:
- `questions.json` — 680 questions, keyed by `id` into a `QuestionsMap` (`Record<number, Question>`)
- `tests.json` — 34 tests, each with an ordered list of 20 question IDs

These maps are the single source of truth. All views consume them via the `useApp()` hook.

### State management

`AppContext` (`src/context/AppContext.tsx`) holds all global state:
- Derived maps: `questions`, `tests`, `testGroups` (grouped by test name, e.g. "5031"), `groupNames`
- `retryQueue: number[]` — question IDs the user got wrong, persisted in `localStorage`
- `currentGroupIndex` — the selected test group in the home view

`TestResult` is passed between `TestView` → `ResultView` via React Router `location.state` (not persisted).

### Routing

Hash-based routing (`HashRouter`) for reliable PWA/offline navigation. Routes:
- `/#/` → `HomeView` — test group picker, nav to bank/images/retry
- `/#/test/:testId` → `TestView` — `testId` is a `cditest` number, `"retry"`, or `"image-test"`
- `/#/result` → `ResultView` — receives state from `TestView`
- `/#/retry` → `RetryQueueView`
- `/#/questions` → `QuestionsView` — filterable question bank
- `/#/images` → `ImagesView` — image grid + select-to-test builder

### Special test modes

`TestView` handles three `testId` variants:
- Numeric string → looks up `tests[Number(testId)].question_ids`
- `"retry"` → uses `retryQueue` snapshot captured at mount time
- `"image-test"` → reads `questionIds` from `location.state` (set by `ImagesView`)

### PWA / Service Worker

`vite-plugin-pwa` generates a Workbox SW with:
- `CacheFirst` for `/pictures/*` (848 JPEG question images, 1-year TTL)
- `NetworkFirst` for `/questions/*` (JSON data files)
- `sw.js` and `index.html` served with `no-cache` headers (see `vercel.json`)

### Scraping

`scraping/scraper.py` — full scraper requiring Python + `requests` + `beautifulsoup4`. Authenticates against `matferline.com`, discovers 34 tests, fetches all question data, downloads images, and writes `public/questions/questions.json` and `public/questions/tests.json`. Run `scraping/fix_missing_correct.py` to fix any questions that end up with no correct answer after scraping.
