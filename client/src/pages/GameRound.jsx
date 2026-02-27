import { useEffect, useMemo, useState } from 'react';
import BearAvatar from '../components/BearAvatar.jsx';
import PlayerList from '../components/PlayerList.jsx';

function formatMs(ms) {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function GameRound({
  players,
  clues,
  timerMs,
  role,
  secretWord,
  category,
  onSubmitClue,
  playerId,
  currentTurnPlayerId
}) {
  const [clue, setClue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showTurnModal, setShowTurnModal] = useState(true);
  const submittedCount = useMemo(() => clues.length, [clues]);
  const isMyTurn = playerId && currentTurnPlayerId === playerId;
  const currentPlayer = players.find((p) => p.id === currentTurnPlayerId);
  const turnLabel = isMyTurn
    ? "It's your turn"
    : currentPlayer
        ? `It's ${currentPlayer.name}'s turn`
        : 'Waiting for next turn...';

  useEffect(() => {
    setShowTurnModal(true);
    const timer = setTimeout(() => {
      setShowTurnModal(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [currentTurnPlayerId]);

  return (
    <div className="card">
      {showTurnModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>
              {isMyTurn && turnLabel}
              {!isMyTurn && (
                <>
                  It's <span className="turn-name">{currentPlayer ? currentPlayer.name : ''}</span>'s
                  turn
                </>
              )}
            </h3>
            {isMyTurn ? <p>Submit one clue word now.</p> : <p>Please wait.</p>}
          </div>
        </div>
      )}
      <h2>Round</h2>
      <div className="status-row">
        <div className="pill">Players: {players.length}</div>
        <div className="pill">Time: {formatMs(timerMs)}</div>
      </div>

      <div className="panel full">
        {role === 'impostor' ? (
          <p className="highlight">
            You are the <span className="impostor-text">IMPOSTOR</span>. Category: {category}
          </p>
        ) : (
          <p className="highlight">Secret word: {secretWord}</p>
        )}
      </div>

      <div className="panel full">
        <h3>Players</h3>
        <PlayerList players={players} currentTurnPlayerId={currentTurnPlayerId} />
      </div>

      {isMyTurn && (
        <div className="panel full">
          <h3>Submit one clue word</h3>
          <p>
            {currentPlayer ? (
              <span className="player-row">
              <BearAvatar color={currentPlayer.color} size={28} />
                <span className="player-name">Current turn: {currentPlayer.name}</span>
              </span>
            ) : (
              'Waiting for next turn...'
            )}
          </p>
          <div className="row">
            <input
              type="text"
              value={clue}
              onChange={(event) => setClue(event.target.value)}
              placeholder="Enter a single clue"
              disabled={!isMyTurn || submitted}
            />
            <button
              onClick={() => {
                onSubmitClue(clue);
                setClue('');
                setSubmitted(true);
              }}
              disabled={!clue.trim() || submitted || !isMyTurn}
            >
              Submit
            </button>
          </div>
          <p>{submittedCount} of {players.length} clues submitted.</p>
        </div>
      )}

      <div className="panel full">
        <h3>Clues</h3>
        <div className="list">
          {clues.map((item, index) => (
            <div key={`${item.playerName}-${index}`} className="list-item player-row">
              <BearAvatar color={item.playerColor} size={30} />
              <span className="player-name">
                <strong>{item.playerName}:</strong> {item.clue}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
