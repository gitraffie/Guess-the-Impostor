import { useEffect, useMemo, useState } from 'react';
import ResultFlipCard from '../components/ResultFlipCard.jsx';

export default function Results({
  players,
  clues,
  votes,
  result,
  secretWord,
  onPlayAgain,
  onLeave,
  connected,
  hostId
}) {
  const [showSecretWord, setShowSecretWord] = useState(false);

  const winnerNames = useMemo(
    () => (result && result.winnerNames ? result.winnerNames : []),
    [result]
  );

  useEffect(() => {
    setShowSecretWord(false);
    if (!players.length) return undefined;

    const entryDuration = 450;
    const stagger = 180;
    const flipDuration = 800;
    const baseDelay = 200;
    const totalDelay =
      baseDelay + entryDuration + flipDuration + (players.length - 1) * stagger + 200;

    const timeout = setTimeout(() => setShowSecretWord(true), totalDelay);
    return () => clearTimeout(timeout);
  }, [players.length, result]);

  const resultTitle = result ? result.winner || 'Game Over' : 'Game Over';
  const resultReason = result ? result.reason : '';

  return (
    <div className="card">
      <h2>Results</h2>
      {result && (
        <div className="panel full">
          <h3>{resultTitle}</h3>
          {resultReason && <p>{resultReason}</p>}
        </div>
      )}

      <div className="panel full">
        <h3>Player Results</h3>
        <div className="result-grid">
          {players.map((player, index) => {
            const isImpostor = Boolean(result && player.name === result.impostorName);
            const isWinner = winnerNames.includes(player.name);

            return (
              <ResultFlipCard
                key={player.id}
                player={player}
                isWinner={isWinner}
                isImpostor={isImpostor}
                style={{ '--delay': `${index * 180}ms` }}
              />
            );
          })}
        </div>
      </div>

      <div className={`panel full result-secret ${showSecretWord ? 'show' : ''}`}>
        <h3>Secret Word</h3>
        <p>{secretWord}</p>
      </div>

      <div className="panel full">
        <h3>Next</h3>
        <div className="row">
          <button onClick={onPlayAgain} disabled={!connected}>
            Play Again
          </button>
          <button className="ghost" onClick={onLeave} disabled={!connected}>
            Leave Room
          </button>
        </div>
        {!connected && <p>Waiting to reconnect to server.</p>}
      </div>
    </div>
  );
}
