import React from 'react';
import { MusicalNote, NoteNaming, Accidental } from '../types';
import { soundEngine } from '../utils/audio';
import { midiToFrequency, SEMITONE_OFFSETS, LATIN_NOTES, ANGLO_NOTES } from '../utils/musicTheory';

interface PianoKeyboardProps {
  minDiatonic: number;
  maxDiatonic: number;
  naming: NoteNaming;
  onKeySelected: (step: number, accidental: Accidental, octave?: number) => void;
  soundEnabled: boolean;
}

interface KeyData {
  step: number;
  octave: number;
  accidental: Accidental;
  midi: number;
  isBlack: boolean;
  name: string;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  minDiatonic,
  maxDiatonic,
  naming,
  onKeySelected,
  soundEnabled,
}) => {
  // Determine octave range based on current min/max diatonic
  const startOctave = Math.max(1, Math.floor(minDiatonic / 7));
  const endOctave = Math.min(7, Math.floor(maxDiatonic / 7));

  // Build list of keys
  const whiteKeys: KeyData[] = [];
  const blackKeys: KeyData[] = [];

  for (let oct = startOctave; oct <= endOctave; oct++) {
    for (let step = 0; step < 7; step++) {
      const midi = (oct + 1) * 12 + SEMITONE_OFFSETS[step];
      const name = naming === 'latin' ? LATIN_NOTES[step] : ANGLO_NOTES[step];

      whiteKeys.push({
        step,
        octave: oct,
        accidental: 'natural',
        midi,
        isBlack: false,
        name: `${name}${oct}`,
      });

      // Steps with black keys after them: 0 (C), 1 (D), 3 (F), 4 (G), 5 (A)
      if ([0, 1, 3, 4, 5].includes(step)) {
        blackKeys.push({
          step,
          octave: oct,
          accidental: 'sharp',
          midi: midi + 1,
          isBlack: true,
          name: `${name}♯${oct}`,
        });
      }
    }
  }

  const handleKeyClick = (key: KeyData) => {
    if (soundEnabled) {
      soundEngine.playPianoNote(midiToFrequency(key.midi));
    }
    onKeySelected(key.step, key.accidental, key.octave);
  };

  const getBlackKeyOffsetLeft = (octaveIdx: number, step: number) => {
    const whiteKeyWidth = 38; // px
    const baseWhiteIdx = octaveIdx * 7;
    const offsets: Record<number, number> = {
      0: 25, // C#
      1: 63, // D#
      3: 139, // F#
      4: 177, // G#
      5: 215, // A#
    };
    return baseWhiteIdx * whiteKeyWidth + (offsets[step] || 0);
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      <div className="w-full overflow-x-auto pb-1 scrollbar-thin flex justify-center">
        <div className="relative inline-flex bg-slate-900 p-1.5 rounded-xl shadow-lg border border-slate-700">
          {/* White Keys */}
          <div className="flex">
            {whiteKeys.map((k) => (
              <button
                key={`white-${k.midi}`}
                type="button"
                onClick={() => handleKeyClick(k)}
                className="w-9 sm:w-10 h-22 sm:h-28 landscape:h-18 bg-white hover:bg-indigo-50 active:bg-indigo-200 text-slate-800 rounded-b-md border-r border-slate-300 flex flex-col justify-end items-center pb-1.5 transition-all active:scale-[0.98] shadow-xs group focus:outline-none touch-manipulation"
              >
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  {k.name}
                </span>
              </button>
            ))}
          </div>

          {/* Black Keys */}
          {blackKeys.map((bk) => {
            const octIndex = bk.octave - startOctave;
            const leftPos = getBlackKeyOffsetLeft(octIndex, bk.step);

            return (
              <button
                key={`black-${bk.midi}`}
                type="button"
                onClick={() => handleKeyClick(bk)}
                style={{ left: `${leftPos + 6}px` }}
                className="absolute top-1.5 w-5 sm:w-6 h-14 sm:h-18 landscape:h-11 bg-gradient-to-b from-slate-950 to-slate-800 hover:from-indigo-900 hover:to-indigo-950 active:from-indigo-800 active:to-indigo-900 text-slate-100 rounded-b-md border border-slate-900 shadow-md flex flex-col justify-end items-center pb-1 transition-all active:scale-95 z-10 focus:outline-none touch-manipulation"
              >
                <span className="text-[7px] sm:text-[8px] font-bold text-indigo-300">
                  {bk.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
