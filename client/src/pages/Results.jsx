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
  hostId,
  isPlayingAgain,
  isLeaving
}) {
  const [showSecretWord, setShowSecretWord] = useState(false);
  const entryDuration = 450;
  const stagger = 180;
  const flipDuration = 800;
  const baseDelay = 200;

  const winnerNames = useMemo(
    () => (result && result.winnerNames ? result.winnerNames : []),
    [result]
  );

  useEffect(() => {
    setShowSecretWord(false);
    if (!players.length) return undefined;

    const totalDelay =
      baseDelay + entryDuration + flipDuration + (players.length - 1) * stagger + 200;

    const timeout = setTimeout(() => setShowSecretWord(true), totalDelay);
    return () => clearTimeout(timeout);
  }, [players.length, result]);

  const resultTitle = result ? result.winner || 'Game Over' : 'Game Over';
  const resultReason = result ? result.reason : '';
  const flipKey = result
    ? `${result.winner}-${result.impostorName}-${result.reason}-${secretWord}-${players.length}`
    : 'no-result';

  return (
    <div className="card">
      <h2>Results</h2>
      {result && (
        <div className="panel full">
          <h3>The {resultTitle} won!</h3>
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
                autoFlipDelay={baseDelay + entryDuration + index * stagger}
                autoFlipKey={flipKey}
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
          <button onClick={onPlayAgain} disabled={!connected || isPlayingAgain}>
            Play Again
            {isPlayingAgain ? <span className="button-spinner" aria-hidden="true" /> : null}
          </button>
          <button className="ghost" onClick={onLeave} disabled={!connected || isLeaving}>
            Leave Room
            {isLeaving ? <span className="button-spinner" aria-hidden="true" /> : null}
          </button>
        </div>
        {!connected && <p>Waiting to reconnect to server.</p>}
      </div>
    </div>
  );
}
