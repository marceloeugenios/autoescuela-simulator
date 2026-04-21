# Auto-Escola Simulator — Implementation Plan

> This document reflects the current state of the application after all delivered iterations.

---

## Stack

| Concern | Choice | Notes |
|---------|--------|-------|
| UI framework | React 18 | Strict mode enabled |
| Language | TypeScript 5 | Strict, `noEmit` via `tsc` |
| Build tool | Vite 5 | HMR in dev; optimised bundle in prod |
| Routing | React Router v6 — `HashRouter` | Hash-based for reliable offline / PWA navigation |
| PWA / SW | vite-plugin-pwa (Workbox) | Auto-generates SW; cache-first for images and JSON data |
| State | React Context + `useState` | No external state library needed |
| Persistence | `localStorage` | Retry queue only |
| Styling | Plain CSS custom properties | Dark theme, glassmorphism header, CSS Grid / Flexbox |
| Deployment | Vercel | Static site, zero config |

---

## Project Structure

```
auto-escola-simulator/
├── public/
│   ├── questions/
│   │   ├── questions.json     # 1 432 questions
│   │   └── tests.json         # 34 tests × 20 question IDs
│   ├── pictures/              # 848 JPEG question images
│   └── icons/                 # PWA icons (192 × 192, 512 × 512)
├── src/
│   ├── types.ts               # Shared TypeScript interfaces
│   ├── main.tsx               # createRoot entry point
│   ├── App.tsx                # AppProvider + HashRouter + AppShell
│   ├── index.css              # Global styles (single flat file)
│   ├── context/
│   │   └── AppContext.tsx     # Data fetch, questions/tests maps, retry queue, group index
│   ├── components/
│   │   └── Header.tsx         # Sticky header; contextual title + back button
│   └── views/
│       ├── HomeView.tsx        # Test group navigator + bank/images shortcuts
│       ├── TestView.tsx        # Active test runner
│       ├── ResultView.tsx      # Score + mistakes log
│       ├── RetryQueueView.tsx  # Retry queue manager
│       ├── QuestionsView.tsx   # Filterable question bank
│       └── ImagesView.tsx      # Image gallery + question modal
├── index.html                 # Vite HTML entry (no manifest link — injected by plugin)
├── vite.config.ts             # Vite + React plugin + PWA plugin config
├── tsconfig.json
└── package.json
```

---

## Routes

| Hash path | View | Notes |
|-----------|------|-------|
| `/#/` | HomeView | Default |
| `/#/test/:testId` | TestView | `testId` = `cditest` number or `retry` |
| `/#/result` | ResultView | Receives `TestResult` via router location state |
| `/#/retry` | RetryQueueView | |
| `/#/questions` | QuestionsView | |
| `/#/images` | ImagesView | |

---

## State (AppContext)

| Key | Type | Source | Persisted |
|-----|------|--------|-----------|
| `questions` | `Record<number, Question>` | `questions.json` | No |
| `tests` | `Record<number, Test>` | `tests.json` | No |
| `testGroups` | `Record<string, Test[]>` | Derived from tests | No |
| `groupNames` | `string[]` | Sorted keys of `testGroups` | No |
| `currentGroupIndex` | `number` | User navigation | No (session only) |
| `retryQueue` | `number[]` | `localStorage` | Yes |
| `loading` | `boolean` | Fetch lifecycle | No |

---

## Views

### HomeView
- Prev / next arrow buttons + dropdown selector to navigate across the 17 test groups (5031–5047)
- Clicking a group immediately shows its Part 1 and Part 2 launch buttons
- "To Be Retried" card visible only when retry queue is non-empty
- Two secondary buttons: **Question Bank** (`/#/questions`) and **Browse Images** (`/#/images`)

### TestView
- Resolves question list from `cditest` param (or `retryQueue` snapshot when `testId === 'retry'`)
- One question at a time: optional image → question text → answer buttons
- On answer: all buttons lock; correct answer gets green border; wrong selection gets red; explanation panel slides in
- "Next Question" / "Finish Test" advances state
- On finish: new mistakes (not already in retry queue) are added; navigates to ResultView via router state

### ResultView
- Reads `TestResult` from `location.state` (questions, mistakes, timerSeconds, testId)
- Pass = ≤ 2 mistakes out of 20
- Mistakes log shows each wrong question with explanation
- "Retry Test" re-navigates to `/#/test/:testId`

### RetryQueueView
- Lists all queued question texts; remove individual items or clear all
- "Start Custom Test" → `/#/test/retry`

### QuestionsView
- Filters (live, combined): keyword (question + explanation text), test group dropdown, image presence dropdown, retry-queue toggle chip
- Results count shown in subtitle
- Load-more pagination (30 per page)
- Each card: badges (test group / bank / img / retry), question text, expandable body with answer list (correct answer highlighted green + checkmark) and explanation

### ImagesView
- Keyword filter on question/explanation text
- CSS grid (3 cols mobile, 4 cols ≥480 px), `loading="lazy"`, load-more pagination (48 per page)
- Click thumbnail → `createPortal` modal rendered into `document.body` (avoids stacking context issues)
- Modal step 1: full-size image + "See related question" button
- Modal step 2: question text, answers (correct answer has green border + bold + checkmark icon), explanation, test link buttons ("Go to Test 5031 · Part 1") that close modal and navigate to the test

---

## PWA / Offline

Handled entirely by `vite-plugin-pwa` (Workbox `generateSW` strategy):

- **Precache**: all build output (JS, CSS, HTML)
- **Runtime cache — `pictures-cache`**: Cache-First, max 1 000 entries, 1-year TTL
- **Runtime cache — `questions-cache`**: Cache-First for `/questions/*.json`
- SW registered with `registerType: 'autoUpdate'`

---

## Data Notes

- `questions.json` image paths already include the `pictures/` prefix (e.g. `pictures/9469_graf_873mod.jpg`) — rendered as `/${q.image}`
- Each image maps to exactly one question (848 unique images, 848 questions with images)
- 752 questions have `tests: []` (bank questions outside the 34 official tests)
- Questions have 2 answers (109) or 3 answers (1 320)

---

## Development Commands

```bash
npm install
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # tsc type-check + Vite production build → dist/
npm run preview  # Serve dist/ locally
```
