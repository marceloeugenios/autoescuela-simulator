# Focus Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three numerical-topic test categories (Velocidades, Años y Plazos, Distancias y Medidas) to the app as a dedicated "Focus Tests" section.

**Architecture:** Categories are computed from `questions.json` at startup in `AppContext` using ordered regex matching (first match wins). A new `FocusTestsView` shows category cards; tapping one launches `TestView` via the existing `image-test` `location.state` pattern. `TestView` gets a one-line change to also accept `focus-test` as a testId.

**Tech Stack:** React 18, TypeScript, React Router v6 (hash-based)

---

### Task 1: Add FocusCategory type

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add the interface**

In `src/types.ts`, append after the last export:

```typescript
export interface FocusCategory {
  id: string
  label: string
  questionIds: number[]
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add FocusCategory type"
```

---

### Task 2: Compute focusCategories in AppContext

**Files:**
- Modify: `src/context/AppContext.tsx`

- [ ] **Step 1: Add import and constant**

At the top of `src/context/AppContext.tsx`, add the import for `FocusCategory`:

```typescript
import type { Question, Test, QuestionsMap, TestsMap, TestGroups, FocusCategory } from '../types'
```

Then add this constant directly below the imports (before the interface definition):

```typescript
const FOCUS_DEFS = [
  { id: 'speed',    label: 'Velocidades',         regex: /velocidad|km\/h|kilómetros por hora/i },
  { id: 'years',    label: 'Años y Plazos',        regex: /año|antigüedad|cumplir/i },
  { id: 'distance', label: 'Distancias y Medidas', regex: /metro|centímetro|distancia|separación/i },
]
```

- [ ] **Step 2: Add focusCategories to context interface**

Replace the existing `AppContextValue` interface:

```typescript
interface AppContextValue {
  questions: QuestionsMap
  tests: TestsMap
  testGroups: TestGroups
  groupNames: string[]
  currentGroupIndex: number
  setCurrentGroupIndex: (i: number) => void
  retryQueue: number[]
  addToRetryQueue: (ids: number[]) => void
  removeFromRetryQueue: (id: number) => void
  clearRetryQueue: () => void
  focusCategories: FocusCategory[]
  loading: boolean
}
```

- [ ] **Step 3: Add state and computation**

In `AppProvider`, add state after the `retryQueue` state declaration:

```typescript
const [focusCategories, setFocusCategories] = useState<FocusCategory[]>([])
```

In the `Promise.all` `.then()` callback, after `setGroupNames(...)` and before `setLoading(false)`, add:

```typescript
const cats: FocusCategory[] = FOCUS_DEFS.map(d => ({ id: d.id, label: d.label, questionIds: [] }))
questionsRaw.forEach(q => {
  const text = q.question + ' ' + q.explanation
  for (let i = 0; i < FOCUS_DEFS.length; i++) {
    if (FOCUS_DEFS[i].regex.test(text)) {
      cats[i].questionIds.push(q.id)
      break
    }
  }
})
setFocusCategories(cats)
```

- [ ] **Step 4: Expose in context value**

In the `AppContext.Provider` value prop, add `focusCategories` alongside the other values:

```typescript
value={{
  questions, tests, testGroups, groupNames,
  currentGroupIndex, setCurrentGroupIndex,
  retryQueue, addToRetryQueue, removeFromRetryQueue, clearRetryQueue,
  focusCategories,
  loading,
}}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/context/AppContext.tsx
git commit -m "feat: compute focusCategories in AppContext"
```

---

### Task 3: Handle focus-test in TestView

**Files:**
- Modify: `src/views/TestView.tsx`

- [ ] **Step 1: Update the testId branch**

In `src/views/TestView.tsx`, find this block inside the `useEffect`:

```typescript
const ids =
  testId === 'retry'
    ? retryQueueSnapshot.current
    : testId === 'image-test'
      ? ((location.state as { questionIds?: number[] })?.questionIds ?? [])
      : (tests[Number(testId)]?.question_ids ?? [])
```

Replace with:

```typescript
const ids =
  testId === 'retry'
    ? retryQueueSnapshot.current
    : testId === 'image-test' || testId === 'focus-test'
      ? ((location.state as { questionIds?: number[] })?.questionIds ?? [])
      : (tests[Number(testId)]?.question_ids ?? [])
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/views/TestView.tsx
git commit -m "feat: handle focus-test testId in TestView"
```

---

### Task 4: Create FocusTestsView

**Files:**
- Create: `src/views/FocusTestsView.tsx`

- [ ] **Step 1: Create the view**

Create `src/views/FocusTestsView.tsx` with this content:

```typescript
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function FocusTestsView() {
  const { focusCategories } = useApp()
  const navigate = useNavigate()

  const launch = (questionIds: number[]) => {
    navigate('/test/focus-test', { state: { questionIds } })
  }

  return (
    <section className="view">
      <div className="home-header">
        <h2>Focus Tests</h2>
        <p>Drill questions grouped by numerical topic</p>
      </div>

      {focusCategories.map(cat => (
        <div
          key={cat.id}
          className="card"
          onClick={() => launch(cat.questionIds)}
          style={{ cursor: 'pointer', marginBottom: 12 }}
        >
          <div className="card-content">
            <h3>{cat.label}</h3>
            <p>{cat.questionIds.length} questions</p>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      ))}
    </section>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/views/FocusTestsView.tsx
git commit -m "feat: add FocusTestsView"
```

---

### Task 5: Register route and add home button

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/views/HomeView.tsx`

- [ ] **Step 1: Register route in App.tsx**

In `src/App.tsx`, add the import:

```typescript
import FocusTestsView from './views/FocusTestsView'
```

Inside `<Routes>`, add after the `/images` route:

```typescript
<Route path="/focus-tests" element={<FocusTestsView />} />
```

- [ ] **Step 2: Add button in HomeView.tsx**

In `src/views/HomeView.tsx`, replace the existing two-button row:

```typescript
<div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
  <button className="secondary-btn" style={{ flex: 1 }} onClick={() => navigate('/questions')}>
    Question Bank
  </button>
  <button className="secondary-btn" style={{ flex: 1 }} onClick={() => navigate('/images')}>
    Browse Images
  </button>
</div>
```

With:

```typescript
<div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
  <button className="secondary-btn" style={{ flex: 1 }} onClick={() => navigate('/questions')}>
    Question Bank
  </button>
  <button className="secondary-btn" style={{ flex: 1 }} onClick={() => navigate('/images')}>
    Browse Images
  </button>
  <button className="secondary-btn" style={{ flex: 1 }} onClick={() => navigate('/focus-tests')}>
    Focus Tests
  </button>
</div>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/views/HomeView.tsx
git commit -m "feat: add Focus Tests route and home button"
```
