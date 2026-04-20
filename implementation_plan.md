# Auto-Escola Simulator Implementation Plan

We will build the Progressive Web App (PWA) exactly according to the requirements using Vanilla JavaScript and modern, premium CSS without a framework to ensure it is lightweight and offline-first capable.

## User Review Required

> [!WARNING]
> Caching all 848 images (around 20-50MB depending on size) on the first visit might impact performance. 
> I propose caching core app files (HTML, JS, CSS, JSON) on Service Worker install to ensure the app boots offline, and using a **“stale-while-revalidate”** or **“cache-first”** strategy for images. Images will be cached as the user encounters them, or we can add a setting to "Download all images for offline use". 
> **Does this hybrid approach work, or would you prefer *all* images downloading immediately in the background on first load?**

## Proposed Changes

### 1. Foundation & Assets

#### [NEW] `index.html`
- SPA boilerplate containing semantic tags for routing containers (`#home-view`, `#test-view`, `#result-view`, `#retry-queue-view`).
- `<meta name="viewport">` for mobile responsiveness.
- Link to Google Fonts (e.g., *Inter* or *Outfit*).

#### [NEW] `manifest.json`
- PWA configurations: icons, `display: "standalone"`, `theme_color`, `background_color`.
- I will generate simple fallback icons for `192x192` and `512x512`.

#### [NEW] `sw.js`
- Service Worker registration.
- `install` & `activate` events to pre-cache core assets: `index.html`, `app.js`, `styles.css`, `questions/questions.json`, `questions/tests.json`.
- `fetch` interceptor to serve cached files and cache image requests on the fly (Cache-First strategy).

---

### 2. Styling (Premium Aesthetics)

#### [NEW] `styles.css`
- **Color Palette:** Curated modern, sleek design (accessible, dark-mode ready).
- **Typography:** Google Fonts integration.
- **Glassmorphism:** For overlays or sticky headers.
- **Micro-animations:** Hover effects, smooth transitions on view change (e.g., slide-in/fade-in), ripple effects for answer selection.
- **Responsive Layouts:** CSS Grid/Flexbox to comfortably accommodate mobile users.

---

### 3. Application Logic

#### [NEW] `app.js`
Will be modularized internally to handle:
- **Routing:** Hash-based routing (`window.addEventListener('hashchange', ...)`) to toggle CSS visibility of sections.
- **State Management:**
  - `localStorage` functions to load/save `retryQueue` (array of question IDs) and `testHistory`.
  - Fetching (`fetch()`) and indexing `questions.json` and `tests.json` in memory once on load.
- **Home View:** Renders the 34 tests grouped by names (5031-5047). Displays the "To be retried" button if `retryQueue` is not empty.
- **Test View:** 
  - Loads a test sequence.
  - Renders current question, timer, progress bar.
  - Handles single selection -> validation -> immediate feedback (green/red) + explanation pop-up.
- **Result View:**
  - Tallies up to 20 questions. If mistakes > 2, display "Fail". Otherwise, "Pass".
  - Shows list of mistakes.
  - Automatically adds wrongly answered questions to `retryQueue` in `localStorage`.
- **Retry View:**
  - Same visual layout as Test view, but sequence comes exclusively from `retryQueue` list. Provides options to remove items.

## Verification Plan

### Automated Tests
- Test PWA installability criteria using Lighthouse CLI / Chrome DevTools.

### Manual Verification
- Start a mock server to serve the Vercel-like directory.
- Verify Service Worker caching and complete offline mode functionality by turning off the local network.
- Verify state persistence across reloads via `localStorage`.
- Go through an entire mock test to verify grading and insertion into the Retry Queue.
