# Status — 2026-11-17

**Wersja:** 0.6.7 (produkcja 100%) · **Migracja bazy:** v10 · **main:** 9ca5712 (`release/0.6.7` jeszcze niescalone)

## Zrobione ostatnio

**0.6.7 na produkcji, 100% użytkowników** (zawiera zmiany z 0.6.6):
- „Zastosuj do kolejnych serii" w aktywnym treningu — kopiuje ciężar i wartość główną do późniejszych,
  nieodhaczonych serii; bez „Cofnij" (decyzja 2026-11-15 w `DECISIONS.md`),
- R8 + zmniejszanie zasobów, wysyłka mapowań do Sentry (Play nie zgłasza już optymalizacji DEX),
- „Spróbuj ponownie" po `initError` zamyka osierocony uchwyt bazy przed ponowną inicjalizacją.

0.6.5 (2026-11-04) — pierwsze publiczne wydanie w Sklepie Play (UE + EOG).

## W toku

—

## Czeka na zewnątrz

—

## Następny krok

- merge `release/0.6.7` → `main` (`--no-ff`), usunięcie gałęzi, push
- link do Sklepu Play w CV, prośba do testerów o opinie, odpowiedzi na opinie
- z backlogu: `flushPendingEdits()` w listenerze `AppState` (utrata danych przy szybkim zamknięciu)
- przy przeglądzie: changelog expo pod FORTIVO-8
- plansze 04/05 (Home z „0 min") — świadomie zostają na razie bez zmian
