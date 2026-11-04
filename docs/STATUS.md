# Status — 2026-11-04

**Wersja w sklepie:** 0.6.5 · **Migracja bazy:** v10 · **W toku:** 0.6.6 (`release/0.6.6`)

## Zrobione ostatnio

**0.6.5 opublikowane w Sklepie Play 2026-11-04** — pierwsze publiczne wydanie (UE + EOG, rozmiar pobierania 15 MB).
Google przyznał dostęp produkcyjny 2026-11-01 (po czterech wnioskach). Zamknięte testy zakończone.

0.6.5 — wydanie produkcyjne, smoke na teście wewnętrznym zaliczony w całości (`docs/private/smoke-0.6.5.md`):
- dev client wykluczony z buildów production (hook `scripts/eas-exclude-dev-client.js`): AAB 79,2 → 62,1 MB,
  DEX 37,8 → 19,7 MB; wypadły ML Kit, Jetpack Compose, Apollo,
- odmiana liczebników (`utils/plural.ts`, D13 zamknięte), „Objętość" zamiast „Volume",
- ikona adaptacyjna pomniejszona do bezpiecznej strefy (launchery nie ucinają talerzy),
- polityka prywatności 2026-11-02 opublikowana (wersja publiczna, kontakt mailowy, opinie i Android vitals),
  `PRIVACY_POLICY_VERSION` zsynchronizowany.

Listing: nowe zrzuty ekranu (6 plansz 1080×1920), ikona 512 jako pełny kwadrat.

## W toku

- 0.6.6 na `release/0.6.6`: R8 + wysyłka mapowań do Sentry (próg Play 25% zaciemniania, wpływ na widoczność od 02.2027),
  poprawka „Spróbuj ponownie” po `initError`. Smoke: `docs/private/smoke-0.6.6.md`.

## Czeka na zewnątrz

—

## Następny krok

- link do Sklepu Play w CV, prośba do testerów o opinie, odpowiedzi na opinie
- 0.6.6: build → smoke → produkcja 20% → 100%; wymiana plansz 04/05 (Home z „0 min")
- przy przeglądzie: changelog expo pod FORTIVO-8
