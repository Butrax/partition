import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClefType,
  PlayMode,
  NoteNaming,
  Accidental,
  MusicalNote,
  ScalePreset,
  GameScore,
} from './types';
import {
  CLEF_CONFIGS,
  SCALE_PRESETS,
  generateRandomNote,
  midiToFrequency,
  formatNoteName,
} from './utils/musicTheory';
import { soundEngine } from './utils/audio';

import { Header } from './components/Header';
import { ScoreBar } from './components/ScoreBar';
import { StaffRenderer } from './components/StaffRenderer';
import { ScrollingStaff } from './components/ScrollingStaff';
import { NotePads } from './components/NotePads';
import { PianoKeyboard } from './components/PianoKeyboard';
import { GameResultModal } from './components/GameResultModal';
import { SettingsMenuModal, SettingsTab } from './components/SettingsMenuModal';

import {
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function App() {
  // App Core State
  const [clef, setClef] = useState<ClefType>('treble');
  const [playMode, setPlayMode] = useState<PlayMode>('scrolling');
  const [naming, setNaming] = useState<NoteNaming>('latin');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notesCount, setNotesCount] = useState<number>(1);
  const [showNoteHint, setShowNoteHint] = useState<boolean>(false);
  const [inputView, setInputView] = useState<'both' | 'pads' | 'piano'>('pads');

  // Dedicated Menu Modal State ('clef_scale' | 'range' | 'mode' | 'preferences' | null)
  const [activeModalTab, setActiveModalTab] = useState<SettingsTab | null>(null);

  // Dual-Clef Training State (Grand Staff in continuous scrolling)
  const [dualClefEnabled, setDualClefEnabled] = useState<boolean>(false);
  const [secondaryClef, setSecondaryClef] = useState<ClefType>('bass');
  const [minDiatonic2, setMinDiatonic2] = useState<number>(CLEF_CONFIGS['bass'].defaultMinDiatonic);
  const [maxDiatonic2, setMaxDiatonic2] = useState<number>(CLEF_CONFIGS['bass'].defaultMaxDiatonic);

  // Bilateral Range Boundaries (Diatonic Index)
  const defaultClefConfig = CLEF_CONFIGS['treble'];
  const [minDiatonic, setMinDiatonic] = useState<number>(defaultClefConfig.defaultMinDiatonic);
  const [maxDiatonic, setMaxDiatonic] = useState<number>(defaultClefConfig.defaultMaxDiatonic);

  // Scales & Tonality
  const [selectedScaleId, setSelectedScaleId] = useState<string>('c_major');
  const [allowedSteps, setAllowedSteps] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [keySignature, setKeySignature] = useState<{ [step: number]: Accidental }>({});

  // Scrolling Mode Controls
  const [baseTempo, setBaseTempo] = useState<number>(2); // 1 to 4
  const [adaptiveScrolling, setAdaptiveScrolling] = useState<boolean>(true);
  const [isScrollingPaused, setIsScrollingPaused] = useState<boolean>(false);
  const scrollingActiveNoteRef = useRef<MusicalNote | null>(null);
  const [scrollingActiveNote, setScrollingActiveNote] = useState<MusicalNote | null>(null);

  // Static / Timed Staff Notes
  const [staticNotes, setStaticNotes] = useState<MusicalNote[]>([]);
  const [activeNoteIndex, setActiveNoteIndex] = useState<number>(0);

  // Accidental selected in user pad
  const [selectedAccidental, setSelectedAccidental] = useState<Accidental>('natural');

  // Animation & Visual Feedback
  const [successFlash, setSuccessFlash] = useState<boolean>(false);
  const [errorFlash, setErrorFlash] = useState<boolean>(false);
  const [lastFeedback, setLastFeedback] = useState<{ text: string; success: boolean } | null>(null);

  // Game Score & Stats
  const [score, setScore] = useState<GameScore>({
    correct: 0,
    total: 0,
    streak: 0,
    maxStreak: 0,
    points: 0,
    elapsedTime: 0,
    lives: 3,
  });

  // Timed Sprint countdown & stopwatch
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  // Update sound engine mute state
  useEffect(() => {
    soundEngine.setMuted(!soundEnabled);
  }, [soundEnabled]);

  // When clef changes, reset default min/max diatonic
  const handleChangeClef = (newClef: ClefType) => {
    setClef(newClef);
    const cfg = CLEF_CONFIGS[newClef];
    setMinDiatonic(cfg.defaultMinDiatonic);
    setMaxDiatonic(cfg.defaultMaxDiatonic);
    resetGameState();
  };

  // When secondary clef changes in dual-clef mode
  const handleChangeSecondaryClef = (newClef: ClefType) => {
    setSecondaryClef(newClef);
    const cfg = CLEF_CONFIGS[newClef];
    setMinDiatonic2(cfg.defaultMinDiatonic);
    setMaxDiatonic2(cfg.defaultMaxDiatonic);
    resetGameState();
  };

  const handleToggleDualClef = () => {
    setDualClefEnabled((prev) => !prev);
    resetGameState();
  };

  // Generate a batch of static notes
  const generateStaticBatch = useCallback(
    (count: number) => {
      const notes: MusicalNote[] = [];
      for (let i = 0; i < count; i++) {
        notes.push(generateRandomNote(minDiatonic, maxDiatonic, allowedSteps, keySignature));
      }
      return notes;
    },
    [minDiatonic, maxDiatonic, allowedSteps, keySignature]
  );

  // Reset or initialize state
  const resetGameState = useCallback(() => {
    setScore({
      correct: 0,
      total: 0,
      streak: 0,
      maxStreak: 0,
      points: 0,
      elapsedTime: 0,
      lives: 3,
    });
    setTimeRemaining(60);
    setIsGameOverModalOpen(false);
    setActiveNoteIndex(0);
    setStaticNotes(generateStaticBatch(notesCount));
    setLastFeedback(null);
  }, [generateStaticBatch, notesCount]);

  // Handle mode switch
  const handleChangePlayMode = (mode: PlayMode) => {
    setPlayMode(mode);
    resetGameState();
  };

  // Refresh static notes when settings change
  useEffect(() => {
    if (playMode !== 'scrolling') {
      setStaticNotes(generateStaticBatch(notesCount));
      setActiveNoteIndex(0);
    }
  }, [minDiatonic, maxDiatonic, allowedSteps, keySignature, notesCount, playMode, generateStaticBatch]);

  // Scale preset selection
  const handleSelectScale = (preset: ScalePreset) => {
    setSelectedScaleId(preset.id);
    setAllowedSteps(preset.allowedSteps);
    setKeySignature(preset.keySignature);
  };

  // Sprint Timer Countdown effect
  useEffect(() => {
    if (playMode !== 'timed_sprint' || isGameOverModalOpen) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOverModalOpen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [playMode, isGameOverModalOpen]);

  // Check game over in survival or challenge mode
  useEffect(() => {
    if (playMode === 'survival' && score.lives !== undefined && score.lives <= 0) {
      setIsGameOverModalOpen(true);
    }
    if (playMode === 'timed_challenge' && score.correct >= 30) {
      setIsGameOverModalOpen(true);
    }
  }, [playMode, score.lives, score.correct]);

  // Primary verification handler
  const handleAnswer = (userStep: number, userAccidental: Accidental, _pianoOctave?: number) => {
    let currentTargetNote: MusicalNote | null = null;

    if (playMode === 'scrolling') {
      currentTargetNote = scrollingActiveNoteRef.current;
    } else {
      if (staticNotes.length > 0 && activeNoteIndex < staticNotes.length) {
        currentTargetNote = staticNotes[activeNoteIndex];
      }
    }

    if (!currentTargetNote) return;

    // Check step match (0=C, 1=D, etc.)
    const stepMatches = userStep === currentTargetNote.step;
    // Check accidental match
    const targetAcc = currentTargetNote.accidental || 'natural';
    const accMatches = userAccidental === targetAcc;

    const isCorrect = stepMatches && accMatches;

    if (isCorrect) {
      // Success!
      setSuccessFlash(true);
      setErrorFlash(false);
      setTimeout(() => setSuccessFlash(false), 250);

      if (soundEnabled) {
        soundEngine.playPianoNote(midiToFrequency(currentTargetNote.midi));
      }

      const newStreak = score.streak + 1;
      const pointsEarned = 10 + Math.min(newStreak * 2, 20);

      setScore((s) => ({
        ...s,
        correct: s.correct + 1,
        total: s.total + 1,
        streak: newStreak,
        maxStreak: Math.max(s.maxStreak, newStreak),
        points: s.points + pointsEarned,
      }));

      const clefTag =
        dualClefEnabled && currentTargetNote.clef
          ? currentTargetNote.clef === 'treble'
            ? ' (Clef de Sol)'
            : currentTargetNote.clef === 'bass'
            ? ' (Clef de Fa)'
            : currentTargetNote.clef === 'alto'
            ? " (Clef d'Ut 3)"
            : " (Clef d'Ut 4)"
          : '';

      setLastFeedback({
        text: `Exact ! ${formatNoteName(currentTargetNote, naming)}${clefTag}`,
        success: true,
      });

      // Sound milestone chime on combo streaks
      if (newStreak % 5 === 0 && soundEnabled) {
        soundEngine.playSuccess();
      }

      // Advance note in static mode
      if (playMode !== 'scrolling') {
        if (activeNoteIndex + 1 < staticNotes.length) {
          setActiveNoteIndex(activeNoteIndex + 1);
        } else {
          setStaticNotes(generateStaticBatch(notesCount));
          setActiveNoteIndex(0);
        }
      }
    } else {
      // Error!
      setErrorFlash(true);
      setSuccessFlash(false);
      setTimeout(() => setErrorFlash(false), 300);

      if (soundEnabled) {
        soundEngine.playError();
      }

      setScore((s) => ({
        ...s,
        total: s.total + 1,
        streak: 0,
        lives: s.lives !== undefined ? Math.max(0, s.lives - 1) : 3,
      }));

      const clefTag =
        dualClefEnabled && currentTargetNote.clef
          ? currentTargetNote.clef === 'treble'
            ? ' (Clef de Sol)'
            : currentTargetNote.clef === 'bass'
            ? ' (Clef de Fa)'
            : currentTargetNote.clef === 'alto'
            ? " (Clef d'Ut 3)"
            : " (Clef d'Ut 4)"
          : '';

      setLastFeedback({
        text: `Incorrect ! C'était ${formatNoteName(currentTargetNote, naming)}${clefTag}`,
        success: false,
      });
    }
  };

  return (
    <div className="min-h-screen h-[100dvh] bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Header - Streamlined with Dedicated Menu Buttons */}
      <Header
        clef={clef}
        dualClefEnabled={dualClefEnabled}
        secondaryClef={secondaryClef}
        playMode={playMode}
        naming={naming}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenMenu={(tab) => setActiveModalTab(tab)}
        onResetScore={resetGameState}
        streak={score.streak}
        points={score.points}
      />

      {/* Main Workspace - 100% Focused on Partition & Response Buttons */}
      {/* Adaptable for Mobile Portrait (vertical stack) & Mobile Landscape (side-by-side) */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-1.5 sm:p-3 flex flex-col justify-between overflow-hidden">
        {/* Top Status Strip */}
        <div className="w-full shrink-0 mb-1">
          <ScoreBar
            playMode={playMode}
            score={score}
            timeRemaining={timeRemaining}
            totalChallengeNotes={30}
            onResetScore={resetGameState}
          />
        </div>

        {/* Responsive Dual Layout: In Portrait stacked vertically, in Landscape side-by-side */}
        <div className="flex-1 w-full flex flex-col landscape:flex-row landscape:items-center landscape:justify-between gap-1.5 sm:gap-3 min-h-0 overflow-hidden">
          {/* Partition / Sheet Music Section */}
          <section className="w-full landscape:w-[58%] flex flex-col justify-center relative min-h-0">
            {playMode === 'scrolling' ? (
              <ScrollingStaff
                clef={clef}
                dualClefEnabled={dualClefEnabled}
                secondaryClef={secondaryClef}
                minDiatonic={minDiatonic}
                maxDiatonic={maxDiatonic}
                minDiatonic2={minDiatonic2}
                maxDiatonic2={maxDiatonic2}
                allowedSteps={allowedSteps}
                keySignature={keySignature}
                naming={naming}
                showNoteHint={showNoteHint}
                baseTempo={baseTempo}
                adaptiveScrolling={adaptiveScrolling}
                onActiveNoteChanged={(note) => setScrollingActiveNote(note)}
                activeNoteRef={scrollingActiveNoteRef}
                successFlash={successFlash}
                errorFlash={errorFlash}
                isPaused={isScrollingPaused}
                setIsPaused={setIsScrollingPaused}
              />
            ) : (
              <div className="w-full relative">
                <StaffRenderer
                  clef={clef}
                  notes={staticNotes}
                  activeIndex={activeNoteIndex}
                  naming={naming}
                  showNoteNames={showNoteHint}
                  highlightCorrect={successFlash}
                  highlightError={errorFlash}
                  height={165}
                />

                {/* Beginner Hint Quick Toggle */}
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={() => setShowNoteHint(!showNoteHint)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 text-xs font-semibold hover:bg-slate-700 border border-slate-700 transition-colors"
                    title="Aide débutant : afficher le nom des notes"
                  >
                    {showNoteHint ? <EyeOff className="w-3 h-3 text-indigo-400" /> : <Eye className="w-3 h-3" />}
                    <span className="hidden xs:inline">{showNoteHint ? 'Masquer aide' : 'Aide'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Instant Answer Feedback Banner */}
            {lastFeedback && (
              <div
                className={`mt-1 py-0.5 px-2 rounded-lg text-center text-xs font-bold flex items-center justify-center gap-1.5 transition-all animate-in fade-in shrink-0 ${
                  lastFeedback.success
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/80'
                    : 'bg-rose-950/70 text-rose-300 border border-rose-800/80'
                }`}
              >
                {lastFeedback.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span className="truncate">{lastFeedback.text}</span>
              </div>
            )}
          </section>

          {/* Response Buttons Section */}
          <section className="w-full landscape:w-[42%] bg-slate-850/90 border border-slate-700/80 rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-md flex flex-col justify-center shrink-0">
            {/* Note Buttons */}
            {(inputView === 'both' || inputView === 'pads') && (
              <NotePads
                naming={naming}
                selectedAccidental={selectedAccidental}
                onAccidentalChange={setSelectedAccidental}
                onNoteSelected={(step) => handleAnswer(step, selectedAccidental)}
              />
            )}

            {/* Piano Keyboard (if enabled) */}
            {(inputView === 'both' || inputView === 'piano') && (
              <div className="mt-1">
                <PianoKeyboard
                  minDiatonic={dualClefEnabled ? Math.min(minDiatonic, minDiatonic2) : minDiatonic}
                  maxDiatonic={dualClefEnabled ? Math.max(maxDiatonic, maxDiatonic2) : maxDiatonic}
                  naming={naming}
                  soundEnabled={soundEnabled}
                  onKeySelected={(step, accidental, octave) => handleAnswer(step, accidental, octave)}
                />
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Dedicated Settings Menus Modal (Clef & Gammes, Étendue, Mode de jeu, Options) */}
      <SettingsMenuModal
        isOpen={activeModalTab !== null}
        activeTab={activeModalTab || 'clef_scale'}
        onClose={() => setActiveModalTab(null)}
        onChangeTab={(tab) => setActiveModalTab(tab)}
        clef={clef}
        onChangeClef={handleChangeClef}
        dualClefEnabled={dualClefEnabled}
        onToggleDualClef={handleToggleDualClef}
        secondaryClef={secondaryClef}
        onChangeSecondaryClef={handleChangeSecondaryClef}
        minDiatonic2={minDiatonic2}
        maxDiatonic2={maxDiatonic2}
        onChangeRange2={(min, max) => {
          setMinDiatonic2(min);
          setMaxDiatonic2(max);
        }}
        selectedScaleId={selectedScaleId}
        onSelectScale={handleSelectScale}
        allowedSteps={allowedSteps}
        onChangeAllowedSteps={setAllowedSteps}
        keySignature={keySignature}
        onChangeKeySignature={setKeySignature}
        minDiatonic={minDiatonic}
        maxDiatonic={maxDiatonic}
        onChangeRange={(min, max) => {
          setMinDiatonic(min);
          setMaxDiatonic(max);
        }}
        playMode={playMode}
        onChangePlayMode={handleChangePlayMode}
        baseTempo={baseTempo}
        onChangeBaseTempo={setBaseTempo}
        adaptiveScrolling={adaptiveScrolling}
        onToggleAdaptive={() => setAdaptiveScrolling(!adaptiveScrolling)}
        notesCount={notesCount}
        onChangeNotesCount={(cnt) => {
          setNotesCount(cnt);
          setActiveNoteIndex(0);
        }}
        naming={naming}
        onChangeNaming={setNaming}
        inputView={inputView}
        onChangeInputView={setInputView}
        showNoteHint={showNoteHint}
        onToggleNoteHint={() => setShowNoteHint(!showNoteHint)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onResetScore={resetGameState}
      />

      {/* Game Over / Results Modal */}
      {isGameOverModalOpen && (
        <GameResultModal
          mode={playMode}
          score={score}
          onRestart={resetGameState}
          onClose={() => setIsGameOverModalOpen(false)}
        />
      )}
    </div>
  );
}
