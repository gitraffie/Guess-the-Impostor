import { useMemo } from 'react';
import BearAvatar from '../components/BearAvatar.jsx';

function formatMs(ms) {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function Voting({ players, votes, clues, playerId, onSubmitVote, timerMs }) {
  const alivePlayers = useMemo(() => players.filter((p) => p.alive), [players]);
  const votedIds = useMemo(() => new Set(votes.map((v) => v.voterId)), [votes]);
  const clueByPlayer = useMemo(() => {
    const map = new Map();
    clues.forEach((item) => {
      map.set(item.playerId, item.clue);
    });
    return map;
  }, [clues]);
  const hasVoted = votedIds.has(playerId);
  const timeUp = timerMs <= 0;

  return (
    <div className="card">
      <h2>Vote</h2>
      <div className="status-row">
        <div className="pill">Time: {formatMs(timerMs)}</div>
        <div className="pill">Votes: {votes.length}/{alivePlayers.length}</div>
      </div>
      <p>Vote out the impostor. If everyone votes the impostor, players win.</p>

      <div className="panel full">
        <h3>Players</h3>
        <div className="list">
          {alivePlayers.map((player) => (
            <div key={player.id} className="list-item status-card player-row">
              <div className="player-inline">
                <BearAvatar color={player.color} size={30} />
                <div className="player-stack">
                  <span className="player-name">{player.name}</span>
                  <span className="player-clue">{clueByPlayer.get(player.id) || 'No clue submitted'}</span>
                </div>
              </div>
              <button
                onClick={() => onSubmitVote(player.id)}
                disabled={hasVoted || timeUp}
              >
                Vote
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel full">
        <h3>Status</h3>
        <div className="list">
          {alivePlayers.map((player) => (
            <div key={`${player.id}-status`} className="list-item status-card player-row">
              <div className="player-inline">
                <BearAvatar color={player.color} size={30} />
                <span className="player-name">{player.name}</span>
              </div>
              {votedIds.has(player.id) ? (
                <span className="badge ready">
                  <span className="check-icon" aria-hidden="true">✓</span>
                  Voted
                </span>
              ) : (
                <span className="badge">Waiting</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
