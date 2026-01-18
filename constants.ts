import { Joker, Rank, Suit } from './types';

export const HAND_SIZE = 8;
export const BASE_HANDS = 4;
export const BASE_DISCARDS = 3;
export const STARTING_MONEY = 4;

export const POKER_HANDS: Record<string, { chips: number; mult: number }> = {
  'High Card': { chips: 5, mult: 1 },
  'Pair': { chips: 10, mult: 2 },
  'Two Pair': { chips: 20, mult: 2 },
  'Three of a Kind': { chips: 30, mult: 3 },
  'Straight': { chips: 30, mult: 4 },
  'Flush': { chips: 35, mult: 4 },
  'Full House': { chips: 40, mult: 4 },
  'Four of a Kind': { chips: 60, mult: 7 },
  'Straight Flush': { chips: 100, mult: 8 },
  'Royal Flush': { chips: 100, mult: 8 }, // Same as SF usually but cooler
};

// Helper to generate a standard 52-card deck
export const createDeck = () => {
  const deck = [];
  const suits = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];
  const ranks = [
    Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, 
    Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace
  ];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `${suit}-${rank}-${Math.random()}`,
        suit,
        rank,
      });
    }
  }
  return deck;
};

// Base Jokers available in the game
export const BASE_JOKERS: Joker[] = [
  {
    id: 'joker_basic',
    name: 'The Fool',
    description: '+4 Mult',
    rarity: 'Common',
    trigger: 'played',
    effect: () => ({ chips: 0, mult: 4, message: '+4 Mult' })
  },
  {
    id: 'joker_suit_hearts',
    name: 'Lusty Blood',
    description: 'Played Hearts give +4 Mult',
    rarity: 'Uncommon',
    trigger: 'played',
    effect: (_, playedHand) => {
      const heartCount = playedHand.filter(c => c.suit === Suit.Hearts).length;
      return { chips: 0, mult: heartCount * 4, message: heartCount > 0 ? `+${heartCount * 4} Mult` : undefined };
    }
  },
  {
    id: 'joker_pair',
    name: 'The Twins',
    description: '+50 Chips if hand contains a Pair',
    rarity: 'Common',
    trigger: 'played',
    effect: (gameState, playedHand) => {
       // logic checked in main eval usually, simplified here
       // In a real app we'd pass the hand type
       return { chips: 50, mult: 0 }; 
    }
  },
  {
    id: 'joker_rich',
    name: 'Golden Ticket',
    description: 'Earn $1 per hand played',
    rarity: 'Rare',
    trigger: 'played',
    effect: () => ({ chips: 0, mult: 0, message: '+$1' }) // Money logic handled separately in core loop
  },
  {
    id: 'joker_madness',
    name: 'Madness',
    description: 'X1.5 Mult',
    rarity: 'Rare',
    trigger: 'played',
    effect: () => ({ chips: 0, mult: 0 }) // Multiplier applied differently in logic
  }
];
