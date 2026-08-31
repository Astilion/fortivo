# Status — 2026-08-15

**Wersja:** 0.6.0 · **Migracja bazy:** v10 · **main:** `2781ded`

## Zrobione ostatnio

v0.6.0 **code-complete**, M1.15 (pre-beta hardening) **domknięte**:

- pozycje audytu D1–D7, D14 (wycinek), D15
- crash reporting (Sentry) z przełącznikiem w profilu
- eksport danych do JSON
- weryfikacja end-to-end na urządzeniu: restore z Android Auto Backup, eksport, 6/6 testów przełącznika

Po M1.15, przed betą: crash reporting przeszedł z **opt-outu na opt-in** — domyślnie
wyłączony, zgoda zbierana slajdem w onboardingu (`crashReportingConsentMeta` z datą
i wersją polityki), plus korekta guardraili Sentry (`__DEV__`, `beforeSendTransaction`,
sanityzacja breadcrumbs `touch`/`navigation`) i `blockedPermissions` na obu STORAGE.

Kod przestał być wąskim gardłem — dalej idzie warstwa papierowa.

## W toku

Porządkowanie dokumentacji wg `docs/private/metodyka-pracy.md`: `STATUS.md` / `ROADMAP.md` /
`BACKLOG.md` / `DECISIONS.md` jako cztery osobne pliki + dieta `CLAUDE.md` (zostają same konwencje).

## Czeka na zewnątrz

Formalności blokujące M1.16 (closed beta):

- DPA od Sentry
- publikacja polityki prywatności — musi opisywać model **opt-in**, a data w jej nagłówku
  musi być równa `PRIVACY_POLICY_VERSION` w `constants/Links.ts` (dziś `2026-08-31`)
- formularz Data Safety w Play Console — dziś opisuje opt-out, do przerobienia
- deklaracja Health apps w Play Console

## Następny krok

**M1.16 closed beta** — start po domknięciu formalności powyżej. Dług z audytu (D8–D13) leci
równolegle w oknie bety jako **M1.17**; lista w `docs/BACKLOG.md`.
