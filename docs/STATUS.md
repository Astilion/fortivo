# Status — 2026-10-11

**Wersja:** 0.6.2 · **Migracja bazy:** v10 · **main:** `3c9a17e`

## Zrobione ostatnio

Diagnoza Sentry FORTIVO-8 (1 event, nieudany odczyt planu ~5 s po starcie): podejrzenie
wyścigu w natywnym rejestrze expo-modules-core, nie w naszym kodzie; issue zostaje otwarte.
Przy okazji wpisane do `BACKLOG.md`: wyciek uchwytu bazy przy „Spróbuj ponownie” po
`initError` oraz zapisy spoza `runInTransaction` wpadające w cudzą transakcję.

Hotfix 0.6.2 (audyt bety #5, #9, #7, #8, #12): ekran recovery z kodem błędu i drugorzędnym
resetem, blokada usuwania ćwiczenia/treningu z aktywnej sesji, sprzątanie pliku eksportu;
versionCode 19 przez `eas build --auto-submit` → test wewnętrzny → Alpha.

## W toku

—

## Czeka na zewnątrz

Wniosek o dostęp do produkcji w Play Console — złożony 2026-10-03, czeka na decyzję Google.

## Następny krok

- decyzja Google; przy odmowie — rekrutacja testerów (Wykop/Reddit) i nacisk na zaangażowanie
- ankieta końcowa (jeszcze niewysłana) → przegląd kryteriów M1.16 ~10.10
- równolegle zadania w trybie nauki (D13)
- przy przeglądzie M1.16: changelog expo pod kątem FORTIVO-8 (`BACKLOG.md`)

Kryteria przy ~6–7 aktywnych z ~18: ≥60% z ≥4 treningami w 2. tygodniu (mierzalne tylko
ankietą — brak analityki), zero utraty danych (sprawdzić, czy ktoś trafił na #1 w 0.6.0),
Sean Ellis ≥1/3. Daty w `docs/ROADMAP.md` odświeżyć dopiero po przeglądzie ~10.10.
