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
- `originalError` → `cause` w `ServiceError`. Od 0.6.1 obsłużone błędy docierają do Sentry
  przez `logger.error`, ale `ServiceError` niesie tylko polski komunikat — przyczyna SQLite
  widoczna jest wyłącznie w osobnym zdarzeniu z warstwy serwisu.
- `withExclusiveTransactionAsync` + przepchnięcie `txn` przez `_...InTx`. Ustalenie z 2026-10-11:
  pojedyncze `runAsync` spoza `runInTransaction` (serwisy workout, exercise, weight, measurement,
  weeklyPlan, profile) mogą wpaść w cudzą otwartą transakcję na wspólnym połączeniu i zostać
  cofnięte jej `ROLLBACK`-iem, mimo że użytkownik dostał toast sukcesu. Realny scenariusz:
  autosave aktywnego treningu + ulubione/własne ćwiczenie dodane w pickerze w tym samym oknie.
  Prawdopodobieństwo bardzo niskie (nakładka czasowa i błąd tej transakcji naraz). Alternatywa
  do oceny: pojedyncze zapisy przez ten sam łańcuch write locka.
- **Sesja instalacyjna nigdy nie raportuje** (2026-09-04). `bootstrapCrashReporting()` biegnie
  raz przy ładowaniu modułu `app/_layout.tsx`, więc zgoda udzielona w onboardingu działa
  dopiero od kolejnego startu aplikacji — a pierwsza sesja jest tą o najwyższym ryzyku
  (migracje na świeżej bazie, seed 272 ćwiczeń). Skutek dla bety: **metryka crash-free
  z kryteriów M1.16 jest lekko zawyżona**, bo nie obejmuje sesji instalacyjnych — czytać ją
  z tym zastrzeżeniem. Re-init w trakcie sesji świadomie odrzucony (`DECISIONS.md`,
  2026-08-31); ewentualne wyjście to przesunięcie decyzji o `Sentry.init` za odczyt zgody
  w tej samej sesji, nie ponowna inicjalizacja klienta.
- **Breadcrumby `network.event` znikają zamiast być przycinane** (2026-09-04). W ostatnim
  przebiegu smoke'a nie było ich w evencie w ogóle, choć `beforeBreadcrumb` przycina je do
  `action` + `network_type` i nigdzie ich nie usuwa. Podejrzenie: za szeroki selektor
  w regułach Advanced Data Scrubbing w projekcie Sentry. Nie blokuje niczego — pod obiema
  hipotezami `vpn_active` nie trafia do raportu; do sprawdzenia przy okazji następnej pracy
  przy konfiguracji Sentry.
- `VIBRATE` zablokowane w `app.json` (2026-08-31, nieużywane). `expo-notifications` z M2.1
  dokłada to uprawnienie — przy wdrażaniu przypomnień lokalnych trzeba je usunąć
  z `blockedPermissions`, inaczej powiadomienia nie zawibrują, a przyczyna będzie niewidoczna.
- **R8/ProGuard praktycznie wyłączony** (2026-09-11, build 16). Play raportuje 1% zaciemnienia
  kodu, brak pliku mapowania i optymalizację „niski"; Google sugeruje włączenie. Świadomie
  odłożone poza okno bety — to zmiana wpływająca na runtime, a kod bety jest zamrożony.
  Dodatkowo włączenie R8 wymaga wysyłania mapowań ProGuarda do Sentry, inaczej stosy natywne
  przestaną być czytelne dokładnie wtedy, gdy zaczną przychodzić. Do rozważenia w M1.17
  albo v0.7.
- **Nieskompresowane DEX-y w AAB: 39,6 MB** (2026-09-11, build 16). Podejrzenie:
  `expo-dev-client` siedzi w `dependencies`, nie `devDependencies` (dodany `4a8d6cc`
  2026-09-04 na potrzeby lokalnego dev buildu), więc kompiluje się także do wydania
  produkcyjnego. Do sprawdzenia w Eksploratorze pakietów aplikacji przez porównanie rozmiaru
  pobierania z wersją 0.2.1 z marca (sprzed dev clienta). Jeśli potwierdzone — wykluczyć
  z buildów release. Nie blokuje bety.
- **Zgoda na raporty u aktualizujących z 0.5.x** (audyt bety #2, 2026-09-24; niski priorytet).
  Onboarding się nie powtarza, więc kto przeszedł go przed modelem opt-in, pytania o zgodę nie
  zobaczy nigdzie poza Profilem. To samo dotyczy przesunięcia palcem za slajd zgody i
  systemowego „wstecz” w onboardingu. Poprawka: jednorazowe pytanie, gdy flaga
  `crashReportingEnabled` jest pusta i brak `crashReportingConsentMeta`. Szczegóły:
  `docs/private/audyt-beta-2026-09.md` #2.
- **Nieidempotentne `ADD COLUMN` w migracjach** (audyt bety #10, 2026-09-24) — razem z **D9**.
  Stary runner (≤ 0.5.0) bumpował `user_version` poza transakcją; baza z kolumną, ale wersją
  N−1, trwale pada na kroku N i zostaje tylko reset. Poprawka: sprawdzenie
  `PRAGMA table_info` przed `ALTER TABLE … ADD COLUMN`. Szczegóły: raport #10.
- **Tworzenie i edycja treningu to dwa zapisy z ekranu** (audyt bety #11, 2026-09-24) — razem
  z **D8**. `create-workout.tsx` / `edit-workout.tsx` wołają `createWorkout`/`updateWorkout` i
  `saveWorkoutExercises` osobno; retry po błędzie duplikuje trening. Poprawka: jedna metoda
  serwisu w jednej transakcji. Szczegóły: raport #11.
  przed `saveWorkoutExercises` w `create-workout.tsx` — walidacja wyżej już
  wyklucza pustą listę (2026-10-22, zostawiony w hotfixie 0.6.3 celowo).
- **Etykieta „Zresetuj” w potwierdzeniu resetu bazy** (2026-10-03). Podczas smoke'a 0.6.2
  przypadkowe potwierdzenie skasowało bazę na emulatorze. Kod działa zgodnie z założeniem
  (reset tylko przez `confirmAction`), ale „Zresetuj” obok „Anuluj” łatwo pomylić przy
  nieodwracalnej akcji. Rozważyć jednoznaczne „Usuń wszystkie dane”.
- **FORTIVO-8: `SharedObject doesn't contain valid id` przy odczycie planu** (2026-10-11).
  1 event (0.6.2+19, ~5 s po starcie, current-workout), niepotwierdzone. Podejrzenie: wyścig
  w `SharedObjectRegistry` expo-modules-core 3.0.18 — argumenty `AsyncFunction` są konwertowane
  na wątku tła, który czyta mapę `pairs` bez synchronizacji, podczas gdy wątek JS ją modyfikuje
  (nowe statementy, finalizatory GC). Nasz `close`/`finalize` nie pasuje do objawu. W Sentry brak
  innych issue z SharedObject (90 dni) i brak „Failed to initialize app” (14 dni) — ścieżka retry
  nie jest przyczyną tego eventu. Skutek: nieudany odczyt planu (toast, kolejny focus powinien
  ładować poprawnie — niesprawdzone). Ten sam mechanizm może trafić zapisy — w transakcji kończy
  się `ROLLBACK`-iem. Do sprawdzenia changelog expo przy przeglądzie M1.16 / v0.7. Issue w Sentry
  zostaje otwarte.
- **„Spróbuj ponownie” po `initError` gubi połączenie** (2026-10-11). `providers/AppProvider.tsx:105`
  woła `initDatabase()` przy każdym `reinitNonce` (retry z `:202–207`), a poprzedni uchwyt jest
  zamykany tylko przy `DatabaseMigrationError` (`database/database.ts:363–366`). Drugie
  `openDatabaseAsync` (`database/database.ts:359`) dostaje ten sam zcache'owany natywny obiekt
  (`expo-sqlite/android/.../SQLiteModule.kt:110`, `addRef`); gdy GC zbierze stary wrapper JS,
  `NativeDatabase.sharedObjectDidRelease()` woła `ref.close()` bez patrzenia na refCount
  (`NativeDatabase.kt:28–31`) i zamyka połączenie nowego kontekstu. Poprawka: zamknąć stary
  uchwyt przed ponownym otwarciem albo zamykać go w `catch` także dla błędów spoza migracji.
- Pomysł, nie teraz (2026-10-11): jedna ponowna próba po przejściowym błędzie natywnym expo-sqlite
  (`InvalidSharedObjectIdException`) dla odczytów i autosave. Wraca, jeśli FORTIVO-8 się powtórzy.
- Screenshoty w README (`assets/screenshots/`) z 2026-05-24 — ekrany od tego czasu zmienione
  (30 commitów); nazwy `current-workout.tsx.png` i `active-workout.tsx.png` są zamienione
  względem ekranów (podpisy w README są poprawne). (nowe 2026-10-17)
- **Wpisana wartość ginie przy killu procesu w aktywnym treningu** (2026-10-22,
  po hotfixie 0.6.3). Pola aktywnego treningu trzymają wpis w `pendingText`
  (ref) aż do `onBlur`/`onEndEditing`, a schowanie klawiatury strzałką na
  Androidzie nie zdejmuje fokusu. 0.6.3 domyka ścieżkę „Zakończ trening”
  (`forceBlur()` przed potwierdzeniem), ale wartość, która nie przeszła
  commitu, nie trafia do store'a ani do bazy, jeśli system zabije proces albo
  aplikacja przejdzie w tło. **Nie zweryfikowane** — sprawdzić krokiem
  „wpisz → schowaj strzałką → `adb shell am force-stop com.astilion.fortivo`”.
  Jeśli się potwierdzi: utrata danych (twardy bloker z kryteriów M1.16),
  priorytet wysoki. Kierunek do rozważenia: commit oczekujących wartości przy
  przejściu aplikacji w tło.

## Nieużywane zależności (kandydaci do usunięcia lub zagospodarowania)

> **Zamknięte 2026-06-10** (`d1f2de1`) — obie usunięte z `package.json`; wpis niżej nieaktualny,
> odnotowane 2026-10-17.

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
