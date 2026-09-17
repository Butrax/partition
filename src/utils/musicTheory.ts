import { ClefType, NoteNaming, Accidental, MusicalNote, ScalePreset } from '../types';

export const LATIN_NOTES = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
export const ANGLO_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const SEMITONE_OFFSETS = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B

export interface ClefInfo {
  id: ClefType;
  name: string;
  clefNoteName: string;
  referencePitch: string;
  // bottom line of the 5-line staff as a diatonic index
  bottomLineDiatonic: number; // e.g. E4 for treble
  defaultMinDiatonic: number;
  defaultMaxDiatonic: number;
  symbol: string;
}

export const CLEF_CONFIGS: Record<ClefType, ClefInfo> = {
  treble: {
    id: 'treble',
    name: 'Clef de Sol (2ème ligne)',
    clefNoteName: 'Sol',
    referencePitch: 'Sol 4 sur la 2ème ligne',
    // Bottom line is E4: 4 * 7 + 2 = 30
    bottomLineDiatonic: 30, // E4
    defaultMinDiatonic: 28, // C4 (Middle C)
    defaultMaxDiatonic: 38, // A5
    symbol: '𝄞',
  },
  bass: {
    id: 'bass',
    name: 'Clef de Fa (4ème ligne)',
    clefNoteName: 'Fa',
    referencePitch: 'Fa 3 sur la 4ème ligne',
    // Bottom line is G2: 2 * 7 + 4 = 18
    bottomLineDiatonic: 18, // G2
    defaultMinDiatonic: 16, // E2
    defaultMaxDiatonic: 28, // C4 (Middle C)
    symbol: '𝄢',
  },
  alto: {
    id: 'alto',
    name: "Clef d'Ut 3ème ligne (Alto)",
    clefNoteName: 'Ut / Do',
    referencePitch: "Do 4 sur la 3ème ligne",
    // Bottom line is F3: 3 * 7 + 3 = 24
    bottomLineDiatonic: 24, // F3
    defaultMinDiatonic: 22, // D3
    defaultMaxDiatonic: 34, // B4
    symbol: '𝄡',
  },
  tenor: {
    id: 'tenor',
    name: "Clef d'Ut 4ème ligne (Ténor)",
    clefNoteName: 'Ut / Do',
    referencePitch: "Do 4 sur la 4ème ligne",
    // Bottom line is D3: 3 * 7 + 1 = 22
    bottomLineDiatonic: 22, // D3
    defaultMinDiatonic: 20, // B2
    defaultMaxDiatonic: 32, // G4
    symbol: '𝄡',
  },
};

export const SCALE_PRESETS: ScalePreset[] = [
  {
    id: 'c_major',
    name: 'Do Majeur (Naturelle)',
    description: 'Aucune altération (Do, Ré, Mi, Fa, Sol, La, Si). Idéal pour débuter.',
    keySignature: {},
    allowedSteps: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'g_major',
    name: 'Sol Majeur (1 dièse)',
    description: 'Fa♯ à la clé.',
    keySignature: { 3: 'sharp' },
    allowedSteps: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'f_major',
    name: 'Fa Majeur (1 bémol)',
    description: 'Si♭ à la clé.',
    keySignature: { 6: 'flat' },
    allowedSteps: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'd_major',
    name: 'Ré Majeur (2 dièses)',
    description: 'Fa♯ et Do♯ à la clé.',
    keySignature: { 3: 'sharp', 0: 'sharp' },
    allowedSteps: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'bb_major',
    name: 'Si♭ Majeur (2 bémols)',
    description: 'Si♭ et Mi♭ à la clé.',
    keySignature: { 6: 'flat', 2: 'flat' },
    allowedSteps: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'a_harmonic_minor',
    name: 'La mineur harmonique',
    description: 'Gamme mineure avec Sol♯.',
    keySignature: { 4: 'sharp' },
    allowedSteps: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'pentatonic',
    name: 'Pentatonique majeure (Do-Ré-Mi-Sol-La)',
    description: '5 notes sans demi-tons, mélodique et fluide.',
    keySignature: {},
    allowedSteps: [0, 1, 2, 4, 5],
  },
  {
    id: 'custom',
    name: 'Personnalisée',
    description: 'Choisissez vos notes et altérations sur mesure.',
    keySignature: {},
    allowedSteps: [0, 1, 2, 3, 4, 5, 6],
  },
];

/**
 * Creates a MusicalNote from diatonicIndex and optional accidental.
 */
export function createNoteFromDiatonic(
  diatonicIndex: number,
  accidental: Accidental = 'natural',
  idPrefix: string = 'n'
): MusicalNote {
  const octave = Math.floor(diatonicIndex / 7);
  const step = ((diatonicIndex % 7) + 7) % 7;
  let midi = (octave + 1) * 12 + SEMITONE_OFFSETS[step];
  if (accidental === 'sharp') midi += 1;
  if (accidental === 'flat') midi -= 1;

  return {
    id: `${idPrefix}-${diatonicIndex}-${accidental}-${Date.now()}-${Math.random()}`,
    step,
    octave,
    accidental,
    midi,
    diatonicIndex,
  };
}

/**
 * Formats note name: e.g. "Do 4", "Sol♯ 5", "F# 4"
 */
export function formatNoteName(
  note: MusicalNote | { step: number; octave: number; accidental?: Accidental },
  naming: NoteNaming = 'latin',
  showOctave: boolean = true
): string {
  const base = naming === 'latin' ? LATIN_NOTES[note.step] : ANGLO_NOTES[note.step];
  let accSym = '';
  if (note.accidental === 'sharp') accSym = '♯';
  if (note.accidental === 'flat') accSym = '♭';
  return showOctave ? `${base}${accSym}${note.octave}` : `${base}${accSym}`;
}

/**
 * Converts note step to frequency (Hz)
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Staff line offset relative to the bottom line (line 1 = 0, space 1 = 1, line 2 = 2, ...)
 */
export function getStaffLineOffset(note: MusicalNote, clef: ClefType): number {
  const bottomDiatonic = CLEF_CONFIGS[clef].bottomLineDiatonic;
  return note.diatonicIndex - bottomDiatonic;
}

/**
 * Returns ledger lines required for a staff position.
 * Line 1 is 0, line 5 is 8.
 * Ledger lines below staff: -2, -4, -6, etc.
 * Ledger lines above staff: 10, 12, 14, etc.
 */
export function getLedgerLines(lineOffset: number): number[] {
  const lines: number[] = [];
  if (lineOffset < 0) {
    // Note is below line 0 (e.g. -1 is space below line 1, -2 is on ledger line 1 below, -3 is space below that)
    const lowestLine = lineOffset % 2 === 0 ? lineOffset : lineOffset - 1;
    for (let l = -2; l >= lowestLine; l -= 2) {
      lines.push(l);
    }
  } else if (lineOffset > 8) {
    // Note is above line 8 (line 5 is 8)
    const highestLine = lineOffset % 2 === 0 ? lineOffset : lineOffset + 1;
    for (let l = 10; l <= highestLine; l += 2) {
      lines.push(l);
    }
  }
  return lines;
}

/**
 * Given diatonic range and settings, generate a random note matching allowed scale
 */
export function generateRandomNote(
  minDiatonic: number,
  maxDiatonic: number,
  allowedSteps: number[],
  keySignature: { [step: number]: Accidental },
  clef?: ClefType
): MusicalNote {
  const validDiatonics: number[] = [];
  for (let d = minDiatonic; d <= maxDiatonic; d++) {
    const step = ((d % 7) + 7) % 7;
    if (allowedSteps.includes(step)) {
      validDiatonics.push(d);
    }
  }

  // Fallback if range doesn't have any allowed steps
  const diatonicIndex = validDiatonics.length > 0 
    ? validDiatonics[Math.floor(Math.random() * validDiatonics.length)]
    : minDiatonic;

  const step = ((diatonicIndex % 7) + 7) % 7;
  const accidental = keySignature[step] || 'natural';

  const note = createNoteFromDiatonic(diatonicIndex, accidental);
  if (clef) {
    note.clef = clef;
  }
  return note;
}
