import { describe, expect, it } from 'vitest';
import { compareCards, getTrickWinner } from './cards.js';
import { getManilhaRank } from './manilha.js';
import { getCardsPerPlayer } from './round.js';
import { isValidBid } from './bidding.js';
import {
  canStartGame,
  createInitialGameState,
  advanceAfterRoundEnd,
  isBlindFirstRound,
  placeBid,
  playCard,
  resolveTrickEnd,
  sanitizeStateForPlayer,
  startGame,
} from './game.js';
import { PlayerState } from './types.js';

function makePlayers(count: number): PlayerState[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Jogador ${i + 1}`,
    color: '#000',
    lives: 5,
    eliminated: false,
    hand: [],
    bid: null,
    tricksWon: 0,
    ready: true,
    isHost: i === 0,
  }));
}

describe('manilha', () => {
  it('calcula manilha corretamente', () => {
    expect(getManilhaRank({ rank: '4', suit: 'ouros' })).toBe('5');
    expect(getManilhaRank({ rank: '3', suit: 'paus' })).toBe('4');
    expect(getManilhaRank({ rank: 'A', suit: 'copas' })).toBe('2');
  });
});

describe('compareCards', () => {
  it('2 vence A', () => {
    expect(
      compareCards(
        { rank: '2', suit: 'ouros' },
        { rank: 'A', suit: 'paus' },
        '5'
      )
    ).toBeGreaterThan(0);
  });

  it('manilha vence carta normal', () => {
    expect(
      compareCards(
        { rank: '5', suit: 'paus' },
        { rank: '3', suit: 'ouros' },
        '5'
      )
    ).toBeGreaterThan(0);
  });

  it('mesmo valor: paus vence copas', () => {
    expect(
      compareCards(
        { rank: 'A', suit: 'paus' },
        { rank: 'A', suit: 'copas' },
        '7'
      )
    ).toBeGreaterThan(0);
  });
});

describe('round cycle', () => {
  it('cicla cartas para 4 jogadores', () => {
    expect(getCardsPerPlayer(1, 4)).toBe(1);
    expect(getCardsPerPlayer(10, 4)).toBe(10);
    expect(getCardsPerPlayer(11, 4)).toBe(9);
    expect(getCardsPerPlayer(19, 4)).toBe(1);
    expect(getCardsPerPlayer(20, 4)).toBe(2);
  });
});

describe('bidding', () => {
  it('bloqueia último palpite que iguala total', () => {
    expect(isValidBid(1, 4, [1, 1, 1], true)).toBe(false);
    expect(isValidBid(0, 4, [1, 1, 1], true)).toBe(true);
    expect(isValidBid(2, 4, [1, 1, 1], true)).toBe(true);
  });

  it('permite soma igual na primeira rodada cega', () => {
    expect(isValidBid(1, 1, [0, 0], true, false)).toBe(true);
    expect(isValidBid(0, 1, [0, 0], true, false)).toBe(true);
  });
});

describe('game flow', () => {
  it('primeira rodada oculta carta própria e exibe oponentes', () => {
    const players = makePlayers(3);
    const state = createInitialGameState(players, 8, 5);
    const readyState = {
      ...state,
      players: state.players.map((p) => ({ ...p, ready: true })),
    };
    const started = startGame(readyState, () => 0.5);

    expect(isBlindFirstRound(started)).toBe(true);

    const view = sanitizeStateForPlayer(started, 'p0');
    expect(view.players.find((p) => p.id === 'p0')?.hand).toEqual([]);
    expect(view.players.find((p) => p.id === 'p1')?.hand).toHaveLength(1);
    expect(view.players.find((p) => p.id === 'p2')?.hand).toHaveLength(1);
  });

  it('último palpite permitido na primeira rodada cega', () => {
    const players = makePlayers(3);
    const state = createInitialGameState(players, 8, 5);
    const readyState = {
      ...state,
      players: state.players.map((p) => ({ ...p, ready: true })),
    };
    let gameState = startGame(readyState, () => 0.5);

    const [b1, b2, b3] = gameState.round!.bidOrder;
    gameState = placeBid(gameState, b1, 0);
    gameState = placeBid(gameState, b2, 0);
    gameState = placeBid(gameState, b3, 1);

    expect(gameState.phase).toBe('playing');
    expect(gameState.players.find((p) => p.id === b3)?.bid).toBe(1);
  });

  it('inicia partida com 2 jogadores', () => {
    const players = makePlayers(2);
    const state = createInitialGameState(players, 8, 5);
    const readyState = {
      ...state,
      players: state.players.map((p) => ({ ...p, ready: true })),
    };
    expect(canStartGame(readyState)).toBe(true);
    const started = startGame(readyState, () => 0.5);
    expect(started.phase).toBe('bidding');
    expect(started.round?.cardsPerPlayer).toBe(1);
    expect(started.round?.vira).toBeDefined();
  });

  it('completa rodada de palpites e jogo', () => {
    const players = makePlayers(2);
    const state = createInitialGameState(players, 8, 5);
    const readyState = {
      ...state,
      players: state.players.map((p) => ({ ...p, ready: true })),
    };
    let gameState = startGame(readyState, () => 0.5);

    const bidder1 = gameState.round!.bidOrder[0];
    const bidder2 = gameState.round!.bidOrder[1];

    gameState = placeBid(gameState, bidder1, 0);
    gameState = placeBid(gameState, bidder2, 0);
    expect(gameState.phase).toBe('playing');

    const leaderId = gameState.round!.currentTrick!.leaderId;
    const leader = gameState.players.find((p) => p.id === leaderId)!;
    gameState = playCard(gameState, leaderId, leader.hand[0]);

    const otherId = gameState.players.find(
      (p) => !p.eliminated && p.id !== leaderId
    )!.id;
    const other = gameState.players.find((p) => p.id === otherId)!;
    gameState = playCard(gameState, otherId, other.hand[0]);
    expect(gameState.phase).toBe('trick_end');

    gameState = resolveTrickEnd(gameState);
    expect(gameState.phase).toBe('round_end');

    gameState = advanceAfterRoundEnd(gameState);
    expect(gameState.round?.number).toBeGreaterThanOrEqual(2);
  });
});

describe('trick winner', () => {
  it('exemplo do GDD: 2 de ouros vence A e K', () => {
    const played = [
      { playerId: 'a', card: { rank: 'A' as const, suit: 'copas' as const } },
      { playerId: 'b', card: { rank: '2' as const, suit: 'ouros' as const } },
      { playerId: 'c', card: { rank: 'K' as const, suit: 'paus' as const } },
    ];
    expect(getTrickWinner(played, '5')).toBe('b');
  });
});
