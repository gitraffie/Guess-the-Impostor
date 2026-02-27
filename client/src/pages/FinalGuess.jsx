import { useState } from 'react';
import BearAvatar from '../components/BearAvatar.jsx';

export default function FinalGuess({ players, finalGuesses, onSubmitGuess }) {
  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const guessedIds = new Set(finalGuesses.map((item) => item.playerId));

  return (
    <div className="card">
      <h2>Final Guess</h2>
      <p>Enter the secret word. One shot only.</p>
      <div className="row">
        <input
          type="text"
          value={guess}
          onChange={(event) => setGuess(event.target.value)}
          placeholder="Your guess"
        />
        <button
          onClick={() => {
            onSubmitGuess(guess);
            setGuess('');
            setSubmitted(true);
          }}
          disabled={!guess.trim() || submitted}
        >
          Submit
        </button>
      </div>
      <p>{finalGuesses.length} of {players.length} guesses submitted.</p>

      <div className="panel full">
        <h3>Player Status</h3>
        <div className="list">
          {players.map((player) => (
            <div key={player.id} className="list-item status-card player-row">
              <div className="player-inline">
                <BearAvatar color={player.color} size={30} />
                <span className="player-name">{player.name}</span>
              </div>
              {guessedIds.has(player.id) ? (
                <span className="badge ready">
                  <span className="check-icon" aria-hidden="true">✓</span>
                  Submitted
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
