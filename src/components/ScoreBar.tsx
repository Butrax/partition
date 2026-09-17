import React from 'react';
import { PlayMode, GameScore } from '../types';
import { Flame, Clock, Heart, Target, RotateCcw } from 'lucide-react';

interface ScoreBarProps {
  playMode: PlayMode;
  score: GameScore;
  timeRemaining?: number;
  totalChallengeNotes?: number;
  onResetScore: () => void;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({
  playMode,
  score,
  timeRemaining = 60,
  totalChallengeNotes = 30,
  onResetScore,
}) => {
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 100;

  return (
    <div className="w-full flex items-center justify-between gap-2 px-1 text-xs select-none">
      {/* Left side: Game Specific Status */}
      <div className="flex items-center gap-2">
        {/* Mode Sprint Countdown */}
        {playMode === 'timed_sprint' && (
          <div className="flex items-center gap-1.5 bg-amber-500/15 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span className="font-mono font-black text-sm">{timeRemaining}s</span>
            <span className="text-[10px] uppercase font-semibold hidden xs:inline">restantes</span>
          </div>
        )}

        {/* Challenge Progress */}
        {playMode === 'timed_challenge' && (
          <div className="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-black text-sm">
              {score.correct}/{totalChallengeNotes}
            </span>
            <span className="text-[10px] uppercase font-semibold hidden xs:inline">notes</span>
          </div>
        )}

        {/* Survival Lives */}
        {playMode === 'survival' && (
          <div className="flex items-center gap-1 bg-rose-500/15 px-2 py-0.5 rounded-lg border border-rose-500/30">
            {[1, 2, 3].map((life) => (
              <Heart
                key={`life-${life}`}
                className={`w-3.5 h-3.5 transition-all ${
                  (score.lives ?? 3) >= life
                    ? 'text-rose-500 fill-rose-500 scale-100'
                    : 'text-slate-600 scale-75'
                }`}
              />
            ))}
          </div>
        )}

        {/* Streak Combo */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700/60 font-semibold">
          <Flame
            className={`w-3.5 h-3.5 ${
              score.streak > 3 ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-slate-400'
            }`}
          />
          <span className="text-xs">Série : {score.streak}</span>
        </div>
      </div>

      {/* Right side: Score Points & Accuracy */}
      <div className="flex items-center gap-2">
        <div className="text-slate-400 text-xs hidden sm:inline">
          Précision : <span className="text-slate-200 font-bold">{accuracy}%</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs">
          <span>{score.points} pts</span>
        </div>

        {score.total > 0 && (
          <button
            type="button"
            onClick={onResetScore}
            className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors"
            title="Réinitialiser la partie"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
