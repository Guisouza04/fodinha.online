import { Card, Suit } from '@fodinha/shared';

const SUIT_SYMBOL: Record<Suit, string> = {
  ouros: '♦',
  espadas: '♠',
  copas: '♥',
  paus: '♣',
};

const SUIT_COLOR: Record<Suit, string> = {
  ouros: '#2c3e50',
  espadas: '#2c3e50',
  copas: '#2c3e50',
  paus: '#2c3e50',
};

export function formatCard(card: Card): string {
  return `${card.rank}${SUIT_SYMBOL[card.suit]}`;
}

export function getSuitColor(suit: Suit): string {
  return SUIT_COLOR[suit];
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'ouros' || suit === 'copas';
}
