import React from 'react';
import { ClefType, PlayMode, NoteNaming, ScalePreset, Accidental, NoteStatsMap } from '../types';
import { CLEF_CONFIGS, SCALE_PRESETS } from '../utils/musicTheory';
import { RangeSlider } from './RangeSlider';
import { ScaleSelector } from './ScaleSelector';
import { StatsView } from './StatsView';
import {
  X,
  Sliders,
  Music,
  Clock,
  Settings,
  Sparkles,
  Zap,
  Gauge,
  Flame,
  Volume2,
  VolumeX,
  Keyboard,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  Layers,
  BarChart3,
} from 'lucide-react';

export type SettingsTab = 'clef_scale' | 'range' | 'mode' | 'stats' | 'preferences';

interface SettingsMenuModalProps {
  isOpen: boolean;
  activeTab: SettingsTab;
  onClose: () => void;
  onChangeTab: (tab: SettingsTab) => void;

  // Clef & Scales
  clef: ClefType;
  onChangeClef: (clef: ClefType) => void;
  dualClefEnabled?: boolean;
  onToggleDualClef?: () => void;
  secondaryClef?: ClefType;
  onChangeSecondaryClef?: (clef: ClefType) => void;

  selectedScaleId: string;
  onSelectScale: (preset: ScalePreset) => void;
  allowedSteps: number[];
  onChangeAllowedSteps: (steps: number[]) => void;
  keySignature: { [step: number]: Accidental };
  onChangeKeySignature: (sig: { [step: number]: Accidental }) => void;

  // Range
  minDiatonic: number;
  maxDiatonic: number;
  onChangeRange: (min: number, max: number) => void;
  minDiatonic2?: number;
  maxDiatonic2?: number;
  onChangeRange2?: (min: number, max: number) => void;

  // Mode & Scrolling
  playMode: PlayMode;
  onChangePlayMode: (mode: PlayMode) => void;
  baseTempo: number;
  onChangeBaseTempo: (tempo: number) => void;
  adaptiveScrolling: boolean;
  onToggleAdaptive: () => void;
  notesCount: number;
  onChangeNotesCount: (count: number) => void;

  // Statistics
  stats: NoteStatsMap;
  onClearStats: () => void;
  focusWeakNotes?: boolean;
  onToggleFocusWeakNotes?: () => void;
  weakNotesThreshold?: number;
  onChangeWeakNotesThreshold?: (threshold: number) => void;

  // Preferences
  naming: NoteNaming;
  onChangeNaming: (naming: NoteNaming) => void;
  inputView: 'both' | 'pads' | 'piano';
  onChangeInputView: (view: 'both' | 'pads' | 'piano') => void;
  showNoteHint: boolean;
  onToggleNoteHint: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetScore: () => void;
}

export const SettingsMenuModal: React.FC<SettingsMenuModalProps> = ({
  isOpen,
  activeTab,
  onClose,
  onChangeTab,
  clef,
  onChangeClef,
  dualClefEnabled = false,
  onToggleDualClef,
  secondaryClef = 'bass',
  onChangeSecondaryClef,
  selectedScaleId,
  onSelectScale,
  allowedSteps,
  onChangeAllowedSteps,
  keySignature,
  onChangeKeySignature,
  minDiatonic,
  maxDiatonic,
  onChangeRange,
  minDiatonic2,
  maxDiatonic2,
  onChangeRange2,
  playMode,
  onChangePlayMode,
  baseTempo,
  onChangeBaseTempo,
  adaptiveScrolling,
  onToggleAdaptive,
  notesCount,
  onChangeNotesCount,
  stats,
  onClearStats,
  focusWeakNotes,
  onToggleFocusWeakNotes,
  weakNotesThreshold,
  onChangeWeakNotesThreshold,
  naming,
  onChangeNaming,
  inputView,
  onChangeInputView,
  showNoteHint,
  onToggleNoteHint,
  soundEnabled,
  onToggleSound,
  onResetScore,
}) => {
  if (!isOpen) return null;

  const clefs: { type: ClefType; label: string; symbol: string; desc: string }[] = [
    {
      type: 'treble',
      label: 'Clef de Sol (2ème ligne)',
      symbol: '𝄞',
      desc: 'Pour piano (main droite), violon, flûte, guitare...',
    },
    {
      type: 'bass',
      label: 'Clef de Fa (4ème ligne)',
      symbol: '𝄢',
      desc: 'Pour piano (main gauche), violoncelle, basse, trombone...',
    },
    {
      type: 'alto',
      label: "Clef d'Ut 3ème ligne",
      symbol: '𝄡',
      desc: "Clef de l'alto et du violon alto...",
    },
    {
      type: 'tenor',
      label: "Clef d'Ut 4ème ligne",
      symbol: '𝄡',
      desc: 'Pour violoncelle aigu, basson, trombone ténor...',
    },
  ];

  const playModes: { id: PlayMode; title: string; desc: string; icon: string }[] = [
    {
      id: 'scrolling',
      title: 'Partition Défilante Adaptative',
      desc: 'Défilement en continu avec auto-freinage pour vous laisser le temps de lire',
      icon: '🎼',
    },
    {
      id: 'timed_sprint',
      title: 'Sprint 60 Secondes',
      desc: 'Déchiffrez le maximum de notes avant la fin du chrono',
      icon: '⏱️',
    },
    {
      id: 'timed_challenge',
      title: 'Défi 30 Notes',
      desc: 'Terminez 30 notes avec la meilleure précision et rapidité',
      icon: '🎯',
    },
    {
      id: 'survival',
      title: 'Mode Survie (3 Vies)',
      desc: 'Trois erreurs maximum permises pour tester votre régularité',
      icon: '❤️',
    },
    {
      id: 'static',
      title: 'Entraînement Libre',
      desc: 'Pas de chrono ni de pression, idéal pour débuter',
      icon: '📖',
    },
  ];

  const tempoNames = ['', 'Lent (65 px/s)', 'Modéré (110 px/s)', 'Rapide (160 px/s)', 'Virtuose (230 px/s)'];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">
              {activeTab === 'clef_scale' && '🎼 Clef & Gammes'}
              {activeTab === 'range' && '📏 Étendue des Notes'}
              {activeTab === 'mode' && '⏱️ Mode de Jeu & Vitesse'}
              {activeTab === 'stats' && '📊 Statistiques & Maîtrise des Notes'}
              {activeTab === 'preferences' && '⚙️ Options & Affichage'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => onChangeTab('clef_scale')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'clef_scale'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Clefs & Gammes</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('range')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'range'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Étendue</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('mode')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'mode'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Mode & Vitesse</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('stats')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'stats'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistiques</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('preferences')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'preferences'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Options</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: CLEF & SCALES */}
          {activeTab === 'clef_scale' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Dual Clef (Grand Staff) option card */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-serif text-lg font-bold border border-amber-500/30 shrink-0">
                      𝄞+𝄢
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>Entraîner deux clefs simultanées (Grand Staff)</span>
                        {dualClefEnabled && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                            Actif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Affiche deux portées en parallèle dans le mode défilement continu (ex: main droite et main gauche de piano).
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={onToggleDualClef}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      dualClefEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        dualClefEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sub-selectors if dual clef is enabled */}
                {dualClefEnabled && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Clef 1 */}
                      <div>
                        <label className="text-xs font-bold text-indigo-300 mb-1.5 block">
                          Clef 1 (Portée du haut) :
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {clefs.map((c) => (
                            <button
                              key={`c1-${c.type}`}
                              type="button"
                              onClick={() => onChangeClef(c.type)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                                clef === c.type
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                              }`}
                            >
                              <span className="font-serif text-base">{c.symbol}</span>
                              <span>
                                {c.type === 'treble' ? 'Sol' : c.type === 'bass' ? 'Fa' : c.type === 'alto' ? 'Ut 3' : 'Ut 4'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Clef 2 */}
                      <div>
                        <label className="text-xs font-bold text-amber-300 mb-1.5 block">
                          Clef 2 (Portée du bas) :
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {clefs.map((c) => (
                            <button
                              key={`c2-${c.type}`}
                              type="button"
                              onClick={() => onChangeSecondaryClef?.(c.type)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                                secondaryClef === c.type
                                  ? 'bg-amber-600 border-amber-500 text-white'
                                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                              }`}
                            >
                              <span className="font-serif text-base">{c.symbol}</span>
                              <span>
                                {c.type === 'treble' ? 'Sol' : c.type === 'bass' ? 'Fa' : c.type === 'alto' ? 'Ut 3' : 'Ut 4'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick Pair Presets */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                        Combinaisons classiques recommandées :
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onChangeClef('treble');
                            onChangeSecondaryClef?.('bass');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                        >
                          🎹 Piano classique : Sol + Fa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onChangeClef('treble');
                            onChangeSecondaryClef?.('alto');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                        >
                          🎻 Cordes : Sol + Ut 3 (Alto)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onChangeClef('bass');
                            onChangeSecondaryClef?.('tenor');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                        >
                          🎺 Grave : Fa + Ut 4 (Ténor)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Clef Selection (if single clef mode) */}
              {!dualClefEnabled && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
                    <span>1. Choisir la clef de référence</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {clefs.map((c) => {
                      const isSelected = clef === c.type;
                      return (
                        <button
                          key={c.type}
                          type="button"
                          onClick={() => onChangeClef(c.type)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                              : 'bg-slate-800/60 border-slate-700 hover:border-slate-600 text-slate-300'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-900 text-indigo-400 flex items-center justify-center font-serif text-2xl font-bold shrink-0">
                            {c.symbol}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm flex items-center justify-between">
                              <span>{c.label}</span>
                              {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                            </div>
                            <div className="text-xs text-slate-400 truncate">{c.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Scale Selector */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
                  <span>2. Gammes, tonalités & altérations</span>
                </h3>
                <ScaleSelector
                  selectedScaleId={selectedScaleId}
                  onSelectScale={onSelectScale}
                  allowedSteps={allowedSteps}
                  onChangeAllowedSteps={onChangeAllowedSteps}
                  keySignature={keySignature}
                  onChangeKeySignature={onChangeKeySignature}
                  naming={naming}
                  focusWeakNotes={focusWeakNotes}
                  onToggleFocusWeakNotes={onToggleFocusWeakNotes}
                  weakNotesThreshold={weakNotesThreshold}
                  onChangeWeakNotesThreshold={onChangeWeakNotesThreshold}
                  stats={stats}
                  currentClef={clef}
                  minDiatonic={minDiatonic}
                  maxDiatonic={maxDiatonic}
                />
              </div>
            </div>
          )}

          {/* TAB 2: RANGE / AMPLITUDE */}
          {activeTab === 'range' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-1">
                  Zone de lecture {dualClefEnabled ? 'Clef 1 (Haut)' : ''}
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  Définissez la note la plus grave et la plus aiguë pour la clef de{' '}
                  {clef === 'treble' ? 'Sol' : clef === 'bass' ? 'Fa' : clef === 'alto' ? 'Ut 3' : 'Ut 4'}.
                </p>
                <RangeSlider
                  clef={clef}
                  minDiatonic={minDiatonic}
                  maxDiatonic={maxDiatonic}
                  naming={naming}
                  onChangeRange={onChangeRange}
                />
              </div>

              {/* Second Clef Range Slider if Dual Clef is enabled */}
              {dualClefEnabled && onChangeRange2 && minDiatonic2 !== undefined && maxDiatonic2 !== undefined && (
                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-1">
                    Zone de lecture Clef 2 (Bas)
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    Définissez la note la plus grave et la plus aiguë pour la clef de{' '}
                    {secondaryClef === 'treble'
                      ? 'Sol'
                      : secondaryClef === 'bass'
                      ? 'Fa'
                      : secondaryClef === 'alto'
                      ? 'Ut 3'
                      : 'Ut 4'}
                    .
                  </p>
                  <RangeSlider
                    clef={secondaryClef}
                    minDiatonic={minDiatonic2}
                    maxDiatonic={maxDiatonic2}
                    naming={naming}
                    onChangeRange={onChangeRange2}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GAME MODE & SPEED */}
          {activeTab === 'mode' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Modes Selection */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-3">
                  Mode de déchiffrage
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {playModes.map((m) => {
                    const isSelected = playMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onChangePlayMode(m.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-600 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm flex items-center gap-1.5">
                            <span>{m.icon}</span>
                            <span>{m.title}</span>
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                        </div>
                        <p className="text-xs text-slate-400">{m.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrolling Parameters (Visible if Scrolling mode) */}
              {playMode === 'scrolling' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-indigo-400" />
                    <span>Paramètres du défilement continu</span>
                  </h4>

                  {/* Adaptive Speed Toggle */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Vitesse adaptative automatique</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        La partition ralentit à l'approche de la note et attend sans jamais vous perdre si vous avez besoin de temps.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleAdaptive}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        adaptiveScrolling ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          adaptiveScrolling ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Base Tempo Slider */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">Vitesse de base de défilement :</span>
                      <span className="text-indigo-400">{tempoNames[baseTempo]}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => onChangeBaseTempo(speed)}
                          className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            baseTempo === speed
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {speed === 1 ? 'Lent' : speed === 2 ? 'Modéré' : speed === 3 ? 'Rapide' : 'Virtuose'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Count Slider (For static modes) */}
              {playMode !== 'scrolling' && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-200">
                    <span>Nombre de notes affichées en même temps sur la portée :</span>
                    <span className="text-indigo-400 text-sm font-mono font-black">{notesCount} note(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => onChangeNotesCount(cnt)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          notesCount === cnt
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STATISTIQUES */}
          {activeTab === 'stats' && (
            <StatsView
              stats={stats}
              currentClef={clef}
              naming={naming}
              onClearStats={onClearStats}
            />
          )}

          {/* TAB 5: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Naming (Do Ré Mi vs C D E) */}
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-200">Système de notation des notes</div>
                  <div className="text-xs text-slate-400">Do, Ré, Mi... (Latin) ou C, D, E... (Anglo-saxon)</div>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => onChangeNaming('latin')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                      naming === 'latin' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Do-Ré-Mi
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeNaming('anglo')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                      naming === 'anglo' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    C-D-E
                  </button>
                </div>
              </div>

              {/* Input view controller */}
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-200">Interface de réponse préférée</div>
                  <div className="text-xs text-slate-400">Boutons simples ou touches de piano</div>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => onChangeInputView('pads')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                      inputView === 'pads' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Boutons
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeInputView('piano')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                      inputView === 'piano' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Piano
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeInputView('both')}
                    className={`hidden sm:inline px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                      inputView === 'both' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Les deux
                  </button>
                </div>
              </div>

              {/* Beginner note hint */}
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    {showNoteHint ? <Eye className="w-4 h-4 text-indigo-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                    <span>Aide débutant (Nom des notes affiché)</span>
                  </div>
                  <div className="text-xs text-slate-400">Affiche le nom de la note pour vous aider à débuter</div>
                </div>
                <button
                  type="button"
                  onClick={onToggleNoteHint}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showNoteHint ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      showNoteHint ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Audio Sound */}
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    <span>Effets sonores & Piano audio</span>
                  </div>
                  <div className="text-xs text-slate-400">Joue la note exacte au piano acoustique lors de la réponse</div>
                </div>
                <button
                  type="button"
                  onClick={onToggleSound}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soundEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Reset Game Score */}
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-rose-300">Réinitialiser la partie</div>
                  <div className="text-xs text-slate-400">Remet les scores, séries et compteurs à zéro</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onResetScore();
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            Appliquer & Reprendre
          </button>
        </div>
      </div>
    </div>
  );
};
