# Status — 2026-09-26

**Wersja:** 0.6.1 · **Migracja bazy:** v10 · **main:** `1772e1b`

## Zrobione ostatnio

Hotfix 0.6.1 — znaleziska audytu bety #1, #3, #4, #6: wygasły aktywny trening z odhaczonymi
seriami trafia do historii (data startu, czas nieznany `-1`) zamiast znikać; Volume w historii
liczy tylko odhaczone serie; błędy z ErrorBoundary i obsłużone `logger.error` docierają do
Sentry (deduplikacja per sesja). Smoke na dev cliencie zaliczony, merge do `main`.
AAB 0.6.1 (versionCode 18) wysłany do sprawdzenia na torze Alpha 2026-09-26; kontrola release
(start, zgoda, trening, historia/Volume, sesja + source mapy w Sentry, uprawnienia = 3)
zaliczona na teście wewnętrznym. versionCode 17 zużyty przez równoległy build EAS, nigdy
niewysłany — nie używać.

Formalia M1.15 domknięte: polityka prywatności opublikowana (`2026-09-11`), Data Safety +
Health apps, target audience 16+, regulamin/nota bety. Closed beta formalnie spełnia wymóg
Google: ~18 wliczanych testerów, aktywnych ~6–7.

## W toku

Wysyłka buildu prosto do Play Console (`--auto-submit`, konto usługi w EAS credentials):
`eas.json` → track `alpha`, `releaseStatus: draft`; `.gitignore` jako zabezpieczenie.
Działa, czeka na commit na `chore/eas-submit`.

## Czeka na zewnątrz

—

## Następny krok

Przed wnioskiem o produkcję sprawdzić kryteria bety przy ~6–7 aktywnych z ~18: ≥60% z ≥4
treningami w 2. tygodniu, zero utraty danych, ankieta (Sean Ellis) — wniosek pyta
o zaangażowanie testerów. Kodowo: R5 („Usuń wszystkie dane") i M1.17 (dług + testy).
