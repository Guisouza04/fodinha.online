export type Suit = 'ouros' | 'espadas' | 'copas' | 'paus';
export type Rank = '4' | '5' | '6' | '7' | 'Q' | 'J' | 'K' | 'A' | '2' | '3';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type GamePhase =
  | 'lobby'
  | 'dealing'
  | 'bidding'
  | 'playing'
  | 'trick_end'
  | 'round_end'
  | 'game_over';

export interface RoundResult {
  playerId: string;
  bid: number;
  tricksWon: number;
  livesLost: number;
  newLives: number;
  eliminated: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  lives: number;
  eliminated: boolean;
  hand: Card[];
  bid: number | null;
  tricksWon: number;
  ready: boolean;
  isHost: boolean;
}

export interface PlayedCard {
  playerId: string;
  card: Card;
}

export interface TrickState {
  cards: PlayedCard[];
  leaderId: string;
}

export interface RoundState {
  number: number;
  cardsPerPlayer: number;
  vira: Card | null;
  manilhaRank: Rank | null;
  dealerId: string;
  currentPlayerIndex: number;
  bidOrder: string[];
  currentBidderIndex: number;
  currentTrick: TrickState | null;
  completedTricks: PlayedCard[][];
  lastTrickWinnerId: string | null;
  lastTrickCards: PlayedCard[] | null;
  roundResults: RoundResult[] | null;
}

export interface GameState {
  phase: GamePhase;
  players: PlayerState[];
  round: RoundState | null;
  winnerId: string | null;
  maxPlayers: number;
  initialLives: number;
}

export interface RoomConfig {
  name: string;
  maxPlayers: number;
  initialLives: number;
}

export const SUITS: Suit[] = ['ouros', 'espadas', 'copas', 'paus'];

export const RANKS: Rank[] = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];

export const SUIT_ORDER: Record<Suit, number> = {
  ouros: 0,
  espadas: 1,
  copas: 2,
  paus: 3,
};

export const RANK_ORDER: Record<Rank, number> = {
  '4': 0,
  '5': 1,
  '6': 2,
  '7': 3,
  Q: 4,
  J: 5,
  K: 6,
  A: 7,
  '2': 8,
  '3': 9,
};

export const PLAYER_COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
  '#e67e22',
  '#34495e',
];
