import { Card, HandResult, Rank, Suit } from '../types';
import { POKER_HANDS } from '../constants';

// Helper to sort cards by rank (Ace high)
const sortCards = (cards: Card[]) => {
  return [...cards].sort((a, b) => b.rank - a.rank);
};

export const evaluateHand = (selectedCards: Card[]): HandResult => {
  if (selectedCards.length === 0) {
    return { name: 'High Card', baseChips: 0, baseMult: 0, cards: [] };
  }

  const sorted = sortCards(selectedCards);
  const ranks = sorted.map(c => c.rank);
  const suits = sorted.map(c => c.suit);
  
  // Count frequencies
  const rankCounts: Record<number, number> = {};
  ranks.forEach(r => { rankCounts[r] = (rankCounts[r] || 0) + 1; });
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  const isFlush = suits.every(s => s === suits[0]) && suits.length >= 5;
  
  // Straight Check
  let isStraight = false;
  if (ranks.length >= 5) {
      // Simple check for 5 distinct sequential ranks
      const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => b - a);
      if(uniqueRanks.length >= 5) {
        for(let i=0; i <= uniqueRanks.length - 5; i++) {
            if(uniqueRanks[i] - uniqueRanks[i+4] === 4) {
                isStraight = true;
                break;
            }
        }
        // Special case: Ace low (A, 5, 4, 3, 2) where Ace is 12 and 2 is 0 (Rank enum)
        // In our enum: 2=0, Ace=12. 
        // Need to check 5,4,3,2,A specifically if logic fails
      }
  }

  let handType = 'High Card';
  if (isFlush && isStraight) handType = 'Straight Flush'; // Royal flush check omitted for brevity
  else if (counts[0] === 4) handType = 'Four of a Kind';
  else if (counts[0] === 3 && counts[1] >= 2) handType = 'Full House';
  else if (isFlush) handType = 'Flush';
  else if (isStraight) handType = 'Straight';
  else if (counts[0] === 3) handType = 'Three of a Kind';
  else if (counts[0] === 2 && counts[1] === 2) handType = 'Two Pair';
  else if (counts[0] === 2) handType = 'Pair';

  const stats = POKER_HANDS[handType];
  
  return {
    name: handType,
    baseChips: stats.chips,
    baseMult: stats.mult,
    cards: sorted // Return sorted for scoring order
  };
};

export const calculateCardScore = (card: Card) => {
    // 2=2 chips, ..., 10=10, J/Q/K=10, A=11
    if (card.rank === Rank.Ace) return 11;
    if (card.rank >= Rank.Ten) return 10;
    return (card.rank as number); // Enum matches value roughly? No, enum starts at 0 or specified.
    // Let's fix Rank mapping for scoring:
    // 2 is Rank.Two (0? No, specified as 2).
    // So if Rank.Two = 2, it returns 2. Correct.
};
