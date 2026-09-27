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

Kalendarz (ustalony 2026-09-26, orientacyjny):

- 26–28.09 — 0.6.1 dostępna na Alpha → komunikat na Discordzie + prośba o powrót do treningów
- 29.09–~6.10 — hotfix 0.6.2 (audyt #5 + #9, #7, #8, #12); obserwacja crash-free w Sentry
- ~3.10 — ankieta końcowa, przypomnienie ~6.10
- ~7–8.10 — 0.6.2: build → test wewnętrzny → Alpha
- ~10.10 — przegląd kryteriów bety (M1.16) → wniosek o produkcję albo przedłużenie bety o tydzień
- po zgodzie — listing + ikona, R5, promocja z Alpha na produkcję

Kryteria przy ~6–7 aktywnych z ~18: ≥60% z ≥4 treningami w 2. tygodniu (mierzalne tylko
ankietą — brak analityki), zero utraty danych (sprawdzić, czy ktoś trafił na #1 w 0.6.0),
Sean Ellis ≥1/3. Daty w `docs/ROADMAP.md` odświeżyć dopiero po przeglądzie ~10.10.
