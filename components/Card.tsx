import React from 'react';
import { Card as CardType, Suit, Rank } from '../types';

interface Props {
  card: CardType;
  onClick?: () => void;
  mini?: boolean;
}

const suitColor = (suit: Suit) => {
  return suit === Suit.Hearts || suit === Suit.Diamonds ? 'text-red-500' : 'text-slate-800';
};

const suitIcon = (suit: Suit) => {
    switch(suit) {
        case Suit.Hearts: return '♥';
        case Suit.Diamonds: return '♦';
        case Suit.Clubs: return '♣';
        case Suit.Spades: return '♠';
    }
};

const rankString = (rank: Rank) => {
    switch(rank) {
        case Rank.Ace: return 'A';
        case Rank.King: return 'K';
        case Rank.Queen: return 'Q';
        case Rank.Jack: return 'J';
        default: return rank.toString();
    }
};

export const Card: React.FC<Props> = ({ card, onClick, mini }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative bg-white rounded-lg shadow-md border-2 border-slate-300 select-none
        transition-all duration-200 cursor-pointer hover:shadow-xl
        ${mini ? 'w-10 h-14 text-xs' : 'w-24 h-36'}
        ${card.isSelected ? '-translate-y-6 border-blue-500 ring-2 ring-blue-400' : 'hover:-translate-y-2'}
      `}
    >
      <div className={`absolute top-1 left-2 font-bold ${suitColor(card.suit)} ${mini ? 'text-xs' : 'text-xl card-font'}`}>
        {rankString(card.rank)}
        <div className="text-xs">{suitIcon(card.suit)}</div>
      </div>
      
      <div className={`absolute inset-0 flex items-center justify-center ${suitColor(card.suit)} ${mini ? 'text-xl' : 'text-4xl'}`}>
        {suitIcon(card.suit)}
      </div>

      <div className={`absolute bottom-1 right-2 font-bold rotate-180 ${suitColor(card.suit)} ${mini ? 'text-xs' : 'text-xl card-font'}`}>
        {rankString(card.rank)}
        <div className="text-xs">{suitIcon(card.suit)}</div>
      </div>
    </div>
  );
};
