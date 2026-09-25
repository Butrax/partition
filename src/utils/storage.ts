import { ClefType, PlayMode, NoteNaming, Accidental, MusicalNote, NoteStat, NoteStatsMap } from '../types';

const SETTINGS_STORAGE_KEY = 'sight_reading_trainer_settings_v1';
const STATS_STORAGE_KEY = 'sight_reading_trainer_stats_v1';

export interface AppStoredSettings {
  clef: ClefType;
  dualClefEnabled: boolean;
  secondaryClef: ClefType;
  minDiatonic: number;
  maxDiatonic: number;
  minDiatonic2: number;
  maxDiatonic2: number;
  selectedScaleId: string;
  allowedSteps: number[];
  keySignature: { [step: number]: Accidental };
  playMode: PlayMode;
  baseTempo: number;
  adaptiveScrolling: boolean;
  notesCount: number;
  naming: NoteNaming;
  inputView: 'both' | 'pads' | 'piano';
  showNoteHint: boolean;
  soundEnabled: boolean;
  focusWeakNotes?: boolean;
  weakNotesThreshold?: number;
}

/**
 * Generate a unique identifier for a note within a specific clef
 */
export function getNoteStatKey(clef: ClefType, diatonicIndex: number, accidental: Accidental = 'natural'): string {
  return `${clef}_${diatonicIndex}_${accidental}`;
}

/**
 * Calculate the mastery score (0 to 100) from reaction time and errors/accuracy
 * - Rouge (0-35) : peu maîtrisée, erreurs fréquentes ou temps de réponse lent
 * - Orange/Jaune (35-70) : en cours d'acquisition
 * - Vert (70-100) : très bien maîtrisée, réflexe rapide et sans erreur
 */
export function calculateMasteryScore(stat: {
  attempts: number;
  correct: number;
  errors: number;
  averageReactionTimeMs: number;
}): number {
  if (stat.attempts === 0) return 0;

  const accuracy = stat.correct / stat.attempts; // 0..1

  // Speed rating:
  // <= 1000ms => 1.0 (reflex speed)
  // >= 4500ms => 0.0 (needs prolonged reading)
  const avgTime = stat.averageReactionTimeMs;
  const speedRating = Math.max(0, Math.min(1, (4500 - avgTime) / 3500));

  // Weight: 65% accuracy (penalizing errors heavily), 35% speed
  let score = (accuracy * 0.65 + speedRating * 0.35) * 100;

  // Direct error penalty: each error shaves off points
  const errorRate = stat.errors / stat.attempts;
  score = score * (1 - errorRate * 0.3);

  // Confidence factor: if only 1 attempt, cap confidence
  if (stat.attempts === 1) {
    score = score * 0.8;
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Returns a smooth color from Red (0%) -> Orange -> Yellow -> Green (100%)
 */
export function getMasteryColor(masteryScore: number, attempts: number): string {
  if (attempts === 0) {
    return '#94a3b8'; // Slate 400 (untested)
  }

  // Hue from 0 (pure red) to 135 (pure emerald green)
  // 0% -> 0 (red)
  // 45% -> 40 (orange/amber)
  // 70% -> 75 (lime/yellow-green)
  // 100% -> 135 (emerald green)
  const hue = Math.round((masteryScore / 100) * 135);
  return `hsl(${hue}, 86%, 42%)`;
}

export function getMasteryBadgeClass(masteryScore: number, attempts: number): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (attempts === 0) {
    return {
      bg: 'bg-slate-800',
      text: 'text-slate-400',
      border: 'border-slate-700',
      label: 'Non testée',
    };
  }
  if (masteryScore >= 75) {
    return {
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-400',
      border: 'border-emerald-800/80',
      label: 'Excellente maîtrise',
    };
  }
  if (masteryScore >= 50) {
    return {
      bg: 'bg-amber-950/60',
      text: 'text-amber-300',
      border: 'border-amber-800/80',
      label: "En cours d'acquisition",
    };
  }
  return {
    bg: 'bg-rose-950/60',
    text: 'text-rose-400',
    border: 'border-rose-800/80',
    label: 'À retravailler',
  };
}

/**
 * Load settings from localStorage
 */
export function loadSettingsFromStorage(): Partial<AppStoredSettings> | null {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load settings from storage:', err);
    return null;
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettingsToStorage(settings: AppStoredSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings to storage:', err);
  }
}

/**
 * Load note statistics from localStorage
 */
export function loadNoteStatsFromStorage(): NoteStatsMap {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (err) {
    console.warn('Failed to load stats from storage:', err);
    return {};
  }
}

/**
 * Save note statistics to localStorage
 */
export function saveNoteStatsToStorage(stats: NoteStatsMap): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('Failed to save stats to storage:', err);
  }
}

/**
 * Clear note statistics from localStorage
 */
export function clearNoteStatsFromStorage(): void {
  try {
    localStorage.removeItem(STATS_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear stats from storage:', err);
  }
}

/**
 * Update stats with a new answer (correct/error) and reaction time
 */
export function updateNoteStat(
  prevStats: NoteStatsMap,
  note: MusicalNote,
  activeClef: ClefType,
  isCorrect: boolean,
  reactionTimeMs: number
): { updatedStats: NoteStatsMap; updatedStat: NoteStat } {
  const noteClef = note.clef || activeClef;
  const accidental = note.accidental || 'natural';
  const key = getNoteStatKey(noteClef, note.diatonicIndex, accidental);

  const existing = prevStats[key] || {
    key,
    clef: noteClef,
    diatonicIndex: note.diatonicIndex,
    step: note.step,
    octave: note.octave,
    accidental,
    attempts: 0,
    correct: 0,
    errors: 0,
    totalReactionTimeMs: 0,
    averageReactionTimeMs: 0,
    masteryScore: 0,
    lastPracticed: Date.now(),
  };

  const newAttempts = existing.attempts + 1;
  const newCorrect = isCorrect ? existing.correct + 1 : existing.correct;
  const newErrors = !isCorrect ? existing.errors + 1 : existing.errors;
  const newTotalTime = existing.totalReactionTimeMs + reactionTimeMs;
  const newAverageTime = Math.round(newTotalTime / newAttempts);

  const newMastery = calculateMasteryScore({
    attempts: newAttempts,
    correct: newCorrect,
    errors: newErrors,
    averageReactionTimeMs: newAverageTime,
  });

  const updatedStat: NoteStat = {
    ...existing,
    attempts: newAttempts,
    correct: newCorrect,
    errors: newErrors,
    totalReactionTimeMs: newTotalTime,
    averageReactionTimeMs: newAverageTime,
    masteryScore: newMastery,
    lastPracticed: Date.now(),
  };

  const updatedStats: NoteStatsMap = {
    ...prevStats,
    [key]: updatedStat,
  };

  saveNoteStatsToStorage(updatedStats);

  return { updatedStats, updatedStat };
}
