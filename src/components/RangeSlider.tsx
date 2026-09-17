import React from 'react';
import { ClefType, NoteNaming } from '../types';
import { CLEF_CONFIGS, createNoteFromDiatonic, formatNoteName } from '../utils/musicTheory';
import { StaffRenderer } from './StaffRenderer';
import { ArrowLeftRight, ChevronLeft, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react';

interface RangeSliderProps {
  clef: ClefType;
  minDiatonic: number;
  maxDiatonic: number;
  naming: NoteNaming;
  onChangeRange: (newMin: number, newMax: number) => void;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  clef,
  minDiatonic,
  maxDiatonic,
  naming,
  onChangeRange,
}) => {
  const clefInfo = CLEF_CONFIGS[clef];

  // Absolute boundaries allowed for practice:
  // Usually from 2-3 ledger lines below to 2-3 ledger lines above
  // Bottom line diatonic is clefInfo.bottomLineDiatonic.
  // Lower limit: bottomLine - 7 (e.g. for Treble E4=30, min is 23 ~ F3)
  // Upper limit: bottomLine + 15 (e.g. for Treble E4=30, max is 45 ~ C6)
  const absoluteMin = clefInfo.bottomLineDiatonic - 8;
  const absoluteMax = clefInfo.bottomLineDiatonic + 16;
  const totalSteps = absoluteMax - absoluteMin;

  const minPercent = ((minDiatonic - absoluteMin) / totalSteps) * 100;
  const maxPercent = ((maxDiatonic - absoluteMin) / totalSteps) * 100;

  const lowestNote = createNoteFromDiatonic(minDiatonic, 'natural');
  const highestNote = createNoteFromDiatonic(maxDiatonic, 'natural');

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (val < maxDiatonic) {
      onChangeRange(val, maxDiatonic);
    }
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (val > minDiatonic) {
      onChangeRange(minDiatonic, val);
    }
  };

  // Preset ranges
  const applyPreset = (preset: 'octave' | 'staff' | 'extended' | 'full') => {
    const base = clefInfo.bottomLineDiatonic;
    switch (preset) {
      case 'octave':
        // 1 octave around middle
        onChangeRange(base - 2, base + 5);
        break;
      case 'staff':
        // Exactly on the 5 lines (offset 0 to 8)
        onChangeRange(base, base + 8);
        break;
      case 'extended':
        // Staff + 2 ledger lines each side
        onChangeRange(base - 4, base + 12);
        break;
      case 'full':
        onChangeRange(absoluteMin, absoluteMax);
        break;
    }
  };

  return (
    <div className="bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base flex items-center gap-2">
              Amplitude des notes (Curseur bilatéral)
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-200">
              Délimitez la note la plus grave et la plus aiguë à travailler
            </p>
          </div>
        </div>

        {/* Amplitude count badge */}
        <div className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-600">
          {maxDiatonic - minDiatonic + 1} notes actives
        </div>
      </div>

      {/* Range Badges with Mini Steppers */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Min Note Box */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-200 block">
              Note la plus grave
            </span>
            <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 flex items-baseline gap-1">
              <span>{formatNoteName(lowestNote, naming, false)}</span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                octave {lowestNote.octave}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => minDiatonic > absoluteMin && onChangeRange(minDiatonic - 1, maxDiatonic)}
              disabled={minDiatonic <= absoluteMin}
              className="p-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 disabled:opacity-30 border border-slate-200 dark:border-slate-700"
              title="Note plus grave"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => minDiatonic + 1 < maxDiatonic && onChangeRange(minDiatonic + 1, maxDiatonic)}
              disabled={minDiatonic + 1 >= maxDiatonic}
              className="p-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 disabled:opacity-30 border border-slate-200 dark:border-slate-700"
              title="Note plus aiguë"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Max Note Box */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-200 block">
              Note la plus aiguë
            </span>
            <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 flex items-baseline gap-1">
              <span>{formatNoteName(highestNote, naming, false)}</span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                octave {highestNote.octave}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => maxDiatonic - 1 > minDiatonic && onChangeRange(minDiatonic, maxDiatonic - 1)}
              disabled={maxDiatonic - 1 <= minDiatonic}
              className="p-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 disabled:opacity-30 border border-slate-200 dark:border-slate-700"
              title="Note moins aiguë"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => maxDiatonic < absoluteMax && onChangeRange(minDiatonic, maxDiatonic + 1)}
              disabled={maxDiatonic >= absoluteMax}
              className="p-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 disabled:opacity-30 border border-slate-200 dark:border-slate-700"
              title="Note plus aiguë"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dual Slider Track */}
      <div className="relative pt-3 pb-6 px-1">
        {/* Background Track */}
        <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full relative overflow-hidden">
          {/* Active Highlight Range */}
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
            style={{
              left: `${minPercent}%`,
              width: `${Math.max(2, maxPercent - minPercent)}%`,
            }}
          />
        </div>

        {/* Min Input Slider */}
        <input
          type="range"
          min={absoluteMin}
          max={absoluteMax}
          value={minDiatonic}
          onChange={handleMinSliderChange}
          className="absolute top-2 w-full h-2.5 bg-transparent appearance-none pointer-events-none z-20 focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing"
          aria-label="Note minimale grave"
        />

        {/* Max Input Slider */}
        <input
          type="range"
          min={absoluteMin}
          max={absoluteMax}
          value={maxDiatonic}
          onChange={handleMaxSliderChange}
          className="absolute top-2 w-full h-2.5 bg-transparent appearance-none pointer-events-none z-20 focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing"
          aria-label="Note maximale aiguë"
        />

        <div className="flex justify-between text-[11px] text-slate-700 dark:text-slate-200 font-mono mt-3">
          <span>Grave</span>
          <span className="text-slate-600 dark:text-slate-300">Portée 5 lignes</span>
          <span>Aigu</span>
        </div>
      </div>

      {/* Staff Visual Preview of the Selected Amplitude */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
          <span>Aperçu de l'amplitude sur la portée :</span>
          <span className="text-[11px] text-indigo-500 font-normal">De {formatNoteName(lowestNote, naming)} à {formatNoteName(highestNote, naming)}</span>
        </div>
        <div className="max-w-md mx-auto">
          <StaffRenderer
            clef={clef}
            notes={[lowestNote, highestNote]}
            activeIndex={-1}
            naming={naming}
            showNoteNames={true}
            height={130}
          />
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 mr-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Préréglages :
        </span>
        <button
          type="button"
          onClick={() => applyPreset('octave')}
          className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors border border-slate-200/60 dark:border-slate-700"
        >
          1 Octave (Simple)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('staff')}
          className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors border border-slate-200/60 dark:border-slate-700"
        >
          Portée (5 lignes)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('extended')}
          className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors border border-slate-200/60 dark:border-slate-700"
        >
          Lignes supplémentaires
        </button>
        <button
          type="button"
          onClick={() => applyPreset('full')}
          className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors border border-slate-200/60 dark:border-slate-700"
        >
          Amplitude maximale
        </button>
      </div>
    </div>
  );
};
