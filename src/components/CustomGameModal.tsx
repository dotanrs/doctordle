import { useState } from 'react';

interface CustomGameModalProps {
  onClose: () => void;
  onCreateLink: (words: string[], name: string) => void;
  onStartGame: (words: string[], name: string) => void;
  wordBank: string[];
}

export function CustomGameModal({ onClose, onCreateLink, onStartGame, wordBank }: CustomGameModalProps) {
  const [words, setWords] = useState<string[]>(Array(8).fill(''));
  const [errors, setErrors] = useState<string[]>(Array(8).fill(''));
  const [gameName, setGameName] = useState('');

  const wordBankSet = new Set(wordBank);

  const validateWord = (word: string, index: number): string => {
    const upper = word.toUpperCase().trim();
    if (upper.length === 0) return '';
    if (upper.length !== 5) return 'Must be 5 letters';
    if (!/^[A-Z]+$/.test(upper)) return 'Letters only';
    if (!wordBankSet.has(upper)) return 'Not in word bank';
    // Check for duplicates
    const otherWords = words.filter((_, i) => i !== index).map(w => w.toUpperCase().trim());
    if (otherWords.includes(upper)) return 'Duplicate word';
    return '';
  };

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value.toUpperCase().slice(0, 5);
    setWords(newWords);

    const newErrors = [...errors];
    newErrors[index] = validateWord(newWords[index], index);
    // Re-validate other words for duplicates
    newWords.forEach((w, i) => {
      if (i !== index && w.trim()) {
        newErrors[i] = validateWord(w, i);
      }
    });
    setErrors(newErrors);
  };

  const handleRandomize = (index: number) => {
    const usedWords = new Set(words.map(w => w.toUpperCase().trim()).filter(w => w.length === 5));
    const available = wordBank.filter(w => !usedWords.has(w));
    if (available.length === 0) return;

    const randomWord = available[Math.floor(Math.random() * available.length)];
    handleWordChange(index, randomWord);
  };

  const handleRandomizeAll = () => {
    const shuffled = [...wordBank].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 8);
    setWords(selected);
    setErrors(Array(8).fill(''));
  };

  const isValid = () => {
    const filledWords = words.map(w => w.toUpperCase().trim()).filter(w => w.length === 5);
    if (filledWords.length !== 8) return false;
    if (errors.some(e => e !== '')) return false;
    return true;
  };

  const getValidWords = (): string[] => {
    return words.map(w => w.toUpperCase().trim());
  };

  const getName = (): string => {
    return gameName.trim() || 'Custom Game';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Create Custom Game</h2>
        <p className="modal-description">Enter 8 words from the word bank to create a custom game.</p>

        <div className="name-input-row">
          <label htmlFor="game-name">Game Name:</label>
          <input
            id="game-name"
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value.slice(0, 30))}
            placeholder="My Custom Puzzle"
            maxLength={30}
            className="name-input"
          />
          <span className="char-count">{gameName.length}/30</span>
        </div>

        <div className="word-inputs">
          {words.map((word, index) => (
            <div key={index} className="word-input-row">
              <span className="word-number">{index + 1}.</span>
              <input
                type="text"
                value={word}
                onChange={(e) => handleWordChange(index, e.target.value)}
                placeholder="WORD"
                maxLength={5}
                className={errors[index] ? 'error' : word.length === 5 && !errors[index] ? 'valid' : ''}
              />
              <button
                type="button"
                className="randomize-btn"
                onClick={() => handleRandomize(index)}
                title="Random word"
              >
                🎲
              </button>
              {errors[index] && <span className="error-text">{errors[index]}</span>}
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button onClick={handleRandomizeAll} className="action-btn secondary">
            Randomize All
          </button>
          <button onClick={onClose} className="action-btn secondary">
            Cancel
          </button>
          <button
            onClick={() => onCreateLink(getValidWords(), getName())}
            className="action-btn primary"
            disabled={!isValid()}
          >
            Copy Link
          </button>
          <button
            onClick={() => onStartGame(getValidWords(), getName())}
            className="action-btn primary"
            disabled={!isValid()}
          >
            Play Now
          </button>
        </div>
      </div>
    </div>
  );
}
