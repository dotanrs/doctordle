import type { LetterState } from '../types';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  boardLetterStates: Map<string, LetterState>[];
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

const STATE_COLORS: Record<LetterState | 'unused', string> = {
  correct: '#538d4e',
  present: '#b59f3b',
  absent: '#3a3a3c',
  empty: '#818384',
  unused: '#818384',
};

function getKeyBackground(key: string, boardLetterStates: Map<string, LetterState>[]): string {
  const states = boardLetterStates.map(board => board.get(key) || 'unused');
  const hasAnyState = states.some(s => s !== 'unused');

  if (!hasAnyState) {
    return STATE_COLORS.unused;
  }

  // Create a conic gradient split into 8 parts
  const segments: string[] = [];
  const segmentSize = 360 / 8;

  states.forEach((state, i) => {
    const color = STATE_COLORS[state];
    const startAngle = i * segmentSize;
    const endAngle = (i + 1) * segmentSize;
    segments.push(`${color} ${startAngle}deg ${endAngle}deg`);
  });

  return `conic-gradient(from 0deg, ${segments.join(', ')})`;
}

export function Keyboard({ onKeyPress, boardLetterStates }: KeyboardProps) {
  return (
    <div className="keyboard">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'BACKSPACE';
            const background = isSpecial ? undefined : getKeyBackground(key, boardLetterStates);
            const hasMultipleStates = !isSpecial && boardLetterStates.some(b => b.has(key));

            return (
              <button
                key={key}
                className={`key ${isSpecial ? 'special' : ''} ${hasMultipleStates ? 'multi-state' : ''}`}
                style={background ? { background } : undefined}
                onClick={() => onKeyPress(key)}
              >
                {key === 'BACKSPACE' ? '⌫' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
