import { PresetWorkout } from '@/types/presets';

export const PRESET_WORKOUTS: PresetWorkout[] = [
  // ─── 1. FBW (Full Body Workout) ─────────────────────────────────────────
  {
    id: 'preset_workout_fbw_basic',
    name: 'FBW',
    description:
      'Trening całego ciała dla początkujących. Idealny do 2-3× w tygodniu z dniem przerwy między sesjami.',
    category: 'basic',
    tags: ['fbw', 'początkujący', 'pełne ciało'],
    estimatedDurationMinutes: 60,
    coachingNotes:
      'Pierwsze 3 ćwiczenia (przysiad, wyciskanie, wiosłowanie) to ciężkie wielostawowe — daj sobie pełne 3 minuty lub więcej przerwy między seriami. Technika ważniejsza niż ciężar. RPE 7 oznacza „mogłem zrobić jeszcze 3 powtórzenia" — zostawiaj zapas, jesteś na początku drogi. Hip thrust, wyciskanie hantli i plank to akcesoria - krótsze przerwy.\n\nZakresy powtórzeń do progresu: główne wielostawowe 8-10 powtórzeń, hip thrust 10-12, wyciskanie hantli 8-12, plank 30+ sekund. Plan ma dolne granice — dodawaj powtórzenia/sekundy, zanim zwiększysz ciężar.',
    exercises: [
      {
        exerciseId: 'squat_001', // Przysiad Klasyczny
        order: 0,
        sets: [
          { setOrder: 0, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 1, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 2, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 3, reps: 8, rpe: 7, restTime: 180 },
        ],
      },
      {
        exerciseId: 'bench_press_013', // Wyciskanie Sztangi na Ławce Płaskiej
        order: 1,
        sets: [
          { setOrder: 0, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 1, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 2, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 3, reps: 8, rpe: 7, restTime: 180 },
        ],
      },
      {
        exerciseId: 'row_002', // Wiosłowanie Sztangą w opadzie tułowia nachwytem
        order: 2,
        sets: [
          { setOrder: 0, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 1, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 2, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 3, reps: 8, rpe: 7, restTime: 180 },
        ],
      },
      {
        exerciseId: 'hip_thrust_001', // Hip Thrust
        order: 3,
        sets: [
          { setOrder: 0, reps: 10, rpe: 8, restTime: 120 },
          { setOrder: 1, reps: 10, rpe: 8, restTime: 120 },
          { setOrder: 2, reps: 10, rpe: 8, restTime: 120 },
        ],
      },
      {
        exerciseId: 'shoulder_press_003', // Wyciskanie Hantli nad Głowę siedząc
        order: 4,
        sets: [
          { setOrder: 0, reps: 8, rpe: 7, restTime: 150 },
          { setOrder: 1, reps: 8, rpe: 7, restTime: 150 },
          { setOrder: 2, reps: 8, rpe: 7, restTime: 150 },
        ],
      },
      {
        exerciseId: 'plank_002', // Deska
        order: 5,
        sets: [
          { setOrder: 0, duration: 30, rpe: 8, restTime: 60 },
          { setOrder: 1, duration: 30, rpe: 8, restTime: 60 },
          { setOrder: 2, duration: 30, rpe: 8, restTime: 60 },
        ],
      },
    ],
  },

  // ─── 2. PUSH ────────────────────────────────────────────────────────────
  {
    id: 'preset_workout_push_basic',
    name: 'Push',
    description:
      'Trening pchający — klatka, barki, triceps. Część 4-6 dniowego splitu Push/Pull/Legs.',
    category: 'basic',
    tags: ['push', 'początkujący', 'klatka', 'barki', 'triceps'],
    estimatedDurationMinutes: 50,
    coachingNotes:
      'Kolejność celowa — najcięższe wielostawowe (wyciskanie sztangi) z największą rezerwą siły, potem wyciskanie nad głowę, potem izolacje. Na obu wyciskaniach nie spiesz się z przerwą — minimum 3 minuty, lepiej dłużej jeśli nie czujesz powrotu. Na wznosach bokiem i pushdown utrzymuj tempo: krótka przerwa, świadoma kontrola, czujesz mięsień zamiast go szarpać.\n\nZakresy do progresu: wyciskanie sztangi 6-10, wyciskanie hantli nad głowę 8-10, wyciskanie skośne hantli 10-12, wznosy bokiem 12-15, pushdown 10-12. Dodawaj powtórzenia w zakresie, zanim zwiększysz ciężar.',
    exercises: [
      {
        exerciseId: 'bench_press_013', // Wyciskanie Sztangi na Ławce Płaskiej
        order: 0,
        sets: [
          { setOrder: 0, reps: 6, rpe: 7, restTime: 180 },
          { setOrder: 1, reps: 6, rpe: 7, restTime: 180 },
          { setOrder: 2, reps: 6, rpe: 7, restTime: 180 },
          { setOrder: 3, reps: 6, rpe: 7, restTime: 180 },
        ],
      },
      {
        exerciseId: 'shoulder_press_003', // Wyciskanie Hantli nad Głowę siedząc
        order: 1,
        sets: [
          { setOrder: 0, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 1, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 2, reps: 8, rpe: 7, restTime: 180 },
        ],
      },
      {
        exerciseId: 'bench_press_005', // Wyciskanie Hantli na Skosie dodatnim
        order: 2,
        sets: [
          { setOrder: 0, reps: 10, rpe: 7, restTime: 120 },
          { setOrder: 1, reps: 10, rpe: 7, restTime: 120 },
          { setOrder: 2, reps: 10, rpe: 7, restTime: 120 },
        ],
      },
      {
        exerciseId: 'raise_007', // Wznosy bokiem hantlami
        order: 3,
        sets: [
          { setOrder: 0, reps: 12, rpe: 8, restTime: 60 },
          { setOrder: 1, reps: 12, rpe: 8, restTime: 60 },
          { setOrder: 2, reps: 12, rpe: 8, restTime: 60 },
        ],
      },
      {
        exerciseId: 'extension_005', // Prostowanie ramion na wyciągu (tricep pushdown)
        order: 4,
        sets: [
          { setOrder: 0, reps: 10, rpe: 8, restTime: 60 },
          { setOrder: 1, reps: 10, rpe: 8, restTime: 60 },
          { setOrder: 2, reps: 10, rpe: 8, restTime: 60 },
        ],
      },
    ],
  },

  // ─── 3. PULL ────────────────────────────────────────────────────────────
  {
    id: 'preset_workout_pull_basic',
    name: 'Pull',
    description:
      'Trening Pull — plecy, biceps, tylne aktony barków. Część splitu Push/Pull/Legs.',
    category: 'basic',
    tags: ['pull', 'początkujący', 'plecy', 'biceps'],
    estimatedDurationMinutes: 60,
    coachingNotes:
      'Martwy ciąg na początku, gdy jesteś świeży — to najbardziej wymagające ćwiczenie w całym splicie. Trzymaj niskie powtórzenia, długą przerwę (4 minuty), pełen fokus na technikę plecy/biodra. Jeśli technika się sypie — zakończ serię. Wiosłowanie sztangi później — dół pleców już rozgrzany, bądź ostrożny z ciężarem. Akcesoria (face pull, uginanie hantli) lecą szybko z krótkimi przerwami i wysoim czuciem. Zakresy do progresu: martwy ciąg 5-8 (trzymaj niskie, na technikę), lat ściąganie drążka 8-10, wiosłowanie sztangi 8-10, wiosłowanie hantlą 10-12, face pull 12-15, uginanie hantli 10-12. Dodawaj powtórzenia, zanim zwiększysz ciężar.',
    exercises: [
      {
        exerciseId: 'deadlift_001', // Martwy Ciąg klasyczny
        order: 0,
        sets: [
          { setOrder: 0, reps: 5, rpe: 7, restTime: 240 },
          { setOrder: 1, reps: 5, rpe: 7, restTime: 240 },
          { setOrder: 2, reps: 5, rpe: 7, restTime: 240 },
        ],
      },
      {
        exerciseId: 'pulldown_006', // Ściąganie drążka nachwytem (lat pulldown)
        order: 1,
        sets: [
          { setOrder: 0, reps: 8, rpe: 7, restTime: 150 },
          { setOrder: 1, reps: 8, rpe: 7, restTime: 150 },
          { setOrder: 2, reps: 8, rpe: 7, restTime: 150 },
          { setOrder: 3, reps: 8, rpe: 7, restTime: 150 },
        ],
      },
      {
        exerciseId: 'row_002', // Wiosłowanie Sztangą w opadzie tułowia nachwytem
        order: 2,
        sets: [
          { setOrder: 0, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 1, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 2, reps: 8, rpe: 7, restTime: 180 },
        ],
      },
      {
        exerciseId: 'row_012', // Wiosłowanie hantlą w klęku podpartym
        order: 3,
        sets: [
          { setOrder: 0, reps: 10, rpe: 7, restTime: 90 },
          { setOrder: 1, reps: 10, rpe: 7, restTime: 90 },
          { setOrder: 2, reps: 10, rpe: 7, restTime: 90 },
        ],
      },
      {
        exerciseId: 'face_pull_002', // face pull z gumą
        order: 4,
        sets: [
          { setOrder: 0, reps: 12, rpe: 8, restTime: 60 },
          { setOrder: 1, reps: 12, rpe: 8, restTime: 60 },
          { setOrder: 2, reps: 12, rpe: 8, restTime: 60 },
        ],
      },
      {
        exerciseId: 'curl_007', // Uginanie ramion z hantlami z rotacją (DB curl)
        order: 5,
        sets: [
          { setOrder: 0, reps: 10, rpe: 8, restTime: 60 },
          { setOrder: 1, reps: 10, rpe: 8, restTime: 60 },
          { setOrder: 2, reps: 10, rpe: 8, restTime: 60 },
        ],
      },
    ],
  },

  // ─── 4. GÓRA (Upper) ────────────────────────────────────────────────────
  {
    id: 'preset_workout_upper_basic',
    name: 'Góra',
    description:
      'Trening górnej części ciała. Część 4-dniowego splitu Góra/Dół.',
    category: 'basic',
    tags: ['góra', 'początkujący', 'upper'],
    estimatedDurationMinutes: 55,
    coachingNotes:
      'Push i Pull idą naprzemiennie, żeby jedna grupa odpoczywała podczas pracy drugiej. To pozwala utrzymać intensywność bez przedłużania treningu. Na wszystkich ćwiczeniach wielostawowych (1-4) zostawiaj sobie zapas — RPE 7 oznacza świadomą rezerwę. Izolacje (uginanie hantli, pushdown) na koniec, krótkie przerwy, maksymalna pompa.\n\nZakresy do progresu: wszystkie wielostawowe 8-10, izolacje 10-12. Dodawaj powtórzenia w zakresie, zanim zwiększysz ciężar.',
    exercises: [
      {
        exerciseId: 'bench_press_013', // Wyciskanie Sztangi na Ławce Płaskiej
        order: 0,
        sets: [
          { setOrder: 0, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 1, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 2, reps: 8, rpe: 7, restTime: 180 },
        ],
      },
      {
        exerciseId: 'row_002', // Wiosłowanie Sztangą w opadzie tułowia nachwytem
        order: 1,
        sets: [
          { setOrder: 0, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 1, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 2, reps: 8, rpe: 7, restTime: 180 },
        ],
      },
      {
        exerciseId: 'shoulder_press_003', // Wyciskanie Hantli nad Głowę siedząc
        order: 2,
        sets: [
          { setOrder: 0, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 1, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 2, reps: 8, rpe: 7, restTime: 180 },
        ],
      },
      {
        exerciseId: 'pulldown_006', // Ściąganie drążka nachwytem (lat pulldown)
        order: 3,
        sets: [
          { setOrder: 0, reps: 8, rpe: 7, restTime: 120 },
          { setOrder: 1, reps: 8, rpe: 7, restTime: 120 },
          { setOrder: 2, reps: 8, rpe: 7, restTime: 120 },
        ],
      },
      {
        exerciseId: 'curl_007', // Uginanie ramion z hantlami z rotacją (DB curl)
        order: 4,
        sets: [
          { setOrder: 0, reps: 10, rpe: 8, restTime: 60 },
          { setOrder: 1, reps: 10, rpe: 8, restTime: 60 },
          { setOrder: 2, reps: 10, rpe: 8, restTime: 60 },
        ],
      },
      {
        exerciseId: 'extension_005', // Prostowanie ramion na wyciągu (tricep pushdown)
        order: 5,
        sets: [
          { setOrder: 0, reps: 10, rpe: 8, restTime: 60 },
          { setOrder: 1, reps: 10, rpe: 8, restTime: 60 },
          { setOrder: 2, reps: 10, rpe: 8, restTime: 60 },
        ],
      },
    ],
  },

  // ─── 5. DÓŁ (Lower) ─────────────────────────────────────────────────────
  {
    id: 'preset_workout_lower_basic',
    name: 'Dół',
    description:
      'Trening dolnej części ciała. Część 4-dniowego splitu Góra/Dół.',
    category: 'basic',
    tags: ['dół', 'początkujący', 'nogi'],
    estimatedDurationMinutes: 60,
    coachingNotes:
      'Przysiad najdłuższa przerwa (4 minuty). RDL idzie drugi, gdy nogi są już rozgrzane ale plecy jeszcze świeże. Wykroki to unilateralne ćwiczenie wielostawowe — trenują balans i korygują asymetrie, ale nie spiesz się z ciężarem. Maszyny (Wyprosty nóg na maszynie, leg curl) i wspięcia na palce to krótkie przerwy, świadoma kontrakcja, pełen zakres ruchu.\n\nZakresy do progresu: przysiad 6-8 (ciężki compound), RDL 8-10, wykroki 10-12 na nogę, prostowanie kolan 10-12, uginanie nóg 10-12, łydki 12-15. Dodawaj powtórzenia w zakresie, zanim zwiększysz ciężar.',
    exercises: [
      {
        exerciseId: 'squat_001', // Przysiad Klasyczny
        order: 0,
        sets: [
          { setOrder: 0, reps: 6, rpe: 7, restTime: 240 },
          { setOrder: 1, reps: 6, rpe: 7, restTime: 240 },
          { setOrder: 2, reps: 6, rpe: 7, restTime: 240 },
          { setOrder: 3, reps: 6, rpe: 7, restTime: 240 },
        ],
      },
      {
        exerciseId: 'deadlift_003', // Rumuński Martwy Ciąg (RDL)
        order: 1,
        sets: [
          { setOrder: 0, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 1, reps: 8, rpe: 7, restTime: 180 },
          { setOrder: 2, reps: 8, rpe: 7, restTime: 180 },
        ],
      },
      {
        exerciseId: 'lunge_002', // Wykroki z hantlami
        order: 2,
        sets: [
          { setOrder: 0, reps: 10, rpe: 7, restTime: 120 },
          { setOrder: 1, reps: 10, rpe: 7, restTime: 120 },
          { setOrder: 2, reps: 10, rpe: 7, restTime: 120 },
        ],
      },
      {
        exerciseId: 'exercise_027', // Wyprosty kolan na maszynie (leg extension)
        order: 3,
        sets: [
          { setOrder: 0, reps: 10, rpe: 8, restTime: 60 },
          { setOrder: 1, reps: 10, rpe: 8, restTime: 60 },
          { setOrder: 2, reps: 10, rpe: 8, restTime: 60 },
        ],
      },
      {
        exerciseId: 'leg_curl_001', // Uginanie nóg leżąc na maszynie
        order: 4,
        sets: [
          { setOrder: 0, reps: 10, rpe: 8, restTime: 60 },
          { setOrder: 1, reps: 10, rpe: 8, restTime: 60 },
          { setOrder: 2, reps: 10, rpe: 8, restTime: 60 },
        ],
      },
      {
        exerciseId: 'exercise_092', // Wspięcia na palce obunóż
        order: 5,
        sets: [
          { setOrder: 0, reps: 12, rpe: 8, restTime: 60 },
          { setOrder: 1, reps: 12, rpe: 8, restTime: 60 },
          { setOrder: 2, reps: 12, rpe: 8, restTime: 60 },
          { setOrder: 3, reps: 12, rpe: 8, restTime: 60 },
        ],
      },
    ],
  },
];
