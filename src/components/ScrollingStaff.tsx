import React, { useState, useEffect, useRef } from 'react';
import { ClefType, MusicalNote, NoteNaming, Accidental } from '../types';
import {
  CLEF_CONFIGS,
  generateRandomNote,
  getStaffLineOffset,
  getLedgerLines,
  formatNoteName,
} from '../utils/musicTheory';
import { Play, Pause, Zap, Gauge, Sparkles } from 'lucide-react';

interface MovingNote {
  note: MusicalNote;
  x: number; // horizontal position in SVG pixels
  hasReachedTarget: boolean;
  popped: boolean;
}

interface ScrollingStaffProps {
  clef: ClefType;
  dualClefEnabled?: boolean;
  secondaryClef?: ClefType;
  minDiatonic: number;
  maxDiatonic: number;
  minDiatonic2?: number;
  maxDiatonic2?: number;
  allowedSteps: number[];
  keySignature: { [step: number]: Accidental };
  naming: NoteNaming;
  showNoteHint?: boolean;
  baseTempo: number; // 1 to 4
  adaptiveScrolling: boolean;
  onActiveNoteChanged: (note: MusicalNote | null) => void;
  activeNoteRef: React.MutableRefObject<MusicalNote | null>;
  successFlash: boolean;
  errorFlash: boolean;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
}

export const ScrollingStaff: React.FC<ScrollingStaffProps> = ({
  clef,
  dualClefEnabled = false,
  secondaryClef = 'bass',
  minDiatonic,
  maxDiatonic,
  minDiatonic2,
  maxDiatonic2,
  allowedSteps,
  keySignature,
  naming,
  showNoteHint = false,
  baseTempo,
  adaptiveScrolling,
  onActiveNoteChanged,
  activeNoteRef,
  successFlash,
  errorFlash,
  isPaused,
  setIsPaused,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const notesQueueRef = useRef<MovingNote[]>([]);
  const [, setFrameCount] = useState(0);

  // Responsive Staff Geometry for Mobile vs Desktop
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const width = isMobile ? 440 : 800;
  const height = dualClefEnabled ? 230 : 170;
  const lineSpacing = dualClefEnabled ? (isMobile ? 11 : 12) : 14;

  const secClef: ClefType = (secondaryClef || 'bass') as ClefType;

  // Single Clef geometry
  const singleStaffCenterY = 85;
  const singleBottomLineY = singleStaffCenterY + 2 * lineSpacing; // 113

  // Dual Clef (Grand Staff) geometry
  const staff1CenterY = 60;
  const staff1BottomLineY = staff1CenterY + 2 * lineSpacing; // 84
  const staff1TopLineY = staff1CenterY - 2 * lineSpacing; // 36

  const staff2CenterY = 165;
  const staff2BottomLineY = staff2CenterY + 2 * lineSpacing; // 189
  const staff2TopLineY = staff2CenterY - 2 * lineSpacing; // 141

  const targetX = isMobile ? 115 : 170; // Reading line position
  const spawnSpacing = isMobile ? 120 : 160; // Distance between consecutive notes

  // Tempo speeds in pixels per second
  const tempoSpeeds = [0, 65, 110, 160, 230]; // index 1..4
  const targetSpeed = tempoSpeeds[baseTempo] || 110;
  const currentSpeedRef = useRef(targetSpeed);

  // Conversion helper for single or dual clef
  const getNoteY = (note: MusicalNote): { noteY: number; lineOffset: number; noteClef: ClefType } => {
    if (dualClefEnabled) {
      const noteClef = note.clef || clef;
      if (noteClef === secClef) {
        const lineOffset = getStaffLineOffset(note, secClef);
        const noteY = staff2BottomLineY - lineOffset * (lineSpacing / 2);
        return { noteY, lineOffset, noteClef };
      } else {
        const lineOffset = getStaffLineOffset(note, clef);
        const noteY = staff1BottomLineY - lineOffset * (lineSpacing / 2);
        return { noteY, lineOffset, noteClef };
      }
    } else {
      const lineOffset = getStaffLineOffset(note, clef);
      const noteY = singleBottomLineY - lineOffset * (lineSpacing / 2);
      return { noteY, lineOffset, noteClef: clef };
    }
  };

  const getLedgerLineY = (llOffset: number, noteClef: ClefType): number => {
    if (dualClefEnabled) {
      const baseBottomY = noteClef === secClef ? staff2BottomLineY : staff1BottomLineY;
      return baseBottomY - llOffset * (lineSpacing / 2);
    } else {
      return singleBottomLineY - llOffset * (lineSpacing / 2);
    }
  };

  // Generate a note according to single or dual clef configuration
  const createNextNote = (): MusicalNote => {
    if (dualClefEnabled) {
      // Pick randomly between clef 1 and clef 2
      const noteClef = Math.random() < 0.5 ? clef : secClef;
      let minD: number;
      let maxD: number;

      if (noteClef === clef) {
        minD = minDiatonic;
        maxD = maxDiatonic;
      } else {
        minD = minDiatonic2 ?? CLEF_CONFIGS[secClef].defaultMinDiatonic;
        maxD = maxDiatonic2 ?? CLEF_CONFIGS[secClef].defaultMaxDiatonic;
      }

      return generateRandomNote(minD, maxD, allowedSteps, keySignature, noteClef);
    } else {
      return generateRandomNote(minDiatonic, maxDiatonic, allowedSteps, keySignature, clef);
    }
  };

  // Populate initial notes queue if empty
  const ensureQueueFilled = () => {
    let lastX =
      notesQueueRef.current.length > 0
        ? notesQueueRef.current[notesQueueRef.current.length - 1].x
        : targetX + spawnSpacing;

    while (notesQueueRef.current.length < 8) {
      const nextNote = createNextNote();
      notesQueueRef.current.push({
        note: nextNote,
        x: Math.max(lastX + spawnSpacing, targetX + (notesQueueRef.current.length === 0 ? 0 : spawnSpacing)),
        hasReachedTarget: false,
        popped: false,
      });
      lastX += spawnSpacing;
    }
  };

  // Sync initial queue
  useEffect(() => {
    notesQueueRef.current = [];
    ensureQueueFilled();
    if (notesQueueRef.current[0]) {
      activeNoteRef.current = notesQueueRef.current[0].note;
      onActiveNoteChanged(notesQueueRef.current[0].note);
    }
  }, [clef, dualClefEnabled, secondaryClef, minDiatonic, maxDiatonic, minDiatonic2, maxDiatonic2, allowedSteps, keySignature, isMobile]);

  // Main 60fps animation loop with Adaptive Speed Deceleration
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const step = (timestamp: number) => {
      const deltaSec = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      if (!isPaused && notesQueueRef.current.length > 0) {
        const activeItem = notesQueueRef.current[0];

        // ADAPTIVE BRAKING LOGIC:
        let effectiveSpeed = targetSpeed;

        if (adaptiveScrolling && activeItem) {
          const distanceToTarget = activeItem.x - targetX;

          if (distanceToTarget > 0 && distanceToTarget < 120) {
            const factor = Math.max(0.1, distanceToTarget / 120);
            effectiveSpeed = targetSpeed * factor;
          } else if (distanceToTarget <= 0.5) {
            effectiveSpeed = 0;
            activeItem.x = targetX; // lock to target line
          }
        }

        // Smooth speed transition
        currentSpeedRef.current += (effectiveSpeed - currentSpeedRef.current) * 0.15;

        // Advance notes
        const moveDist = currentSpeedRef.current * deltaSec;
        for (let i = 0; i < notesQueueRef.current.length; i++) {
          notesQueueRef.current[i].x -= moveDist;
        }

        // Keep target item locked if speed is virtually stopped
        if (effectiveSpeed === 0 && activeItem) {
          activeItem.x = targetX;
        }

        ensureQueueFilled();
        setFrameCount((c) => (c + 1) % 60);
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, adaptiveScrolling, targetSpeed, minDiatonic, maxDiatonic]);

  // Handle removing active note when answered correctly
  useEffect(() => {
    if (successFlash && notesQueueRef.current.length > 0) {
      notesQueueRef.current.shift();
      ensureQueueFilled();

      if (notesQueueRef.current[0]) {
        activeNoteRef.current = notesQueueRef.current[0].note;
        onActiveNoteChanged(notesQueueRef.current[0].note);
      }
    }
  }, [successFlash]);

  // Clef symbol rendering helper
  const renderClefSymbol = (c: ClefType, centerY: number) => {
    const clefX = isMobile ? 30 : 34;
    switch (c) {
      case 'treble':
        return (
          <text
            x={clefX}
            y={centerY + (dualClefEnabled ? 15 : 18)}
            fontSize={dualClefEnabled ? (isMobile ? '56' : '62') : isMobile ? '66' : '72'}
            fontFamily="'Times New Roman', serif"
            className="fill-slate-800 dark:fill-slate-100 select-none font-bold"
            textAnchor="middle"
          >
            𝄞
          </text>
        );
      case 'bass':
        return (
          <text
            x={clefX}
            y={centerY + (dualClefEnabled ? 10 : 12)}
            fontSize={dualClefEnabled ? (isMobile ? '48' : '54') : isMobile ? '58' : '64'}
            fontFamily="'Times New Roman', serif"
            className="fill-slate-800 dark:fill-slate-100 select-none font-bold"
            textAnchor="middle"
          >
            𝄢
          </text>
        );
      case 'alto':
      case 'tenor':
        const utY = c === 'alto' ? centerY : centerY - lineSpacing;
        return (
          <text
            x={clefX}
            y={utY + 10}
            fontSize={dualClefEnabled ? (isMobile ? '44' : '50') : isMobile ? '52' : '58'}
            fontFamily="'Times New Roman', serif"
            className="fill-slate-800 dark:fill-slate-100 select-none font-bold"
            textAnchor="middle"
          >
            𝄡
          </text>
        );
    }
  };

  const currentSpeedNormalized = Math.round((currentSpeedRef.current / (tempoSpeeds[4] || 230)) * 100);

  return (
    <div className="w-full select-none" ref={containerRef}>
      {/* Top Bar with Status and Play/Pause */}
      <div className="flex items-center justify-between gap-1.5 px-2 sm:px-3 py-1 bg-slate-800/80 rounded-t-xl border-t border-x border-slate-700 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-100 text-[11px] sm:text-xs">
              {dualClefEnabled ? 'Grand Staff (2 clefs simultanées)' : 'Défilement continu'}
            </span>
          </div>

          {dualClefEnabled && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950/70 text-amber-300 font-semibold border border-amber-800">
              <Sparkles className="w-2.5 h-2.5" />
              <span>
                {clef === 'treble' ? 'Sol' : clef === 'bass' ? 'Fa' : clef === 'alto' ? 'Ut 3' : 'Ut 4'} +{' '}
                {secondaryClef === 'treble' ? 'Sol' : secondaryClef === 'bass' ? 'Fa' : secondaryClef === 'alto' ? 'Ut 3' : 'Ut 4'}
              </span>
            </span>
          )}

          {adaptiveScrolling && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-950/60 text-indigo-300 font-semibold border border-indigo-800">
              <Zap className="w-2.5 h-2.5" /> Auto-ajusté
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Dynamic Speed Gauge */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[10px] sm:text-[11px]">
            <Gauge className="w-3 h-3 text-indigo-400" />
            <span>{currentSpeedNormalized}%</span>
          </div>

          {/* Pause / Play */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 text-slate-200 hover:bg-slate-850 font-medium border border-slate-700 shadow-xs transition-colors text-[11px] active:scale-95 touch-manipulation"
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" /> Reprendre
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-amber-400 fill-amber-400" /> Pause
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Continuous Staff Canvas / SVG */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-b-xl shadow-sm">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="laser-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.05" />
              <stop offset="30%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
            </linearGradient>

            <linearGradient id="fade-right" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor="var(--bg-fade, #0f172a)" />
            </linearGradient>
          </defs>

          {/* Render Staves */}
          {!dualClefEnabled ? (
            /* Single Staff: 5 Continuous Lines */
            [0, 1, 2, 3, 4].map((i) => {
              const y = singleBottomLineY - i * lineSpacing;
              return (
                <line
                  key={`scroll-line-${i}`}
                  x1="0"
                  y1={y}
                  x2={width}
                  y2={y}
                  className="stroke-slate-300 dark:stroke-slate-600"
                  strokeWidth="1.6"
                />
              );
            })
          ) : (
            /* Dual Clef (Grand Staff): Two Sets of 5 Continuous Lines */
            <g>
              {/* Staff 1 (Top Clef) */}
              {[0, 1, 2, 3, 4].map((i) => {
                const y = staff1BottomLineY - i * lineSpacing;
                return (
                  <line
                    key={`scroll-staff1-line-${i}`}
                    x1="0"
                    y1={y}
                    x2={width}
                    y2={y}
                    className="stroke-slate-300 dark:stroke-slate-600"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Staff 2 (Bottom Clef) */}
              {[0, 1, 2, 3, 4].map((i) => {
                const y = staff2BottomLineY - i * lineSpacing;
                return (
                  <line
                    key={`scroll-staff2-line-${i}`}
                    x1="0"
                    y1={y}
                    x2={width}
                    y2={y}
                    className="stroke-slate-300 dark:stroke-slate-600"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Vertical connecting bar lines on the left for Grand Staff */}
              <line
                x1={isMobile ? 12 : 14}
                y1={staff1TopLineY}
                x2={isMobile ? 12 : 14}
                y2={staff2BottomLineY}
                stroke="#64748b"
                strokeWidth="3.5"
              />
              <line
                x1={isMobile ? 16 : 19}
                y1={staff1TopLineY}
                x2={isMobile ? 16 : 19}
                y2={staff2BottomLineY}
                stroke="#64748b"
                strokeWidth="1.2"
              />
            </g>
          )}

          {/* Target Line Zone (Hit Line) */}
          <rect
            x={targetX - 22}
            y={dualClefEnabled ? staff1TopLineY - 14 : singleBottomLineY - 5 * lineSpacing}
            width="44"
            height={dualClefEnabled ? staff2BottomLineY - staff1TopLineY + 28 : lineSpacing * 6}
            fill="url(#laser-glow)"
            className="opacity-40 pointer-events-none"
          />

          {/* Vertical Target Laser Beam */}
          <line
            x1={targetX}
            y1={dualClefEnabled ? staff1TopLineY - 12 : singleBottomLineY - 5 * lineSpacing}
            x2={targetX}
            y2={dualClefEnabled ? staff2BottomLineY + 12 : singleBottomLineY + lineSpacing}
            stroke="#6366f1"
            strokeWidth="2.2"
            strokeDasharray="4 2"
            className="opacity-90 animate-pulse"
          />

          {/* Target Zone Label */}
          <text
            x={targetX}
            y={dualClefEnabled ? staff2BottomLineY + 22 : singleBottomLineY + 28}
            fontSize={isMobile ? '8.5' : '9.5'}
            textAnchor="middle"
            className="fill-indigo-600 dark:fill-indigo-400 font-bold uppercase tracking-wider select-none"
          >
            {isMobile ? 'Zone cible' : 'Zone de lecture'}
          </text>

          {/* Left Clef Container Overlay */}
          <rect
            x="0"
            y="0"
            width={isMobile ? 58 : 72}
            height={height}
            className="fill-white/95 dark:fill-slate-900/95"
          />
          <line
            x1={isMobile ? 58 : 72}
            y1={dualClefEnabled ? staff1TopLineY : singleBottomLineY - 4 * lineSpacing}
            x2={isMobile ? 58 : 72}
            y2={dualClefEnabled ? staff2BottomLineY : singleBottomLineY}
            stroke="currentColor"
            className="stroke-slate-400 dark:stroke-slate-500"
            strokeWidth="2"
          />

          {/* Render Clef Symbols */}
          {!dualClefEnabled ? (
            renderClefSymbol(clef, singleStaffCenterY)
          ) : (
            <g>
              {renderClefSymbol(clef, staff1CenterY)}
              {renderClefSymbol(secClef, staff2CenterY)}
            </g>
          )}

          {/* Moving Notes */}
          {notesQueueRef.current.map((item, idx) => {
            const { note, x } = item;
            if (x < (isMobile ? 32 : 50) || x > width + 40) return null;

            const { noteY, lineOffset, noteClef } = getNoteY(note);
            const isActive = idx === 0;
            const ledgerLines = getLedgerLines(lineOffset);

            const stemDown = lineOffset >= 4;
            const stemLength = dualClefEnabled ? 30 : 36;
            const stemX = stemDown ? x - 7 : x + 7;
            const stemY2 = stemDown ? noteY + stemLength : noteY - stemLength;

            let noteColor = isActive ? '#4f46e5' : '#64748b';
            if (isActive && successFlash) noteColor = '#10b981';
            if (isActive && errorFlash) noteColor = '#f43f5e';

            return (
              <g key={note.id} className="transition-opacity select-none">
                {/* Ledger lines */}
                {ledgerLines.map((llOffset) => {
                  const llY = getLedgerLineY(llOffset, noteClef);
                  return (
                    <line
                      key={`scroll-ll-${note.id}-${llOffset}`}
                      x1={x - 16}
                      y1={llY}
                      x2={x + 16}
                      y2={llY}
                      stroke={isActive ? '#818cf8' : '#94a3b8'}
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Active Target Glow Ring */}
                {isActive && (
                  <circle
                    cx={x}
                    cy={noteY}
                    r={dualClefEnabled ? '16' : '19'}
                    fill="none"
                    stroke={noteColor}
                    strokeWidth="1.8"
                    strokeDasharray="4 2"
                    className="animate-spin-slow opacity-80"
                  />
                )}

                {/* Accidental */}
                {note.accidental && note.accidental !== 'natural' && (
                  <text
                    x={x - 16}
                    y={noteY + 5}
                    fontSize={dualClefEnabled ? '20' : '24'}
                    textAnchor="middle"
                    fill={noteColor}
                    className="font-serif font-bold select-none"
                  >
                    {note.accidental === 'sharp' ? '♯' : '♭'}
                  </text>
                )}

                {/* Notehead */}
                <ellipse
                  cx={x}
                  cy={noteY}
                  rx={dualClefEnabled ? '8' : '9'}
                  ry={dualClefEnabled ? '5.5' : '6.2'}
                  transform={`rotate(-22 ${x} ${noteY})`}
                  fill={noteColor}
                />

                {/* Stem */}
                <line
                  x1={stemX}
                  y1={noteY}
                  x2={stemX}
                  y2={stemY2}
                  stroke={noteColor}
                  strokeWidth="1.8"
                />

                {/* Beginner Note Hint (if enabled) */}
                {showNoteHint && (
                  <text
                    x={x}
                    y={stemDown ? noteY - 12 : noteY + 20}
                    fontSize="9"
                    textAnchor="middle"
                    className="fill-indigo-400 font-bold font-mono select-none"
                  >
                    {formatNoteName(note, naming, false)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating guidance banner when note paused at target */}
        {adaptiveScrolling && currentSpeedNormalized < 15 && !isPaused && (
          <div className="absolute top-2 right-4 px-3 py-1 bg-indigo-600/90 text-white rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5 animate-bounce">
            <span>Prenez votre temps pour déchiffrer la note !</span>
          </div>
        )}
      </div>
    </div>
  );
};
