# Status — 2026-10-17

**Wersja:** 0.6.2 · **Migracja bazy:** v10 · **main:** `9479cf7`

## Zrobione ostatnio

README przepisany pod obecny kod (portfolio, EN): transakcje przez `runInTransaction`, UPSERT
`ON CONFLICT`, migracje v10, snapshot historii, ekran recovery 0.6.2, nowe sekcje Privacy,
Testing i Engineering decisions, roadmapa wg `docs/ROADMAP.md`. Status wydania opisany
neutralnie, bez dat.

Wcześniej: diagnoza Sentry FORTIVO-8 (issue otwarte) i hotfix 0.6.2 (versionCode 19 na Alpha).

## W toku

- Powtórzone zamknięte testy w Google Play — potrwają do ok. 30.10.2026 (wniosek o produkcję
  z 2026-10-03 odrzucony).
- Plan B: rekrutacja dodatkowych testerów (Wykop/Reddit) i nacisk na zaangażowanie obecnych.

## Czeka na zewnątrz

—

## Następny krok

- po ~30.10: ankieta końcowa → przegląd kryteriów M1.16 → ponowny wniosek o produkcję
- równolegle zadania w trybie nauki (D13)
- przy przeglądzie M1.16: changelog expo pod kątem FORTIVO-8 (`BACKLOG.md`)

Kryteria przy ~6–7 aktywnych z ~18: ≥60% z ≥4 treningami w 2. tygodniu (mierzalne tylko
ankietą — brak analityki), zero utraty danych (sprawdzić, czy ktoś trafił na #1 w 0.6.0),
Sean Ellis ≥1/3. Daty w `docs/ROADMAP.md` odświeżyć dopiero po przeglądzie po ~30.10.
