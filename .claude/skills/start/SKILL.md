---
name: start
description: Odtwarza kontekst na starcie sesji roboczej nad Fortivo. Czyta STATUS.md, prywatną ROADMAP.md, BACKLOG.md i ostatnie wpisy z DECISIONS.md, po czym raportuje gdzie jesteśmy, co jest w toku i czy dokumentacja rozjeżdża się z kodem. Używaj na początku każdej sesji, zanim cokolwiek zaczniemy robić.
---

# Start sesji

Przeczytaj w tej kolejności:

1. `docs/STATUS.md`
2. `docs/private/ROADMAP.md` — **to jest roadmapa robocza**. `docs/ROADMAP.md` to jej
   publiczna, ocenzurowana wersja; nie czytaj jej jako źródła.
3. `docs/BACKLOG.md` — tylko nagłówki pozycji, nie całość
4. ostatnie 10 wpisów z `docs/DECISIONS.md` (od końca pliku)

Następnie w **maksymalnie 12 liniach**:

1. **Gdzie jesteśmy** — wersja, `main`, ostatnia domknięta pozycja
2. **Co jest w toku** — niedokończone, rozgrzebane
3. **Następny milestone** i co go blokuje
4. **Rozjazd** — patrz niżej

## Sprawdzenie rozjazdu (pkt 4)

- `PRAGMA user_version` w `database/database.ts` vs numer migracji w `STATUS.md`
- `version` w `app.json` i `package.json` — czy zsynchronizowane ze sobą i ze `STATUS.md`
- czy `STATUS.md` wskazuje commit, który faktycznie jest na `main`
- ścieżki wymienione w `CLAUDE.md` — czy istnieją, z dokładną wielkością liter
  (weryfikuj przez `git ls-files`, nie przez istnienie pliku — Windows jest
  case-insensitive i ukryje martwy link, który wyjdzie dopiero na GitHubie)
- `git -C docs/private status -sb` — czy są niewypchnięte commity w prywatnym repo
- czy `docs/ROADMAP.md` (publiczna) nie rozjechała się rażąco z `docs/private/ROADMAP.md`
  co do etapów i kolejności; różnice w szczegółowości są zamierzone

Rozjazd zgłoś jako obserwację. Nie naprawiaj.

## Zasady

- Nie proponuj rozwiązań.
- Nie zmieniaj żadnych plików.
- Nie czytaj całego repo. Wystarczą pliki wyżej plus punktowe sprawdzenia.
- Jeśli `docs/STATUS.md` nie istnieje — powiedz to wprost i przerwij, zamiast
  rekonstruować stan z `CLAUDE.md` czy handoffów.
