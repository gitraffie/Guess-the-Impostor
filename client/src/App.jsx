import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import Lobby from './pages/Lobby.jsx';
import GameRound from './pages/GameRound.jsx';
import Voting from './pages/Voting.jsx';
import Results from './pages/Results.jsx';
import BearAvatar from './components/BearAvatar.jsx';
import EliminationAnimation from './components/EliminationAnimation.jsx';
import logo from '../images/guess_the_impostor_logo.png';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function App() {
  const socket = useMemo(() => io(SERVER_URL), []);
  const [phase, setPhase] = useState('lobby');
  const [players, setPlayers] = useState([]);
  const [clues, setClues] = useState([]);
  const [votes, setVotes] = useState([]);
  const [result, setResult] = useState(null);
  const [hostId, setHostId] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [category, setCategory] = useState('');
  const [role, setRole] = useState('player');
  const [timerMs, setTimerMs] = useState(0);
  const [error, setError] = useState('');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [connected, setConnected] = useState(false);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(null);
  const [replayPending, setReplayPending] = useState(false);
  const [eliminationMessage, setEliminationMessage] = useState('');
  const [eliminatedPlayerId, setEliminatedPlayerId] = useState('');

  function resetClientState() {
    setPhase('lobby');
    setPlayers([]);
    setClues([]);
    setVotes([]);
    setResult(null);
    setRoomCode('');
    setPlayerId('');
    setHostId('');
    setSecretWord('');
    setCategory('');
    setRole('player');
    setTimerMs(0);
    setError('');
    setCurrentTurnPlayerId(null);
    setReplayPending(false);
    setEliminationMessage('');
    setEliminatedPlayerId('');
  }

  useEffect(() => {
    const handleRoomJoined = ({ code, playerId: id, state }) => {
      setRoomCode(code);
      setPlayerId(id);
      applyState(state);
      setError('');
    };

    const handleRoomState = (state) => {
      applyState(state);
    };

    const handleSecretWord = ({ word }) => {
      setSecretWord(word);
    };

    const handleCategory = ({ category }) => {
      setCategory(category);
    };

    const handleRole = ({ role }) => {
      setRole(role);
      if (role === 'impostor') {
        setSecretWord('');
      }
    };

    const handleTimerUpdate = ({ remainingMs }) => {
      setTimerMs(remainingMs);
    };

    const handleError = ({ message }) => {
      setError(message);
    };

    const handleLeftRoom = () => {
      resetClientState();
    };

    const handleRoomClosed = ({ message }) => {
      resetClientState();
      setError(message || 'Room closed.');
    };

    const handleConnect = () => {
      setConnected(true);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleConnectError = () => {
      setConnected(false);
    };

    socket.on('room_joined', handleRoomJoined);

    socket.on('room_state', handleRoomState);
    socket.on('secret_word', handleSecretWord);
    socket.on('category', handleCategory);
    socket.on('role', handleRole);
    socket.on('timer_update', handleTimerUpdate);
    socket.on('error_message', handleError);
    socket.on('left_room', handleLeftRoom);
    socket.on('room_closed', handleRoomClosed);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('room_joined', handleRoomJoined);
      socket.off('room_state', handleRoomState);
      socket.off('secret_word', handleSecretWord);
      socket.off('category', handleCategory);
      socket.off('role', handleRole);
      socket.off('timer_update', handleTimerUpdate);
      socket.off('error_message', handleError);
      socket.off('left_room', handleLeftRoom);
      socket.off('room_closed', handleRoomClosed);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [socket]);

  function applyState(state) {
    setPhase(state.phase);
    setPlayers(state.players || []);
    setClues(state.clues || []);
    setVotes(state.votes || []);
    setResult(state.result || null);
    setHostId(state.hostId || '');
    setCurrentTurnPlayerId(state.currentTurnPlayerId || null);
    setReplayPending(Boolean(state.replayPending));
    setCategory(state.category || '');
    setEliminationMessage(state.eliminationMessage || '');
    setEliminatedPlayerId(state.eliminatedPlayerId || '');
    if (state.secretWord) {
      setSecretWord(state.secretWord);
    }
    if (state.turnEndsAt) {
      setTimerMs(Math.max(state.turnEndsAt - Date.now(), 0));
    }
    if (state.countdownEndsAt) {
      setTimerMs(Math.max(state.countdownEndsAt - Date.now(), 0));
    }
    if (state.voteEndsAt) {
      setTimerMs(Math.max(state.voteEndsAt - Date.now(), 0));
    }
  }

  function handleCreate(name, color) {
    socket.emit('create_room', { name, color });
  }

  function handleJoin(code, name, color) {
    socket.emit('join_room', { code, name, color });
  }

  function handleStart() {
    socket.emit('start_round', { code: roomCode });
  }

  function handleClue(clue) {
    socket.emit('submit_clue', { code: roomCode, playerId, clue });
  }

  function handleVote(targetId) {
    socket.emit('submit_vote', { code: roomCode, playerId, targetId });
  }

  function handleLeave() {
    if (!roomCode) return;
    if (!connected) {
      setError('Not connected to server.');
      return;
    }
    socket.emit('leave_room', { code: roomCode }, (response) => {
      if (!response || !response.ok) {
        setError(response && response.message ? response.message : 'Failed to leave room.');
        return;
      }
      setShowLeaveConfirm(false);
    });
  }

  function handlePlayAgain() {
    if (!roomCode) return;
    if (!connected) {
      setError('Not connected to server.');
      return;
    }
    socket.emit('play_again', { code: roomCode, playerId }, (response) => {
      if (!response || !response.ok) {
        setError(response && response.message ? response.message : 'Failed to reset room.');
      }
    });
  }

  const me = players.find((player) => player.id === playerId);
  const isReady = Boolean(me && me.ready);
  const isAlive = me ? me.alive !== false : true;
  const viewPhase =
    phase === 'results' && replayPending && isReady ? 'lobby' : phase;

  const isSpectator = !isAlive && (viewPhase === 'round' || viewPhase === 'voting');
  const winnerClass =
    viewPhase === 'results' && result && result.winner
      ? result.winner === 'impostor'
        ? 'impostor-win'
        : 'players-win'
      : '';

  const eliminatedPlayer = eliminatedPlayerId
    ? players.find((player) => player.id === eliminatedPlayerId)
    : null;
  const eliminationPlayer =
    eliminatedPlayer && playerId
      ? { ...eliminatedPlayer, isLocal: eliminatedPlayer.id === playerId }
      : eliminatedPlayer;
  const eliminationColor = eliminatedPlayer && eliminatedPlayer.color
    ? eliminatedPlayer.color
    : '#1b1b1b';

  return (
    <div
      className={`app ${isSpectator ? 'spectator' : ''} ${winnerClass} ${
        phase === 'elimination' ? 'elimination-shake' : ''
      }`}
    >
      <header className="header">
        <div className="brand">
          <img className="logo" src={logo} alt="Guess the Impostor logo" />
          <h1>Guess the Impostor</h1>
        </div>
        {roomCode && <span className="room-pill">Room {roomCode}</span>}
      </header>

      {error && <div className="error">{error}</div>}

      {viewPhase === 'lobby' && (
        <Lobby
          players={players}
          roomCode={roomCode}
          onCreate={handleCreate}
          onJoin={handleJoin}
          onStart={handleStart}
          onLeave={() => setShowLeaveConfirm(true)}
          isHost={playerId && hostId && playerId === hostId}
          hostId={hostId}
          replayPending={replayPending}
        />
      )}

      {viewPhase === 'round' && isAlive && (
        <GameRound
          players={players}
          clues={clues}
          timerMs={timerMs}
          role={role}
          secretWord={secretWord}
          category={category}
          playerId={playerId}
          currentTurnPlayerId={currentTurnPlayerId}
          onSubmitClue={handleClue}
        />
      )}

      {(viewPhase === 'round' || viewPhase === 'voting') && !isAlive && (
        <div className="card">
          <h2>Spectator Mode</h2>
          <p>You were eliminated. Watch the remaining players.</p>

          <div className="panel full">
            <h3>Active Players</h3>
            <div className="list">
              {players.filter((p) => p.alive).map((player) => (
                <div key={player.id} className="list-item player-row">
                  <BearAvatar color={player.color} size={34} />
                  <span className="player-name">{player.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel full">
            <h3>Clues</h3>
            <div className="list">
              {clues.map((item, index) => (
                <div key={`${item.playerName}-${index}`} className="list-item player-row">
                  <BearAvatar color={item.playerColor} size={34} />
                  <span className="player-name">
                    <strong>{item.playerName}:</strong> {item.clue}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {viewPhase === 'voting' && (
            <div className="panel full">
              <h3>Voting Progress</h3>
              <p>{votes.length} votes submitted.</p>
            </div>
          )}
        </div>
      )}

      {viewPhase === 'voting' && isAlive && (
        <Voting
          players={players}
          votes={votes}
          clues={clues}
          playerId={playerId}
          onSubmitVote={handleVote}
          timerMs={timerMs}
        />
      )}

      {viewPhase === 'results' && (
        <Results
          players={players}
          clues={clues}
          votes={votes}
          result={result}
          secretWord={secretWord}
          onPlayAgain={handlePlayAgain}
          onLeave={() => setShowLeaveConfirm(true)}
          connected={connected}
          hostId={hostId}
        />
      )}

      {phase === 'countdown' && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Game starting in</h3>
            <p className="countdown">{Math.max(1, Math.ceil(timerMs / 1000))}s</p>
          </div>
        </div>
      )}

      {phase === 'elimination' && (
        <EliminationAnimation
          eliminatedPlayer={eliminationPlayer}
          color={eliminationColor}
        />
      )}

      {showLeaveConfirm && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Leave room?</h3>
            <p>You will be removed from the current game.</p>
            <div className="row">
              <button className="ghost" onClick={() => setShowLeaveConfirm(false)}>
                Cancel
              </button>
              <button onClick={handleLeave}>Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
