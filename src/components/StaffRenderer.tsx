import React from 'react';
import { MusicalNote, ClefType, NoteNaming } from '../types';
import { getStaffLineOffset, getLedgerLines, formatNoteName } from '../utils/musicTheory';

interface StaffRendererProps {
  clef: ClefType;
  notes: MusicalNote[];
  activeIndex?: number; // which note is currently being tested (0..notes.length-1)
  naming?: NoteNaming;
  showNoteNames?: boolean;
  width?: number | string;
  height?: number;
  highlightCorrect?: boolean;
  highlightError?: boolean;
}

export const StaffRenderer: React.FC<StaffRendererProps> = ({
  clef,
  notes,
  activeIndex = 0,
  naming = 'latin' as NoteNaming,
  showNoteNames = false,
  width = '100%',
  height = 180,
  highlightCorrect = false,
  highlightError = false,
}) => {
  // Staff geometry constants
  // Standard 5 lines:
  // Let lineSpacing = 14px
  // 5 lines occupy 4 spaces = 56px
  // Middle of staff (line 3) is at Y = 90px
  const lineSpacing = 14;
  const staffCenterY = 90; // Line 3
  // Line 1 (bottom) is at staffCenterY + 2 * lineSpacing = 118
  // Line 5 (top) is at staffCenterY - 2 * lineSpacing = 62
  const bottomLineY = staffCenterY + 2 * lineSpacing; // 118

  // Function to convert lineOffset to Y coordinate:
  // lineOffset 0 is bottomLineY
  // each step is lineSpacing / 2 (7px)
  const getYForLineOffset = (lineOffset: number) => {
    return bottomLineY - (lineOffset * (lineSpacing / 2));
  };

  // Clef SVG symbol position and paths
  const renderClef = () => {
    switch (clef) {
      case 'treble':
        // G-Clef / Clef de Sol: wraps around Line 2 (Y = 104)
        return (
          <g transform={`translate(28, ${staffCenterY - 14}) scale(1.15)`}>
            <text
              x="0"
              y="22"
              fontSize="68"
              fontFamily="'Times New Roman', serif"
              className="fill-slate-800 dark:fill-slate-100 select-none font-bold"
              textAnchor="middle"
            >
              𝄞
            </text>
          </g>
        );
      case 'bass':
        // F-Clef / Clef de Fa: dots around Line 4 (Y = 76)
        return (
          <g transform={`translate(28, ${staffCenterY - 14}) scale(1.15)`}>
            <text
              x="0"
              y="18"
              fontSize="62"
              fontFamily="'Times New Roman', serif"
              className="fill-slate-800 dark:fill-slate-100 select-none font-bold"
              textAnchor="middle"
            >
              𝄢
            </text>
          </g>
        );
      case 'alto':
      case 'tenor':
        // C-Clef / Clef d'Ut:
        // Alto is centered on Line 3 (Y = 90)
        // Tenor is centered on Line 4 (Y = 76)
        const utCenterY = clef === 'alto' ? staffCenterY : staffCenterY - lineSpacing;
        return (
          <g transform={`translate(28, ${utCenterY - 12}) scale(1.1)`}>
            <text
              x="0"
              y="18"
              fontSize="56"
              fontFamily="'Times New Roman', serif"
              className="fill-slate-800 dark:fill-slate-100 select-none font-bold"
              textAnchor="middle"
            >
              𝄡
            </text>
          </g>
        );
    }
  };

  // Calculate horizontal positions for multiple notes
  // If notes.length == 1, place centered at x=190
  // If notes.length > 1, distribute evenly starting after clef
  const startX = 100;
  const availableWidth = 260;
  const noteSpacing = notes.length > 1 ? availableWidth / (notes.length) : 0;

  return (
    <div className="w-full flex items-center justify-center select-none overflow-hidden rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-sm p-2 transition-all">
      <svg
        viewBox="0 0 380 180"
        className="w-full max-w-lg h-auto max-h-[170px] sm:max-h-[200px] select-none"
      >
        <defs>
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 5 Staff Lines */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = bottomLineY - i * lineSpacing;
          return (
            <line
              key={`staff-line-${i}`}
              x1="12"
              y1={y}
              x2="368"
              y2={y}
              stroke="currentColor"
              className="stroke-slate-400 dark:stroke-slate-500"
              strokeWidth="1.8"
            />
          );
        })}

        {/* Staff Vertical Bar Lines (start & end) */}
        <line
          x1="12"
          y1={bottomLineY - 4 * lineSpacing}
          x2="12"
          y2={bottomLineY}
          stroke="currentColor"
          className="stroke-slate-400 dark:stroke-slate-500"
          strokeWidth="2"
        />
        <line
          x1="368"
          y1={bottomLineY - 4 * lineSpacing}
          x2="368"
          y2={bottomLineY}
          stroke="currentColor"
          className="stroke-slate-400 dark:stroke-slate-500"
          strokeWidth="2"
        />

        {/* Clef */}
        {renderClef()}

        {/* Render Notes */}
        {notes.map((note, idx) => {
          const lineOffset = getStaffLineOffset(note, clef);
          const noteY = getYForLineOffset(lineOffset);
          const noteX = notes.length === 1 
            ? 210 
            : startX + idx * noteSpacing + noteSpacing / 2;

          const isActive = idx === activeIndex;
          const ledgerLines = getLedgerLines(lineOffset);

          // Stem orientation: if note is on line 3 or higher (lineOffset >= 4), stem points DOWN
          const stemDown = lineOffset >= 4;
          const stemLength = 36;
          const stemX = stemDown ? noteX - 7.5 : noteX + 7.5;
          const stemY2 = stemDown ? noteY + stemLength : noteY - stemLength;

          // Note status coloring
          let noteColorClass = 'fill-slate-900 dark:fill-slate-100';
          let stemColorClass = 'stroke-slate-900 dark:stroke-slate-100';

          if (isActive) {
            if (highlightCorrect) {
              noteColorClass = 'fill-emerald-500';
              stemColorClass = 'stroke-emerald-500';
            } else if (highlightError) {
              noteColorClass = 'fill-rose-500';
              stemColorClass = 'stroke-rose-500';
            } else {
              noteColorClass = 'fill-indigo-600 dark:fill-indigo-400';
              stemColorClass = 'stroke-indigo-600 dark:stroke-indigo-400';
            }
          } else {
            noteColorClass = 'fill-slate-400 dark:fill-slate-500';
            stemColorClass = 'stroke-slate-400 dark:stroke-slate-500';
          }

          return (
            <g key={note.id || `note-${idx}`} className="transition-transform duration-200">
              {/* Ledger Lines */}
              {ledgerLines.map((llOffset) => {
                const llY = getYForLineOffset(llOffset);
                return (
                  <line
                    key={`ledger-${note.id || idx}-${llOffset}`}
                    x1={noteX - 17}
                    y1={llY}
                    x2={noteX + 17}
                    y2={llY}
                    stroke="currentColor"
                    className="stroke-slate-500 dark:stroke-slate-400"
                    strokeWidth="2.2"
                  />
                );
              })}

              {/* Active Indicator Pulse Ring */}
              {isActive && notes.length > 1 && (
                <circle
                  cx={noteX}
                  cy={noteY}
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="4 2"
                  className="stroke-indigo-400 animate-spin-slow opacity-60"
                  strokeWidth="1.8"
                />
              )}

              {/* Accidental if present */}
              {note.accidental && note.accidental !== 'natural' && (
                <text
                  x={noteX - 18}
                  y={noteY + 6}
                  fontSize="24"
                  textAnchor="middle"
                  className={`${noteColorClass} font-serif font-bold select-none`}
                >
                  {note.accidental === 'sharp' ? '♯' : '♭'}
                </text>
              )}

              {/* Notehead (standard tilted oval) */}
              <ellipse
                cx={noteX}
                cy={noteY}
                rx="9"
                ry="6.4"
                transform={`rotate(-22 ${noteX} ${noteY})`}
                className={`${noteColorClass} transition-colors duration-150`}
              />

              {/* Stem */}
              <line
                x1={stemX}
                y1={noteY}
                x2={stemX}
                y2={stemY2}
                strokeWidth="2"
                className={`${stemColorClass} transition-colors duration-150`}
              />

              {/* Optional Note Name label (underneath or hint) */}
              {showNoteNames && (
                <text
                  x={noteX}
                  y={bottomLineY + 36}
                  fontSize="13"
                  textAnchor="middle"
                  className="fill-indigo-600 dark:fill-indigo-400 font-bold tracking-tight"
                >
                  {formatNoteName(note, naming, true)}
                </text>
              )}

              {/* Order badge for multiple notes */}
              {notes.length > 1 && (
                <text
                  x={noteX}
                  y={bottomLineY + 22}
                  fontSize="11"
                  textAnchor="middle"
                  className={`font-semibold ${isActive ? 'fill-indigo-500 font-bold' : 'fill-slate-400'}`}
                >
                  #{idx + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
