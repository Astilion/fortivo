# Status — 2026-10-03

**Wersja:** 0.6.2 · **Migracja bazy:** v10 · **main:** `5fa6b94`

## Zrobione ostatnio

Hotfix 0.6.2 (audyt bety #5, #9, #7, #8, #12): ekran recovery z kodem błędu i drugorzędnym
resetem, blokada usuwania ćwiczenia/treningu z aktywnej sesji, sprzątanie pliku eksportu.
Smoke (5 poprawek + regresja FAB) zaliczony na emulatorze z dev buildem z EAS — lokalny
`expo run:android` pada na Windows (limit 260 znaków ścieżki), a dev client ma ten sam pakiet
co wersja z Play, więc nie na telefonie z prawdziwymi danymi. Pierwszy build przez
`eas build --auto-submit` zadziałał: versionCode 19 → test wewnętrzny zaliczony → Alpha.

## W toku

—

## Czeka na zewnątrz

Wniosek o dostęp do produkcji w Play Console — złożony 2026-10-03, czeka na decyzję Google.

## Następny krok

- decyzja Google; przy odmowie — rekrutacja testerów (Wykop/Reddit) i nacisk na zaangażowanie
- ankieta końcowa (jeszcze niewysłana) → przegląd kryteriów M1.16 ~10.10
- równolegle zadania w trybie nauki (D13)

Kryteria przy ~6–7 aktywnych z ~18: ≥60% z ≥4 treningami w 2. tygodniu (mierzalne tylko
ankietą — brak analityki), zero utraty danych (sprawdzić, czy ktoś trafił na #1 w 0.6.0),
Sean Ellis ≥1/3. Daty w `docs/ROADMAP.md` odświeżyć dopiero po przeglądzie ~10.10.
