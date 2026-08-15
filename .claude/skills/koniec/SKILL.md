---
name: koniec
description: Zamyka sesję roboczą nad Fortivo. Aktualizuje STATUS.md, ROADMAP.md, DECISIONS.md, BACKLOG.md i w razie potrzeby CLAUDE.md na podstawie tego, co faktycznie wydarzyło się w tej sesji. Uruchamiać wyłącznie na wyraźne polecenie użytkownika, nigdy z własnej inicjatywy.
disable-model-invocation: true
---

# Zamknięcie sesji

Wykonaj kroki po kolei. **Pokaż diff PRZED zapisem każdego pliku i poczekaj na akceptację.**

## 1. `docs/STATUS.md` — nadpisz

Maksymalnie 30 linii:

```markdown
# Status — RRRR-MM-DD

**Wersja:** x.y.z · **Migracja bazy:** vN · **main:** <short-sha>

## Zrobione w tej sesji
## W toku / niedokończone
## Czeka na zewnątrz
## Następny krok
```

Sekcja „Czeka na zewnątrz" jest dla rzeczy zablokowanych na trzecią stronę
(DPA, review w Play Console) — bez niej takie pozycje giną między sesjami.

Pusta sekcja → wpisz „—". Nie wymyślaj treści.

## 2. `docs/ROADMAP.md`

- Odznacz `[x]` **tylko** to, co faktycznie działa — nie „napisane", tylko „działa".
- Porzucone → **NIE usuwaj**. Przekreśl i dopisz `(porzucone RRRR-MM-DD: powód)`.
- Nowe → dopisz z `(nowe RRRR-MM-DD)`.

Przekreślanie zamiast usuwania jest celowe: żeby za trzy miesiące nikt — ani użytkownik,
ani model — nie zaproponował ponownie czegoś, co już odrzucono.

## 3. `docs/DECISIONS.md` — dopisz na końcu

```markdown
## RRRR-MM-DD — [tytuł decyzji]

**Kontekst:**
**Decyzja:**
**Odrzucone:**
**Dlaczego:**
```

- Dopisuj **wyłącznie na końcu**. Nigdy nie edytuj wcześniejszych wpisów.
- Jedna decyzja = jeden wpis.
- „Odrzucone" jest obowiązkowe. Jeśli nie było alternatyw — napisz dlaczego.
- Implementacja bez wyboru to nie decyzja. Pomiń.

## 4. `docs/BACKLOG.md`

Nowy dług odkryty w tej sesji → dopisz **tutaj**, nie do `DECISIONS.md`.
Dług spłacony → oznacz jako zamknięty z datą, nie kasuj wpisu.

Rozróżnienie: `DECISIONS.md` = co postanowiliśmy i dlaczego. `BACKLOG.md` = co wiemy,
że jest nie tak, i świadomie odkładamy.

## 5. `CLAUDE.md` — tylko warunkowo

Zaktualizuj **wyłącznie** gdy zmieniła się konwencja kodu, struktura folderów,
stack albo proces release/komendy.

**Nie** wpisuj tu stanu projektu (wersja, SHA, status milestone'a) — to `STATUS.md`.
**Nie** wpisuj tu uzasadnień — to `DECISIONS.md`, tu zostaje sama reguła plus odesłanie.
**Nie** wpisuj tu długu — to `BACKLOG.md`.

Jeśli kusi Cię dopisanie akapitu z uzasadnieniem: to sygnał, że wpis należy
do `DECISIONS.md`.

## 6. Raport końcowy

Poza plikami wypisz:

- **Notion:** jedno zdanie — co użytkownik ma ręcznie zaktualizować
- **Push:** przypomnij o `git push` w głównym repo **oraz** osobno w `docs/private/`,
  jeśli tam też były zmiany

## Zasady twarde

- Nie dotykaj plików z kodem. Ten skill zmienia wyłącznie dokumentację.
- Nie wymyślaj rzeczy, których nie było w tej sesji. Nie masz pewności, czy coś
  skończone — zapytaj, nie zgaduj.
- Sesja była krótka i nie ma czego zapisać → powiedz to wprost zamiast produkować wpisy.
