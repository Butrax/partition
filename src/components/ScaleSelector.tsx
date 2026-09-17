import React from 'react';
import { ScalePreset, NoteNaming, Accidental } from '../types';
import { SCALE_PRESETS, LATIN_NOTES, ANGLO_NOTES } from '../utils/musicTheory';
import { Music, Settings2, Check } from 'lucide-react';

interface ScaleSelectorProps {
  selectedScaleId: string;
  onSelectScale: (preset: ScalePreset) => void;
  allowedSteps: number[];
  onChangeAllowedSteps: (steps: number[]) => void;
  keySignature: { [step: number]: Accidental };
  onChangeKeySignature: (sig: { [step: number]: Accidental }) => void;
  naming: NoteNaming;
}

export const ScaleSelector: React.FC<ScaleSelectorProps> = ({
  selectedScaleId,
  onSelectScale,
  allowedSteps,
  onChangeAllowedSteps,
  keySignature,
  onChangeKeySignature,
  naming,
}) => {
  const noteNames = naming === 'latin' ? LATIN_NOTES : ANGLO_NOTES;

  const toggleStep = (step: number) => {
    if (allowedSteps.includes(step)) {
      if (allowedSteps.length > 1) {
        onChangeAllowedSteps(allowedSteps.filter(s => s !== step));
      }
    } else {
      onChangeAllowedSteps([...allowedSteps, step].sort((a, b) => a - b));
    }
  };

  const cycleAccidental = (step: number) => {
    const current = keySignature[step] || 'natural';
    const next: Accidental = current === 'natural' ? 'sharp' : current === 'sharp' ? 'flat' : 'natural';
    const newSig = { ...keySignature };
    if (next === 'natural') {
      delete newSig[step];
    } else {
      newSig[step] = next;
    }
    onChangeKeySignature(newSig);
  };

  const isCustom = selectedScaleId === 'custom';

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
          <Music className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base">
            Gammes & Tonalités (Personnalisables)
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-200">
            Choisissez une gamme pédagogique ou personnalisez les notes et altérations
          </p>
        </div>
      </div>

      {/* Preset Scales Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {SCALE_PRESETS.map((preset) => {
          const isSelected = preset.id === selectedScaleId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectScale(preset)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm truncate">{preset.name}</span>
                {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 line-clamp-1">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Custom Note and Accidental matrix */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
            Notes actives dans la gamme ({allowedSteps.length}/7) :
          </span>
          <span className="text-[11px] text-slate-600 dark:text-slate-300">
            Cliquez sur le badge pour activer la note, sur l'altération pour changer (♮ / ♯ / ♭)
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {noteNames.map((name, step) => {
            const isIncluded = allowedSteps.includes(step);
            const acc = keySignature[step] || 'natural';
            const accSymbol = acc === 'sharp' ? '♯' : acc === 'flat' ? '♭' : '♮';

            return (
              <div
                key={`custom-step-${step}`}
                className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                  isIncluded
                    ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 opacity-40 bg-slate-100 dark:bg-slate-900'
                }`}
              >
                {/* Note Toggle Check */}
                <button
                  type="button"
                  onClick={() => toggleStep(step)}
                  className={`w-full py-1 rounded-md text-xs font-bold transition-colors ${
                    isIncluded
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-400 line-through'
                  }`}
                >
                  {name}
                </button>

                {/* Accidental modifier cycle button */}
                <button
                  type="button"
                  onClick={() => cycleAccidental(step)}
                  disabled={!isIncluded}
                  title="Cliquer pour changer l'altération (Bécarre, Dièse, Bémol)"
                  className="mt-1 px-2 py-0.5 rounded text-xs font-serif font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  {accSymbol}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
