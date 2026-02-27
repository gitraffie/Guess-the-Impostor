import BearAvatar from './BearAvatar.jsx';

export default function PlayerList({ players, currentTurnPlayerId }) {
  return (
    <div className="player-list">
      {players.map((player) => {
        const isCurrent = player.id === currentTurnPlayerId;
        return (
          <div key={player.id} className={`player-tile ${isCurrent ? 'is-current' : ''}`}>
            <div className="player-ring">
              <BearAvatar color={player.color} size={48} />
            </div>
            <span className="player-label">{player.name}</span>
          </div>
        );
      })}
    </div>
  );
}
