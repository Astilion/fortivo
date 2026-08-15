# Status — 2026-08-15

**Wersja:** 0.6.0 · **Migracja bazy:** v10 · **main:** `9fae822`

## Zrobione ostatnio

v0.6.0 **code-complete**, M1.15 (pre-beta hardening) **domknięte**:

- pozycje audytu D1–D7, D14 (wycinek), D15
- crash reporting (Sentry) z przełącznikiem opt-out
- eksport danych do JSON
- weryfikacja end-to-end na urządzeniu: restore z Android Auto Backup, eksport, 6/6 testów opt-outu

Kod przestał być wąskim gardłem — dalej idzie warstwa papierowa.

## W toku

Porządkowanie dokumentacji wg `docs/private/metodyka-pracy.md`: `STATUS.md` / `ROADMAP.md` /
`BACKLOG.md` / `DECISIONS.md` jako cztery osobne pliki + dieta `CLAUDE.md` (zostają same konwencje).

## Czeka na zewnątrz

Formalności blokujące M1.16 (closed beta):

- DPA od Sentry
- publikacja polityki prywatności
- formularz Data Safety w Play Console
- deklaracja Health apps w Play Console

## Następny krok

**M1.16 closed beta** — start po domknięciu formalności powyżej. Dług z audytu (D8–D13) leci
równolegle w oknie bety jako **M1.17**; lista w `docs/BACKLOG.md`.
