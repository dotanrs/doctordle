export type LetterState = 'correct' | 'present' | 'absent' | 'empty';

export type GameMode = 'daily' | 'freeplay' | 'custom';

export interface LetterResult {
  letter: string;
  state: LetterState;
}

export interface BoardState {
  targetWord: string;
  guesses: LetterResult[][];
  solved: boolean;
  solvedAtGuess: number | null;
}

export interface GameState {
  boards: BoardState[];
  currentGuess: string;
  guessCount: number;
  gameOver: boolean;
  won: boolean;
}

export interface ScoreRecord {
  date: string;
  won: boolean;
  guessCount: number;
  boardsSolved: number;
}
