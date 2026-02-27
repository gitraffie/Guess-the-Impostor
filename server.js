const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Server } = require('socket.io');
const { randomUUID } = require('crypto');

const PORT = process.env.PORT || 3001;
const TURN_MS = 30000;
const COUNTDOWN_MS = 5000;
const VOTE_MS = 60000;
const ELIMINATION_MS = 2500;
const PLAYER_COLORS = [
  '#e4572e',
  '#17bebb',
  '#ffc914',
  '#2e282a',
  '#76b041',
  '#6943ff',
  '#ff7aa2',
  '#3d6cb9'
];

const wordsPath = path.join(__dirname, 'words.json');
const categories = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

const app = express();
app.use(cors());
app.get('/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const items = [...list];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function pickSecret() {
  const categoryNames = Object.keys(categories);
  const category = pickRandom(categoryNames);
  const word = pickRandom(categories[category]);
  return { category, word };
}

function normalizeWord(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeColor(value) {
  return String(value || '').trim().toLowerCase();
}

function isColorTaken(room, color) {
  const normalized = normalizeColor(color);
  return room.players.some((player) => normalizeColor(player.color) === normalized);
}

function getPublicState(room, viewer) {
  const aliveSet = room.alivePlayerIds || new Set();
  const base = {
    code: room.code,
    phase: room.phase,
    hostId: room.hostId,
    replayPending: room.replayPending,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      role: room.phase === 'results' ? (p.id === room.impostorId ? 'impostor' : 'player') : undefined,
      ready: room.replayPending ? room.readyPlayerIds.has(p.id) : false,
      alive: room.phase === 'lobby' ? true : aliveSet.has(p.id)
    })),
    playerCount: room.players.length,
    clues: [],
    result: room.phase === 'results' ? room.result : null,
    turnEndsAt: room.phase === 'round' ? room.turnEndsAt : null,
    currentTurnPlayerId: room.phase === 'round' ? room.currentTurnPlayerId : null,
    countdownEndsAt: room.phase === 'countdown' ? room.countdownEndsAt : null,
    voteEndsAt: room.phase === 'voting' ? room.voteEndsAt : null,
    eliminationMessage: room.phase === 'elimination' ? room.eliminationMessage : null,
    eliminatedPlayerId: room.phase === 'elimination' ? room.eliminatedPlayerId : null,
    category: viewer && viewer.id === room.impostorId ? room.category : null,
    votes: []
  };

  if (room.phase === 'round' || room.phase === 'voting' || room.phase === 'results') {
    base.clues = room.clues.map((c) => {
      const player = room.players.find((p) => p.id === c.playerId);
      return {
        playerId: c.playerId,
        playerName: player ? player.name : 'Unknown',
        playerColor: player ? player.color : null,
        clue: c.clue
      };
    });
  }

  if (room.phase === 'results') {
    base.secretWord = room.secretWord;
    base.votes = room.votes.map((v) => {
      const voter = room.players.find((p) => p.id === v.voterId);
      const target = room.players.find((p) => p.id === v.targetId);
      return {
        voterName: voter ? voter.name : 'Unknown',
        targetName: target ? target.name : 'Unknown'
      };
    });
  }

  if (room.phase === 'voting') {
    base.votes = room.votes.map((v) => ({ voterId: v.voterId }));
  }

  return base;
}

function emitState(room) {
  room.players.forEach((player) => {
    const payload = getPublicState(room, player);
    io.to(player.socketId).emit('room_state', payload);
  });
}

function removePlayerFromRoom(room, socketId) {
  const idx = room.players.findIndex((p) => p.socketId === socketId);
  if (idx === -1) return false;

  const [removed] = room.players.splice(idx, 1);

  if (removed && removed.id === room.hostId) {
    io.to(room.code).emit('room_closed', { message: 'Host left the room.' });
    clearRoundTimers(room);
    rooms.delete(room.code);
    return true;
  }

  if (removed && room.alivePlayerIds) {
    room.alivePlayerIds.delete(removed.id);
  }

  if (removed && removed.id === room.impostorId) {
    room.impostorId = room.players.length ? pickRandom(room.players).id : null;
  }

  if (room.players.length === 0) {
    clearRoundTimers(room);
    rooms.delete(room.code);
    return true;
  }

  emitState(room);
  return true;
}

function clearRoundTimers(room) {
  if (room.turnInterval) {
    clearInterval(room.turnInterval);
    room.turnInterval = null;
  }
  if (room.turnTimeout) {
    clearTimeout(room.turnTimeout);
    room.turnTimeout = null;
  }
  if (room.countdownInterval) {
    clearInterval(room.countdownInterval);
    room.countdownInterval = null;
  }
  if (room.countdownTimeout) {
    clearTimeout(room.countdownTimeout);
    room.countdownTimeout = null;
  }
  if (room.voteInterval) {
    clearInterval(room.voteInterval);
    room.voteInterval = null;
  }
  if (room.voteTimeout) {
    clearTimeout(room.voteTimeout);
    room.voteTimeout = null;
  }
  if (room.eliminationTimeout) {
    clearTimeout(room.eliminationTimeout);
    room.eliminationTimeout = null;
  }
}

function getAlivePlayers(room) {
  const aliveSet = room.alivePlayerIds || new Set();
  return room.players.filter((p) => aliveSet.has(p.id));
}

function startTurn(room) {
  const currentId = room.turnOrder[room.currentTurnIndex];
  const currentPlayer = room.players.find((p) => p.id === currentId);
  if (!currentPlayer) {
    endRound(room);
    return;
  }

  room.currentTurnPlayerId = currentPlayer.id;
  room.turnEndsAt = Date.now() + TURN_MS;
  emitState(room);

  room.turnInterval = setInterval(() => {
    const remaining = Math.max(room.turnEndsAt - Date.now(), 0);
    io.to(room.code).emit('timer_update', { remainingMs: remaining });
  }, 1000);

  room.turnTimeout = setTimeout(() => {
    advanceTurn(room);
  }, TURN_MS);
}

function advanceTurn(room) {
  clearRoundTimers(room);
  room.currentTurnIndex += 1;
  if (room.currentTurnIndex >= room.turnOrder.length) {
    endRound(room);
    return;
  }
  startTurn(room);
}

function beginCountdown(room, nextRoundNewSecret) {
  room.phase = 'countdown';
  room.countdownEndsAt = Date.now() + COUNTDOWN_MS;
  room.nextRoundNewSecret = nextRoundNewSecret;
  room.countdownUsed = true;
  emitState(room);

  room.countdownInterval = setInterval(() => {
    const remaining = Math.max(room.countdownEndsAt - Date.now(), 0);
    io.to(room.code).emit('timer_update', { remainingMs: remaining, type: 'countdown' });
  }, 1000);

  room.countdownTimeout = setTimeout(() => {
    startRoundNow(room);
  }, COUNTDOWN_MS);
}

function beginElimination(room, nextAction) {
  room.phase = 'elimination';
  room.eliminationMessage = 'Someone has been eliminated.';
  room.eliminatedPlayerId = nextAction.eliminatedPlayerId || null;
  room.pendingNext = nextAction;
  emitState(room);

  room.eliminationTimeout = setTimeout(() => {
    const pending = room.pendingNext;
    room.pendingNext = null;
    room.eliminationMessage = null;
    room.eliminatedPlayerId = null;
    if (!pending) return;
    if (pending.type === 'results') {
      finishGame(room, pending.winner, pending.reason);
      return;
    }
    if (pending.type === 'round') {
      if (pending.useCountdown) {
        beginCountdown(room, pending.newSecret);
        return;
      }
      startRoundNow(room);
    }
  }, ELIMINATION_MS);
}

function startRound(room) {
  if (room.phase !== 'lobby' && !(room.phase === 'results' && room.replayPending)) return;
  if (room.players.length < 3) return;
  if (room.replayPending) {
    const allReady = room.players.length > 0 && room.players.every((p) => room.readyPlayerIds.has(p.id));
    if (!allReady) return;
  }

  startRoundNow(room, true);
}

function startRoundNow(room, forceNewSecret = false) {
  if (!['countdown', 'lobby', 'results', 'elimination'].includes(room.phase)) return;
  clearRoundTimers(room);
  if (room.phase === 'results') {
    room.roundNumber = 0;
    room.countdownUsed = false;
  }
  room.eliminationMessage = null;
  room.eliminatedPlayerId = null;
  room.pendingNext = null;
  const isNewSecret = forceNewSecret || room.nextRoundNewSecret || !room.secretWord;
  if (isNewSecret) {
    const secret = pickSecret();
    room.impostorId = pickRandom(room.players).id;
    room.category = secret.category;
    room.secretWord = secret.word;
    room.alivePlayerIds = new Set(room.players.map((p) => p.id));
  }
  if (!room.alivePlayerIds || room.alivePlayerIds.size === 0) {
    room.alivePlayerIds = new Set(room.players.map((p) => p.id));
  }
  room.clues = [];
  room.votes = [];
  room.phase = 'round';
  room.turnOrder = shuffle(getAlivePlayers(room).map((p) => p.id));
  if (room.turnOrder.length > 1 && room.turnOrder[0] === room.impostorId) {
    const nextIndex = room.turnOrder.findIndex((id) => id !== room.impostorId);
    if (nextIndex > 0) {
      const temp = room.turnOrder[0];
      room.turnOrder[0] = room.turnOrder[nextIndex];
      room.turnOrder[nextIndex] = temp;
    }
  }
  room.currentTurnIndex = 0;
  room.currentTurnPlayerId = null;
  room.readyPlayerIds = new Set();
  room.replayPending = false;
  room.turnEndsAt = null;
  room.countdownEndsAt = null;
  room.voteEndsAt = null;
  room.nextRoundNewSecret = false;
  room.roundNumber = (room.roundNumber || 0) + 1;

  room.players.forEach((player) => {
    const role = player.id === room.impostorId ? 'impostor' : 'player';
    io.to(player.socketId).emit('role', { role });
    if (role === 'player') {
      io.to(player.socketId).emit('secret_word', { word: room.secretWord });
    } else {
      io.to(player.socketId).emit('category', { category: room.category });
    }
  });

  emitState(room);
  startTurn(room);
}

function endRound(room) {
  if (room.phase !== 'round') return;
  clearRoundTimers(room);
  room.turnEndsAt = null;
  room.currentTurnPlayerId = null;
  room.countdownEndsAt = null;
  room.voteEndsAt = null;

  const alivePlayers = getAlivePlayers(room);
  if (alivePlayers.length <= 2 && alivePlayers.some((p) => p.id === room.impostorId)) {
    finishGame(room, 'impostor', 'Only two players remain.');
    return;
  }

  room.phase = 'voting';
  room.votes = [];
  room.voteEndsAt = Date.now() + VOTE_MS;
  emitState(room);

  room.voteInterval = setInterval(() => {
    const remaining = Math.max(room.voteEndsAt - Date.now(), 0);
    io.to(room.code).emit('timer_update', { remainingMs: remaining, type: 'voting' });
  }, 1000);

  room.voteTimeout = setTimeout(() => {
    resolveVotes(room);
  }, VOTE_MS);
}

function finishGame(room, winner, reason) {
  const impostor = room.players.find((p) => p.id === room.impostorId);
  const aliveSet = room.alivePlayerIds || new Set();
  const winnerPlayers =
    winner === 'impostor'
      ? impostor
        ? [impostor.name]
        : ['Impostor']
      : room.players
          .filter((p) => p.id !== room.impostorId && (aliveSet.size === 0 || aliveSet.has(p.id)))
          .map((p) => p.name);
  room.phase = 'results';
  room.result = {
    winner,
    reason,
    winnerNames: winnerPlayers,
    impostorName: impostor ? impostor.name : 'Unknown'
  };
  room.readyPlayerIds = new Set();
  emitState(room);
}

function resolveVotes(room) {
  clearRoundTimers(room);
  const alivePlayers = getAlivePlayers(room);
  if (alivePlayers.length <= 2 && alivePlayers.some((p) => p.id === room.impostorId)) {
    finishGame(room, 'impostor', 'Only two players remain.');
    return;
  }

  const counts = new Map();
  room.votes.forEach((vote) => {
    counts.set(vote.targetId, (counts.get(vote.targetId) || 0) + 1);
  });

  let maxVotes = 0;
  counts.forEach((count) => {
    if (count > maxVotes) maxVotes = count;
  });

  const topTargets = Array.from(counts.entries())
    .filter(([, count]) => count === maxVotes)
    .map(([id]) => id);

  if (topTargets.length !== 1) {
    const useCountdown = room.roundNumber === 1 && !room.countdownUsed;
    if (useCountdown) {
      beginCountdown(room, false);
      return;
    }
    startRoundNow(room);
    return;
  }

  const targetId = topTargets[0];

  if (targetId === room.impostorId) {
    room.alivePlayerIds.delete(targetId);
    beginElimination(room, {
      type: 'results',
      eliminatedPlayerId: targetId,
      winner: 'players',
      reason: 'The impostor was voted out.'
    });
    return;
  }

  room.alivePlayerIds.delete(targetId);

  const remaining = getAlivePlayers(room);
  if (remaining.length <= 2 && remaining.some((p) => p.id === room.impostorId)) {
    beginElimination(room, {
      type: 'results',
      winner: 'impostor',
      reason: 'Only two players remain.'
    });
    return;
  }

  const useCountdown = room.roundNumber === 1 && !room.countdownUsed;
  beginElimination(room, {
    type: 'round',
    eliminatedPlayerId: targetId,
    newSecret: false,
    useCountdown
  });
}

function resetRoom(room) {
  clearRoundTimers(room);
  room.phase = 'lobby';
  room.impostorId = null;
  room.secretWord = null;
  room.category = null;
  room.clues = [];
  room.votes = [];
  room.alivePlayerIds = new Set();
  room.turnOrder = [];
  room.result = null;
  room.replayPending = false;
  room.readyPlayerIds = new Set();
  room.turnEndsAt = null;
  room.currentTurnIndex = 0;
  room.currentTurnPlayerId = null;
  room.nextRoundNewSecret = false;
  room.countdownEndsAt = null;
  room.countdownUsed = false;
  room.roundNumber = 0;
  room.eliminationMessage = null;
  room.eliminatedPlayerId = null;
  room.pendingNext = null;
  emitState(room);
}


io.on('connection', (socket) => {
  socket.on('create_room', ({ name, color }) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;
    const normalizedColor = normalizeColor(color);
    if (!PLAYER_COLORS.includes(normalizedColor)) {
      socket.emit('error_message', { message: 'Please choose a valid character color.' });
      return;
    }

    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const player = {
      id: randomUUID(),
      name: trimmed,
      color: normalizedColor,
      socketId: socket.id
    };

    const room = {
      code,
      hostId: player.id,
      players: [player],
      phase: 'lobby',
      impostorId: null,
      secretWord: null,
      category: null,
      clues: [],
      votes: [],
      alivePlayerIds: new Set(),
      turnOrder: [],
      result: null,
      readyPlayerIds: new Set(),
      replayPending: false,
      countdownEndsAt: null,
      countdownInterval: null,
      countdownTimeout: null,
      voteEndsAt: null,
      voteInterval: null,
      voteTimeout: null,
      nextRoundNewSecret: false,
      countdownUsed: false,
      roundNumber: 0,
      eliminationMessage: null,
      eliminatedPlayerId: null,
      eliminationTimeout: null,
      pendingNext: null,
      turnEndsAt: null,
      currentTurnIndex: 0,
      currentTurnPlayerId: null,
      turnInterval: null,
      turnTimeout: null
    };

    rooms.set(code, room);
    socket.join(code);
    socket.emit('room_joined', { code, playerId: player.id, state: getPublicState(room) });
  });

  socket.on('join_room', ({ code, name, color }) => {
    const roomCode = String(code || '').trim().toUpperCase();
    const trimmed = String(name || '').trim();
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('error_message', { message: 'Room not found.' });
      return;
    }

    if (room.phase !== 'lobby' && !room.replayPending) {
      socket.emit('error_message', { message: 'Game already started.' });
      return;
    }

    if (!trimmed) return;
    const normalizedColor = normalizeColor(color);
    if (!PLAYER_COLORS.includes(normalizedColor)) {
      socket.emit('error_message', { message: 'Please choose a valid character color.' });
      return;
    }
    if (isColorTaken(room, normalizedColor)) {
      socket.emit('error_message', { message: 'That color is already taken. Pick another.' });
      return;
    }

    const player = {
      id: randomUUID(),
      name: trimmed,
      color: normalizedColor,
      socketId: socket.id
    };

    room.players.push(player);
    if (room.replayPending) {
      room.readyPlayerIds.add(player.id);
    }
    if (room.alivePlayerIds) {
      room.alivePlayerIds.add(player.id);
    }
    socket.join(roomCode);
    socket.emit('room_joined', { code: roomCode, playerId: player.id, state: getPublicState(room) });
    emitState(room);
  });

  socket.on('start_round', ({ code }) => {
    const room = rooms.get(String(code || '').trim().toUpperCase());
    if (!room) return;
    const host = room.players.find((p) => p.id === room.hostId);
    if (!host || host.socketId !== socket.id) return;
    startRound(room);
  });

  socket.on('submit_clue', ({ code, playerId, clue }) => {
    const room = rooms.get(String(code || '').trim().toUpperCase());
    if (!room || room.phase !== 'round') return;
    const player = room.players.find((p) => p.id === playerId && p.socketId === socket.id);
    if (!player) return;
    if (!room.alivePlayerIds || !room.alivePlayerIds.has(playerId)) return;
    if (room.currentTurnPlayerId !== playerId) return;

    const already = room.clues.find((c) => c.playerId === playerId);
    if (already) return;

    const trimmed = String(clue || '').trim();
    if (!trimmed) return;

    room.clues.push({ playerId, clue: trimmed });
    emitState(room);

    advanceTurn(room);
  });

  socket.on('submit_vote', ({ code, playerId, targetId }) => {
    const room = rooms.get(String(code || '').trim().toUpperCase());
    if (!room || room.phase !== 'voting') return;
    const player = room.players.find((p) => p.id === playerId && p.socketId === socket.id);
    if (!player) return;
    if (!room.alivePlayerIds || !room.alivePlayerIds.has(playerId)) return;
    if (!room.alivePlayerIds.has(targetId)) return;

    const already = room.votes.find((v) => v.voterId === playerId);
    if (already) return;

    room.votes.push({ voterId: playerId, targetId });
    emitState(room);

    const aliveCount = getAlivePlayers(room).length;
    if (room.votes.length >= aliveCount) {
      resolveVotes(room);
    }
  });

  socket.on('leave_room', ({ code }, callback) => {
    const room = rooms.get(String(code || '').trim().toUpperCase());
    if (!room) {
      if (typeof callback === 'function') callback({ ok: false, message: 'Room not found.' });
      return;
    }
    socket.leave(room.code);
    removePlayerFromRoom(room, socket.id);
    socket.emit('left_room');
    if (typeof callback === 'function') callback({ ok: true });
  });

  socket.on('play_again', ({ code, playerId }, callback) => {
    const room = rooms.get(String(code || '').trim().toUpperCase());
    if (!room) {
      if (typeof callback === 'function') callback({ ok: false, message: 'Room not found.' });
      return;
    }
    if (room.phase !== 'results') {
      if (typeof callback === 'function') callback({ ok: false, message: 'Game is not in results yet.' });
      return;
    }
    const player = room.players.find((p) => p.id === playerId && p.socketId === socket.id);
    if (!player) {
      if (typeof callback === 'function') callback({ ok: false, message: 'Player not found.' });
      return;
    }

    room.readyPlayerIds.add(player.id);
    room.replayPending = true;
    emitState(room);
    if (typeof callback === 'function') callback({ ok: true });
  });

  socket.on('disconnect', () => {
    rooms.forEach((room) => {
      removePlayerFromRoom(room, socket.id);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
