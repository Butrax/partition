import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameScore, PlayMode } from '../types';
import { Trophy, Zap, Clock, RotateCcw, Award, CheckCircle2, XCircle } from 'lucide-react';

interface GameResultModalProps {
  mode: PlayMode;
  score: GameScore;
  onRestart: () => void;
  onClose: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  mode,
  score,
  onRestart,
  onClose,
}) => {
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  useEffect(() => {
    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore in environments without canvas
    }
  }, []);

  const getModeTitle = () => {
    switch (mode) {
      case 'timed_sprint':
        return 'Sprint 60 Secondes Terminé !';
      case 'timed_challenge':
        return 'Défi 30 Notes Réussi !';
      case 'survival':
        return 'Fin de Partie - Mode Survie';
      default:
        return 'Session Terminée';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full shadow-2xl text-center">
        {/* Trophy icon header */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 ring-8 ring-amber-50 dark:ring-amber-950/30">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {getModeTitle()}
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
          Superbe travail de lecture et de déchiffrage musical !
        </p>

        {/* Big Score Stats Grid */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-xs text-slate-700 dark:text-slate-200 font-medium block">Précision</span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
              {accuracy}%
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-300">
              {score.correct} / {score.total}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-xs text-slate-700 dark:text-slate-200 font-medium block">Série Max</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              🔥 {score.maxStreak}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-300">combo</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-xs text-slate-700 dark:text-slate-200 font-medium block">Points</span>
            <span className="text-xl font-black text-amber-500">
              {score.points}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-300">score</span>
          </div>
        </div>

        {/* Time stats */}
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300 mb-6 bg-slate-100 dark:bg-slate-900/40 py-2 rounded-xl">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span>Temps écoulé : {Math.round(score.elapsedTime)} secondes</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Rejouer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
