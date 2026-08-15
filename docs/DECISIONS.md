# DECISIONS — dziennik decyzji technicznych Fortivo

Dokument **append-only**: nowe decyzje dopisujemy na końcu, starych wpisów nie edytujemy
ani nie usuwamy. Jeśli decyzja zostanie odwrócona — powstaje nowy wpis, który odwołuje się
do poprzedniego.

Treść wpisów pochodzi z uzasadnień zapisanych w `CLAUDE.md`; daty ustalone przez commit
wprowadzający zmianę.

---

## 2026-03-17 — Migracje przez `PRAGMA user_version`, każda w osobnej transakcji

**Kontekst:** Schemat bazy przestał być czymś, co można wywrócić przy każdym większym
release'ie — na urządzeniach są dane, których nikt nie odtworzy. Potrzebny był mechanizm
podnoszenia schematu, który przeżyje przerwany upgrade (kill procesu, brak miejsca, błąd SQL
w środku kroku).

**Decyzja:** Wersjonowanie schematu przez `PRAGMA user_version` + tablica migracji w
`database/database.ts`. Każda migracja idzie w **osobnej transakcji**, a `user_version`
bumpuje się dopiero **po sukcesie danego kroku** — wewnątrz tej samej transakcji co sam krok.
Runner migracji jest jedynym miejscem w kodzie, które wolno wołać `db.withTransactionAsync`
wprost (działa zanim powstanie jakikolwiek serwis; recovery musi być niezależne od stanu
współdzielonego modułu). Niepowodzenie kroku owija się w `DatabaseMigrationError`, co
podnosi ekran recovery.

**Odrzucone:** brak zapisanych alternatyw.

**Dlaczego:** Bump `user_version` po sukcesie kroku daje wznawialność: przerwana migracja
v9 zostawia bazę na v8, a nie w stanie „częściowo v9, oznaczone jako v9". Gdyby wszystkie
kroki szły w jednej wspólnej transakcji, jeden błąd w najnowszej migracji cofałby też
poprawnie wykonane starsze kroki, a diagnostyka sprowadzałaby się do „coś nie przeszło".

---

## 2026-05-20 — Presety jako read-only seed w TypeScript, nie seed do bazy

**Kontekst:** Gotowe treningi (FBW, Góra/Dół, Push/Pull) miały być dostępne od pierwszego
uruchomienia. Naturalnym odruchem było wrzucenie ich do bazy przy starcie, obok seeda 272
ćwiczeń.

**Decyzja:** Presety żyją wyłącznie w `constants/PresetWorkouts.ts` (i
`constants/PresetWeeklyPlans.ts`) jako read-only dane w TS. `presetService.copyPresetWorkoutToUserWorkouts`
robi **niezależną kopię z nowymi ID**, transakcyjnie. `validatePresets` chodzi DEV-only
w `AppProvider` (fire-and-forget). Ponieważ `reps` jest `NOT NULL`, sety time/distance
dostają fallback `1`.

**Odrzucone:** seedowanie presetów do bazy danych.

**Dlaczego:** Preset w bazie stałby się encją, którą użytkownik może zmodyfikować albo
usunąć, a którą kolejny seed musiałby „naprawiać" — czyli dokładnie ten problem, który
`seedExercises` już generował. Kopia z nowymi ID oddziela treść wzorca od treningu
użytkownika: edycja skopiowanego treningu nie zmienia presetu, a zmiana presetu w kolejnej
wersji aplikacji nie rusza tego, co użytkownik już ma u siebie.

---

## 2026-05-24 — True UPSERT (`ON CONFLICT`) zamiast `INSERT OR REPLACE`

**Kontekst:** `seedExercises` chodził przy każdym zimnym starcie i zapisywał ćwiczenia
przez `INSERT OR REPLACE`. Objaw zgłoszony przez użytkownika: „0 ćwiczeń, 0 serii" —
treningi przeżywały restart, ale ich zawartość znikała. Pierwsze podejście
(2026-03-29, `d884c9f`) zamieniło `DELETE + INSERT` na `INSERT OR REPLACE`, co problem
tylko zamaskowało.

**Decyzja:** Wszystkie upserty w warstwie serwisów idą jako
`INSERT ... ON CONFLICT(...) DO UPDATE SET ...`. `INSERT OR REPLACE` jest zakazany przy
tabelach z FK i `ON DELETE CASCADE`. W `seedExercises` dodatkowo `WHERE is_custom = 0`,
żeby seed nie dotykał ćwiczeń użytkownika.

**Odrzucone:** `INSERT OR REPLACE`.

**Dlaczego:** Przy `PRAGMA foreign_keys = ON` `REPLACE` to fizyczne DELETE + INSERT, a jego
wewnętrzny DELETE odpala `ON DELETE CASCADE` na dzieciach. W praktyce reseed ćwiczeń kasował
kaskadowo `workout_exercises` (a przez nie `workout_sets`), `template_exercises`,
`exercise_progress` i `favorite_exercises` przy **każdym** restarcie aplikacji — stąd
treningi bez ćwiczeń. `ON CONFLICT DO UPDATE` aktualizuje wiersz w miejscu: nie ma DELETE,
nie ma kaskady. Ten sam mechanizm zabiłby np. `workout_sets` przy `INSERT OR REPLACE`
na `workout_exercises`.

---

## 2026-05-26 — Active workout: SQLite jako source of truth, store in-memory bez `persist`

**Kontekst:** Trwający trening był stanem, który użytkownik buduje przez 60–90 minut,
przełączając się między ekranami i aplikacjami. Kill procesu przez system (albo agresywny
menedżer pamięci producenta) kasował całą sesję.

**Decyzja:** `activeWorkoutStore` jest **in-memory, bez `persist`**; źródłem prawdy jest
SQLite. Store hydratuje się z bazy (`started_at`) przy boocie i przy mount. Zapis idzie
przez `useActiveWorkoutAutosave` — debounce 500 ms + flush na unmount — inkrementalnie,
metodą UPSERT po **stabilnych ID** z diff-prune przez `deleteRowsNotIn`. Sesja starsza niż
`ACTIVE_WORKOUT_TIMEOUT_MS` (12 h) jest czyszczona cicho przy starcie. Okno 500 ms debounce'u
to **świadomie zaakceptowana** strata przy killu procesu — potwierdzona testem restore'u
z Auto Backup; nie tykać.

**Odrzucone:** `persist` na store (AsyncStorage jako nośnik stanu domenowego);
DELETE + reinsert zamiast UPSERT z diff-prune.

**Dlaczego:** Dwa równoległe źródła prawdy (AsyncStorage z `persist` i SQLite) rozjeżdżają
się przy każdym błędzie zapisu, a rozjazd wychodzi dopiero po restarcie — czyli w najgorszym
momencie. DELETE + reinsert nadaje wierszom nowe ID przy każdym zapisie, co niszczy tożsamość
wiersza: przy autosave co 500 ms oznacza to bezustanną rotację kluczy, a docelowo brak
podstawy pod jakikolwiek sync.

---

## 2026-06-05 — Historia treningu jako immutable snapshot `performance_data`

**Kontekst:** Szczegóły ukończonego treningu były renderowane z **żywych** `workout_sets`.
Edycja treningu po fakcie (albo kolejna sesja tego samego treningu) zmieniała wstecz to,
co użytkownik widział w historii — wpis z zeszłego miesiąca pokazywał ciężary z dzisiaj.

**Decyzja:** Finisz treningu serializuje wykonane serie do
`workout_history.performance_data` (JSON, migracja v8). Szczegóły historii czytają snapshot
per-wpis, nie żywe `workout_sets` (dla wpisów sprzed v8 zostaje legacy fallback). Na tym
samym snapshocie stoi smart prefill (helper `getLatestPerformanceSnapshot`, bierze
**najnowszy sfinalizowany** snapshot): w aktywnym treningu `seedActualsFromLastSession`
seeduje `actual_*` przy aktywacji i resetuje `completed = 0` (discard-proof), a w
edycji treningu 5 pól numerycznych jest nakładanych na wartości **planowane** przy load —
ścieżka save pozostaje nietknięta, dzięki czemu plan śledzi progresję.

**Odrzucone:** brak zapisanych alternatyw.

**Dlaczego:** Historia jest zapisem tego, co się faktycznie wydarzyło — musi być
niezmienna, inaczej traci całą wartość jako dziennik. Snapshot rozcina zależność między
„szablonem treningu, który wolno edytować" a „zapisem sesji, którego edytować nie wolno",
i przy okazji daje prefill za darmo: to, co pokazujemy w historii, jest dokładnie tym,
z czego chcemy zaproponować kolejne obciążenie.

---

## 2026-06-05 — Snapshot `performance_data` ma `version: 1`, którego odczyt nie sprawdza

**Kontekst:** Snapshot jest zserializowanym JSON-em zapisanym na stałe w bazie użytkownika.
Każda przyszła zmiana jego kształtu spotka się ze starymi wpisami, których nikt nie
zmigruje w locie.

**Decyzja:** Snapshot niesie pole `version: 1`. Świadomie **nie ma** dziś branchowania po
wersji przy odczycie — czytniki zakładają v1. Konsekwencja zapisana jako reguła:
**każda zmiana kształtu snapshotu = bump `version` + branch w deserializacji**.

**Odrzucone:** brak zapisanych alternatyw.

**Dlaczego:** Pole wersji kosztuje jeden klucz w JSON-ie dziś, a bez niego przyszła zmiana
kształtu nie miałaby się o co zaczepić — trzeba by zgadywać wersję po obecności pól.
Brak sprawdzania wersji przy odczycie jest przyznanym długiem, nie przeoczeniem: dopóki
istnieje jedna wersja, branch byłby martwym kodem, ale pierwsza zmiana kształtu musi
dodać go razem z bumpem, inaczej stare wpisy zaczną się cicho deserializować jako nowy
format.

---

## 2026-06-07 — Rebuild tabeli w migracji: `PRAGMA foreign_keys = OFF` poza transakcją

**Kontekst:** Migracja v9 odcinała historię od treningu: FK `ON DELETE SET NULL` +
denormalizowana kolumna `workout_name`. SQLite nie pozwala zmienić definicji FK przez
`ALTER TABLE`, więc jedyną drogą był rebuild tabeli (nowa tabela → kopia danych →
`DROP` starej → `RENAME`).

**Decyzja:** Rebuild przez nową tabelę + kopia + `DROP` + `RENAME` jest dopuszczalny tylko
dopóki **nikt do tabeli nie referuje** — tak było w v9 (`workout_history` nie ma dzieci).
Przy rebuildzie tabeli, która ma dzieci (np. `workouts`), obowiązkowo `PRAGMA foreign_keys = OFF`
**poza transakcją** na czas rebuildu, plus `PRAGMA foreign_key_check` na końcu.

**Odrzucone:** brak zapisanych alternatyw.

**Dlaczego:** `DROP TABLE` na tabeli, do której prowadzą FK z włączonym `foreign_keys = ON`,
albo wywali migrację, albo — przy `ON DELETE CASCADE` — zabierze ze sobą dzieci. Wyłączenie
FK musi iść **poza** transakcją, bo `PRAGMA foreign_keys` jest no-opem wewnątrz aktywnej
transakcji. `foreign_key_check` na końcu jest jedynym dowodem, że po `RENAME` referencje
faktycznie wskazują na nową tabelę, a nie zostały osierocone w czasie, gdy egzekwowanie
było wyłączone.

---

## 2026-06-09 — `??` zamiast `||` na polach liczbowych

**Kontekst:** Zapis serii używał `||` do podstawiania wartości domyślnych. Użytkownik,
który świadomie wpisał `0` (np. 0 kg przy ćwiczeniu z masą własną albo 0 powtórzeń
w nieudanej serii), tracił tę wartość.

**Decyzja:** Na polach liczbowych używamy `??`, nigdy `||`.

**Odrzucone:** `||`.

**Dlaczego:** `0` jest w JS falsy, więc `||` zamienia uczciwie zalogowane zero na wartość
domyślną albo NULL. W dzienniku treningowym `0` i „nie podano" to dwie różne informacje —
i to ta pierwsza jest częściej prawdziwa.

---

## 2026-06-10 — Eksport JSON bez importu

**Kontekst:** Aplikacja jest offline-first i bez kont: wszystkie dane leżą wyłącznie na
telefonie. Użytkownicy potrzebowali sposobu, żeby je z siebie wydostać.

**Decyzja:** `exportService.exportAllData()` buduje kopertę
`{schemaVersion, appVersion, exportedAt, tables}`, zapisuje plik w `Paths.cache` i oddaje
go przez `Sharing.shareAsync`. Ćwiczenia trafiają do eksportu tylko z `is_custom = 1`
(seed jest odtwarzalny). **Importu nie ma.**

**Odrzucone:** brak zapisanych alternatyw.

**Dlaczego:** Eksport bez importu jest ścieżką wyjścia z aplikacji i materiałem do wglądu
we własne dane, ale **nie jest backupem** — nie ma czym go przywrócić. Ma to bezpośrednią
konsekwencję dla recovery: reset bazy z `DatabaseRecoveryScreen` kasuje wszystko
nieodwracalnie, a wyeksportowany plik tego nie cofnie. Dlatego import/restore stoi wysoko
na roadmapie zaraz po becie. `schemaVersion` w kopercie jest zapisany właśnie po to, żeby
przyszły import miał po czym walidować plik.

---

## 2026-06-15 — `localDateString()` zamiast `toISOString().split('T')[0]`

**Kontekst:** Wpisy wagi (`weight-tracking.tsx`) i pomiarów ciała (`body-measurements.tsx`)
brały datę przez `new Date().toISOString().split('T')[0]`. Wpis dodany w Polsce o 00:30
lądował pod **wczorajszą** datą.

**Decyzja:** Datę lokalną bierzemy z helpera `localDateString()` w `utils/date.ts`.
`toISOString().split('T')[0]` jest zakazane w kodzie aplikacji; antywzorzec pilnowany
gretem: `grep -rn "toISOString().split" app/ services/`.

**Odrzucone:** `new Date().toISOString().split('T')[0]`.

**Dlaczego:** `toISOString()` zwraca czas UTC. W Polsce (UTC+1/+2) wszystko między północą
a 1:00 (latem 2:00) ma po konwersji jeszcze poprzednią datę. W dzienniku, w którym wpisy są
kluczowane po dniu, oznacza to ważenie się wieczorem i zobaczenie wyniku pod wczorajszą
datą — albo dwa wpisy „z tego samego dnia" rozjechane na dwa dni.

---

## 2026-06-17 — Kaskady FK pokazywane użytkownikowi przed usunięciem

**Kontekst:** Usunięcie własnego ćwiczenia wyglądało w UI jak lokalna, niegroźna operacja
(„usuwam pozycję z listy ćwiczeń"), a w bazie odpalało kaskadę po wszystkich treningach
i całej historii progresu.

**Decyzja:** Confirm przy usuwaniu ćwiczenia **liczy skutek** i pokazuje go użytkownikowi:
`exerciseService.countWorkoutsUsingExercise(id)` przed `confirmAction`. Reguła ogólna:
przy każdej nowej destrukcyjnej akcji sprawdzamy mapę kaskad w
`docs/private/fable-review/audyt-techniczny.md` §5.4.

**Odrzucone:** brak zapisanych alternatyw.

**Dlaczego:** Usunięcie własnego ćwiczenia kasuje je ze **wszystkich** treningów (razem
z ich seriami) i czyści cały `exercise_progress`. Skala tego skutku jest w UI całkowicie
niewidoczna — użytkownik nie ma jak zgadnąć, że klikając „usuń" przy jednej pozycji traci
historię progresu z kilku miesięcy. Skoro operacja jest nieodwracalna, jedyną uczciwą
obroną jest podanie liczby przed potwierdzeniem.

---

## 2026-06-29 — Guardraile Sentry: `sendDefaultPii`, `beforeBreadcrumb`, `beforeSend`, limit zdarzeń

**Kontekst:** Sentry jest **jedynym kanałem wychodzącym w całej aplikacji** — apka nie ma
backendu, kont ani analityki. Wszystko, co wypłynie z urządzenia, wypłynie tędy. Dane
są w dodatku wrażliwe (waga, pomiary ciała, historia treningów).

**Decyzja:** Zestaw guardraili, których nie wolno usuwać: `sendDefaultPii: false` jawnie ·
`beforeBreadcrumb` odsiewający parametry nawigacji i kategorię `console` · `beforeSend`
robiący `delete event.user` i egzekwujący twardy limit `MAX_EVENTS_PER_SESSION = 25`
(limit dodany 2026-08-11 wraz z opt-outem) · `no-console: error` w ESLint jako drugi zamek ·
serwerowa reguła scrubbingu `$user.geo.**`. Osobno zapisane: zmiana konfiguracji Sentry
pociąga za sobą politykę prywatności i formularz Data Safety w Play Console — to nie jest
zmiana wyłącznie techniczna.

**Odrzucone:** brak zapisanych alternatyw.

**Dlaczego:** Domyślna konfiguracja SDK zbiera więcej, niż projekt potrzebuje: breadcrumbs
z parametrów nawigacji potrafią wyciągnąć ID i nazwy encji, a przechwycone `console`
przenosi do Sentry dowolną treść, którą ktoś kiedyś zalogował. Limit 25 zdarzeń na sesję
chroni quotę przed pętlą crashów u pojedynczego testera. `no-console` w ESLint jest drugim
zamkiem do tych samych drzwi: `beforeBreadcrumb` odsiewa to, co już powstało, a lint nie
pozwala temu powstać.

---

## 2026-07-22 — `android.allowBackup: true` jako świadoma decyzja

**Kontekst:** Android Auto Backup jest domyślnie włączony. Przy aplikacji bez kont i bez
chmury to jedyny mechanizm, dzięki któremu dane wracają po reinstalacji albo zmianie
telefonu — ale oznacza też, że baza z danymi zdrowotnymi trafia do kopii Google.

**Decyzja:** `android.allowBackup: true` wpisane **jawnie** w `app.json` jako decyzja,
nie jako domyślna wartość, i opisane w polityce prywatności.

**Odrzucone:** brak zapisanych alternatyw.

**Dlaczego:** To jedyna ciągłość danych w produkcie bez kont — wyłączenie backupu oznaczałoby,
że reinstalacja aplikacji kasuje historię treningów bezpowrotnie. Jawny wpis w `app.json`
ma wartość dokumentacyjną: czyta się jako decyzja, więc nikt nie „posprząta" go przy
okazji. Zakres jest ograniczony sam z siebie — restore dzieje się **wyłącznie w momencie
instalacji** i tylko przy zgodnym kluczu podpisu.

---

## 2026-08-08 — Orkiestracja wieloetapowa należy do serwisu, nie do ekranu

**Kontekst:** Finisz treningu był czterema nieatomowymi wywołaniami składanymi z poziomu
ekranu; zapis planu tygodniowego — DELETE dni + sekwencyjne INSERT-y sterowane z
`create-weekly-plan.tsx`. Błąd w środku i ponowny klik „Zakończ" dawał **duplikat w
historii**; przerwana edycja planu zostawiała **plan bez żadnych dni**.

**Decyzja:** Ekran woła **jedną** metodę serwisu: `workoutService.finishWorkout(...)`
(snapshot + historia + progres + clear w jednej transakcji),
`weeklyPlanService.savePlanWithDays(...)` (update + replace dni w jednej transakcji).
Transakcja jest obowiązkowa dla każdego zapisu wielostanowego. Nowy wieloetapowy zapis
rozbity na kilka wywołań z ekranu = regresja D1/D2.

**Odrzucone:** składanie kroków z poziomu ekranu (stan sprzed zmiany).

**Dlaczego:** Ekran nie ma jak zapewnić atomowości — między jego kolejnymi `await` mieści
się nawigacja, unmount, kill procesu i drugi klik użytkownika. Dopiero granica transakcji
w serwisie sprawia, że retry po błędzie jest bezpieczny: albo wszystkie cztery kroki
finiszu, albo żaden. Przy okazji orkiestracja znika z komponentu, który nie powinien
wiedzieć nic o kolejności zapisów.

---

## 2026-08-08 — Sekwencyjne `for...of` zamiast `Promise.all` przy zapisach SQLite

**Kontekst:** Zapis wielu wierszy (dni planu, ćwiczenia, serie) był puszczany przez
`Promise.all`, w odruchu „równolegle będzie szybciej".

**Decyzja:** Zapisy do SQLite idą sekwencyjnie, przez `for...of`.

**Odrzucone:** `Promise.all`.

**Dlaczego:** Aplikacja ma jedno połączenie do bazy, więc i tak serializuje operacje —
`Promise.all` nic nie przyspiesza. Daje za to nieprzewidywalną kolejność błędów: przy
awarii nie wiadomo, który zapis przeszedł jako pierwszy i co dokładnie zostało w bazie,
a odrzucona obietnica nie zatrzymuje pozostałych.

---

## 2026-08-08 — Brak transakcji zagnieżdżonych w expo-sqlite → wzorzec `_...InTx`

**Kontekst:** Domknięcie finiszu treningu w jednej transakcji wymagało wywołania metod,
które **same** były już opakowane we własną transakcję (zapis snapshotu, zapis progresu).

**Decyzja:** Metody, które mają być składane w większą transakcję, wydzielamy jako
wewnętrzne `_...InTx` — bez własnego wrappera transakcyjnego. Publiczna metoda z transakcją
i wewnętrzna `_...InTx` bez niej istnieją obok siebie.

**Odrzucone:** brak zapisanych alternatyw.

**Dlaczego:** expo-sqlite nie wspiera transakcji zagnieżdżonych — `BEGIN` w `BEGIN` rzuca.
Bez rozdzielenia na wariant „z transakcją" i „w cudzej transakcji" jedyną drogą byłoby
duplikowanie SQL-a w dwóch miejscach albo warunkowy wrapper sterowany flagą — jedno i
drugie kończy się rozjazdem przy pierwszej zmianie zapytania.

---

## 2026-08-08 — `runInTransaction` z `database/writeLock.ts` zamiast `db.withTransactionAsync`

**Kontekst:** Autosave aktywnego treningu (co 500 ms) i `finishWorkout` potrafiły trafić
na siebie na jednym, współdzielonym połączeniu. Objaw: cicha utrata danych finiszu przy
**fałszywym toaście sukcesu** — użytkownik widział „zapisano", a wpis nie istniał.

**Decyzja:** Każda transakcja w warstwie serwisów idzie przez `runInTransaction` z
`database/writeLock.ts`, który serializuje wszystkie transakcje w jednym łańcuchu obietnic —
tak, że w danym momencie w locie jest tylko jedno `BEGIN..COMMIT`. `db.withTransactionAsync`
nie wolno wołać wprost **nigdzie** poza runnerem migracji (ten działa, zanim powstanie
jakikolwiek serwis; recovery musi być niezależne od stanu współdzielonego modułu).
Antywzorzec pilnowany gretem: `grep -rn "withTransactionAsync" services/ hooks/ app/`.

**Odrzucone:** `db.withTransactionAsync` wołane bezpośrednio z serwisów.

**Dlaczego:** `withTransactionAsync` w expo-sqlite **nie jest wyłączna**, a jej `catch`
wykonuje bezimienny `ROLLBACK` na jedynym, współdzielonym połączeniu. Bezimienny `ROLLBACK`
nie wie, czyją transakcję cofa — potrafi wycofać **cudzą** otwartą transakcję. W praktyce:
błąd w autosavie wycofywał trwający finisz treningu, ścieżka finiszu nie widziała żadnego
wyjątku i pokazywała toast sukcesu, a dane nie były zapisane. To najgorszy możliwy tryb
awarii — cicha utrata danych z pozytywnym potwierdzeniem.

---

## 2026-08-11 — `Sentry.init` warunkowy zamiast `enabled: false`

**Kontekst:** Do bety wchodził przełącznik „wysyłaj raporty błędów" w profilu. Oczywistą
implementacją opt-outu wyglądało przekazanie `enabled: false` do `Sentry.init`.

**Decyzja:** `app/_layout.tsx` woła `bootstrapCrashReporting()`, który dopiero **po**
odczycie flagi opt-out decyduje, czy w ogóle wywołać `Sentry.init`. Przy wyłączonych
raportach klient **nie powstaje w ogóle**. Konsekwencja obowiązująca na stałe: **każde**
nowe wywołanie API Sentry musi być odporne na brak klienta — wolno używać wyłącznie metod
z twardym guardem (`captureException`, `captureMessage`, `getClient()?.`), nigdy nie
zakładamy, że klient istnieje.

**Odrzucone:** `enabled: false` w opcjach `Sentry.init`.

**Dlaczego:** `enabled: false` nie zatrzymuje zbierania danych. `initAndBind`
(`@sentry/core`) **nie sprawdza `options.enabled`**, a `init()` klienta React Native
bezwarunkowo woła `_initNativeSdk()` — jego guard patrzy tylko na `enableNative`,
`autoInitializeNativeSdk` i `dsn`. Efekt: natywne handlery crashy zainstalowałyby się mimo
„wyłączonego" Sentry, a użytkownik, który kliknął opt-out, nadal wysyłałby raporty.
Pominięcie `init` to jedyny wariant, w którym opt-out faktycznie działa.

---

## 2026-08-11 — AsyncStorage dla `crashReportingEnabled` jako wyjątek od reguły

**Kontekst:** W projekcie obowiązuje zasada: AsyncStorage tylko na flagi UI (np. onboarding),
**nigdy** na dane domenowe — te idą do SQLite. Flaga opt-outu crash reportingu jest
ustawieniem użytkownika, więc naturalnym miejscem byłaby tabela `user_settings`.

**Decyzja:** `crashReportingEnabled` mieszka w AsyncStorage (`utils/crashReporting.ts`) —
jako jawny, jedyny wyjątek od tej reguły.

**Odrzucone:** przechowywanie flagi w tabeli `user_settings`.

**Dlaczego:** Flaga musi być czytelna **przed** inicjalizacją bazy — decyzja o wywołaniu
`Sentry.init` zapada na starcie aplikacji, zanim SQLite w ogóle wstanie. Musi też
**przeżyć reset bazy** przez `DatabaseRecoveryScreen`: gdyby siedziała w `user_settings`,
reset po cichu przywróciłby raportowanie komuś, kto je świadomie wyłączył — i to
w momencie awarii, czyli dokładnie wtedy, gdy poleci najwięcej zdarzeń.
