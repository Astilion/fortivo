# BACKLOG — znany dług Fortivo

> Rejestr rzeczy, o których wiemy, że są nie tak, i świadomie je odkładamy.
> Nie naprawiaj mimochodem, ale nie pogłębiaj. Dopisuj na bieżąco.
> Dług spłacony → oznacz datą zamknięcia, nie kasuj wpisu.

---

## Otwarte pozycje audytu (→ M1.17)

- **D8** — `saveWorkoutExercises` = DELETE + reinsert z nowymi ID (stąd guard blokujący edycję aktywnego treningu). Docelowo UPSERT + diff-prune jak w `saveActiveWorkoutSnapshot`.
- **D9** — zero testów dla `workoutService` (snapshot round-trip, `seedActualsFromLastSession`) i migracji. Plan w `strategia-testow.md` (SQLite in-memory przez better-sqlite3).
- **D10** — seed 272 ćwiczeń przy każdym boocie, bez transakcji.
- **D11** — N+1 w `getWorkoutExercises` (do JOIN/IN).
- **D12** — typy kłamiące na granicy serwis→UI (`WeeklyPlanDay.workout` non-null vs `null` + `as WeeklyPlan`, `{id,name} as Workout` w mailboxie).
- **D13** — polska odmiana liczebników („2 treningów"); wzorzec istnieje w `WorkoutCard.getExerciseLabel`, wynieść jako `utils/plural.ts`.

## Reszta / drobne

- Reszta **D6** — pełne przejście loaderów na `useAsyncLoader`.
- Reszta **D14** — drobne.
- `jest-expo` wciąż w `dependencies`.
- Import/restore danych — domyka pętlę bezpieczeństwa; wysoko po becie.
- `originalError` → `cause` w `ServiceError` (dziś komunikat SQLite nie dociera do Sentry).
- `withExclusiveTransactionAsync` + przepchnięcie `txn` przez `_...InTx`.

## Nieużywane zależności (kandydaci do usunięcia lub zagospodarowania)

Stan na v0.6 (zweryfikowane grepem — zero importów w kodzie):

- **`react-hook-form`** — w `package.json`, ale nigdzie nie importowane. Formularze
  (create/edit workout, create-exercise, weight, measurements) działają na własnym
  state + walidacji inline. **Decyzja (czerwiec 2026):** zostawić na razie; w
  trakcie bety przy refaktorze formularzy rozważyć, czy `react-hook-form` upraszcza
  walidację/dirty-tracking — jeśli nie, usunąć z deps.
- **`date-fns`** — w `package.json`, ale nigdzie nie importowane. Formatowanie dat
  robi `utils/date.ts` na `Intl`/`toLocale*` (locale `pl-PL`). **Decyzja:** jak
  wyżej — albo znaleźć zastosowanie przy refaktorze dat, albo usunąć.

> Obie to martwe deps na dziś (waga w bundlu, szum w `package.json`). Świadomie
> trzymane do okna refaktoru, żeby najpierw sprawdzić, czy się przydadzą, zanim
> się je wyrzuci.

## Zaparkowane z handoffu v0.6 (po becie, NIE teraz)

- PR detection rewrite (per rep-range, jeden PR/sesja, heaviest-single; E1RM → premium).
- Measurement-type UI logic (hide/show weight/RPE/tempo per typ ćwiczenia).
- Multi-measurement rendering + wykresy.
- Backfill `workout_name` w starych `exercise_progress` (zostawione null by design).
- Edycja `measurementType` ćwiczenia z historią → dziwny render (warn/disable).
- `exerciseStore` — read errors przez `error.message` (EN) zamiast `userMessage` (PL);
  niespójność z `useAsyncLoader`, do ujednolicenia.

## Zamknięte

- **D1–D7, D15** — zamknięte 2026-08-11 w M1.15 (`9fae822`). Szczegóły w
  `docs/private/fable-review/audyt-techniczny.md`.
