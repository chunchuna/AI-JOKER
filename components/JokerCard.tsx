import React from 'react';
import { Joker } from '../types';

interface Props {
  joker: Joker;
}

export const JokerCard: React.FC<Props> = ({ joker }) => {
  const rarityColors = {
    'Common': 'border-slate-400 bg-slate-200',
    'Uncommon': 'border-green-400 bg-green-100',
    'Rare': 'border-yellow-500 bg-yellow-50',
    'Legendary': 'border-purple-500 bg-purple-100',
  };

  return (
    <div className={`
      relative w-24 h-36 rounded-lg border-4 shadow-lg flex flex-col items-center justify-center p-2 text-center overflow-hidden
      ${rarityColors[joker.rarity]}
      transition-transform hover:scale-110 duration-200
    `}>
        {joker.imageUrl && (
            <img src={joker.imageUrl} alt={joker.name} className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}
        
      <div className="relative z-10">
        <div className="font-bold text-sm text-slate-900 uppercase tracking-tighter bg-white/80 px-1 rounded mb-1">{joker.name}</div>
        <div className="text-xs text-slate-800 font-medium leading-tight bg-white/60 p-1 rounded shadow-sm">
            {joker.description}
        </div>
      </div>
      
      <div className="absolute top-0 right-0 bg-black text-white text-[0.6rem] px-1 rounded-bl">
        {joker.rarity}
      </div>
    </div>
  );
};
