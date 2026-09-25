import React, { useMemo } from 'react';
import { ScalePreset, NoteNaming, Accidental, NoteStatsMap, ClefType } from '../types';
import { SCALE_PRESETS, LATIN_NOTES, ANGLO_NOTES } from '../utils/musicTheory';
import { Music, Settings2, Check, Target, Dices, Sliders } from 'lucide-react';

interface ScaleSelectorProps {
  selectedScaleId: string;
  onSelectScale: (preset: ScalePreset) => void;
  allowedSteps: number[];
  onChangeAllowedSteps: (steps: number[]) => void;
  keySignature: { [step: number]: Accidental };
  onChangeKeySignature: (sig: { [step: number]: Accidental }) => void;
  naming: NoteNaming;
  focusWeakNotes?: boolean;
  onToggleFocusWeakNotes?: () => void;
  weakNotesThreshold?: number;
  onChangeWeakNotesThreshold?: (threshold: number) => void;
  stats?: NoteStatsMap;
  currentClef?: ClefType;
  minDiatonic?: number;
  maxDiatonic?: number;
}

export const ScaleSelector: React.FC<ScaleSelectorProps> = ({
  selectedScaleId,
  onSelectScale,
  allowedSteps,
  onChangeAllowedSteps,
  keySignature,
  onChangeKeySignature,
  naming,
  focusWeakNotes = false,
  onToggleFocusWeakNotes,
  weakNotesThreshold = 70,
  onChangeWeakNotesThreshold,
  stats,
  currentClef = 'treble',
  minDiatonic,
  maxDiatonic,
}) => {
  const noteNames = naming === 'latin' ? LATIN_NOTES : ANGLO_NOTES;
  const effectiveThreshold = weakNotesThreshold ?? 70;

  // Compute breakdown of notes in current scale/range with the custom threshold
  const { unattemptedCount, weakCount, masteredCount, totalScaleNotes } = useMemo(() => {
    if (minDiatonic === undefined || maxDiatonic === undefined || !stats) {
      return { unattemptedCount: 0, weakCount: 0, masteredCount: 0, totalScaleNotes: 0 };
    }
    let unattempted = 0;
    let weak = 0;
    let mastered = 0;

    for (let d = minDiatonic; d <= maxDiatonic; d++) {
      const step = ((d % 7) + 7) % 7;
      if (allowedSteps.includes(step)) {
        const acc = keySignature[step] || 'natural';
        const key = `${currentClef}_${d}_${acc}`;
        const stat = stats[key];
        if (!stat || stat.attempts === 0) {
          unattempted++;
        } else {
          const successRate = (stat.correct / stat.attempts) * 100;
          if (successRate < effectiveThreshold) {
            weak++;
          } else {
            mastered++;
          }
        }
      }
    }

    return {
      unattemptedCount: unattempted,
      weakCount: weak,
      masteredCount: mastered,
      totalScaleNotes: unattempted + weak + mastered,
    };
  }, [minDiatonic, maxDiatonic, allowedSteps, keySignature, currentClef, stats, effectiveThreshold]);

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

      {/* Adaptive Weak Notes Focusing Option */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {focusWeakNotes ? (
                  <Target className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                ) : (
                  <Dices className="w-4 h-4 text-indigo-500 shrink-0" />
                )}
                <span>Cibler les notes fragiles ou jamais rencontrées</span>
              </span>

              {focusWeakNotes ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  🎯 Adaptatif actif
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  🎲 Tirage 100% aléatoire
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {focusWeakNotes
                ? "Augmente automatiquement la fréquence d'apparition des notes les moins bien maîtrisées (ou jamais encore proposées) pour accélérer vos progrès."
                : "Option non cochée : les notes sont proposées strictement au hasard de façon équitable."}
            </p>

            {/* Range notes summary indicators */}
            {stats && (
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  État de la gamme actuelle :
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {unattemptedCount} jamais proposée{unattemptedCount > 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {weakCount} sous {effectiveThreshold}%
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {masteredCount} réussie{masteredCount > 1 ? 's' : ''} (≥ {effectiveThreshold}%)
                </span>
              </div>
            )}
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center sm:self-center shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={focusWeakNotes}
              onClick={onToggleFocusWeakNotes}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                focusWeakNotes ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              title={
                focusWeakNotes
                  ? "Désactiver le ciblage adaptatif (repasser à 100% au hasard)"
                  : "Activer le ciblage prioritaire des notes fragiles"
              }
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  focusWeakNotes ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* CURSEUR / SLIDER SEUIL DE RÉUSSITE (Accessible uniquement lorsque l'option est cochée) */}
        {focusWeakNotes && (
          <div className="mt-3 p-4 rounded-xl bg-amber-500/5 dark:bg-slate-900/90 border border-amber-500/30 dark:border-amber-500/30 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <label htmlFor="weak-threshold-slider" className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Curseur de réussite seuil</span>
                  </label>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Définissez le pourcentage de réussite en dessous duquel une note doit être proposée
                  </p>
                </div>
              </div>

              {/* Current Value Pill */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Seuil retenu :
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-xs tabular-nums flex items-center gap-1">
                  <span>&lt; {effectiveThreshold}%</span>
                  <span className="text-[10px] font-bold opacity-80">de réussite</span>
                </span>
              </div>
            </div>

            {/* Slider track & input */}
            <div className="space-y-1.5 pt-1">
              <div className="relative flex items-center">
                <input
                  id="weak-threshold-slider"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={effectiveThreshold}
                  onChange={(e) => onChangeWeakNotesThreshold?.(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  aria-label="Pourcentage de réussite en dessous duquel une note doit être proposée"
                />
              </div>

              {/* Graduation markers */}
              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 px-0.5 font-semibold">
                <span>10% (très exigeant)</span>
                <span>30%</span>
                <span>50%</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 underline decoration-2 decoration-amber-500 underline-offset-2">
                  70% (conseillé)
                </span>
                <span>85%</span>
                <span>100% (toutes)</span>
              </div>
            </div>

            {/* Quick Presets Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mr-1">
                Réglages rapides :
              </span>
              {[
                { value: 50, label: '50% (Grandes difficultés)' },
                { value: 70, label: '70% (Recommandé)' },
                { value: 85, label: '85% (Perfectionnement)' },
                { value: 100, label: '100% (Toutes avec erreurs ou non vues)' },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onChangeWeakNotesThreshold?.(preset.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    effectiveThreshold === preset.value
                      ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-amber-400/60 hover:bg-amber-50 dark:hover:bg-slate-750'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Summary & Live Target Count */}
            <div className="p-3 rounded-lg bg-white/70 dark:bg-slate-950/60 border border-amber-500/20 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                  🎯 Impact sur votre exercice :
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 tabular-nums">
                  {unattemptedCount + weakCount} / {totalScaleNotes} note{totalScaleNotes > 1 ? 's' : ''} éligible{unattemptedCount + weakCount > 1 ? 's' : ''}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                L'exercice proposera <strong>exclusivement</strong> les notes dont le taux de réussite est inférieur à <strong>{effectiveThreshold}%</strong> (ainsi que les notes encore jamais rencontrées). Les notes déjà maîtrisées (≥ {effectiveThreshold}%) sont mises de côté pour focaliser vos efforts.
              </p>

              {/* If no notes are below threshold */}
              {unattemptedCount + weakCount === 0 && totalScaleNotes > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium mt-1">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Bravo ! Toutes les notes de cette sélection affichent déjà un taux ≥ {effectiveThreshold}%. Pour continuer à restreindre le tirage, vous pouvez augmenter le curseur (ex: {Math.min(100, effectiveThreshold + 15)}%) ou vous entraîner sur toute la gamme.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
