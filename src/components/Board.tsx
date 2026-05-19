import type { BoardState, LetterResult } from '../types';

interface BoardProps {
  board: BoardState;
  currentGuess: string;
  boardIndex: number;
  maxGuesses: number;
  showAnswer?: boolean;
}

function Tile({ letter, state }: { letter: string; state: string }) {
  return (
    <div className={`tile ${state}`}>
      {letter}
    </div>
  );
}

function Row({ letters, isCurrentRow, currentGuess }: {
  letters?: LetterResult[];
  isCurrentRow: boolean;
  currentGuess: string;
}) {
  if (letters) {
    return (
      <div className="row">
        {letters.map((l, i) => (
          <Tile key={i} letter={l.letter} state={l.state} />
        ))}
      </div>
    );
  }

  if (isCurrentRow) {
    return (
      <div className="row">
        {[0, 1, 2, 3, 4].map((i) => (
          <Tile
            key={i}
            letter={currentGuess[i] || ''}
            state="empty"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="row">
      {[0, 1, 2, 3, 4].map((i) => (
        <Tile key={i} letter="" state="empty" />
      ))}
    </div>
  );
}

export function Board({ board, currentGuess, boardIndex, maxGuesses, showAnswer }: BoardProps) {
  const displayCurrentGuess = !board.solved;

  return (
    <div className={`board ${board.solved ? 'solved' : ''} ${showAnswer ? 'failed' : ''}`}>
      <div className="board-header">
        Board {boardIndex + 1}
        {board.solved && board.solvedAtGuess && (
          <span className="solved-badge">Solved in {board.solvedAtGuess}</span>
        )}
        {showAnswer && (
          <span className="answer-badge">{board.targetWord}</span>
        )}
      </div>
      <div className="board-grid">
        {Array.from({ length: maxGuesses }).map((_, rowIndex) => {
          const guess = board.guesses[rowIndex];
          const isCurrentRow = displayCurrentGuess && rowIndex === board.guesses.length;

          return (
            <Row
              key={rowIndex}
              letters={guess}
              isCurrentRow={isCurrentRow}
              currentGuess={currentGuess}
            />
          );
        })}
      </div>
    </div>
  );
}
