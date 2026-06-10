import {
  Card,
  GameState,
  PLAYER_COLORS,
  RoomConfig,
  sanitizeStateForPlayer,
} from '@fodinha/shared';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  beginGame,
  createRoom,
  getBidHint,
  getPlayerIdBySocket,
  getRoom,
  joinRoom,
  newGame,
  Room,
  setPlayerSocket,
  submitBid,
  submitCard,
  toggleReady,
} from './rooms.js';
import { schedulePhaseAdvance } from './phaseAdvance.js';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/colors', (_req, res) => {
  res.json(PLAYER_COLORS);
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

function emitRoomState(room: Room) {
  for (const player of room.gameState.players) {
    const socketId = room.playerSockets.get(player.id);
    if (!socketId) continue;
    const state = sanitizeStateForPlayer(room.gameState, player.id);
    const bidHint = getBidHint(room, player.id);
    io.to(socketId).emit('game:state', { state, bidHint });
  }
}

function broadcastRoom(room: Room) {
  io.to(room.code).emit('room:info', {
    code: room.code,
    name: room.name,
    hostId: room.hostId,
    config: room.config,
    playerCount: room.gameState.players.length,
    phase: room.gameState.phase,
  });
  emitRoomState(room);
}

io.on('connection', (socket) => {
  let currentRoomCode: string | null = null;
  let currentPlayerId: string | null = null;

  socket.on(
    'room:create',
    (
      data: {
        playerId: string;
        playerName: string;
        playerColor: string;
        config: RoomConfig;
      },
      callback?: (res: { ok: boolean; room?: { code: string }; error?: string }) => void
    ) => {
      try {
        const room = createRoom(
          data.playerId,
          data.playerName,
          data.playerColor,
          data.config
        );
        currentRoomCode = room.code;
        currentPlayerId = data.playerId;
        socket.join(room.code);
        setPlayerSocket(room, data.playerId, socket.id);
        callback?.({ ok: true, room: { code: room.code } });
        broadcastRoom(room);
      } catch (e) {
        callback?.({ ok: false, error: (e as Error).message });
      }
    }
  );

  socket.on(
    'room:join',
    (
      data: {
        code: string;
        playerId: string;
        playerName: string;
        playerColor: string;
      },
      callback?: (res: { ok: boolean; error?: string }) => void
    ) => {
      try {
        const room = joinRoom(
          data.code,
          data.playerId,
          data.playerName,
          data.playerColor
        );
        currentRoomCode = room.code;
        currentPlayerId = data.playerId;
        socket.join(room.code);
        setPlayerSocket(room, data.playerId, socket.id);
        callback?.({ ok: true });
        broadcastRoom(room);
      } catch (e) {
        callback?.({ ok: false, error: (e as Error).message });
      }
    }
  );

  socket.on('room:ready', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = getRoom(currentRoomCode);
    if (!room) return;
    toggleReady(room, currentPlayerId);
    broadcastRoom(room);
  });

  socket.on('game:start', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = getRoom(currentRoomCode);
    if (!room) return;
    try {
      beginGame(room, currentPlayerId);
      broadcastRoom(room);
    } catch (e) {
      socket.emit('error', { message: (e as Error).message });
    }
  });

  socket.on('game:bid', (data: { bid: number }) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = getRoom(currentRoomCode);
    if (!room) return;
    try {
      submitBid(room, currentPlayerId, data.bid);
      broadcastRoom(room);
    } catch (e) {
      socket.emit('error', { message: (e as Error).message });
    }
  });

  socket.on('game:play', (data: { card: Card }) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = getRoom(currentRoomCode);
    if (!room) return;
    try {
      submitCard(room, currentPlayerId, data.card);
      broadcastRoom(room);
      schedulePhaseAdvance(room, broadcastRoom);
    } catch (e) {
      socket.emit('error', { message: (e as Error).message });
    }
  });

  socket.on('game:new', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = getRoom(currentRoomCode);
    if (!room) return;
    try {
      newGame(room, currentPlayerId);
      broadcastRoom(room);
    } catch (e) {
      socket.emit('error', { message: (e as Error).message });
    }
  });

  socket.on('disconnect', () => {
    if (!currentRoomCode) return;
    const room = getRoom(currentRoomCode);
    if (!room) return;

    const playerId =
      currentPlayerId ?? getPlayerIdBySocket(room, socket.id);
    if (playerId) {
      room.playerSockets.set(playerId, '');
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Servidor Fodinha rodando na porta ${PORT}`);
});
