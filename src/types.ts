export type ClefType = 'treble' | 'bass' | 'alto' | 'tenor';

export type NoteNaming = 'latin' | 'anglo'; // latin = Do Ré Mi..., anglo = C D E...

export type Accidental = 'natural' | 'sharp' | 'flat';

export interface MusicalNote {
  id: string;
  step: number; // 0=C, 1=D, 2=E, 3=F, 4=G, 5=A, 6=B
  octave: number; // e.g. 4 for C4 (middle C)
  accidental?: Accidental;
  midi: number; // MIDI note number (e.g. 60 for C4)
  diatonicIndex: number; // octave * 7 + step (absolute diatonic scale position)
  clef?: ClefType; // which clef this note belongs to (for dual-clef mode)
}

export interface ScalePreset {
  id: string;
  name: string;
  description: string;
  keySignature: { [step: number]: Accidental }; // step (0..6) -> accidental
  allowedSteps: number[]; // e.g. [0, 1, 2, 3, 4, 5, 6] or pentatonic [0, 1, 2, 4, 5]
}

export type PlayMode = 'scrolling' | 'static' | 'timed_sprint' | 'timed_challenge' | 'survival';

export interface GameSettings {
  clef: ClefType;
  minDiatonic: number; // lowest note diatonicIndex
  maxDiatonic: number; // highest note diatonicIndex
  notesCount: number; // 1 to 5 notes displayed at the same time
  naming: NoteNaming;
  scaleId: string;
  customScaleAllowedSteps: number[];
  customKeySignature: { [step: number]: Accidental };
  soundEnabled: boolean;
  baseTempo: number; // base scrolling speed (1: lent, 2: modéré, 3: rapide, 4: virtuose)
  adaptiveScrolling: boolean; // whether to smoothly adapt scrolling to reading speed
  inputMethod: 'both' | 'pads' | 'piano';
}

export interface GameScore {
  correct: number;
  total: number;
  streak: number;
  maxStreak: number;
  points: number;
  timeRemaining?: number;
  elapsedTime: number;
  lives?: number;
}

export interface NoteStat {
  key: string; // e.g. "treble_32_natural"
  clef: ClefType;
  diatonicIndex: number;
  step: number;
  octave: number;
  accidental: Accidental;
  attempts: number;
  correct: number;
  errors: number;
  totalReactionTimeMs: number;
  averageReactionTimeMs: number;
  masteryScore: number; // 0 to 100
  lastPracticed: number;
}

export type NoteStatsMap = { [noteKey: string]: NoteStat };
