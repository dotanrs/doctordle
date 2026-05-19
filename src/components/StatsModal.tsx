import type { ScoreRecord } from '../types';

interface StatsModalProps {
  onClose: () => void;
  scores: ScoreRecord[];
}

export function StatsModal({ onClose, scores }: StatsModalProps) {
  const totalGames = scores.length;
  const wins = scores.filter(s => s.won).length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const avgGuesses = totalGames > 0
    ? (scores.reduce((sum, s) => sum + s.guessCount, 0) / totalGames).toFixed(1)
    : '0';
  const avgBoardsSolved = totalGames > 0
    ? (scores.reduce((sum, s) => sum + s.boardsSolved, 0) / totalGames).toFixed(1)
    : '0';

  // Current streak
  let currentStreak = 0;
  for (const score of scores) {
    if (score.won) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Best streak
  let bestStreak = 0;
  let tempStreak = 0;
  for (const score of scores) {
    if (score.won) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content stats-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Statistics</h2>
        <p className="modal-description">Daily puzzle scores only</p>

        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{totalGames}</span>
            <span className="stat-label">Played</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{winRate}%</span>
            <span className="stat-label">Win Rate</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{currentStreak}</span>
            <span className="stat-label">Current Streak</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{bestStreak}</span>
            <span className="stat-label">Best Streak</span>
          </div>
        </div>

        <div className="stats-averages">
          <div className="avg-item">
            <span>Avg Guesses:</span>
            <span>{avgGuesses}</span>
          </div>
          <div className="avg-item">
            <span>Avg Boards Solved:</span>
            <span>{avgBoardsSolved}/8</span>
          </div>
        </div>

        <h3>Recent Games</h3>
        {scores.length === 0 ? (
          <p className="no-games">No daily puzzles completed yet</p>
        ) : (
          <ul className="scores-list">
            {scores.slice(0, 15).map((score, i) => (
              <li key={i} className={score.won ? 'won' : 'lost'}>
                {score.date} -{' '}
                {score.won ? 'Won' : 'Lost'} ({score.boardsSolved}/8) in{' '}
                {score.guessCount} guesses
              </li>
            ))}
          </ul>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="action-btn primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
