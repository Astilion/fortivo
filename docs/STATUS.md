# Status — 2026-11-03

**Wersja:** 0.6.5 · **Migracja bazy:** v10 · **Branch wydania:** `release/0.6.5` (`a9c4f6b`)

## Zrobione ostatnio

Google przyznał dostęp produkcyjny (2026-11-01, po czterech wnioskach). Zamknięte testy zakończone.

0.6.5 — wydanie produkcyjne, smoke na teście wewnętrznym zaliczony w całości (`docs/private/smoke-0.6.5.md`):
- dev client wykluczony z buildów production (hook `scripts/eas-exclude-dev-client.js`): AAB 79,2 → 62,1 MB,
  DEX 37,8 → 19,7 MB; wypadły ML Kit, Jetpack Compose, Apollo,
- odmiana liczebników (`utils/plural.ts`, D13 zamknięte), „Objętość" zamiast „Volume",
- ikona adaptacyjna pomniejszona do bezpiecznej strefy (launchery nie ucinają talerzy),
- polityka prywatności 2026-11-02 opublikowana (wersja publiczna, kontakt mailowy, opinie i Android vitals),
  `PRIVACY_POLICY_VERSION` zsynchronizowany.

Listing: nowe zrzuty ekranu (6 plansz 1080×1920), ikona 512 jako pełny kwadrat.

## W toku

—

## Czeka na zewnątrz

- Google Play: review wydania produkcyjnego 0.6.5.

## Następny krok

- po publikacji: link w CV i README, prośba do testerów o opinie, odpowiedzi na opinie
- rozmiar pobierania 0.6.4 vs 0.6.5 z Eksploratora pakietów → `BACKLOG.md`
- pierwsza aktualizacja: R8 + mapowania ProGuard do Sentry; wymiana plansz 04/05 (Home z „0 min")
- przy przeglądzie: changelog expo pod FORTIVO-8
