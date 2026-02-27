import { useEffect, useMemo, useState } from 'react';
import BearAvatar from '../components/BearAvatar.jsx';
import { PLAYER_COLORS } from '../constants/playerColors.js';

export default function Lobby({
  players,
  roomCode,
  onCreate,
  onJoin,
  onStart,
  onLeave,
  isHost,
  hostId,
  replayPending
}) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const allReady = players.length > 0 && players.every((player) => player.ready);
  const canSubmit = Boolean(name.trim() && selectedColor);
  const takenColors = useMemo(
    () => new Set(players.map((player) => String(player.color || '').toLowerCase())),
    [players]
  );

  useEffect(() => {
    if (!selectedColor) return;
    if (takenColors.has(selectedColor.toLowerCase())) {
      setSelectedColor('');
    }
  }, [selectedColor, takenColors]);

  useEffect(() => {
    if (roomCode) {
      setShowJoinModal(false);
    }
  }, [roomCode]);

  return (
    <div className="card">
      <h2>Lobby</h2>

      {!roomCode && (
        <div className="split">
          <div className="panel">
            <h3>Create Room</h3>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div className="color-picker">
              <p>Choose your avatar</p>
              <div className="color-grid avatar-grid">
                {PLAYER_COLORS.map((entry, index) => (
                  <button
                    key={`create-${entry.color}`}
                    type="button"
                    className={`color-swatch avatar-swatch ${selectedColor === entry.color ? 'selected' : ''}`}
                    onClick={() => setSelectedColor(entry.color)}
                    disabled={takenColors.has(entry.color.toLowerCase())}
                    aria-label={`Select avatar ${index + 1}`}
                  >
                    <BearAvatar
                      color={entry.color}
                      size={52}
                      name={entry.name}
                      glowing={selectedColor === entry.color}
                    />
                    <span className="avatar-label">{entry.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => onCreate(name, selectedColor)} disabled={!canSubmit}>
              Create
            </button>
            <button type="button" className="ghost" onClick={() => setShowJoinModal(true)}>
              + Join Room
            </button>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Join Room</h3>
            <input
              type="text"
              placeholder="Room code"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            />
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div className="color-picker">
              <p>Choose your avatar</p>
              <div className="color-grid avatar-grid">
                {PLAYER_COLORS.map((entry, index) => (
                  <button
                    key={`join-${entry.color}`}
                    type="button"
                    className={`color-swatch avatar-swatch ${selectedColor === entry.color ? 'selected' : ''}`}
                    onClick={() => setSelectedColor(entry.color)}
                    disabled={takenColors.has(entry.color.toLowerCase())}
                    aria-label={`Select avatar ${index + 1}`}
                  >
                    <BearAvatar
                      color={entry.color}
                      size={52}
                      name={entry.name}
                      glowing={selectedColor === entry.color}
                    />
                    <span className="avatar-label">{entry.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="row">
              <button onClick={() => onJoin(joinCode, name, selectedColor)} disabled={!canSubmit}>
                Join
              </button>
              <button className="ghost" onClick={() => setShowJoinModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {roomCode && (
        <div className="panel full">
          <h3>Room {roomCode}</h3>
          <p>Waiting for players. Need at least 3 players to start.</p>
          <div className="lobby-grid">
            {players.map((player) => (
              <div key={player.id} className="lobby-card">
                <BearAvatar color={player.color} size={46} />
                <div className="lobby-card-name">{player.name}</div>
                <div className="lobby-card-badges">
                  {hostId === player.id ? <span className="badge">Host</span> : null}
                  {replayPending ? (
                    player.ready ? <span className="badge ready">Ready</span> : <span className="badge">Not Ready</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="row">
            <button
              onClick={onStart}
              disabled={players.length < 3 || !isHost || (replayPending && !allReady)}
            >
              Start Round
            </button>
            <button className="ghost" onClick={onLeave}>
              Leave Room
            </button>
          </div>
          {!isHost && <p>Only the host can start the game.</p>}
          {replayPending && isHost && !allReady && <p>Waiting for all players to be ready.</p>}
        </div>
      )}
    </div>
  );
}
