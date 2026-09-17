import React, { useEffect } from 'react';
import { NoteNaming, Accidental } from '../types';
import { LATIN_NOTES, ANGLO_NOTES } from '../utils/musicTheory';

interface NotePadsProps {
  naming: NoteNaming;
  selectedAccidental: Accidental;
  onAccidentalChange: (acc: Accidental) => void;
  onNoteSelected: (step: number) => void;
  disabled?: boolean;
}

export const NotePads: React.FC<NotePadsProps> = ({
  naming,
  selectedAccidental,
  onAccidentalChange,
  onNoteSelected,
  disabled = false,
}) => {
  const noteNames = naming === 'latin' ? LATIN_NOTES : ANGLO_NOTES;
  const keyboardKeys = ['1', '2', '3', '4', '5', '6', '7'];

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();

      // Number keys 1..7 -> Do..Si
      if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        e.preventDefault();
        onNoteSelected(parseInt(e.key, 10) - 1);
        return;
      }

      // Letter keys C, D, E, F, G, A, B
      const letterIndex = ANGLO_NOTES.indexOf(key);
      if (letterIndex !== -1) {
        e.preventDefault();
        onNoteSelected(letterIndex);
        return;
      }

      // Accidentals shortcuts: # / S for Sharp, B for flat, N for natural
      if (e.key === '#' || e.key.toLowerCase() === 'd') {
        onAccidentalChange('sharp');
      } else if (e.key.toLowerCase() === 'b') {
        onAccidentalChange('flat');
      } else if (e.key.toLowerCase() === 'n' || e.key === '0') {
        onAccidentalChange('natural');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onNoteSelected, onAccidentalChange]);

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2.5 w-full">
      {/* Accidental selector row (♭, ♮, ♯) */}
      <div className="flex items-center justify-center gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-slate-700/80">
        <button
          type="button"
          onClick={() => onAccidentalChange('flat')}
          className={`flex items-center gap-1 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs font-bold transition-all touch-manipulation active:scale-95 ${
            selectedAccidental === 'flat'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Bémol (♭)"
        >
          <span className="text-sm sm:text-base font-serif font-bold">♭</span>
          <span className="hidden xs:inline">Bémol</span>
        </button>

        <button
          type="button"
          onClick={() => onAccidentalChange('natural')}
          className={`flex items-center gap-1 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs font-bold transition-all touch-manipulation active:scale-95 ${
            selectedAccidental === 'natural'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Bécarre / Naturel (♮)"
        >
          <span className="text-sm sm:text-base font-serif font-bold">♮</span>
          <span className="hidden xs:inline">Bécarre</span>
        </button>

        <button
          type="button"
          onClick={() => onAccidentalChange('sharp')}
          className={`flex items-center gap-1 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs font-bold transition-all touch-manipulation active:scale-95 ${
            selectedAccidental === 'sharp'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Dièse (♯)"
        >
          <span className="text-sm sm:text-base font-serif font-bold">♯</span>
          <span className="hidden xs:inline">Dièse</span>
        </button>
      </div>

      {/* 7 Note Answer Buttons */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 w-full max-w-2xl px-0.5">
        {noteNames.map((name, idx) => {
          let accSymbol = '';
          if (selectedAccidental === 'sharp') accSymbol = '♯';
          if (selectedAccidental === 'flat') accSymbol = '♭';

          return (
            <button
              key={`note-pad-${idx}`}
              type="button"
              disabled={disabled}
              onClick={() => onNoteSelected(idx)}
              className="relative group flex flex-col items-center justify-center min-h-[42px] landscape:min-h-[38px] sm:min-h-[56px] py-1.5 sm:py-2.5 px-0.5 sm:px-2 rounded-xl bg-slate-800/90 border-2 border-slate-700/80 hover:border-indigo-500 active:bg-indigo-600 active:border-indigo-600 shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50 touch-manipulation focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <div className="text-sm sm:text-lg landscape:text-sm font-black text-white group-hover:text-indigo-300 group-active:text-white leading-tight">
                {name}
                <span className="text-xs sm:text-sm font-serif ml-0.5 text-indigo-400 group-active:text-white">
                  {accSymbol}
                </span>
              </div>

              {/* Desktop shortcut hint */}
              <div className="hidden sm:block text-[9px] font-mono text-slate-400 group-active:text-indigo-100">
                [{keyboardKeys[idx]}]
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
