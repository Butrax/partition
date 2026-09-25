import React, { useState, useMemo } from 'react';
import { ClefType, NoteNaming, MusicalNote, NoteStatsMap, NoteStat } from '../types';
import {
  CLEF_CONFIGS,
  createNoteFromDiatonic,
  getStaffLineOffset,
  getLedgerLines,
  formatNoteName,
} from '../utils/musicTheory';
import {
  getNoteStatKey,
  getMasteryColor,
  getMasteryBadgeClass,
  clearNoteStatsFromStorage,
} from '../utils/storage';
import {
  BarChart3,
  Sparkles,
  Zap,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Award,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

interface StatsViewProps {
  stats: NoteStatsMap;
  currentClef: ClefType;
  naming: NoteNaming;
  onClearStats: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  stats,
  currentClef,
  naming,
  onClearStats,
}) => {
  const [selectedClef, setSelectedClef] = useState<ClefType | 'grand'>(currentClef);
  const [selectedNoteKey, setSelectedNoteKey] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  // Clefs configuration list
  const clefTabs: { id: ClefType | 'grand'; label: string; symbol: string }[] = [
    { id: 'treble', label: 'Clef de Sol', symbol: '𝄞' },
    { id: 'bass', label: 'Clef de Fa', symbol: '𝄢' },
    { id: 'alto', label: "Clef d'Ut 3", symbol: '𝄡' },
    { id: 'tenor', label: "Clef d'Ut 4", symbol: '𝄡' },
    { id: 'grand', label: 'Portée Double (Sol + Fa)', symbol: '𝄞+𝄢' },
  ];

  // Range of diatonic notes to display on the staff for each clef
  const notesToDisplay = useMemo(() => {
    if (selectedClef === 'grand') {
      // Treble: C4 (28) to A5 (38)
      const trebleNotes: MusicalNote[] = [];
      for (let d = 28; d <= 38; d++) {
        const note = createNoteFromDiatonic(d, 'natural', `grand_treble_${d}`);
        note.clef = 'treble';
        trebleNotes.push(note);
      }

      // Bass: E2 (16) to C4 (28)
      const bassNotes: MusicalNote[] = [];
      for (let d = 16; d <= 28; d++) {
        const note = createNoteFromDiatonic(d, 'natural', `grand_bass_${d}`);
        note.clef = 'bass';
        bassNotes.push(note);
      }

      return { trebleNotes, bassNotes };
    } else {
      const cfg = CLEF_CONFIGS[selectedClef];
      // Display range: from bottomLine - 3 (3 ledger lines below) to bottomLine + 11 (3 ledger lines above)
      const minD = cfg.defaultMinDiatonic - 1;
      const maxD = cfg.defaultMaxDiatonic + 1;
      const list: MusicalNote[] = [];
      for (let d = minD; d <= maxD; d++) {
        const note = createNoteFromDiatonic(d, 'natural', `stat_${selectedClef}_${d}`);
        note.clef = selectedClef;
        list.push(note);
      }
      return { singleNotes: list };
    }
  }, [selectedClef]);

  // Global KPI metrics
  const globalMetrics = useMemo(() => {
    const allStats: NoteStat[] = Object.values(stats);
    let totalAttempts = 0;
    let totalCorrect = 0;
    let totalErrors = 0;
    let totalTime = 0;
    let masteredCount = 0;
    let inProgressCount = 0;
    let toReviewCount = 0;

    allStats.forEach((s) => {
      totalAttempts += s.attempts;
      totalCorrect += s.correct;
      totalErrors += s.errors;
      totalTime += s.totalReactionTimeMs;

      if (s.attempts > 0) {
        if (s.masteryScore >= 75) masteredCount++;
        else if (s.masteryScore >= 45) inProgressCount++;
        else toReviewCount++;
      }
    });

    const averageReactionSec =
      totalAttempts > 0 ? (totalTime / totalAttempts / 1000).toFixed(2) : '—';
    const accuracyRate =
      totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    // Top mastered notes (attempts >= 1, sorted by masteryScore desc, then reaction time asc)
    const sortedByMastery = [...allStats]
      .filter((s) => s.attempts > 0)
      .sort((a, b) => b.masteryScore - a.masteryScore || a.averageReactionTimeMs - b.averageReactionTimeMs);

    // Top weak notes (notes with errors or lowest score, attempts >= 1)
    const sortedByWeakness = [...allStats]
      .filter((s) => s.attempts > 0 && (s.errors > 0 || s.masteryScore < 65))
      .sort((a, b) => b.errors - a.errors || a.masteryScore - b.masteryScore || b.averageReactionTimeMs - a.averageReactionTimeMs);

    return {
      totalAttempts,
      totalCorrect,
      totalErrors,
      averageReactionSec,
      accuracyRate,
      masteredCount,
      inProgressCount,
      toReviewCount,
      topMastered: sortedByMastery.slice(0, 4),
      topWeak: sortedByWeakness.slice(0, 4),
    };
  }, [stats]);

  // Selected note details
  const selectedNoteStat = useMemo(() => {
    if (!selectedNoteKey) return null;
    return stats[selectedNoteKey] || null;
  }, [selectedNoteKey, stats]);

  // Helper for rendering a single staff line set
  const renderSingleStaff = (
    notes: MusicalNote[],
    clefType: ClefType,
    title?: string
  ) => {
    const lineSpacing = 14;
    const staffCenterY = 75;
    const bottomLineY = staffCenterY + 2 * lineSpacing; // 103

    const width = Math.max(520, notes.length * 38 + 90);
    const height = 155;
    const startX = 70;
    const spacing = (width - startX - 30) / Math.max(1, notes.length - 1);

    const clefSymbol = CLEF_CONFIGS[clefType].symbol;

    return (
      <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 pb-1">
        {title && (
          <div className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5 px-2">
            <span className="font-serif text-base text-indigo-400">{clefSymbol}</span>
            <span>{title}</span>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ minWidth: `${width}px` }}
          className="w-full h-auto select-none rounded-xl bg-slate-900/90 border border-slate-800"
        >
          {/* 5 Staff lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = bottomLineY - i * lineSpacing;
            return (
              <line
                key={`line-${clefType}-${i}`}
                x1="20"
                y1={y}
                x2={width - 20}
                y2={y}
                stroke="#475569"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Clef Symbol */}
          <text
            x="38"
            y={
              clefType === 'treble'
                ? staffCenterY + 18
                : clefType === 'bass'
                ? staffCenterY + 12
                : staffCenterY + 10
            }
            fontSize={clefType === 'treble' ? '64' : '56'}
            fontFamily="'Times New Roman', serif"
            className="fill-slate-300 select-none font-bold"
            textAnchor="middle"
          >
            {clefSymbol}
          </text>

          {/* Notes */}
          {notes.map((note, idx) => {
            const x = startX + idx * spacing;
            const lineOffset = getStaffLineOffset(note, clefType);
            const noteY = bottomLineY - lineOffset * (lineSpacing / 2);
            const ledgerLines = getLedgerLines(lineOffset);

            const statKey = getNoteStatKey(clefType, note.diatonicIndex, note.accidental || 'natural');
            const stat = stats[statKey];
            const attempts = stat?.attempts || 0;
            const score = stat?.masteryScore || 0;
            const noteColor = getMasteryColor(score, attempts);

            const isSelected = selectedNoteKey === statKey;
            const stemDown = lineOffset >= 4;
            const stemLength = 32;
            const stemX = stemDown ? x - 6.5 : x + 6.5;
            const stemY2 = stemDown ? noteY + stemLength : noteY - stemLength;

            return (
              <g
                key={note.id}
                onClick={() => setSelectedNoteKey(statKey)}
                className="cursor-pointer group"
              >
                {/* Clickable hit area */}
                <rect
                  x={x - 16}
                  y={noteY - 26}
                  width="32"
                  height="52"
                  fill="transparent"
                />

                {/* Ledger lines */}
                {ledgerLines.map((llOffset) => {
                  const llY = bottomLineY - llOffset * (lineSpacing / 2);
                  return (
                    <line
                      key={`stat-ll-${note.id}-${llOffset}`}
                      x1={x - 15}
                      y1={llY}
                      x2={x + 15}
                      y2={llY}
                      stroke={isSelected ? '#818cf8' : '#64748b'}
                      strokeWidth="1.8"
                    />
                  );
                })}

                {/* Selection Ring */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={noteY}
                    r="15"
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="2.2"
                    strokeDasharray="3 2"
                    className="animate-spin-slow"
                  />
                )}

                {/* Notehead */}
                <ellipse
                  cx={x}
                  cy={noteY}
                  rx="7.5"
                  ry="5.2"
                  transform={`rotate(-22 ${x} ${noteY})`}
                  fill={noteColor}
                  className="transition-transform group-hover:scale-110"
                />

                {/* Stem */}
                <line
                  x1={stemX}
                  y1={noteY}
                  x2={stemX}
                  y2={stemY2}
                  stroke={noteColor}
                  strokeWidth="1.6"
                />

                {/* Note name underneath */}
                <text
                  x={x}
                  y={height - 12}
                  fontSize="10"
                  textAnchor="middle"
                  className={`font-mono font-bold select-none transition-colors ${
                    isSelected ? 'fill-indigo-300' : 'fill-slate-400 group-hover:fill-slate-200'
                  }`}
                >
                  {formatNoteName(note, naming, false)}
                </text>

                {/* Score badge under note */}
                <text
                  x={x}
                  y={height - 2}
                  fontSize="8"
                  textAnchor="middle"
                  fill={noteColor}
                  className="font-bold select-none"
                >
                  {attempts > 0 ? `${score}%` : '—'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header with Clef Selector & Reset Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Cartographie de maîtrise par note</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Couleurs calculées dynamiquement selon la vitesse de réponse et les erreurs. Cliquez sur une note pour inspecter ses statistiques.
          </p>
        </div>

        {/* Action: Clear stats with confirmation */}
        <div className="flex items-center gap-2 shrink-0">
          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 text-xs font-semibold transition-colors"
              title="Effacer toutes les statistiques enregistrées"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser les stats</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-800 p-1 rounded-lg animate-in fade-in">
              <span className="text-[11px] text-rose-300 font-semibold px-1">Confirmer ?</span>
              <button
                type="button"
                onClick={() => {
                  clearNoteStatsFromStorage();
                  onClearStats();
                  setConfirmClear(false);
                  setSelectedNoteKey(null);
                }}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold"
              >
                Oui, effacer
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
              >
                Non
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Clef Selection Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
        {clefTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setSelectedClef(tab.id);
              setSelectedNoteKey(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedClef === tab.id
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <span className="font-serif text-sm">{tab.symbol}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Interactive Musical Staff / Heatmap */}
      <div className="space-y-3">
        {selectedClef === 'grand' ? (
          <div className="space-y-4">
            {renderSingleStaff(
              (notesToDisplay as { trebleNotes: MusicalNote[]; bassNotes: MusicalNote[] }).trebleNotes,
              'treble',
              'Portée supérieure : Clef de Sol (𝄞)'
            )}
            {renderSingleStaff(
              (notesToDisplay as { trebleNotes: MusicalNote[]; bassNotes: MusicalNote[] }).bassNotes,
              'bass',
              'Portée inférieure : Clef de Fa (𝄢)'
            )}
          </div>
        ) : (
          renderSingleStaff(
            (notesToDisplay as { singleNotes: MusicalNote[] }).singleNotes,
            selectedClef as ClefType
          )
        )}

        {/* Continuous Color Legend */}
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Moins maîtrisée (Erreurs & Réaction lente)</span>
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>En progression</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Très maîtrisée (Rapide & Sans faute)</span>
            </span>
          </div>

          {/* Continuous gradient strip */}
          <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 shadow-inner" />

          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <span>Score : 0% - 35%</span>
            <span>36% - 69%</span>
            <span>70% - 100%</span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
              <span>Gris = Pas encore testée</span>
            </span>
          </div>
        </div>
      </div>

      {/* Selected Note Inspector Card */}
      {selectedNoteStat ? (
        <div className="p-4 rounded-xl bg-slate-800/90 border border-indigo-500/50 shadow-lg animate-in zoom-in-95 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-lg"
                style={{
                  backgroundColor: getMasteryColor(
                    selectedNoteStat.masteryScore,
                    selectedNoteStat.attempts
                  ),
                }}
              >
                {selectedNoteStat.clef === 'treble'
                  ? '𝄞'
                  : selectedNoteStat.clef === 'bass'
                  ? '𝄢'
                  : '𝄡'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-base text-white">
                    {createNoteFromDiatonic(
                      selectedNoteStat.diatonicIndex,
                      selectedNoteStat.accidental
                    )
                      ? formatNoteName(
                          createNoteFromDiatonic(
                            selectedNoteStat.diatonicIndex,
                            selectedNoteStat.accidental
                          ),
                          naming,
                          true
                        )
                      : 'Note'}{' '}
                    <span className="text-slate-400 text-sm font-normal">
                      (
                      {formatNoteName(
                        createNoteFromDiatonic(
                          selectedNoteStat.diatonicIndex,
                          selectedNoteStat.accidental
                        ),
                        naming === 'latin' ? 'anglo' : 'latin',
                        true
                      )}
                      )
                    </span>
                  </h4>

                  {/* Badge */}
                  {(() => {
                    const badge = getMasteryBadgeClass(
                      selectedNoteStat.masteryScore,
                      selectedNoteStat.attempts
                    );
                    return (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="text-xs text-slate-400 mt-0.5">
                  Clef :{' '}
                  {selectedNoteStat.clef === 'treble'
                    ? 'Sol (2ème ligne)'
                    : selectedNoteStat.clef === 'bass'
                    ? 'Fa (4ème ligne)'
                    : selectedNoteStat.clef === 'alto'
                    ? "Ut 3ème ligne"
                    : "Ut 4ème ligne"}
                </div>
              </div>
            </div>

            {/* Score & Reaction Gauge */}
            <div className="flex items-center gap-4 bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-700/80">
              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Maîtrise
                </div>
                <div
                  className="text-lg font-black"
                  style={{
                    color: getMasteryColor(
                      selectedNoteStat.masteryScore,
                      selectedNoteStat.attempts
                    ),
                  }}
                >
                  {selectedNoteStat.masteryScore}%
                </div>
              </div>

              <div className="w-px h-8 bg-slate-700" />

              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Temps moyen
                </div>
                <div className="text-lg font-black text-indigo-400 font-mono">
                  {(selectedNoteStat.averageReactionTimeMs / 1000).toFixed(2)}s
                </div>
              </div>

              <div className="w-px h-8 bg-slate-700" />

              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Précision
                </div>
                <div className="text-lg font-black text-emerald-400">
                  {selectedNoteStat.attempts > 0
                    ? `${Math.round(
                        (selectedNoteStat.correct / selectedNoteStat.attempts) * 100
                      )}%`
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown summary row */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs">
            <div className="p-2 rounded-lg bg-slate-900/60 text-center">
              <span className="text-slate-400">Tentatives : </span>
              <span className="font-bold text-white">{selectedNoteStat.attempts}</span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-950/30 text-center text-emerald-300">
              <span>Bonnes : </span>
              <span className="font-bold">{selectedNoteStat.correct}</span>
            </div>
            <div className="p-2 rounded-lg bg-rose-950/30 text-center text-rose-300">
              <span>Erreurs : </span>
              <span className="font-bold">{selectedNoteStat.errors}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span>
            Cliquez sur n'importe quelle note de la portée ci-dessus pour afficher son bilan détaillé (score, temps de réaction exact, erreurs).
          </span>
        </div>
      )}

      {/* Global Performance Summary Cards */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          <span>Bilan global de votre pratique</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-indigo-400" />
              <span>Notes tentées</span>
            </div>
            <div className="text-xl font-black text-white mt-1">
              {globalMetrics.totalAttempts}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {globalMetrics.totalCorrect} correctes ({globalMetrics.accuracyRate}%)
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>Temps de réaction</span>
            </div>
            <div className="text-xl font-black text-indigo-300 font-mono mt-1">
              {globalMetrics.averageReactionSec}s
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Depuis la dernière note</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-400" />
              <span>Notes maîtrisées</span>
            </div>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {globalMetrics.masteredCount}
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">Score ≥ 75%</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>À travailler</span>
            </div>
            <div className="text-xl font-black text-rose-400 mt-1">
              {globalMetrics.toReviewCount}
            </div>
            <div className="text-[10px] text-rose-400/80 mt-0.5">Erreurs ou réflexe lent</div>
          </div>
        </div>
      </div>

      {/* Side-by-Side: Best Mastery vs Focus Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Mastered */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-emerald-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Notes les plus maîtrisées</span>
            </h4>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
              Points forts
            </span>
          </div>

          {globalMetrics.topMastered.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center">
              Déchiffrez quelques notes pour identifier vos points forts !
            </div>
          ) : (
            <div className="space-y-1.5">
              {globalMetrics.topMastered.map((s) => {
                const note = createNoteFromDiatonic(s.diatonicIndex, s.accidental);
                const name = formatNoteName(note, naming, true);
                const clefSym = CLEF_CONFIGS[s.clef].symbol;
                return (
                  <div
                    key={`top-${s.key}`}
                    onClick={() => {
                      setSelectedClef(s.clef);
                      setSelectedNoteKey(s.key);
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 hover:bg-slate-850 border border-slate-700/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base text-emerald-400 font-bold">
                        {clefSym}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-white">{name}</div>
                        <div className="text-[10px] text-slate-400">
                          {s.correct}/{s.attempts} réussites
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-xs text-emerald-400">
                        {s.masteryScore}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {(s.averageReactionTimeMs / 1000).toFixed(2)}s
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Priority Focus Areas (Weakest Notes) */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-rose-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Notes à travailler en priorité</span>
            </h4>
            <span className="text-[10px] text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800">
              Focus entraînement
            </span>
          </div>

          {globalMetrics.topWeak.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center">
              Aucune faiblesse majeure détectée pour l'instant ! Bravo.
            </div>
          ) : (
            <div className="space-y-1.5">
              {globalMetrics.topWeak.map((s) => {
                const note = createNoteFromDiatonic(s.diatonicIndex, s.accidental);
                const name = formatNoteName(note, naming, true);
                const clefSym = CLEF_CONFIGS[s.clef].symbol;
                return (
                  <div
                    key={`weak-${s.key}`}
                    onClick={() => {
                      setSelectedClef(s.clef);
                      setSelectedNoteKey(s.key);
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 hover:bg-slate-850 border border-slate-700/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base text-rose-400 font-bold">
                        {clefSym}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-white">{name}</div>
                        <div className="text-[10px] text-rose-400 font-semibold">
                          {s.errors} erreur{s.errors > 1 ? 's' : ''} sur {s.attempts} essais
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-xs text-rose-400">
                        {s.masteryScore}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {(s.averageReactionTimeMs / 1000).toFixed(2)}s
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
