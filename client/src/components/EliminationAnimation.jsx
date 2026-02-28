import BearAvatar from './BearAvatar.jsx';

export default function EliminationAnimation({ eliminatedPlayer, color }) {
  const isLocalPlayer = Boolean(eliminatedPlayer && eliminatedPlayer.isLocal);
  const displayName = eliminatedPlayer && eliminatedPlayer.name ? eliminatedPlayer.name : 'Player';

  return (
    <div className="elimination-overlay">
      <div className="elimination-vignette" />
      <div className="elimination-shake-layer">
        <div className="elimination-stage">
          <div className="elimination-burst" />
          <div className="elimination-avatar">
            <BearAvatar color={color} size={140} name={displayName} glowing />
          </div>
          <p className="elimination-label">{displayName}</p>
          <h3 className="elimination-message">
            {isLocalPlayer ? 'You were eliminated.' : 'Someone has been eliminated.'}
          </h3>
        </div>
      </div>
    </div>
  );
}
