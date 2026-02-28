import BearAvatar from './BearAvatar.jsx';

export default function ResultFlipCard({ player, isWinner, isImpostor, ...rest }) {
  const roleLabel = isImpostor ? 'Impostor' : 'Normal Player';
  const winnerClass = isWinner ? (isImpostor ? 'winner-impostor' : 'winner-player') : '';

  return (
    <div className={`result-flip-card ${winnerClass}`} {...rest}>
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
