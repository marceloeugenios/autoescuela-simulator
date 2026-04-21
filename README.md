# Auto-Escola Simulator

## Application

A **Progressive Web App (PWA)** for practising the A1/A2 motorcycle driving theory exam. Runs fully offline on mobile once installed.

### Features

- **Test simulator** — reproduces the official 34 tests (20 questions each) in the exact server order, with question images where available
- **Answer feedback** — after each answer, shows whether it was correct/incorrect and displays the explanation text
- **Test summary** — on completion, shows score and pass/fail result (**max 2 mistakes allowed** out of 20 questions), time taken, and a breakdown of every question
- **"To be retried" category** — questions answered incorrectly are automatically grouped into a personal retry queue; launch a custom test from this pool at any time
- **Question bank** — browse all 1 432 questions with filters: keyword search (question text, explanation, or question ID), test group (5031–5047), image presence, and retry-queue membership; each card shows the question `#id` and expands inline to show answers and explanation
- **Image gallery** — grid of all 848 question images; tap any image to open a modal with the full image (tap image to close), question `#id`, question text, answers (correct highlighted), explanation, and a direct link to the associated test
- **Image test builder** — in the image gallery, switch to select mode to pick specific images and generate an ad-hoc in-memory test from those questions
- **Offline-first** — all question data (`questions.json`, `tests.json`) and images (`pictures/`) are cached via a Service Worker; no network required after first load
- **PWA installable** — `manifest.json` with icon set; add-to-home-screen on iOS/Android gives a native-app feel

### Data sources

| File | Contents |
|------|----------|
| `questions/questions.json` | 1 432 questions — text, explanation, answers with correct flag, image path, test memberships |
| `questions/tests.json` | 34 tests — each with its ordered list of 20 question IDs |
| `pictures/` | 848 question images (JPEG) |

### Tech stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** — dev server with HMR and optimised production build
- **React Router v6** (hash-based routing for reliable offline/PWA navigation)
- **vite-plugin-pwa** — auto-generates Service Worker (Workbox) and web manifest; cache-first strategy for images and question data
- State persisted in `localStorage` (retry queue)
- Deployed on **Vercel** (static site, zero config)

### Project structure

```
src/
├── types.ts                  # Question, Test, Answer, TestResult types
├── main.tsx                  # React entry point
├── App.tsx                   # Router + AppShell (loading gate)
├── index.css                 # Global styles
├── context/
│   └── AppContext.tsx         # Data loading, retry queue, group navigation state
├── components/
│   └── Header.tsx            # Sticky header with contextual back button
└── views/
    ├── HomeView.tsx           # Test group selector (prev/next + dropdown) + nav to bank/images
    ├── TestView.tsx           # Active test: questions, timer, answer feedback
    ├── ResultView.tsx         # Score, pass/fail, mistakes log, retry test
    ├── RetryQueueView.tsx     # Queue list with remove + launch controls
    ├── QuestionsView.tsx      # Filterable question bank (keyword/id, test, image, retry)
    └── ImagesView.tsx         # Image grid; tap → modal; select mode → image test builder

public/
├── questions/                # questions.json, tests.json (fetched at runtime)
├── pictures/                 # 848 JPEG question images (cached by SW)
└── icons/                    # PWA icons

scraping/
├── scraper.py                # Full scraper — login, test discovery, question fetch
└── fix_missing_correct.py    # Targeted re-fetch for questions missing a correct answer
```

### Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # TypeScript check + Vite production build → dist/
npm run preview  # Preview the production build locally
```

### App screens

| Route | View | Description |
|-------|------|-------------|
| `/#/` | Home | Test groups 5031–5047; dropdown shows code only; "Select the test you want to perform" prompt; Part 1 / Part 2 launch buttons; shortcuts to Question Bank and Images; "To be retried" card if queue is non-empty |
| `/#/test/:testId` | Test | One question at a time; optional image; answer options; immediate correct/incorrect feedback + explanation; progress bar; timer. `testId` can be a `cditest` number, `retry`, or `image-test` |
| `/#/result` | Result | Pass/fail (≤ 2 mistakes), score, time taken; mistakes log with explanations; retry same test |
| `/#/retry` | Retry Queue | List of incorrectly-answered questions; launch as custom test; remove individual entries or clear all |
| `/#/questions` | Question Bank | All 1 432 questions with live filters: keyword (text + explanation + `#id`), test group (code only), image presence, retry-queue; expandable cards showing `#id`, answers + explanation |
| `/#/images` | Images | 3–4 column grid of all 848 question images (48 per page); tap → modal (tap image to close) showing `#id`, question, correct answer highlighted, explanation, test link. "Select for test" mode lets you pick images and launch an ad-hoc test |

---

## Scraper

### Credentials

| Field   | Value |
|---------|-------|
| Site    | https://matferline.com/alumno |
| Usuario | `<NIE>` (e.g. `Z1246219S`) |
| Senha   | same as Usuario |
| School  | AUTOESCOLA RACC BARNA DOS (code: `barna`) |

> Both `usuario` and `clave` must be set to the student's NIE. Using `NIE`/`NIE` (the old placeholder) returns `0` (failure).

---

## API Flow

### Step 1 — School selection

```
GET  https://matferline.com/acceso/index.php
     → establishes PHPSESSID cookie

POST https://matferline.com/acceso/php_script/validar_ae.php
     Fields: acceso=barna    (multipart/form-data)
     Response: "AUTOESCOLA RACC BARNA DOS"  (non-numeric = success)
```

### Step 2 — Student login

```
POST https://matferline.com/alumno/php_script/validar_datos_alumno.php
     Fields: usuario=<NIE>, clave=<NIE>   (multipart/form-data)
     Response: "ok,2,101"   (short CSV = success; cdipermiso=2, programa=101)
     Response: "0"          (numeric = failure — wrong credentials)
```

### Step 3 — Discover available tests

```
GET  https://matferline.com/alumno/alumno_menu_infotest.php
     → HTML page listing 34 exam tests (test names 5031–5047, each split in two halves)
     → Each test item has an onclick: cargar_test_infotest(tipo_test, ayuda,
       cdicurso, cdipermiso, cdicategoria, cditest, programa, ...)
     → Extract all unique cditest values (34 total: 76–89, 217–740)
```

Confirmed tests for Permiso A1-A2 (cdicurso=1, cdipermiso=2, programa=101):

| cditest | Test name | cditest | Test name |
|---------|-----------|---------|-----------|
| 76      | 5031      | 217     | 5038      |
| 77      | 5031      | 227     | 5038      |
| 78      | 5032      | 261     | 5039      |
| 79      | 5032      | 267     | 5039      |
| 80      | 5033      | 273     | 5040      |
| 81      | 5033      | 280     | 5040      |
| 82      | 5034      | 293     | 5041      |
| 83      | 5034      | 320     | 5041      |
| 84      | 5035      | 341     | 5042      |
| 85      | 5035      | 343     | 5042      |
| 86      | 5036      | 373     | 5043      |
| 87      | 5036      | 385     | 5043      |
| 88      | 5037      | 594     | 5044      |
| 89      | 5037      | 606     | 5044      |
|         |           | 607     | 5045      |
|         |           | 611     | 5045      |
|         |           | 627     | 5046      |
|         |           | 650     | 5046      |
|         |           | 670     | 5047      |
|         |           | 740     | 5047      |

### Step 4 — Get question IDs per test

```
POST https://matferline.com/alumno/alumno_fullscreen_test_infotest.php
     Fields (multipart/form-data):
       tipo_test=0, PA=1, IP=1, num_cursos=, ayuda=1
       cdicurso=1, cdipermiso=2, cdicategoria=3
       cditest=<cditest>, programa=101
       modo_vtest=2, modo_ctest=0, test_propio=0, idioma=, traducir=0
     Referer: .../alumno/alumno_menu_infotest.php

     Response: HTML page containing:
       inicializa("9468#9469#9470#...#9487", ...)
     → Split on "#" to get the 20 question IDs for this test
```

### Step 5 — Fetch each question

```
POST https://matferline.com/alumno/php_script/obtener_pregunta_fullscreen.php
     Fields: cdipregunta=<ID>, identificacion=FV, tipo_test=0
     Referer: .../alumno/alumno_fullscreen_test_infotest.php

     Response format (UTF-8):
       image_filename###<strong>question html</strong>##answer1##answer2##answer3##[answer4|__]##explanation text\t
```

- `__` are empty-slot placeholders (questions have 2 or 3 answers)
- `explanation` restates the question with the correct answer embedded
- Correct answer is identified by word-overlap between explanation and answer options (threshold ≥ 0.3)
- If no answer scores above threshold, run `fix_missing_correct.py` (uses no-threshold fallback — always picks the best match)
- Image URL: `https://matferline.com/panel/preguntas/adjuntos/thumb1/{image_filename}`

### Step 6 — Auxiliary endpoints

```
POST https://matferline.com/alumno/php_script/info_test.php
     Fields: cdicurso=<N>, cdipermiso=2
     Response: "FORMACIÓN VIAL*PERMISO A1 - A2*2_A1-A2.jpg"

POST https://matferline.com/alumno/php_script/obtener_CTA_num_fallos.php
     Fields: cdipermiso=2
     Response: "b#a#a#a#b#a#c#b#c#a#c#a#c#b#a#b#b#c#b#c*2"
     → Correct answer positions per test slot (a/b/c)
```

---

## Running the scraper

```bash
pip install requests beautifulsoup4
python3 scraping/scraper.py
```

### What it does

1. School + student login (two-step auth)
2. Loads `alumno_menu_infotest.php` → discovers all 34 tests and their `cditest` values
3. For each test, POSTs to `alumno_fullscreen_test_infotest.php` → extracts 20 question IDs
4. Builds a `question → test(s)` map
5. Fetches all unique question IDs (caches already-scraped ones from `questions.json`)
6. Downloads images to `pictures/`
7. Saves `public/questions/questions.json` and `public/questions/tests.json`

### Fixing questions with no correct answer

If after scraping some questions have all answers marked `false`, run:

```bash
python3 scraping/fix_missing_correct.py
```

This re-fetches only the affected questions using a no-threshold matching strategy (always picks the best-scoring answer). All 1 432 questions currently have a correct answer.

---

## Output files

### `questions/questions.json`

```json
[
  {
    "id": 9468,
    "question": "Si obtiene el permiso de la clase A1 o el de la clase A, ¿puede conducir vehículos especiales agrícolas?",
    "image": null,
    "explanation": "El permiso de la clase A1, o el A, no autoriza a conducir vehículos especiales agrícolas.",
    "answers": [
      { "text": "Sí.", "correct": false },
      { "text": "No.", "correct": true }
    ],
    "tests": [
      { "cditest": 76, "name": "5031" }
    ]
  }
]
```

- **1 432 total questions** — all have at least one `correct: true` answer
- **`tests` field**: list of tests this question belongs to — empty `[]` for bank-only questions
- 752 questions have `tests: []` (outside the 34 official tests)
- Questions have 2 answers (109) or 3 answers (1 323)

### `questions/tests.json`

```json
[
  {
    "cditest": 76,
    "name": "5031",
    "question_ids": [9468, 9469, 9470, ..., 9487]
  }
]
```

- **34 tests**, each with exactly 20 question IDs in the original server order

### `pictures/`

848 JPEG images downloaded from `https://matferline.com/panel/preguntas/adjuntos/thumb1/{filename}`

---

## Key Endpoints Summary

| Purpose                  | Method | URL |
|--------------------------|--------|-----|
| School access            | POST   | `/acceso/php_script/validar_ae.php` |
| Student login            | POST   | `/alumno/php_script/validar_datos_alumno.php` |
| Test menu (list tests)   | GET    | `/alumno/alumno_menu_infotest.php` |
| Test question IDs        | POST   | `/alumno/alumno_fullscreen_test_infotest.php` |
| Fetch question           | POST   | `/alumno/php_script/obtener_pregunta_fullscreen.php` |
| Course info              | POST   | `/alumno/php_script/info_test.php` |
| Image download           | GET    | `/panel/preguntas/adjuntos/thumb1/{filename}` |

**Permit type**: A1-A2 (cdipermiso=2, cdicurso=1, cdicategoria=3, programa=101)
