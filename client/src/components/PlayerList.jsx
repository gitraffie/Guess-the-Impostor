import BearAvatar from './BearAvatar.jsx';

export default function PlayerList({ players, currentTurnPlayerId }) {
  return (
    <div className="player-list">
      {players.map((player) => {
        const isCurrent = player.id === currentTurnPlayerId;
        const isEliminated = player.alive === false;
        return (
          <div
            key={player.id}
            className={`player-tile ${isCurrent ? 'is-current' : ''} ${isEliminated ? 'is-eliminated' : ''}`}
          >
            <div className="player-ring">
              <div className="avatar-wrap">
                <BearAvatar color={player.color} size={48} />
                {isEliminated && <span className="eliminated-badge">ELIMINATED</span>}
              </div>
            </div>
            <span className="player-label">{player.name}</span>
          </div>
        );
      })}
    </div>
  );
}
