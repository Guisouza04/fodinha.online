import { Card, Rank, SUIT_ORDER } from './types.js';
import { isManilha } from './manilha.js';

export function compareCards(
  a: Card,
  b: Card,
  manilhaRank: Rank
): number {
  const aManilha = isManilha(a, manilhaRank);
  const bManilha = isManilha(b, manilhaRank);

  if (aManilha && !bManilha) return 1;
  if (!aManilha && bManilha) return -1;
  if (aManilha && bManilha) {
    return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
  }

  const rankDiff = rankStrength(a.rank) - rankStrength(b.rank);
  if (rankDiff !== 0) return rankDiff;
  return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
}

function rankStrength(rank: Rank): number {
  const order = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
  return order.indexOf(rank);
}

export function getTrickWinner(
  played: { playerId: string; card: Card }[],
  manilhaRank: Rank
): string {
  if (played.length === 0) {
    throw new Error('Nenhuma carta jogada na rodada');
  }

  let winner = played[0];
  for (let i = 1; i < played.length; i++) {
    if (compareCards(played[i].card, winner.card, manilhaRank) > 0) {
      winner = played[i];
    }
  }
  return winner.playerId;
}
