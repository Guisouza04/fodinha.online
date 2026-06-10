import {
  Card,
  createInitialGameState,
  GameState,
  getForbiddenBid,
  isBlindFirstRound,
  placeBid,
  playCard,
  PlayerState,
  resetForNewGame,
  RoomConfig,
  sanitizeStateForPlayer,
  startGame,
} from '@fodinha/shared';
import { randomBytes } from 'crypto';

export interface Room {
  code: string;
  name: string;
  hostId: string;
  config: RoomConfig;
  gameState: GameState;
  playerSockets: Map<string, string>;
}

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export function createRoom(
  hostId: string,
  hostName: string,
  hostColor: string,
  config: RoomConfig
): Room {
  let code = generateCode();
  while (rooms.has(code)) {
    code = generateCode();
  }

  const host: PlayerState = {
    id: hostId,
    name: hostName,
    color: hostColor,
    lives: config.initialLives,
    eliminated: false,
    hand: [],
    bid: null,
    tricksWon: 0,
    ready: false,
    isHost: true,
  };

  const room: Room = {
    code,
    name: config.name,
    hostId,
    config,
    gameState: createInitialGameState([host], config.maxPlayers, config.initialLives),
    playerSockets: new Map([[hostId, '']]),
  };

  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function joinRoom(
  code: string,
  playerId: string,
  playerName: string,
  playerColor: string
): Room {
  const room = getRoom(code);
  if (!room) throw new Error('Sala não encontrada');

  if (room.gameState.phase !== 'lobby' && room.gameState.phase !== 'game_over') {
    throw new Error('Partida já em andamento');
  }

  const existing = room.gameState.players.find((p) => p.id === playerId);
  if (existing) return room;

  if (room.gameState.players.length >= room.config.maxPlayers) {
    throw new Error('Sala cheia');
  }

  const colorTaken = room.gameState.players.some((p) => p.color === playerColor);
  if (colorTaken) throw new Error('Cor já em uso');

  const player: PlayerState = {
    id: playerId,
    name: playerName,
    color: playerColor,
    lives: room.config.initialLives,
    eliminated: false,
    hand: [],
    bid: null,
    tricksWon: 0,
    ready: false,
    isHost: false,
  };

  room.gameState.players.push(player);
  room.playerSockets.set(playerId, '');
  return room;
}

export function setPlayerSocket(room: Room, playerId: string, socketId: string) {
  room.playerSockets.set(playerId, socketId);
}

export function getPlayerIdBySocket(room: Room, socketId: string): string | undefined {
  for (const [playerId, sid] of room.playerSockets) {
    if (sid === socketId) return playerId;
  }
  return undefined;
}

export function toggleReady(room: Room, playerId: string): Room {
  room.gameState.players = room.gameState.players.map((p) =>
    p.id === playerId ? { ...p, ready: !p.ready } : p
  );
  return room;
}

export function beginGame(room: Room, playerId: string): Room {
  if (playerId !== room.hostId) {
    throw new Error('Apenas o anfitrião pode iniciar');
  }
  room.gameState = startGame(room.gameState);
  return room;
}

export function submitBid(room: Room, playerId: string, bid: number): Room {
  room.gameState = placeBid(room.gameState, playerId, bid);
  return room;
}

export function submitCard(room: Room, playerId: string, card: Card): Room {
  room.gameState = playCard(room.gameState, playerId, card);
  return room;
}

export function newGame(room: Room, playerId: string): Room {
  if (playerId !== room.hostId) {
    throw new Error('Apenas o anfitrião pode iniciar nova partida');
  }
  room.gameState = resetForNewGame(room.gameState);
  return room;
}

export function getBidHint(room: Room, playerId: string): number | null {
  const { gameState } = room;
  if (gameState.phase !== 'bidding' || !gameState.round) return null;

  const round = gameState.round;
  const isLastBidder =
    round.currentBidderIndex === round.bidOrder.length - 1;
  const expectedBidder = round.bidOrder[round.currentBidderIndex];

  if (expectedBidder !== playerId || !isLastBidder) return null;
  if (isBlindFirstRound(gameState)) return null;

  const existingBids = gameState.players
    .filter((p) => p.bid !== null)
    .map((p) => p.bid as number);

  return getForbiddenBid(round.cardsPerPlayer, existingBids);
}

