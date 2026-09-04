# Status — 2026-09-04

**Wersja:** 0.6.0 · **Migracja bazy:** v10 · **main:** `7364604`

## Zrobione ostatnio

Smoke opt-in na fizycznym urządzeniu (dev client, 2026-09-03/04): slajd zgody w onboardingu,
„Pomiń" przewijające do slajdu zgody, przełącznik w profilu, ścieżka odmowy nie wysyła nic.
Guardraile potwierdzone na żywych zdarzeniach w Sentry — breadcrumby `navigation` bez
parametrów, `touch` bez `message`/`data`, zero `console`, zdarzenia i transakcje bez pola
`user`, transakcje faktycznie powstają.

Wykryte przy okazji: natywne breadcrumby Androida (`network.event`, `device.event`,
`app.lifecycle`) nie przechodzą przez `beforeBreadcrumb` i niosły siłę sygnału,
przepustowość i `vpn_active`. Domknięte dwuwarstwowo — reguły Advanced Data Scrubbing
w projekcie Sentry + `stripVpnFlag` w `beforeSend`/`beforeSendTransaction` (`372dc34`).

Usunięte rusztowanie smoke'a z `_layout.tsx` i `profile.tsx`; `PRIVACY_POLICY_VERSION`
podbity na `2026-09-04`. Weryfikacja end-to-end M1.15 domknięta w całości.

## W toku

Polityka prywatności pod model opt-in — dokument przepisany (nagłówek `2026-09-04`,
zgodny z `PRIVACY_POLICY_VERSION`), został do publikacji pod `PRIVACY_POLICY_URL`.

## Czeka na zewnątrz

- publikacja polityki prywatności
- Play Console: formularz Data Safety (opisuje dziś opt-out) + deklaracja Health apps
  + target audience 16+
- regulamin/nota bety dla testerów

## Następny krok

**M1.16 closed beta** — start po domknięciu formalności powyżej. Kodowo w M1.15 otwarte
zostaje R5 („Usuń wszystkie dane"). Dług D8–D13 leci w oknie bety jako M1.17.
