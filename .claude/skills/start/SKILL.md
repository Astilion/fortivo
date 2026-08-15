---
name: start
description: Odtwarza kontekst na starcie sesji roboczej nad Fortivo. Czyta STATUS.md, ROADMAP.md, BACKLOG.md i ostatnie wpisy z DECISIONS.md, po czym raportuje gdzie jesteśmy, co jest w toku i czy dokumentacja rozjeżdża się z kodem. Używaj na początku każdej sesji, zanim cokolwiek zaczniemy robić.
---

# Start sesji

Przeczytaj w tej kolejności:

1. `docs/STATUS.md`
2. `docs/ROADMAP.md`
3. `docs/BACKLOG.md` — tylko nagłówki pozycji, nie całość
4. ostatnie 10 wpisów z `docs/DECISIONS.md` (od końca pliku)

Następnie w **maksymalnie 12 liniach** powiedz:

1. **Gdzie jesteśmy** — wersja, ostatni merge, ostatnia domknięta pozycja
2. **Co jest w toku** — niedokończone, rozgrzebane
3. **Następny milestone** z roadmapy i co go blokuje
4. **Rozjazd dokumentacji z kodem** — patrz niżej

## Sprawdzenie rozjazdu (pkt 4)

Zweryfikuj punktowo rzeczy, które starzeją się najszybciej:

- `PRAGMA user_version` w `database/database.ts` vs numer migracji w `STATUS.md`
- `version` w `app.json` i `package.json` — czy zsynchronizowane ze sobą i ze `STATUS.md`
- czy pliki wymienione w `CLAUDE.md` w sekcji „Dokumentacja wewnętrzna" istnieją
- czy `STATUS.md` wskazuje commit, który faktycznie jest na `main`

Rozjazd zgłoś jako obserwację. Nie naprawiaj.

## Zasady

- Nie proponuj rozwiązań.
- Nie zmieniaj żadnych plików.
- Nie czytaj całego repo. Wystarczą pliki wyżej plus punktowe sprawdzenie do pkt 4.
- Jeśli `STATUS.md` nie istnieje — powiedz to wprost i przerwij, zamiast rekonstruować
  stan z `CLAUDE.md` czy handoffów.
