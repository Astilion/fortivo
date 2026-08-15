# Fortivo — Project Context for Claude Code

## Zasady dla Claude Code

Plan mode dla wszystkiego, co dotyka więcej niż dwóch plików lub sygnatur; wyniki grepów przed usuwaniem metod; jawna lista „poza zakresem" w prompcie; raport o diffie wychodzącym poza zakres.

## O projekcie

Fortivo to fitness tracking app (React Native + Expo). Portfolio piece + potencjalny komercyjny produkt.

## Stack

- React Native 0.81 + Expo SDK 54 (expo-router 6, typed routes)
- TypeScript (strict, bez wyjątków w tsconfig)
- Zustand (state management)
- SQLite via expo-sqlite (offline-first)
- AsyncStorage (tylko flagi UI, np. onboarding — NIE dane domenowe). Jedyny wyjątek: `crashReportingEnabled` (`utils/crashReporting.ts`) — czytana przed inicjalizacją bazy i musi przeżyć reset bazy. Uzasadnienie: `docs/DECISIONS.md`.
- Sentry (`@sentry/react-native` ~7.2, region **EU** — `https://de.sentry.io/`) — jedyny kanał wychodzący w całej apce
- expo-file-system + expo-sharing (eksport JSON)
- Jest + jest-expo + @testing-library/react-native
- **npm** (`packageManager` przypięty w package.json; pnpm lockfile usunięty — dwa lockfile'e psuły EAS)
- EAS Build (Android; iOS odłożone do dostępu do Maca)

## Struktura projektu

Bez folderu `/src` — pliki na root level:

- `app/` — ekrany (Expo Router, file-based routing)
- `components/` — reusable komponenty (`ui/`, `weight/`, `measurements/` + root: Toast, DatabaseRecoveryScreen)
- `providers/` — `AppProvider.tsx` (bootstrap bazy, DI serwisów przez Context, recovery gate)
- `services/` — warstwa bazodanowa (class-based, SQLite): exercise, workout, weeklyPlan, profile, weight, measurement, preset, export
- `store/` — Zustand stores
- `hooks/` — custom hooks
- `types/` — TypeScript types (training.ts = główny plik typów)
- `constants/` — Colors.ts, Styles.ts, User.ts (LOCAL_USER_ID), Training.ts, bodyParts.ts, PresetWorkouts.ts, PresetWeeklyPlans.ts, activeWorkout.ts
- `utils/` — date.ts, logger.ts, numbers.ts, search.ts, confirm.ts, errors.ts, days.ts, onboarding.ts, validation.ts, validatePresets.ts, capitalize.ts, crashReporting.ts
- `database/` — database.ts (init + migracje), writeLock.ts (`runInTransaction`)
- `__tests__/` — jest (utils/, services/, hooks/)

## Konwencje kodu

- **Język kodu i komentarzy:** angielski
- **Język UI:** polski (texty widoczne dla użytkownika, `ServiceError.userMessage`, toasty, confirmy, alerty)
- **Komponenty:** functional components, named exports
- **Nazwy plików:** kebab-case (`select-exercise.tsx`, `create-weekly-plan.tsx`)
- **Nawigacja:** expo-router, `useLocalSearchParams` dla parametrów
- **Refresh on focus:** `useFocusEffect` + `useCallback` (do refreshu listy/danych przy powrocie na ekran). `useEffect` zostaje dla initial mount, subscriptions, listenerów.
- **Pressable** zamiast TouchableOpacity
- **logger** zamiast console.log — `no-console: error` **egzekwowane przez ESLint**, wyjątek tylko dla `utils/logger.ts`
- **LOCAL_USER_ID** z `constants/User.ts` (nie hardcoded stringi)
- **generateId(prefix)** z `database/database.ts`
- **Partial<WorkoutSet>** spread dla generic set updates
- **Destrukcyjne akcje:** zawsze `confirmAction` z `utils/confirm.ts` (delete, finish, clear, dezaktywacja)
- **Errors:** service write methods rzucają `ServiceError` (z `utils/errors.ts`) — ale **toast nie pojawia się sam**: każdy caller robi `await` + try/catch + `showToast(error instanceof ServiceError ? error.userMessage : 'fallback PL', 'error')` + `logger.error(...)`. Fire-and-forget zapis = bug (to był dług D5).
- **Loadery też łapią błędy** — `try/finally` bez `catch` daje pusty ekran bez komunikatu (dług D6). Preferuj `useAsyncLoader`.
- **Daty lokalne, nie UTC:** `localDateString()` z `utils/date.ts`, **nigdy** `new Date().toISOString().split('T')[0]`. Uzasadnienie: `docs/DECISIONS.md`.
- **Upserty:** `INSERT ... ON CONFLICT(...) DO UPDATE SET ...` (true UPSERT) — **nigdy** `INSERT OR REPLACE` przy tabelach z FK i `ON DELETE CASCADE`. Uzasadnienie: `docs/DECISIONS.md`.
- **`??` nie `||`** na polach liczbowych. Uzasadnienie: `docs/DECISIONS.md`.
- **Sekwencyjne `for...of`** zamiast `Promise.all` przy zapisach SQLite. Uzasadnienie: `docs/DECISIONS.md`.

## Komentarze w kodzie

**Domyślnie ZERO komentarzy.** Komentarz to wyjątek wymagający uzasadnienia, nie default. Pisz
kod samoopisujący (dobre nazwy zamiast komentarza). To jest twardy wymóg — łamany notorycznie,
egzekwuj go.

- **Tylko WHY, nigdy WHAT.** Komentarz opisujący CO robi kod (parafraza linijki niżej) = USUŃ.
- **Test przed dodaniem:** jeśli usunięcie komentarza nie traci informacji, której nie niesie już
  sam kod + nazwy → komentarz jest zbędny, nie dodawaj go. W razie wątpliwości: NIE pisz.
- Dozwolony wyłącznie gdy intencja jest nieoczywista z kodu: obejście buga (z linkiem/powodem),
  nieintuicyjna decyzja, gotcha platformy, „dlaczego TAK a nie inaczej".
- **Zakazane (typowe WHAT, które wciąż się pojawia):** `// loop over exercises`,
  `// set state`, `// fetch data`, `// guard`, nagłówki-etykiety nad oczywistymi blokami,
  bloki-opisy nad self-explanatory funkcjami (nazwa + sygnatura wystarczą), komentarz
  powtarzający treść following statement.
- Komentarz, który mówi nieprawdę, jest gorszy niż jego brak — przy edycji kodu aktualizuj albo kasuj.
- Komentarze po angielsku.

## File structure standard (ujednolicone w 1.13.4)

Kolejność w pliku komponentu/ekranu:

1. imports
2. types
3. constants
4. component:
   - state
   - hooks (custom + built-in)
   - derived (useMemo)
   - effects (useEffect, useFocusEffect)
   - loaders (async fetchery, np. via `useAsyncLoader`)
   - handlers (event handlers)
   - helpers (lokalne funkcje pomocnicze)
   - JSX (return)
5. styles (StyleSheet.create na końcu pliku)

Trzymaj się tej kolejności. Refactor 1.13.4 ujednolicił wszystkie ekrany pod tym wzorcem.

## Baza danych

- Plik: `fortivo.db` (WAL)
- Migracje: `PRAGMA user_version` — numer aktualnej migracji w `docs/STATUS.md` (v7 `started_at` na `workouts`; v8 `performance_data` JSON snapshot na `workout_history`; v9 decouple historii od treningu — FK `ON DELETE SET NULL` + denormalizowana `workout_name`, rebuild tabeli; v10 `workout_name` na `exercise_progress`)
- Każda migracja idzie w osobnej transakcji; `user_version` bumpuje się dopiero po sukcesie kroku. Uzasadnienie: `docs/DECISIONS.md`.
- **Każda transakcja w warstwie serwisów przez `runInTransaction` z `database/writeLock.ts`, NIGDY `db.withTransactionAsync` wprost.** Jedyny wyjątek: runner migracji. Uzasadnienie: `docs/DECISIONS.md`.
- **Brak transakcji zagnieżdżonych w expo-sqlite** — metody składane w większą transakcję wydzielaj jako wewnętrzne `_...InTx` bez własnego wrappera. Uzasadnienie: `docs/DECISIONS.md`.
- Transakcja obowiązkowa dla każdego zapisu wielostanowego (workout + exercises + sets, plan + dni, finisz treningu)
- Foreign keys: ON (`PRAGMA foreign_keys = ON`)
- **Rebuild tabeli w migracji** (nowa tabela → kopia → DROP → RENAME): przy tabeli z dziećmi (np. `workouts`) obowiązkowo `PRAGMA foreign_keys = OFF` **poza transakcją** na czas rebuildu + `PRAGMA foreign_key_check` na końcu. Uzasadnienie: `docs/DECISIONS.md`.
- **Snapshot `performance_data` ma `version: 1`, a odczyt wersji nie sprawdza** — każda zmiana kształtu snapshotu = bump `version` + branch w deserializacji. Uzasadnienie: `docs/DECISIONS.md`.
- Recovery: przy `DatabaseMigrationError` aplikacja pokazuje recovery screen (reset + re-bootstrap), renderowany **poza** routerem z `AppProvider` (gate bezkontekstowy = takeover, nie `<Redirect>`). Reset kasuje wszystko nieodwracalnie.

## Branding / UI

- Dark theme: `#1C2227` (primary), `#2A2F37` (secondary), `#E0FE10` (neon accent), `#434B53` (background), `#6C757D` (muted)
- `colors.secondary` dla kart i inputów
- `colors.danger` tylko dla destrukcyjnych akcji
- Zawsze `import colors from '@/constants/Colors'` → `colors.X` w `StyleSheet.create`; zero hardcoded hexów (wyjątek: `shadowColor: '#000'`, kolor brandu YouTube)
- borderRadius: 12 na kartach, 8 na inputach/buttonach
- Ionicons z `@expo/vector-icons`

## Istniejące reusable komponenty

- **EmptyState** — fullscreen empty z icon + title + subtitle? + action? (CTA)
- **EmptyTabState** — kompaktowy empty dla pustych tabów (bez CTA)
- **LoadingView** — fullscreen spinner + message?; `inline` prop dla render w obrębie listy
- **ErrorView** — fullscreen error + onRetry?; `inline` prop dostępny
- **Toast** — w root layout; sterowany przez `toastStore` (Zustand); czas ekspozycji per typ (błędy dłużej)
- **DatabaseRecoveryScreen** — fullscreen takeover renderowany przez `AppProvider` przy `DatabaseMigrationError` (retry / reset); NIE jest route'em
- **Button** — primary/secondary/danger + disabled + style
- **Card** — children + onPress? + onLongPress? + style
- **Input** — value + onChangeText + placeholder + icon?
- StatCard, ActionButton
- **WorkoutCard**, **WorkoutHistoryCard**, **WeeklyPlanCard**, **DayCard**
- **PresetWorkoutCard** (read-only gotowy trening w tabie „Gotowe")
- **ExpandableExerciseCard** (z seriami, measurement types)
- **ActiveWorkoutFAB**

## Custom hooks

Z M1.13.4 (refactor & DRY):

- `useRefreshOnFocus(loader, deps)` — DRY wrapper na useFocusEffect + useCallback
- `useAsyncLoader<T>(fn)` — generic async data loader ze statusem (loading/error/data); w `catch` sam wyciąga `ServiceError.userMessage`. **Docelowy wzorzec dla wszystkich loaderów** — dziś używa go tylko `useWorkoutHistory` (dług D6, reszta hooków powiela maszynerię ręcznie)
- `useWeeklyPlanData(planId)` — load + refresh planu tygodniowego z dniami
- domenowe loadery: `useDashboardStats`, `useRecentWorkouts`, `useWorkoutHistory`, `useProfileSettings`
- `useStartWorkout` — start/wznów/porzuć aktywny trening

Active workout:

- `useActiveWorkoutAutosave()` — debounced (500 ms) inkrementalny zapis aktywnego treningu do SQLite + flush na unmount

## Zustand stores

- `toastStore` — kanał toastów (message + type)
- `dbErrorStore` — `dbError` + `reinitNonce` (bump = ponowny bootstrap w AppProvider)
- `onboardingStore` — `showOnboarding: boolean | null` (null = splash/ładowanie)
- `activeWorkoutStore` — stan trwającego treningu **in-memory** (BEZ `persist`); hydratowany z SQLite przy boocie i mount
- `exerciseStore`, `weeklyPlanStore`, `workoutStore`

Konwencja store'ów: akcje read-only niekrytyczne logują i zwracają wartość domyślną, bez toastu; mutacje rzucają dalej — toast pokazuje ekran.
(`exerciseStore` jest hybrydą stan+serwis+async — jedyne takie miejsce w repo; nie kopiuj tego wzorca, nowe dane domenowe idą hookami.)

## Ważne wzorce

- **Service layer → custom hooks → screens** — UI nigdy nie woła SQLite bezpośrednio (jedyny uzasadniony wyjątek: `DatabaseRecoveryScreen`, gdzie warstwa serwisów nie istnieje)
- **Orkiestracja wieloetapowa należy do serwisu, nie do ekranu** — ekran woła jedną metodę: `workoutService.finishWorkout(...)`, `weeklyPlanService.savePlanWithDays(...)`. Nowy wieloetapowy zapis rozbity na kilka wywołań z ekranu = regresja D1/D2. Uzasadnienie: `docs/DECISIONS.md`.
- **Mailbox pattern** — store z `pendingX` do przekazywania złożonych obiektów między ekranami (tylko single-item; multi-select niekompatybilny z mailboxem)
- **FAB** musi być ostatnim child w parent View (paint order)
- **Safe area (dół):** ekrany **stackowe** z elementem przyklejonym do dołu (sticky footer, floating bar, FAB, ostatni przycisk w `ScrollView`) respektują dolny inset przez `useSafeAreaInsets()` (inline w komponencie, bez wrappera) + **additive** `insets.bottom + <base>` na kontenerze — NIE `Math.max`. Baza sticky footerów = 20. Ekrany w `app/(tabs)/*` tego NIE potrzebują (domyślny tab bar sam konsumuje inset), `onboarding.tsx` też już obsługuje.
- **Set w React state** — nigdy nie mutuj, zawsze `new Set(...)`
- **Ternary** zamiast `&&` w style props (unikaj `false` w tablicy stylów)
- **`days.ts`** = single source of truth dla nazw/indexów dni tygodnia
- **`week_starts_on`** z `user_settings` używany konsekwentnie (nie hardcoded Sunday-start)
- **Performance:** `useMemo` na filtered lists, `useCallback` na renderItem w FlatList
- **Accessibility:** `accessibilityLabel` na icon-only buttonach, `hitSlop` na małych targetach, `accessibilityRole="alert"` na toaście
- **Active workout = SQLite jako source of truth, store in-memory:** `activeWorkoutStore` bez `persist`; hydratowany z bazy (`started_at`) przy boocie. Autosave przez `useActiveWorkoutAutosave` (UPSERT po stabilnych ID + diff-prune via `deleteRowsNotIn`, NIE DELETE+reinsert). Sesja starsza niż `ACTIVE_WORKOUT_TIMEOUT_MS` (12 h) czyszczona cicho przy starcie. Okno 500 ms debounce'u = akceptowana strata — **nie tykać**. Uzasadnienie: `docs/DECISIONS.md`.
- **Historia = immutable snapshot:** finisz serializuje wykonane serie do `workout_history.performance_data` (JSON); szczegóły historii czytają snapshot per-wpis, NIE żywe `workout_sets` (legacy fallback dla wpisów sprzed v8). Smart prefill z najnowszego finiszowanego snapshotu (`getLatestPerformanceSnapshot`): active = seed `actual_*` na aktywacji (`seedActualsFromLastSession`), edit-workout = overlay 5 pól numerycznych na PLANOWANE przy load (save path nietknięty). `workout_history`/`exercise_progress` denormalizują `workout_name` (FK `ON DELETE SET NULL`). Uzasadnienie: `docs/DECISIONS.md`.
- **Kaskady FK trzeba pokazać użytkownikowi:** usunięcie własnego ćwiczenia kasuje je ze **wszystkich** treningów (razem z seriami) i czyści cały `exercise_progress`. Confirm liczy skutek przez `exerciseService.countWorkoutsUsingExercise(id)`. Przy każdej nowej destrukcyjnej akcji sprawdź mapę kaskad w `docs/private/fable-review/audyt-techniczny.md` §5.4. Uzasadnienie: `docs/DECISIONS.md`.
- **Anti-loop w gate'ach:** flip stanu warunku synchronicznie PRZED async side-effectem (onboarding `complete()` ustawia `showOnboarding: false` przed `setOnboardingCompleted`).
- **Presety = read-only seed w TS:** `constants/PresetWorkouts.ts` (NIE seed do DB). `presetService.copyPresetWorkoutToUserWorkouts` robi niezależną kopię z nowymi ID (transakcyjnie). `validatePresets` DEV-only w AppProvider (fire-and-forget). `reps` jest `NOT NULL` → time/distance sety mają fallback `1`. Uzasadnienie: `docs/DECISIONS.md`.
- **Eksport danych:** `exportService.exportAllData()` → koperta `{schemaVersion, appVersion, exportedAt, tables}` → plik w `Paths.cache` → `Sharing.shareAsync`. Ćwiczenia tylko `is_custom = 1`. **Importu nie ma — eksport nie jest backupem.** Uzasadnienie: `docs/DECISIONS.md`.
- **Sentry = init warunkowy (opt-out):** `bootstrapCrashReporting()` w `app/_layout.tsx` woła `Sentry.init` dopiero po odczycie flagi opt-out — przy wyłączonych raportach klient **nie powstaje w ogóle**. NIE zastępuj tego `enabled: false`. Konsekwencja: **każde** nowe wywołanie API Sentry musi być odporne na brak klienta — tylko metody z twardym guardem (`captureException`, `captureMessage`, `getClient()?.`). Uzasadnienie: `docs/DECISIONS.md`.
- **Guardraile Sentry (nie usuwać):** `sendDefaultPii: false`, `beforeBreadcrumb` (bez paramów nawigacji i `console`), `beforeSend` (`delete event.user` + twardy limit `MAX_EVENTS_PER_SESSION = 25`), `no-console` w ESLint, serwerowa reguła scrubbingu `$user.geo.**`. Zmiana konfiguracji Sentry pociąga politykę prywatności i formularz Data Safety w Play Console. Uzasadnienie: `docs/DECISIONS.md`.
- **`android.allowBackup: true` jest jawne w `app.json`** — świadoma decyzja, restore wyłącznie w momencie instalacji i tylko przy zgodnym kluczu podpisu. Uzasadnienie: `docs/DECISIONS.md`.

## Git & commits

- Feature branch per task, merge `--no-ff`, delete after merge (local + remote)
- Kolejność: branch → kod → smoke (`npx tsc --noEmit`, `npm run lint`, `npm test`, urządzenie) → commit → merge `--no-ff` → `branch -d` (local + remote) → push. **Wyjątek przy buildach:** commit musi wyprzedzić build, bo EAS czyta z gita.
- Periodyczny `git fetch --prune` na stale remoty
- `CLAUDE.md` i `docs/` są **śledzone** — z wyjątkiem `docs/private/` i `docs/scratch/`, które zostają poza repo
- Commit messages **po angielsku**

**Commit message rules:**

- Subject line ≤ 72 znaki, imperative mood ("add X", nie "added X" / "adds X")
- Business-focused, NIE referencje do milestone numbers ("add multi-select to exercise picker", nie "M1.13.2: multi-select")
- Body **tylko gdy diff sam nie tłumaczy "dlaczego"** — wtedy 2-3 zdania lub krótkie bullets. Nie powielaj tego co widać w diff. Nie pisz wieloparagrafowych uzasadnień, chyba że użytkownik poprosi wprost.
- Atomic — jeden commit = jedna logiczna zmiana

## Release / versioning

- `versionCode` jest **EAS-remote** (`appVersionSource: "remote"` + `autoIncrement`). NIE dodawaj `android.versionCode` do `app.json` — zepsuje config.
- Bumpuj tylko `version` w `app.json` + `package.json` (muszą być zsynchronizowane).
- Profil czyta wersję przez `Constants.expoConfig?.version`.
- Przed buildem: `eas build:version:get --platform android` żeby zweryfikować remote versionCode.
- Każdy profil w `eas.json` ma przypięty `environment`.
- **Testy na urządzeniu: zawsze preview build, nigdy Expo Go** (natywny Sentry, SQLite). Po edycji serwisów pełny reload Metro (`r`), nie Fast Refresh. Urządzenia: Huawei P30 Pro, POCO F8 Pro (POCO wymaga pełnego uninstalla przed sideloadem).

## Komendy

- Dev: `npx expo start`
- Lint: `npm run lint` (ESLint 9, flat config + Prettier)
- Typecheck: `npx tsc --noEmit`
- Tests: `npm test` (jest)
- Build (preview): `eas build --profile preview --platform android`
- Build (production): `eas build --profile production --platform android`

Po większych zmianach uruchom lint + typecheck + testy przed commitem.

## Dokumentacja

- `docs/STATUS.md` — gdzie jesteśmy: wersja, migracja bazy, `main`, co w toku, co czeka na zewnątrz. To czyta `/start`.
- `docs/ROADMAP.md` — co ma powstać w aplikacji i w jakiej kolejności.
- `docs/BACKLOG.md` — znany dług i rzeczy świadomie odłożone.
- `docs/DECISIONS.md` — append-only dziennik decyzji z uzasadnieniem; „dlaczego" trafia tutaj, nie do `CLAUDE.md`.

`docs/private/` — plany komercyjne, sprawy umowne, robocze notatki przed publikacją; poza repo.
`docs/scratch/` — jednorazowe plany, handoffy, notatki wygasające po tygodniu; niewersjonowane.

## Antipatterns to watch

- `grep -rn "INSERT OR REPLACE" services/`
- `grep -rn "DELETE FROM" services/` # poza świadomymi destrukcyjnymi akcjami
- `grep -rn "DROP TABLE" services/` # poza migracjami
- `grep -rn "withTransactionAsync" services/ hooks/ app/` # wszystko poza `database/` = obejście write locka
- `grep -rn "toISOString().split" app/ services/` # data UTC zamiast lokalnej
- `grep -rn "console\." app/ services/ store/ hooks/ components/` # łapie też ESLint
- Zapis bez `await` / bez `catch` w handlerach ekranów
