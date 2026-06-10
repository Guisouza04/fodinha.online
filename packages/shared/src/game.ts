import { calculateLivesLost, isValidBid } from './bidding';
import { getTrickWinner } from './cards';
import { cardsEqual, createDeck, shuffleDeck } from './deck';
import { getManilhaRank } from './manilha';
import { getCardsPerPlayer } from './round';
import {
  Card,
  GameState,
  PlayedCard,
  PlayerState,
  RoundResult,
  RoundState,
} from './types';

export function createInitialGameState(
  players: PlayerState[],
  maxPlayers: number,
  initialLives: number
): GameState {
  return {
    phase: 'lobby',
    players: players.map((p) => ({
      ...p,
      lives: initialLives,
      eliminated: false,
      hand: [],
      bid: null,
      tricksWon: 0,
      ready: false,
    })),
    round: null,
    winnerId: null,
    maxPlayers,
    initialLives,
  };
}

export function getActivePlayers(state: GameState): PlayerState[] {
  return state.players.filter((p) => !p.eliminated);
}

export function canStartGame(state: GameState): boolean {
  const active = getActivePlayers(state);
  return (
    state.phase === 'lobby' &&
    active.length >= 2 &&
    active.every((p) => p.ready)
  );
}

export function startGame(state: GameState, random = Math.random): GameState {
  if (!canStartGame(state)) {
    throw new Error('Não é possível iniciar a partida');
  }

  const active = getActivePlayers(state);
  const dealerId = active[0].id;
  return startRound(
    {
      ...state,
      phase: 'bidding',
      winnerId: null,
    },
    1,
    dealerId,
    random
  );
}

function startRound(
  state: GameState,
  roundNumber: number,
  dealerId: string,
  random = Math.random
): GameState {
  const active = getActivePlayers(state);
  const cardsPerPlayer = getCardsPerPlayer(roundNumber, active.length);
  const deck = shuffleDeck(createDeck(), random);

  const totalNeeded = cardsPerPlayer * active.length + 1;
  if (deck.length < totalNeeded) {
    throw new Error('Baralho insuficiente');
  }

  const vira = deck[cardsPerPlayer * active.length];
  const manilhaRank = getManilhaRank(vira);

  const players = state.players.map((p) => {
    if (p.eliminated) {
      return { ...p, hand: [], bid: null, tricksWon: 0 };
    }
    const activeIndex = active.findIndex((a) => a.id === p.id);
    const handStart = activeIndex * cardsPerPlayer;
    const hand = deck.slice(handStart, handStart + cardsPerPlayer);
    return { ...p, hand, bid: null, tricksWon: 0 };
  });

  const dealerIndex = active.findIndex((p) => p.id === dealerId);
  const safeDealerIndex = dealerIndex >= 0 ? dealerIndex : 0;
  const bidOrder = getBidOrder(active, safeDealerIndex);
  const leaderIndex = (safeDealerIndex + 1) % active.length;

  const round: RoundState = {
    number: roundNumber,
    cardsPerPlayer,
    vira,
    manilhaRank,
    dealerId: active[safeDealerIndex].id,
    currentPlayerIndex: leaderIndex,
    bidOrder: bidOrder.map((p) => p.id),
    currentBidderIndex: 0,
    currentTrick: null,
    completedTricks: [],
    lastTrickWinnerId: null,
    lastTrickCards: null,
    roundResults: null,
  };

  return {
    ...state,
    phase: 'bidding',
    players,
    round,
  };
}

function getBidOrder(
  active: PlayerState[],
  dealerIndex: number
): PlayerState[] {
  const order: PlayerState[] = [];
  for (let i = 1; i <= active.length; i++) {
    order.push(active[(dealerIndex + i) % active.length]);
  }
  return order;
}

function getNextDealerId(active: PlayerState[], currentDealerId: string): string {
  const idx = active.findIndex((p) => p.id === currentDealerId);
  const nextIdx = idx >= 0 ? (idx + 1) % active.length : 0;
  return active[nextIdx].id;
}

export function placeBid(
  state: GameState,
  playerId: string,
  bid: number
): GameState {
  if (state.phase !== 'bidding' || !state.round) {
    throw new Error('Não está na fase de palpites');
  }

  const round = state.round;
  const expectedBidderId = round.bidOrder[round.currentBidderIndex];
  if (playerId !== expectedBidderId) {
    throw new Error('Não é sua vez de palpitar');
  }

  const existingBids = state.players
    .filter((p) => p.bid !== null)
    .map((p) => p.bid as number);

  const isLastBidder = round.currentBidderIndex === round.bidOrder.length - 1;
  const enforceLastBidderRule = !isBlindFirstRound(state);

  if (
    !isValidBid(
      bid,
      round.cardsPerPlayer,
      existingBids,
      isLastBidder,
      enforceLastBidderRule
    )
  ) {
    throw new Error('Palpite inválido');
  }

  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, bid } : p
  );

  const nextBidderIndex = round.currentBidderIndex + 1;

  if (nextBidderIndex >= round.bidOrder.length) {
    const active = getActivePlayers({ ...state, players });
    const leaderId = active[round.currentPlayerIndex].id;

    return {
      ...state,
      phase: 'playing',
      players,
      round: {
        ...round,
        currentBidderIndex: nextBidderIndex,
        currentTrick: { cards: [], leaderId },
      },
    };
  }

  return {
    ...state,
    players,
    round: { ...round, currentBidderIndex: nextBidderIndex },
  };
}

export function playCard(
  state: GameState,
  playerId: string,
  card: Card
): GameState {
  const round = state.round;
  const currentTrick = round?.currentTrick;

  if (state.phase !== 'playing' || !round || !currentTrick) {
    throw new Error('Não está na fase de jogo');
  }
  const active = getActivePlayers(state);
  const currentPlayer = active[round.currentPlayerIndex];

  if (currentPlayer.id !== playerId) {
    throw new Error('Não é sua vez de jogar');
  }

  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.hand.some((c) => cardsEqual(c, card))) {
    throw new Error('Carta inválida');
  }

  const players = state.players.map((p) => {
    if (p.id !== playerId) return p;
    return { ...p, hand: p.hand.filter((c) => !cardsEqual(c, card)) };
  });

  const playedCard: PlayedCard = { playerId, card };
  const trickCards = [...currentTrick.cards, playedCard];

  if (trickCards.length < active.length) {
    const nextIndex = (round.currentPlayerIndex + 1) % active.length;
    return {
      ...state,
      players,
      round: {
        ...round,
        currentPlayerIndex: nextIndex,
        currentTrick: { leaderId: currentTrick.leaderId, cards: trickCards },
      },
    };
  }

  const winnerId = getTrickWinner(trickCards, round.manilhaRank!);
  const updatedPlayers = players.map((p) =>
    p.id === winnerId ? { ...p, tricksWon: p.tricksWon + 1 } : p
  );

  const completedTricks = [...round.completedTricks, trickCards];
  const winnerIndex = active.findIndex((p) => p.id === winnerId);

  return {
    ...state,
    phase: 'trick_end',
    players: updatedPlayers,
    round: {
      ...round,
      currentPlayerIndex: winnerIndex,
      completedTricks,
      lastTrickWinnerId: winnerId,
      lastTrickCards: trickCards,
      currentTrick: null,
    },
  };
}

function buildRoundResults(players: PlayerState[]): RoundResult[] {
  const results: RoundResult[] = [];

  for (const player of players) {
    if (player.eliminated || player.bid === null) continue;

    const livesLost = calculateLivesLost(player.bid, player.tricksWon);
    const newLives = player.lives - livesLost;

    results.push({
      playerId: player.id,
      bid: player.bid,
      tricksWon: player.tricksWon,
      livesLost,
      newLives,
      eliminated: newLives <= 0,
    });
  }

  return results;
}

function applyRoundResults(state: GameState): GameState {
  if (!state.round) throw new Error('Sem rodada ativa');

  const roundResults = buildRoundResults(state.players);
  const players = state.players.map((p) => {
    const result = roundResults.find((r) => r.playerId === p.id);
    if (!result) return p;

    return {
      ...p,
      lives: result.newLives,
      eliminated: result.eliminated,
    };
  });

  return {
    ...state,
    phase: 'round_end',
    players,
    round: {
      ...state.round,
      roundResults,
      lastTrickWinnerId: null,
      lastTrickCards: null,
    },
  };
}

export function resolveTrickEnd(state: GameState): GameState {
  if (state.phase !== 'trick_end' || !state.round) {
    throw new Error('Não está na fase de fim de vaza');
  }

  const allCardsPlayed = getActivePlayers(state).every((p) => p.hand.length === 0);

  if (allCardsPlayed) {
    return applyRoundResults(state);
  }

  const winnerId = state.round.lastTrickWinnerId;
  if (!winnerId) throw new Error('Vencedor da vaza não encontrado');

  return {
    ...state,
    phase: 'playing',
    round: {
      ...state.round,
      lastTrickWinnerId: null,
      lastTrickCards: null,
      currentTrick: { cards: [], leaderId: winnerId },
    },
  };
}

export function advanceAfterRoundEnd(
  state: GameState,
  random = Math.random
): GameState {
  if (state.phase !== 'round_end' || !state.round) {
    throw new Error('Não está na fase de fim de rodada');
  }

  const alive = state.players.filter((p) => !p.eliminated);

  if (alive.length <= 1) {
    return {
      ...state,
      phase: 'game_over',
      winnerId: alive[0]?.id ?? null,
    };
  }

  const nextDealerId = getNextDealerId(alive, state.round.dealerId);
  return startRound(state, state.round.number + 1, nextDealerId, random);
}

export function isBlindFirstRound(state: GameState): boolean {
  return (
    state.round?.number === 1 &&
    state.round.cardsPerPlayer === 1
  );
}

export function sanitizeStateForPlayer(
  state: GameState,
  viewerId: string
): GameState {
  if (state.phase === 'bidding' && isBlindFirstRound(state)) {
    return {
      ...state,
      players: state.players.map((p) => {
        if (p.eliminated) return { ...p, hand: [] };
        if (p.id === viewerId) return { ...p, hand: [] };
        return p;
      }),
    };
  }

  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      hand: p.id === viewerId ? p.hand : [],
    })),
  };
}

export function getCurrentBidderId(state: GameState): string | null {
  if (state.phase !== 'bidding' || !state.round) return null;
  return state.round.bidOrder[state.round.currentBidderIndex] ?? null;
}

export function getCurrentPlayerId(state: GameState): string | null {
  if (state.phase !== 'playing' || !state.round) return null;
  const active = getActivePlayers(state);
  return active[state.round.currentPlayerIndex]?.id ?? null;
}

export function getPlayerView(state: GameState, playerId: string) {
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      hand: p.id === playerId ? p.hand : p.hand.map(() => null),
    })),
  };
}

export function resetForNewGame(state: GameState): GameState {
  return createInitialGameState(
    state.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      lives: state.initialLives,
      eliminated: false,
      hand: [],
      bid: null,
      tricksWon: 0,
      ready: false,
      isHost: p.isHost,
    })),
    state.maxPlayers,
    state.initialLives
  );
}
