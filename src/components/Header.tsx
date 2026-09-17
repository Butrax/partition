import React from 'react';
import { ClefType, PlayMode, NoteNaming } from '../types';
import { CLEF_CONFIGS } from '../utils/musicTheory';
import { SettingsTab } from './SettingsMenuModal';
import {
  Volume2,
  VolumeX,
  Sliders,
  Music,
  Clock,
  Settings,
  Flame,
  RotateCcw,
} from 'lucide-react';

interface HeaderProps {
  clef: ClefType;
  dualClefEnabled?: boolean;
  secondaryClef?: ClefType;
  playMode: PlayMode;
  naming: NoteNaming;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenMenu: (tab: SettingsTab) => void;
  onResetScore: () => void;
  streak: number;
  points: number;
}

export const Header: React.FC<HeaderProps> = ({
  clef,
  dualClefEnabled = false,
  secondaryClef = 'bass',
  playMode,
  naming,
  soundEnabled,
  onToggleSound,
  onOpenMenu,
  onResetScore,
  streak,
  points,
}) => {
  const clefInfo = CLEF_CONFIGS[clef];
  const secClefInfo = CLEF_CONFIGS[secondaryClef];

  const getPlayModeLabel = (mode: PlayMode) => {
    switch (mode) {
      case 'scrolling':
        return 'Défilement';
      case 'timed_sprint':
        return 'Sprint 60s';
      case 'timed_challenge':
        return 'Défi 30';
      case 'survival':
        return 'Survie';
      case 'static':
        return 'Entraînement';
    }
  };

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 px-2.5 sm:px-4 py-1.5 sm:py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-serif text-lg sm:text-xl font-bold shadow-md shadow-indigo-500/20">
            {clefInfo.symbol}
          </div>
          <div className="hidden xs:block">
            <h1 className="font-black text-xs sm:text-sm text-white tracking-tight flex items-center gap-1">
              Lecture de Notes
            </h1>
          </div>
        </div>

        {/* Dedicated Menu Triggers - Clear & Focused */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {/* Menu 1: Clefs & Gammes */}
          <button
            type="button"
            onClick={() => onOpenMenu('clef_scale')}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 hover:border-indigo-500/80 transition-all text-xs font-semibold shadow-xs active:scale-95 touch-manipulation"
            title="Menu Clefs & Gammes (Clef simple ou Grand Staff à 2 clefs)"
          >
            <Music className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline text-slate-400">Clef :</span>
            {dualClefEnabled ? (
              <span className="font-bold text-amber-300 flex items-center gap-0.5">
                <span className="font-serif">{clefInfo.symbol}</span>
                <span>+</span>
                <span className="font-serif">{secClefInfo.symbol}</span>
                <span className="hidden md:inline ml-0.5 text-slate-200">
                  ({clef === 'treble' ? 'Sol' : clef === 'bass' ? 'Fa' : clef === 'alto' ? 'Ut 3' : 'Ut 4'}/
                  {secondaryClef === 'treble' ? 'Sol' : secondaryClef === 'bass' ? 'Fa' : secondaryClef === 'alto' ? 'Ut 3' : 'Ut 4'})
                </span>
              </span>
            ) : (
              <>
                <span className="font-bold text-white font-serif">{clefInfo.symbol}</span>
                <span className="hidden md:inline font-bold">
                  {clef === 'treble' ? 'Sol' : clef === 'bass' ? 'Fa' : clef === 'alto' ? 'Ut 3' : 'Ut 4'}
                </span>
              </>
            )}
          </button>

          {/* Menu 2: Étendue */}
          <button
            type="button"
            onClick={() => onOpenMenu('range')}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 hover:border-indigo-500/80 transition-all text-xs font-semibold shadow-xs active:scale-95 touch-manipulation"
            title="Menu Étendue des Notes (Amplitudes)"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Étendue</span>
          </button>

          {/* Menu 3: Mode de Jeu */}
          <button
            type="button"
            onClick={() => onOpenMenu('mode')}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 hover:border-indigo-500/80 transition-all text-xs font-semibold shadow-xs active:scale-95 touch-manipulation"
            title="Menu Mode de jeu & Vitesse"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="font-bold text-indigo-300">{getPlayModeLabel(playMode)}</span>
          </button>

          {/* Menu 4: Options & Affichage */}
          <button
            type="button"
            onClick={() => onOpenMenu('preferences')}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 hover:border-indigo-500/80 transition-all text-xs font-semibold shadow-xs active:scale-95 touch-manipulation"
            title="Menu Options & Affichage"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">Options</span>
          </button>
        </div>

        {/* Right Quick Controls: Sound & Streak */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg border transition-all touch-manipulation ${
              soundEnabled
                ? 'bg-slate-800 text-indigo-400 border-slate-700 hover:border-indigo-500'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title={soundEnabled ? 'Couper le son' : 'Activer le son'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
