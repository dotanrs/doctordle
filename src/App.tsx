import { useState, useEffect, useCallback } from 'react';
import { Board } from './components/Board';
import { Keyboard } from './components/Keyboard';
import { CustomGameModal } from './components/CustomGameModal';
import { StatsModal } from './components/StatsModal';
import { Confetti } from './components/Confetti';
import type { BoardState, GameState, LetterState, LetterResult, ScoreRecord, GameMode } from './types';
import { getRandomTargetWords, getDailyTargetWords, getTodayDateString, VALID_WORDS, WORD_BANK } from './words';
import './App.css';

const MAX_GUESSES = 13;
const WORD_LENGTH = 5;
const STORAGE_KEY = 'octordle-daily-scores';
const DAILY_STATE_KEY = 'octordle-daily-state';

function encodeCustomGame(words: string[], name: string): string {
  return btoa(JSON.stringify({ words, name }));
}

function decodeCustomGame(encoded: string): { words: string[]; name: string } | null {
  try {
    const decoded = JSON.parse(atob(encoded));
    if (!decoded.words || decoded.words.length !== 8) return null;
    if (!decoded.words.every((w: string) => w.length === 5 && /^[A-Z]+$/.test(w))) return null;
    return { words: decoded.words, name: decoded.name || 'Custom Game' };
  } catch {
    return null;
  }
}

function getCustomGameFromURL(): { words: string[]; name: string } | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('game');
  if (!encoded) return null;
  return decodeCustomGame(encoded);
}

function getFeedbackMessage(won: boolean, guessCount: number): string {
  if (!won) return 'Next time!';
  if (guessCount < 10) return 'Miraculous!';
  if (guessCount === 10) return 'Superb!';
  if (guessCount === 11) return 'Very good!';
  if (guessCount === 12) return 'Nice!';
  return 'Phew!';
}

function evaluateGuess(guess: string, target: string): LetterResult[] {
  const result: LetterResult[] = [];
  const targetLetters = target.split('');
  const guessLetters = guess.split('');
  const remainingTarget: (string | null)[] = [...targetLetters];

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = { letter: guessLetters[i], state: 'correct' };
      remainingTarget[i] = null;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i]) continue;
    const letterIndex = remainingTarget.indexOf(guessLetters[i]);
    if (letterIndex !== -1) {
      result[i] = { letter: guessLetters[i], state: 'present' };
      remainingTarget[letterIndex] = null;
    } else {
      result[i] = { letter: guessLetters[i], state: 'absent' };
    }
  }

  return result;
}

function createBoardsFromWords(words: string[]): BoardState[] {
  return words.map((word) => ({
    targetWord: word,
    guesses: [],
    solved: false,
    solvedAtGuess: null,
  }));
}

function createGameState(boards: BoardState[]): GameState {
  return {
    boards,
    currentGuess: '',
    guessCount: 0,
    gameOver: false,
    won: false,
  };
}

function loadScores(): ScoreRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveScore(score: ScoreRecord) {
  const scores = loadScores();
  // Check if we already have a score for this date
  const existingIndex = scores.findIndex(s => s.date === score.date);
  if (existingIndex >= 0) {
    scores[existingIndex] = score;
  } else {
    scores.unshift(score);
  }
  const trimmed = scores.slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

function loadDailyState(): { date: string; state: GameState } | null {
  try {
    const stored = localStorage.getItem(DAILY_STATE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed.date !== getTodayDateString()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDailyState(state: GameState) {
  const data = { date: getTodayDateString(), state };
  localStorage.setItem(DAILY_STATE_KEY, JSON.stringify(data));
}

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('daily');
  const [customName, setCustomName] = useState<string>('');
  const [gameState, setGameState] = useState<GameState>(() => {
    const customGame = getCustomGameFromURL();
    if (customGame) {
      return createGameState(createBoardsFromWords(customGame.words));
    }
    const savedDaily = loadDailyState();
    if (savedDaily) {
      return savedDaily.state;
    }
    return createGameState(createBoardsFromWords(getDailyTargetWords()));
  });

  const [cheatMode, setCheatMode] = useState(false);
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState<ScoreRecord[]>(loadScores);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Initialize game mode from URL
  useEffect(() => {
    const customGame = getCustomGameFromURL();
    if (customGame) {
      setGameMode('custom');
      setCustomName(customGame.name);
    }
  }, []);

  // Save daily state when it changes
  useEffect(() => {
    if (gameMode === 'daily') {
      saveDailyState(gameState);
    }
  }, [gameState, gameMode]);

  const showMessage = useCallback((msg: string, duration = 2000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    if (gameState.gameOver) return;

    setGameState((prev) => {
      if (key === 'BACKSPACE') {
        return { ...prev, currentGuess: prev.currentGuess.slice(0, -1) };
      }

      if (key === 'ENTER') {
        if (prev.currentGuess.length !== WORD_LENGTH) {
          showMessage('Word must be 5 letters');
          return prev;
        }

        if (!cheatMode && !VALID_WORDS.has(prev.currentGuess)) {
          showMessage('Not a valid word');
          return prev;
        }

        const newGuessCount = prev.guessCount + 1;
        const newBoards = prev.boards.map((board) => {
          if (board.solved) return board;
          const result = evaluateGuess(prev.currentGuess, board.targetWord);
          const isSolved = result.every((r) => r.state === 'correct');
          return {
            ...board,
            guesses: [...board.guesses, result],
            solved: isSolved,
            solvedAtGuess: isSolved ? newGuessCount : null,
          };
        });

        const allSolved = newBoards.every((b) => b.solved);
        const outOfGuesses = newGuessCount >= MAX_GUESSES;
        const gameOver = allSolved || outOfGuesses;

        if (gameOver) {
          const boardsSolved = newBoards.filter((b) => b.solved).length;

          // Only save scores for daily puzzles
          if (gameMode === 'daily') {
            const newScore: ScoreRecord = {
              date: getTodayDateString(),
              won: allSolved,
              guessCount: newGuessCount,
              boardsSolved,
            };
            saveScore(newScore);
            setScores(loadScores());
          }

          // Show feedback and confetti
          const feedback = getFeedbackMessage(allSolved, newGuessCount);
          setFeedbackMessage(feedback);
          if (allSolved) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
          }
        }

        return {
          ...prev,
          boards: newBoards,
          currentGuess: '',
          guessCount: newGuessCount,
          gameOver,
          won: allSolved,
        };
      }

      if (prev.currentGuess.length >= WORD_LENGTH) return prev;
      if (!/^[A-Z]$/.test(key)) return prev;
      return { ...prev, currentGuess: prev.currentGuess + key };
    });
  }, [gameState.gameOver, cheatMode, showMessage, gameMode]);

  const handleHint = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState((prev) => {
      const position = prev.currentGuess.length;
      if (position >= WORD_LENGTH) {
        showMessage('Word is complete');
        return prev;
      }

      const eligibleBoards = prev.boards.filter((board) => {
        if (board.solved) return false;
        const lastGuess = board.guesses[board.guesses.length - 1];
        if (lastGuess && lastGuess[position]?.state === 'correct') return false;
        return true;
      });

      if (eligibleBoards.length === 0) {
        showMessage('No hint available');
        return prev;
      }

      const randomBoard = eligibleBoards[Math.floor(Math.random() * eligibleBoards.length)];
      const hintLetter = randomBoard.targetWord[position];
      return { ...prev, currentGuess: prev.currentGuess + hintLetter };
    });
  }, [gameState.gameOver, showMessage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCustomModal || showStatsModal) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACKSPACE');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, showCustomModal, showStatsModal]);

  const boardLetterStates: Map<string, LetterState>[] = gameState.boards.map((board) => {
    const states = new Map<string, LetterState>();
    const statePriority: Record<LetterState, number> = { correct: 3, present: 2, absent: 1, empty: 0 };
    board.guesses.forEach((guess) => {
      guess.forEach(({ letter, state }) => {
        const current = states.get(letter);
        if (!current || statePriority[state] > statePriority[current]) {
          states.set(letter, state);
        }
      });
    });
    return states;
  });

  const startDailyGame = () => {
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setGameMode('daily');
    setCustomName('');
    setFeedbackMessage('');
    const savedDaily = loadDailyState();
    if (savedDaily && savedDaily.date === getTodayDateString()) {
      setGameState(savedDaily.state);
    } else {
      setGameState(createGameState(createBoardsFromWords(getDailyTargetWords())));
    }
  };

  const startFreePlay = () => {
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setGameMode('freeplay');
    setCustomName('');
    setFeedbackMessage('');
    setGameState(createGameState(createBoardsFromWords(getRandomTargetWords())));
  };

  const handleCreateCustomGame = (words: string[], name: string) => {
    const encoded = encodeCustomGame(words, name);
    const url = `${window.location.origin}${window.location.pathname}?game=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      showMessage('Link copied to clipboard!', 3000);
    }).catch(() => {
      showMessage('Failed to copy link', 2000);
    });
    setShowCustomModal(false);
  };

  const handleStartCustomGame = (words: string[], name: string) => {
    const encoded = encodeCustomGame(words, name);
    window.history.replaceState({}, '', `?game=${encoded}`);
    setGameMode('custom');
    setCustomName(name);
    setFeedbackMessage('');
    setGameState(createGameState(createBoardsFromWords(words)));
    setShowCustomModal(false);
  };

  const solvedCount = gameState.boards.filter((b) => b.solved).length;
  const unsolvedBoards = gameState.boards.filter((b) => !b.solved);

  const getModeLabel = () => {
    if (gameMode === 'daily') return `Daily Puzzle - ${getTodayDateString()}`;
    if (gameMode === 'freeplay') return 'Free Play';
    return customName || 'Custom Game';
  };

  return (
    <div className="app">
      <Confetti active={showConfetti} />

      <header className="header">
        <h1>Octordle</h1>
        <span className="mode-badge">{getModeLabel()}</span>
        <div className="game-info">
          <span>Guesses: {gameState.guessCount}/{MAX_GUESSES}</span>
          <span>Solved: {solvedCount}/8</span>
        </div>
      </header>

      {message && <div className="message">{message}</div>}

      {gameState.gameOver && feedbackMessage && (
        <div className={`feedback-message ${gameState.won ? 'won' : 'lost'}`}>
          {feedbackMessage}
        </div>
      )}

      <div className="controls">
        <button onClick={startDailyGame} className={`mode-btn ${gameMode === 'daily' ? 'active' : ''}`}>
          Daily
        </button>
        <button onClick={startFreePlay} className={`mode-btn ${gameMode === 'freeplay' ? 'active' : ''}`}>
          Free Play
        </button>
        <button onClick={handleHint} className="hint-btn" disabled={gameState.gameOver}>
          Hint
        </button>
        <label className="cheat-toggle">
          <input
            type="checkbox"
            checked={cheatMode}
            onChange={(e) => setCheatMode(e.target.checked)}
          />
          Cheat Mode
        </label>
      </div>

      <div className="boards-container">
        {gameState.boards.map((board, index) => (
          <Board
            key={index}
            board={board}
            currentGuess={gameState.currentGuess}
            boardIndex={index}
            maxGuesses={MAX_GUESSES}
            showAnswer={gameState.gameOver && !board.solved}
          />
        ))}
      </div>

      <div className="keyboard-container">
        <Keyboard onKeyPress={handleKeyPress} boardLetterStates={boardLetterStates} />
      </div>

      {gameState.gameOver && unsolvedBoards.length > 0 && (
        <div className="unsolved-section">
          <h2>Unsolved Words</h2>
          <div className="unsolved-words">
            {unsolvedBoards.map((board, i) => (
              <span key={i} className="unsolved-word">{board.targetWord}</span>
            ))}
          </div>
        </div>
      )}

      <div className="bottom-controls">
        <button onClick={() => setShowCustomModal(true)} className="bottom-btn">
          Custom Game
        </button>
        <button onClick={() => setShowStatsModal(true)} className="bottom-btn">
          Stats
        </button>
      </div>

      {showCustomModal && (
        <CustomGameModal
          onClose={() => setShowCustomModal(false)}
          onCreateLink={handleCreateCustomGame}
          onStartGame={handleStartCustomGame}
          wordBank={WORD_BANK}
        />
      )}

      {showStatsModal && (
        <StatsModal
          onClose={() => setShowStatsModal(false)}
          scores={scores}
        />
      )}
    </div>
  );
}

export default App;
