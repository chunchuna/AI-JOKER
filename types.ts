export enum Suit {
  Hearts = 'Hearts',
  Diamonds = 'Diamonds',
  Clubs = 'Clubs',
  Spades = 'Spades',
}

export enum Rank {
  Two = 2, Three, Four, Five, Six, Seven, Eight, Nine, Ten, Jack, Queen, King, Ace
}

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  scoreModifier?: number;
  multModifier?: number;
  isSelected?: boolean;
}

export interface Joker {
  id: string;
  name: string;
  description: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
  trigger: 'played' | 'held' | 'discard';
  effect: (gameState: GameState, playedHand: Card[]) => { chips: number; mult: number; message?: string };
  imageUrl?: string; // For AI generated art
}

export interface HandResult {
  name: string;
  baseChips: number;
  baseMult: number;
  cards: Card[];
}

export interface PlayerState {
  currentScore: number;
  targetScore: number;
  round: number;
  handsLeft: number;
  discardsLeft: number;
  money: number;
  hand: Card[];
  jokers: Joker[];
  isGameOver: boolean;
  statusMessage: string;
}

export interface GameState extends PlayerState {
  opponentState?: Partial<PlayerState>; // For P2P
}

// P2P Messages
export type P2PMessage = 
  | { type: 'SYNC_STATE'; payload: Partial<PlayerState> }
  | { type: 'GAME_OVER'; score: number }
  | { type: 'EMOTE'; emoji: string };

export enum ImageSize {
    SIZE_1K = "1K",
    SIZE_2K = "2K",
    SIZE_4K = "4K"
}

export enum AspectRatio {
    RATIO_1_1 = "1:1",
    RATIO_2_3 = "2:3",
    RATIO_3_2 = "3:2",
    RATIO_3_4 = "3:4",
    RATIO_4_3 = "4:3",
    RATIO_9_16 = "9:16",
    RATIO_16_9 = "16:9",
    RATIO_21_9 = "21:9"
}
