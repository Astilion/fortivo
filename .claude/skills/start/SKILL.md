---
name: koniec
description: Zamyka sesję roboczą nad Fortivo. Aktualizuje STATUS.md, prywatną ROADMAP.md, DECISIONS.md, BACKLOG.md i w razie potrzeby CLAUDE.md na podstawie tego, co faktycznie wydarzyło się w tej sesji. Uruchamiać wyłącznie na wyraźne polecenie użytkownika, nigdy z własnej inicjatywy.
disable-model-invocation: true
---

# Zamknięcie sesji

Wykonaj kroki po kolei. **Pokaż diff PRZED zapisem każdego pliku i poczekaj na akceptację.**

## 1. `docs/STATUS.md` — nadpisz

```markdown
# Status — RRRR-MM-DD

**Wersja:** x.y.z · **Migracja bazy:** vN · **main:** <short-sha>

## Zrobione ostatnio

## W toku

## Czeka na zewnątrz

## Następny krok
```

`main` bierz z `git rev-parse --short HEAD`, nie z poprzedniej treści pliku.
„Czeka na zewnątrz" jest dla rzeczy zablokowanych na trzecią stronę (DPA, review
w Play Console) — bez tej sekcji giną między sesjami.

Maks. 30 linii. Pusta sekcja → „—". Nie wymyślaj treści.

## 2. `docs/private/ROADMAP.md`

To jest roadmapa robocza i jedyna, którą edytujesz.

- Odznacz `[x]` **tylko** to, co faktycznie działa — nie „napisane", tylko „działa".
- Porzucone → **NIE usuwaj**. Przekreśl + `(porzucone RRRR-MM-DD: powód)`.
- Nowe → dopisz z `(nowe RRRR-MM-DD)`.

Jeśli zmienił się horyzont (doszedł/wypadł etap, zmieniła się kolejność), zgłoś to
w raporcie końcowym jako „`docs/ROADMAP.md` do odświeżenia" — ale **nie edytuj jej sam**.
Wersja publiczna jest wyprowadzana świadomie, nie synchronizowana automatycznie.

## 3. `docs/DECISIONS.md` — dopisz na końcu

```markdown
## RRRR-MM-DD — [tytuł decyzji]

**Kontekst:**
**Decyzja:**
**Odrzucone:**
**Dlaczego:**
```

- Wyłącznie na końcu. Nigdy nie edytuj wcześniejszych wpisów.
- Jedna decyzja = jeden wpis.
- „Odrzucone" obowiązkowe. Brak alternatyw → napisz dlaczego ich nie było.
- Implementacja bez wyboru to nie decyzja. Pomiń.
- Ten plik jest publiczny. Pisz tak, żeby dało się to obronić pod pytaniem
  z zewnątrz — bez skrótów zrozumiałych tylko dla nas.

## 4. `docs/BACKLOG.md`

Nowy dług odkryty w tej sesji → **tutaj**, nie do `DECISIONS.md`.
Dług spłacony → oznacz zamknięciem z datą, nie kasuj wpisu.

Granica: `DECISIONS.md` = co postanowiliśmy i dlaczego. `BACKLOG.md` = co wiemy,
że jest nie tak, i świadomie odkładamy.

## 5. `CLAUDE.md` — tylko warunkowo

Wyłącznie gdy zmieniła się konwencja kodu, struktura folderów, stack albo
proces release/komendy.

**Nie** wpisuj stanu projektu → `STATUS.md`. **Nie** wpisuj uzasadnień →
`DECISIONS.md`, tu zostaje reguła plus odesłanie. **Nie** wpisuj długu → `BACKLOG.md`.

Kusi Cię dopisanie akapitu z uzasadnieniem? To sygnał, że wpis należy do `DECISIONS.md`.

## 6. Raport końcowy

Poza plikami wypisz:

- **Notion:** jedno zdanie — co użytkownik ma ręcznie zaktualizować
- **`docs/ROADMAP.md`:** czy wymaga odświeżenia (patrz krok 2)
- **Push repo głównego:** przypomnij
- **Push repo prywatnego** — podaj gotową komendę do skopiowania:

  ```
  git -C docs/private add -A && git -C docs/private commit -m "notatki RRRR-MM-DD" && git -C docs/private push
  ```

  Najpierw sprawdź `git -C docs/private status -sb`. Jeśli nie ma zmian ani
  niewypchniętych commitów — pomiń tę pozycję zamiast przypominać na sucho.

## Zasady twarde

- Nie dotykaj plików z kodem. Ten skill zmienia wyłącznie dokumentację.
- Nie rób `git commit` ani `git push` sam — przygotuj treść, komendy podaj do wykonania.
- Nie wymyślaj rzeczy, których nie było w tej sesji. Nie masz pewności — zapytaj.
- Sesja krótka i nie ma czego zapisać → powiedz to wprost zamiast produkować wpisy.
