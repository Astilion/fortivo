# Fortivo — Roadmapa

Co ma powstać w aplikacji i w jakiej kolejności. Dokument kierunkowy: mówi **dokąd
idziemy i dlaczego w tej kolejności**, nie kiedy.

Pozostałe trzy dokumenty w `docs/`:
`STATUS.md` — gdzie jesteśmy teraz · `BACKLOG.md` — znany dług i rzeczy odłożone ·
`DECISIONS.md` — dziennik decyzji z uzasadnieniem.

---

## Pozycjonowanie — filtr każdej decyzji

> **Fortivo = prywatny dziennik siłowni po polsku: bez konta, bez chmury, bez social
> feedu. Szybki jak notes, mądrzejszy niż notes.**

Każda nowa pozycja przechodzi test: *czy to służy prywatnemu, szybkiemu, polskiemu
dziennikowi bez konta?*

Czym Fortivo świadomie **nie** jest:

- **social fitness** — pusty feed to anty-feature, a network effects w tej kategorii
  są już rozdane
- **„AI coach"** — podpowiedzi heurystyczne tak, słowo „AI" w sklepie nie; zawyża
  oczekiwania, których produkt nie spełni
- **wszystko-w-jednym** — dieta i cardio-GPS to sąsiednie kategorie z własnymi
  liderami; każdy metr w ich stronę to metr od własnej tożsamości

Legenda: ✅ zrobione · 🔜 następne · ⏳ zaplanowane · 🚪 za bramką wejścia ·
❌ świadomie odrzucone

---

## Faza 1 — aplikacja lokalna

Pełna funkcjonalność offline, zero kont, zero backendu. **Wersja 0.6.0.**

- ✅ **M1.1–M1.8** — rdzeń MVP: CRUD treningów, aktywny trening na żywo, śledzenie
  progresu, dashboard
- ✅ **M1.9–M1.12** — profil i pomiary ciała, własne ćwiczenia, plany tygodniowe
- ✅ **M1.13** — polish, obsługa błędów (`ServiceError` + toasty), onboarding, refactor
- ✅ **M1.14** — gotowe treningi (FBW / Góra / Dół / Push / Pull)
- ✅ **v0.6** — niemutowalne snapshoty historii + smart prefill kolejnej sesji
- ✅ **M1.15 „Pre-beta hardening"** — integralność danych (transakcyjny finisz treningu
  i zapis planu, wspólny write lock na transakcjach SQLite, daty lokalne zamiast UTC),
  prywatność (crash reporting z przełącznikiem opt-out, guardraile Sentry), eksport
  danych do JSON

### 🔜 M1.16 — closed beta

Zamknięte testy na cudzych urządzeniach, wg wymogów Google Play dla nowych kont
deweloperskich. Cel nie brzmi „zebrać feedback" — brzmi **udowodnić, że dane
użytkownika są bezpieczne poza laptopem autora**.

Kryteria zaliczenia:

| Metryka | Próg |
|---|---|
| Crash-free sessions | ≥99,5% |
| Zgłoszenia utraty danych | **0 — twardy bloker launchu** |
| Testerzy z ≥4 treningami w drugim tygodniu | ≥60% |
| Pierwszy trening <48 h od instalacji | ≥50% |

### ⏳ M1.17 — dług techniczny i testy (tor równoległy)

Kod bety jest zamrożony poza bugfixami, więc to naturalne okno na rzeczy, które nie
zmieniają zachowania. Pozycje długu: `BACKLOG.md`.

- siatka testowa na prawdziwym SQLite in-memory (adapter na `better-sqlite3`) zamiast
  mocków — testy runnera migracji (fresh install, idempotencja, atomowość kroku,
  upgrade z danymi), rdzeń `workoutService` (smart prefill, niemutowalność historii,
  autosave), regresje atomowości finiszu i zapisu planu
- CI: lint + typecheck + testy na każdy push
- stabilne ID w `saveWorkoutExercises` (UPSERT + diff-prune zamiast DELETE + reinsert)
  — zdejmuje guard blokujący edycję aktywnego treningu i jest **warunkiem wstępnym
  Fazy 3**: bez tożsamości wierszy sync nie istnieje
- zasady stałe: bug z bety = najpierw test regresyjny, potem fix · nowa metoda zapisu
  = test integracyjny · budżet całej suity poniżej 10 s · ❌ bez Detoxa (e2e =
  sformalizowany ręczny smoke odhaczany przed każdym buildem)

### 🚀 Publiczny launch — koniec Fazy 1

Produkcja Google Play po zaliczeniu bety.

---

## Faza 2 — retencja → premium (nadal offline)

Kolejność jest tu ważniejsza niż zawartość: **retencja i zaufanie do danych → wartość
premium → paywall**. Powód jest prozaiczny — aplikacja nie ma dziś wykresów,
przypomnień ani analityki, czyli ani mechanizmu powrotu użytkownika, ani oczu do
mierzenia, czy wraca. Paywall ma jedną premierę i nie może wyjść pusty.

### ⏳ v0.7 „Retention pack"

- przypomnienia lokalne (dni z aktywnego planu + „nie było cię X dni"), opt-in, zero
  backendu
- cel tygodniowy na dashboardzie + licznik tygodni z rzędu — świadomie **nie** dzienny
  streak; na siłowni dni wolne są częścią planu, nie porażką
- prośba o recenzję po trzecim ukończonym treningu / pierwszym rekordzie
- anonimowa analityka produktowa, hostowana w UE, z opt-outem w profilu; kilkanaście
  zdarzeń, zero danych treningowych. **Granica święta: dane treningowe ≠ telemetria**
- import JSON jako lustro istniejącego eksportu — domyka pętlę bezpieczeństwa danych,
  daje pełną ścieżkę zmiany telefonu i jest generalną próbą migracji local→cloud

### ⏳ v0.8 „Logging & trust"

- **pierwszy wykres — darmowy** (szacowane 1RM / objętość w czasie). Wizualny progres
  to pętla emocjonalna, która utrzymuje użytkownika; jeden darmowy wykres jest
  nienegocjowalny
- własna klawiatura do logowania: kopiuj poprzednią serię, ustaw wszystkim, +/−
- kalkulator talerzy i szacowane 1RM w miejscu logowania
- supersety w UI — kolumna w bazie istnieje od dawna, brakuje wyłącznie interfejsu
- **automatyczna kopia lokalna** do folderu wybranego przez użytkownika (jego Dysk,
  jego Dropbox — **jego** chmura, nie nasza). Rozbraja największe ryzyko produktu
  (utrata telefonu = utrata danych) bez budowania chmury
- komunikat w profilu i onboardingu: „Twoje dane są tylko na tym telefonie — ustaw
  kopię zapasową"

### ⏳ v0.9 „Premium content"

- zaawansowane statystyki: objętość per partia, heatmapa RPE, częstotliwość,
  porównania okresów, pełne wykresy
- podpowiedzi heurystyczne („zbyt mało nóg", „nowy rekord!") — bez słowa „AI"
- paczki planów treningowych przygotowane z trenerem-partnerem; technicznie mechanizm
  kopiowania presetów planów istnieje od M1.14
- sugestie kolejnego treningu, zgodność z planem, rotacja A/B
- import z innych dzienników treningowych — historia jest kotwicą przy przesiadce
- ❌ odrzucone: periodyzacja, deload weeks, bloki treningowe (kupiec tych funkcji ma
  już własny system — budować dopiero na jawny popyt) · marketplace szablonów (bez
  masy użytkowników to pustynia) · eksport PDF (to potrzeba trenera, nie użytkownika)

### ⏳ v1.0 „Pro" — monetyzacja

Warunek wejścia: pełne statystyki + co najmniej jedna paczka planów + 2–3 narzędzia
logowania. Model i cennik są poza tym dokumentem.

### ⏳ „Wrapped" — listopad

Podsumowanie roku w formacie Stories: treningi i łączny czas, tonaż z relatable
przelicznikiem, top ćwiczenie, rekordy, najmocniejszy miesiąc. Technicznie: render
widoku do obrazka + istniejący share sheet. **Zawsze darmowe** — to marketing, nie
feature premium. Musi być w sklepie przed połową listopada, bo później traci sens.

---

## 🚪 Faza 3 — konto, backup i sync

Cel to **nie** „multi-device sync", tylko (a) przeniesienie danych na nowy telefon
i (b) dane widoczne dla trenera (Faza 4). Multi-device jest produktem ubocznym.
Około 80% danych w tej aplikacji jest append-only i nie konfliktuje wcale, co pozwala
dowozić wartość etapami.

**Bramka wejścia — obie muszą puścić:**

1. **popyt zmierzony, nie założony** — automatyczna kopia lokalna z v0.8 gasi
   większość realnej potrzeby; chmura musi obronić resztę
2. **warunki techniczne** — stabilne ID (M1.17), import JSON (v0.7), testy migracyjne

**Etapy:** konto + kopia w chmurze (zero konfliktów, największa wartość całej fazy) →
push append-only + pobieranie planów (to już wystarcza pod panel trenera) → pełny sync
dwukierunkowy (najtrudniejszy i najmniej wartościowy kawałek; może czekać dowolnie
długo).

**Reguły przyjęte z góry:** backend w regionie UE od pierwszego dnia — regionu nie
zmienisz później · schemat chmury wg klasyfikacji tabel (co się synchronizuje, co
zostaje lokalne, co jest wspólnym contentem), **nie** lustro SQLite · stan sesji
treningowej zostaje lokalny · ID generuje klient, nigdy serwer · `updated_at` bumpują
wyłącznie ścieżki edycji szablonu, nigdy autosave sesji.

⚠️ Dzień, w którym waga i pomiary ciała trafiają do chmury powiązane z kontem,
zmienia charakter projektu: dane szczególnej kategorii oznaczają osobny, niemały
nakład formalny poza kodem. To planowana część fazy, nie niespodzianka.

---

## 🚪 Faza 4 — panel trenera (web)

Panel trenera to **drugi startup** z własnym ryzykiem rynkowym, nie przedłużenie
roadmapy. Bramka przed pierwszą linijką kodu: rozmowy z trenerami, landing i twarde
deklaracje zakupu. Bez tego faza nie istnieje.

- React SPA (Vite) + TanStack Query — „po prostu React", maksymalny transfer
  umiejętności z React Native; brak SEO i brak ruchu anonimowego znoszą argumenty za SSR
- autoryzacja wyłącznie na politykach dostępu po stronie bazy; polityki trener↔klient
  **wymagają testów** — błędna polityka to wyciek danych
- przeprowadzka na monorepo i `/src` **dopiero tu**, jednym mechanicznym PR-em:
  wspólny pakiet z typami i (de)serializacją snapshotów, który panel musi czytać
  identycznie jak aplikacja
- zarządzanie klientami, plan builder z przypisywaniem planów, notatki async
- ❌ chat wycięty z pierwszej wersji — komunikator (delivery, read receipts, push,
  moderacja) to produkt sam w sobie i klasyczna pułapka zakresu

---

## Kierunki odrzucone

- ❌ **Dietetyka** — z liderami kategorii nie konkuruje się bazą produktów spożywczych
  w pojedynkę; to baza danych do zbudowania i utrzymywania, nie feature. Maksimum
  kiedyś: integracja. Warta backlogu pozostaje wyłącznie Health Connect
- ❌ **Osobna aplikacja mobilna dla trenera** — hipoteza domyślna to tryb roli
  w istniejącej aplikacji; monorepo z Fazy 4 nie blokuje żadnej z dróg

---

## Metryki

- **North star: liczba ukończonych treningów tygodniowo.** Nie instalacje —
  instalacje to próżność, ukończone treningi to wartość
- **Aktywacja:** pierwszy ukończony trening poniżej 72 h od instalacji; pełna
  aktywacja = 3 ukończone treningi w 14 dni. Lejek: instalacja → onboarding →
  (skopiowany preset lub własny trening) → 1. trening → 3. trening
- **Anty-metryki** — nie patrz i nie raportuj: suma instalacji bez retencji · liczba
  funkcji · commity i godziny · gwiazdki na GitHubie · porównania 1:1 z liderami
  kategorii (inna liga zasobów — porównuj się z Fortivo sprzed kwartału)

---

## Reguły obowiązujące od teraz

Wynikają z roadmapy i obowiązują przy każdej nowej pozycji — v0.9 i Faza 3 dodadzą
tabele i kolumny, więc dług w tym miejscu jest najdroższy.

- **Nowa tabela:** `id TEXT` z `generateId(prefix)` + `created_at` + `updated_at`
- **Nowa migracja = test upgrade'u z danymi.** Żadnej migracji v11+ bez testu
  fixture'owego — to jedyne narzędzie na ścieżkę upgrade'u, bo urządzenia testowe są
  już na najnowszym schemacie
- **Zmiana kształtu snapshotu `performance_data`** = bump `version` + gałąź
  w deserializacji. Odczyt nie sprawdza wersji, dopóki wersja jest jedna
- **Estymaty w sesjach (2–3 h)**, nie w godzinach zadania. Historyczny mnożnik dla
  wycen godzinowych: ×3–5
- Konwencje kodu, warstwy i wzorce: `CLAUDE.md`. Uzasadnienia: `DECISIONS.md`

---

**Fortivo = journey, not sprint.** 💪
