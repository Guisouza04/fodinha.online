import { Card, Rank, RANKS } from './types';

const RANK_CYCLE: Rank[] = [...RANKS, RANKS[0]];

export function getManilhaRank(vira: Card): Rank {
  const viraIndex = RANKS.indexOf(vira.rank);
  return RANK_CYCLE[viraIndex + 1];
}

export function isManilha(card: Card, manilhaRank: Rank): boolean {
  return card.rank === manilhaRank;
}
