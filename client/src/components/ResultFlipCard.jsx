import { useEffect, useState } from 'react';
import BearAvatar from './BearAvatar.jsx';

export default function ResultFlipCard({
  player,
  isWinner,
  isImpostor,
  autoFlipDelay = null,
  autoFlipKey = null,
  ...rest
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const roleLabel = isImpostor ? 'Impostor' : 'Normal Player';
  const winnerClass = isWinner ? (isImpostor ? 'winner-impostor' : 'winner-player') : '';

  useEffect(() => {
    setIsFlipped(false);
  }, [autoFlipKey]);

  useEffect(() => {
    if (autoFlipDelay === null || autoFlipDelay === undefined) return undefined;
    const timeout = setTimeout(() => setIsFlipped(true), autoFlipDelay);
    return () => clearTimeout(timeout);
  }, [autoFlipDelay, autoFlipKey]);

  return (
    <div
      className={`result-flip-card ${winnerClass} ${isFlipped ? 'is-flipped' : ''}`}
      onClick={() => setIsFlipped((prev) => !prev)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setIsFlipped((prev) => !prev);
        }
      }}
      {...rest}
    >
      <div className="result-flip-inner">
        <div className="result-flip-face result-front">
          <BearAvatar color={player.color} size={70} name={player.name} />
          <span className="result-name">{player.name}</span>
        </div>
        <div className="result-flip-face result-back">
          <span className="result-role">{roleLabel}</span>
          {isWinner && <span className="result-highlight">Winner</span>}
        </div>
      </div>
    </div>
  );
}
