import BearAvatar from '../components/BearAvatar.jsx';

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
  const winnerPlayers = result && result.winnerNames
    ? result.winnerNames
        .map((name) => players.find((player) => player.name === name))
        .filter(Boolean)
    : [];
  const impostorPlayer = result
    ? players.find((player) => player.name === result.impostorName)
    : null;

  return (
    <div className="card">
      <h2>Results</h2>
      {result && (
        <div className="panel full">
          <h3>Winner</h3>
          {winnerPlayers.length > 0 ? (
            <div className="list">
              {winnerPlayers.map((player) => (
                <div key={`winner-${player.id}`} className="list-item player-row">
                  <BearAvatar color={player.color} size={30} />
                  <span className="player-name">{player.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>{result.winner}</p>
          )}
          <p>{result.reason}</p>
        </div>
      )}

      <div className="panel full">
        <h3>Secret Word</h3>
        <p>{secretWord}</p>
      </div>

      {result && (
        <div className="panel full">
          <h3>Impostor</h3>
          {impostorPlayer ? (
            <div className="list">
              <div className="list-item player-row">
                <BearAvatar color={impostorPlayer.color} size={30} />
                <span className="player-name">{impostorPlayer.name}</span>
              </div>
            </div>
          ) : (
            <p>{result.impostorName}</p>
          )}
        </div>
      )}

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
