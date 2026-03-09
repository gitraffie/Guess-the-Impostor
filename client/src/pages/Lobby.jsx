import { useEffect, useMemo, useState } from 'react';
import BearAvatar from '../components/BearAvatar.jsx';
import { PLAYER_COLORS } from '../constants/playerColors.js';
import Portal from '../components/Portal.jsx';

export default function Lobby({
  players,
  roomCode,
  onCreate,
  onJoin,
  onStart,
  onLeave,
  isHost,
  hostId,
  replayPending,
  isCreating,
  isJoining,
  isStarting,
  isLeaving
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

  const displayName = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return 'Player';
    return trimmed.length > 8 ? `${trimmed.slice(0, 8)}…` : trimmed;
  };
  const cardStyleFor = (color) => {
    const hex = String(color || '').trim();
    if (!hex.startsWith('#') || (hex.length !== 4 && hex.length !== 7)) return undefined;
    const fullHex =
      hex.length === 4
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex;
    const r = parseInt(fullHex.slice(1, 3), 16);
    const g = parseInt(fullHex.slice(3, 5), 16);
    const b = parseInt(fullHex.slice(5, 7), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return undefined;
    return {
      background: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.16), rgba(255, 255, 255, 0.85))`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.35)`
    };
  };

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
            <details className="color-picker">
              <summary>Choose your avatar</summary>
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
            </details>
            <button
              onClick={() => onCreate(name, selectedColor)}
              disabled={!canSubmit || isCreating}
            >
              Create
              {isCreating ? <span className="button-spinner" aria-hidden="true" /> : null}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => setShowJoinModal(true)}
              disabled={isCreating || isJoining}
            >
              + Join Room
            </button>
          </div>
        </div>
      )}

      {showJoinModal && (
        <Portal>
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
              <details className="color-picker">
                <summary>Choose your avatar</summary>
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
              </details>
              <div className="row">
                <button
                  onClick={() => onJoin(joinCode, name, selectedColor)}
                  disabled={!canSubmit || isJoining}
                >
                  Join
                  {isJoining ? <span className="button-spinner" aria-hidden="true" /> : null}
                </button>
                <button className="ghost" onClick={() => setShowJoinModal(false)} disabled={isJoining}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {roomCode && (
        <div className="panel full">
          <h3>Room <strong>{roomCode}</strong></h3>
          <p>Waiting for players. Need at least 3 players to start.</p>
          <div className="lobby-grid">
            {players.map((player) => (
              <div key={player.id} className="lobby-card" style={cardStyleFor(player.color)}>
                <BearAvatar color={player.color} size={46} />
                <div className="lobby-card-name">{displayName(player.name)}</div>
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
              disabled={
                players.length < 3 ||
                !isHost ||
                (replayPending && !allReady) ||
                isStarting
              }
            >
              Start Round
              {isStarting ? <span className="button-spinner" aria-hidden="true" /> : null}
            </button>
            <button className="ghost" onClick={onLeave} disabled={isLeaving}>
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
