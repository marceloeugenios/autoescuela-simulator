# Focus Tests — Design Spec
**Date:** 2026-05-10

## Goal

Add three numerical-topic test categories (Velocidades, Años y Plazos, Distancias y Medidas) to the app so the user can drill the most memorisation-heavy question types as a group.

## Categories

| Label | Regex triggers (applied to question + explanation text) | ~Count |
|---|---|---|
| Velocidades | `velocidad`, `km/h`, `kilómetros por hora` | 43 |
| Años y Plazos | `año`, `antigüedad`, `cumplir` | 34 |
| Distancias y Medidas | `metro`, `centímetro`, `distancia`, `separación` | 24 |

Matching is exclusive: each question is assigned to the first matching category only. Questions matching none are excluded from focus tests.

## Data

Category computation happens once in `AppContext` at startup, alongside the existing `questions`/`tests` map building. A new `focusCategories` value is added to the context:

```ts
interface FocusCategory {
  id: string        // 'speed' | 'years' | 'distance'
  label: string     // 'Velocidades' etc.
  questionIds: number[]
}
```

`AppContext` exports `focusCategories: FocusCategory[]`.

## Routing

New route: `/#/focus-tests` → `FocusTestsView`

Launching a focus test reuses the existing `image-test` pattern in `TestView`:
- Navigate to `/test/focus-test` with `location.state = { questionIds: [...] }`
- `TestView` already handles this via the `image-test` branch — no changes needed there

## UI

### Home screen
Add a third button "Focus Tests" in the existing two-button row (Question Bank | Browse Images) — the row becomes three equal-width buttons.

### FocusTestsView (`src/views/FocusTestsView.tsx`)
Simple card list, one card per category:
- Category label
- Question count
- Chevron arrow
- Tapping navigates to `/test/focus-test` with that category's `questionIds`

Style follows existing card pattern (`.card` class).

## Files changed

| File | Change |
|---|---|
| `src/context/AppContext.tsx` | Add `focusCategories` computation + context value |
| `src/types.ts` | Add `FocusCategory` interface |
| `src/views/FocusTestsView.tsx` | New view |
| `src/views/HomeView.tsx` | Add "Focus Tests" button |
| `src/App.tsx` | Register `/focus-tests` route |
| `src/views/TestView.tsx` | Handle `testId === 'focus-test'` (same as `image-test`) |
