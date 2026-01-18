import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './components/Card';
import { JokerCard } from './components/JokerCard';
import { GeneratorModal } from './components/GeneratorModal';
import { createDeck, BASE_HANDS, BASE_DISCARDS, BASE_JOKERS, POKER_HANDS, STARTING_MONEY } from './constants';
import { PlayerState, Card as CardType, Joker, HandResult } from './types';
import { evaluateHand, calculateCardScore } from './utils/pokerLogic';
import { p2pService } from './services/p2pService';

// Initial dummy state
const INITIAL_STATE: PlayerState = {
  currentScore: 0,
  targetScore: 300,
  round: 1,
  handsLeft: BASE_HANDS,
  discardsLeft: BASE_DISCARDS,
  money: STARTING_MONEY,
  hand: [],
  jokers: [], // Start with no jokers
  isGameOver: false,
  statusMessage: 'Select cards to play a hand.',
};

function App() {
  const [gameState, setGameState] = useState<PlayerState>(INITIAL_STATE);
  const [deck, setDeck] = useState<CardType[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]); // IDs
  const [previewHand, setPreviewHand] = useState<HandResult | null>(null);
  
  // P2P State
  const [peerId, setPeerId] = useState<string>('');
  const [targetPeerId, setTargetPeerId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [opponentRound, setOpponentRound] = useState<number>(1);
  const [showConnectionUI, setShowConnectionUI] = useState(false);

  // Shop / Generation State
  const [showShop, setShowShop] = useState(false);
  const [shopJoker, setShopJoker] = useState<Joker | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    startNewGame();
    // Initialize P2P
    p2pService.initialize().then(id => {
        setPeerId(id);
        p2pService.onMessage = (msg) => {
            if (msg.type === 'SYNC_STATE') {
                if (msg.payload.currentScore !== undefined) setOpponentScore(msg.payload.currentScore);
                if (msg.payload.round !== undefined) setOpponentRound(msg.payload.round);
            }
        };
        p2pService.onConnect = () => {
            setIsConnected(true);
            setShowConnectionUI(false);
        };
    }).catch(console.error);
  }, []);

  // Sync state to peer
  useEffect(() => {
    if (isConnected) {
        p2pService.send({
            type: 'SYNC_STATE',
            payload: {
                currentScore: gameState.currentScore,
                round: gameState.round
            }
        });
    }
  }, [gameState.currentScore, gameState.round, isConnected]);

  const startNewGame = () => {
    const newDeck = createDeck();
    const hand: CardType[] = [];
    for (let i = 0; i < 8; i++) {
        const card = newDeck.pop();
        if (card) hand.push(card);
    }
    
    setDeck(newDeck);
    setGameState({
        ...INITIAL_STATE,
        hand,
        jokers: [...INITIAL_STATE.jokers] // Reset jokers
    });
    setSelectedCards([]);
  };

  const drawCards = (count: number) => {
    const currentDeck = [...deck];
    const newHand = [...gameState.hand];
    
    for(let i=0; i<count; i++) {
        if(currentDeck.length > 0) {
            newHand.push(currentDeck.pop()!);
        }
    }
    setDeck(currentDeck);
    setGameState(prev => ({ ...prev, hand: newHand }));
  };

  const toggleSelectCard = (id: string) => {
    if (selectedCards.includes(id)) {
        setSelectedCards(prev => prev.filter(cid => cid !== id));
    } else {
        if (selectedCards.length < 5) {
            setSelectedCards(prev => [...prev, id]);
        }
    }
  };

  // Live update of hand preview
  useEffect(() => {
    if (selectedCards.length > 0) {
        const cardsToCheck = gameState.hand.filter(c => selectedCards.includes(c.id));
        setPreviewHand(evaluateHand(cardsToCheck));
    } else {
        setPreviewHand(null);
    }
  }, [selectedCards, gameState.hand]);


  const handlePlayHand = () => {
    if (selectedCards.length === 0 || gameState.handsLeft <= 0) return;

    const cardsPlayed = gameState.hand.filter(c => selectedCards.includes(c.id));
    const evalResult = evaluateHand(cardsPlayed);

    let chips = evalResult.baseChips;
    let mult = evalResult.baseMult;

    // Add card scores
    evalResult.cards.forEach(c => {
        chips += calculateCardScore(c);
    });

    // Apply Jokers
    gameState.jokers.forEach(j => {
        const result = j.effect(gameState, evalResult.cards);
        chips += result.chips;
        mult += (j.name === 'Madness' ? mult * 1.5 : result.mult); // Simple logic adjustment
    });

    const handScore = Math.floor(chips * mult);
    const newTotalScore = gameState.currentScore + handScore;

    // Remove played cards
    const remainingHand = gameState.hand.filter(c => !selectedCards.includes(c.id));
    
    setGameState(prev => ({
        ...prev,
        currentScore: newTotalScore,
        hand: remainingHand,
        handsLeft: prev.handsLeft - 1,
        statusMessage: `${evalResult.name}! Scored ${handScore} (${chips} x ${mult})`
    }));

    setSelectedCards([]);
    
    // Draw back up to 8 if possible, immediately? usually not in Balatro, but let's do it for flow
    setTimeout(() => {
        // Balatro doesn't auto-draw after play usually, you are stuck with what you have unless you discard.
        // Wait, standard Balatro: you play, cards gone. You draw back up only at end of round? 
        // No, actually you draw back up to hand limit after play or discard usually.
        // Let's implement draw to limit.
        const cardsNeeded = 8 - remainingHand.length;
        if (cardsNeeded > 0) {
            drawCards(cardsNeeded);
        }
        checkWinCondition(newTotalScore, gameState.handsLeft - 1);
    }, 1000);
  };

  const handleDiscard = () => {
    if (selectedCards.length === 0 || gameState.discardsLeft <= 0) return;
    
    const remainingHand = gameState.hand.filter(c => !selectedCards.includes(c.id));
    setGameState(prev => ({
        ...prev,
        hand: remainingHand,
        discardsLeft: prev.discardsLeft - 1,
        statusMessage: `Discarded ${selectedCards.length} cards.`
    }));
    setSelectedCards([]);

    setTimeout(() => {
        const cardsNeeded = 8 - remainingHand.length;
        if (cardsNeeded > 0) drawCards(cardsNeeded);
    }, 500);
  };

  const checkWinCondition = (score: number, handsLeft: number) => {
    if (score >= gameState.targetScore) {
        // Round Win
        setTimeout(() => {
            openShop();
        }, 1500);
    } else if (handsLeft === 0) {
        // Game Over
        setGameState(prev => ({ ...prev, isGameOver: true, statusMessage: 'GAME OVER' }));
    }
  };

  const openShop = () => {
     // Generate a random Joker for the shop
     const randomJoker = BASE_JOKERS[Math.floor(Math.random() * BASE_JOKERS.length)];
     setShopJoker({ ...randomJoker, id: randomJoker.id + Math.random() });
     setShowShop(true);
  };

  const handleNextRound = () => {
     // Apply score scaling
     const nextTarget = Math.floor(gameState.targetScore * 1.5) + 500;
     
     // Reset deck
     const newDeck = createDeck();
     const newHand: CardType[] = [];
     for(let i=0; i<8; i++) newHand.push(newDeck.pop()!);
     setDeck(newDeck);

     setGameState(prev => ({
        ...prev,
        round: prev.round + 1,
        targetScore: nextTarget,
        currentScore: 0,
        handsLeft: BASE_HANDS,
        discardsLeft: BASE_DISCARDS,
        hand: newHand,
        statusMessage: `Round ${prev.round + 1} Start! Beat ${nextTarget}.`
     }));
     setShowShop(false);
  };

  const buyJoker = () => {
      if (!shopJoker) return;
      if (gameState.jokers.length < 5) {
          setGameState(prev => ({
              ...prev,
              jokers: [...prev.jokers, shopJoker]
          }));
          setShopJoker(null); // Sold
      }
  };

  const handleCustomJoker = (imageUrl: string) => {
      // Create a custom joker with the generated image
      // For gameplay balance, we just give it a generic "Wildcard" effect
      const customJoker: Joker = {
          id: 'joker_custom_' + Date.now(),
          name: 'AI Wildcard',
          description: 'Custom Art. +50 Chips.',
          rarity: 'Legendary',
          trigger: 'played',
          effect: () => ({ chips: 50, mult: 0 }),
          imageUrl: imageUrl
      };

      setGameState(prev => ({
        ...prev,
        jokers: [...prev.jokers, customJoker]
    }));
    setShowGenerator(false);
  };

  // --- UI Renders ---

  if (gameState.isGameOver) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
            <h1 className="text-6xl font-bold mb-4 text-red-500">GAME OVER</h1>
            <p className="text-2xl mb-8">Round: {gameState.round} - Score: {gameState.currentScore}</p>
            <button 
                onClick={startNewGame}
                className="px-8 py-3 bg-blue-600 rounded text-xl font-bold hover:bg-blue-500"
            >
                Try Again
            </button>
        </div>
      );
  }

  return (
    <div className="min-h-screen relative flex flex-col">
        {/* Top Bar: Stats */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg z-10">
            <div className="flex gap-6">
                <div className="text-center">
                    <div className="text-xs text-slate-400 uppercase">Round Score</div>
                    <div className="text-2xl font-bold text-blue-400">{gameState.currentScore.toLocaleString()}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-slate-400 uppercase">Target</div>
                    <div className="text-2xl font-bold text-red-400">{gameState.targetScore.toLocaleString()}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-slate-400 uppercase">Round</div>
                    <div className="text-2xl font-bold text-amber-400">{gameState.round}</div>
                </div>
            </div>

            <div className="flex gap-4">
               {/* P2P UI */}
               <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded border border-slate-700">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {isConnected ? (
                        <div className="text-sm">
                            <span className="text-slate-400">VS Opponent: </span>
                            <span className="font-bold">{opponentScore}</span> 
                            <span className="text-xs text-slate-500 ml-1">(R{opponentRound})</span>
                        </div>
                    ) : (
                        <button onClick={() => setShowConnectionUI(true)} className="text-xs bg-blue-700 px-2 py-1 rounded">Multiplayer</button>
                    )}
               </div>
            </div>
        </div>

        {/* Game Board */}
        <div className="flex-1 relative flex flex-col items-center justify-start pt-8 pb-4 px-4 overflow-y-auto">
            
            {/* Joker Slots */}
            <div className="w-full max-w-4xl mb-8">
                <div className="flex justify-center gap-4 min-h-[160px] p-4 bg-black/20 rounded-xl border border-white/10">
                    {gameState.jokers.length === 0 && (
                        <div className="text-white/30 flex items-center justify-center w-full">No Jokers Collected</div>
                    )}
                    {gameState.jokers.map(j => (
                        <JokerCard key={j.id} joker={j} />
                    ))}
                </div>
            </div>

            {/* Status Message */}
            <div className="mb-6 h-8 text-center">
                <p className="text-xl font-medium text-amber-200 animate-pulse">{gameState.statusMessage}</p>
            </div>

            {/* Hand Area */}
            <div className="flex justify-center gap-[-2rem] mb-8 select-none">
                 {/* Gap negative for overlap look? Tailwind doesn't do negative gap easily in flex. Using margin. */}
                 <div className="flex justify-center -space-x-4">
                    {gameState.hand.map((card, index) => (
                        <div key={card.id} style={{ zIndex: index }}>
                            <Card 
                                card={{...card, isSelected: selectedCards.includes(card.id)}} 
                                onClick={() => toggleSelectCard(card.id)} 
                            />
                        </div>
                    ))}
                 </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-8 z-20">
                <div className="flex flex-col items-center">
                    <button 
                        onClick={handlePlayHand}
                        disabled={selectedCards.length === 0 || gameState.handsLeft === 0}
                        className="px-8 py-3 bg-orange-600 text-white font-bold rounded-lg shadow-lg hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition active:scale-95"
                    >
                        PLAY HAND
                    </button>
                    <div className="text-sm text-slate-300 mt-1">{gameState.handsLeft} Hands Left</div>
                </div>

                {previewHand && (
                    <div className="bg-black/60 px-4 py-2 rounded text-center backdrop-blur-sm border border-white/10">
                        <div className="text-xs text-slate-400 uppercase">Hand Type</div>
                        <div className="text-lg font-bold text-white">{previewHand.name}</div>
                        <div className="text-xs text-blue-300">
                            ~{previewHand.baseChips} x {previewHand.baseMult} Base
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center">
                    <button 
                         onClick={handleDiscard}
                         disabled={selectedCards.length === 0 || gameState.discardsLeft === 0}
                         className="px-6 py-3 bg-red-700 text-white font-bold rounded-lg shadow-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        DISCARD
                    </button>
                    <div className="text-sm text-slate-300 mt-1">{gameState.discardsLeft} Discards Left</div>
                </div>
            </div>
        </div>

        {/* Connection Modal */}
        {showConnectionUI && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                <div className="bg-slate-800 p-6 rounded-lg max-w-sm w-full text-white">
                    <h3 className="text-lg font-bold mb-4">Multiplayer Duel</h3>
                    <div className="mb-4">
                        <label className="text-xs text-slate-400">Your ID</label>
                        <div className="flex gap-2">
                            <input readOnly value={peerId} className="flex-1 bg-slate-900 p-2 rounded text-sm font-mono" />
                            <button onClick={() => navigator.clipboard.writeText(peerId)} className="bg-slate-700 px-3 rounded">Copy</button>
                        </div>
                    </div>
                    <div className="mb-6">
                         <label className="text-xs text-slate-400">Opponent ID</label>
                         <div className="flex gap-2">
                            <input 
                                value={targetPeerId} 
                                onChange={(e) => setTargetPeerId(e.target.value)}
                                placeholder="Paste ID here"
                                className="flex-1 bg-slate-900 p-2 rounded text-sm font-mono" 
                            />
                            <button onClick={() => p2pService.connectToPeer(targetPeerId)} className="bg-green-600 px-3 rounded hover:bg-green-500">Join</button>
                        </div>
                    </div>
                    <button onClick={() => setShowConnectionUI(false)} className="w-full py-2 bg-slate-700 rounded hover:bg-slate-600">Close</button>
                </div>
            </div>
        )}

        {/* Shop Modal (Between Rounds) */}
        {showShop && (
             <div className="fixed inset-0 bg-black/90 z-40 flex flex-col items-center justify-center text-white">
                <h2 className="text-4xl font-bold mb-2 text-amber-400">SHOP</h2>
                <p className="mb-8 text-slate-400">Choose a Joker to help your run</p>
                
                <div className="flex gap-8 items-center">
                    {shopJoker ? (
                        <div className="flex flex-col items-center gap-4">
                             <JokerCard joker={shopJoker} />
                             <button onClick={buyJoker} className="px-6 py-2 bg-green-600 rounded hover:bg-green-500">
                                Add to Deck
                             </button>
                        </div>
                    ) : (
                        <div className="text-slate-500 italic">Out of Stock</div>
                    )}
                    
                    <div className="w-px h-32 bg-slate-700 mx-4"></div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-36 border-2 border-dashed border-blue-400 flex items-center justify-center rounded-lg bg-blue-900/20 text-blue-200 text-center p-2 text-xs">
                            AI Generated Custom Joker
                        </div>
                        <button 
                            onClick={() => setShowGenerator(true)} 
                            className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-500"
                        >
                            Create Custom
                        </button>
                    </div>
                </div>

                <button 
                    onClick={handleNextRound}
                    className="mt-12 px-8 py-3 bg-slate-700 rounded-lg font-bold hover:bg-slate-600 border border-slate-500"
                >
                    Next Round &rarr;
                </button>
             </div>
        )}

        {showGenerator && (
            <GeneratorModal 
                onClose={() => setShowGenerator(false)} 
                onGenerate={handleCustomJoker} 
            />
        )}
    </div>
  );
}

export default App;
