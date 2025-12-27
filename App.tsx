import React, { useState, useEffect } from 'react';
import { SONGS, WINNING_SCORE } from './constants';
import { GamePhase, GameState, Player, Song, Challenge } from './types';
import { SetupScreen } from './components/SetupScreen';
import { Card } from './components/Card';
import { MusicPlayer } from './components/MusicPlayer';
import { 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Volume2, 
  Trophy, 
  Coins, 
  Zap,
  ShieldAlert,
  FastForward,
  User,
  Pause,
  Play,
  Smartphone,
  Tablet,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Plus
} from 'lucide-react';

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Helper to log broken songs
const logBrokenSong = (song: Song) => {
  try {
    const raw = localStorage.getItem('chrono_broken_songs');
    const list: Song[] = raw ? JSON.parse(raw) : [];
    
    // Check if already exists
    if (!list.find(s => s.id === song.id)) {
      const newList = [...list, song];
      localStorage.setItem('chrono_broken_songs', JSON.stringify(newList));
      console.log('Logged broken song:', song.title);
    }
  } catch (e) {
    console.error('Failed to log broken song', e);
  }
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    deck: [],
    currentCard: null,
    phase: GamePhase.SETUP,
    winner: null,
    activePlayerSlot: null,
    challenger: null
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [bonusAwarded, setBonusAwarded] = useState(false);
  const [playError, setPlayError] = useState(false);
  
  // State to control the visual "Slide out" animation. 
  // We separate this from GamePhase.REVEAL to allow the card to flip first.
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);

  const startGame = (names: string[]) => {
    const shuffledDeck = shuffle(SONGS);
    const initialPlayers: Player[] = names.map((name, i) => ({
      id: `p-${i}`,
      name,
      timeline: [shuffledDeck.pop()!], 
      score: 1,
      tokens: 2
    }));

    setGameState({
      players: initialPlayers,
      currentPlayerIndex: 0,
      deck: shuffledDeck,
      currentCard: null,
      phase: GamePhase.LISTENING,
      winner: null,
      activePlayerSlot: null,
      challenger: null
    });
  };

  const returnToSetup = () => {
    setGameState({
      players: [],
      currentPlayerIndex: 0,
      deck: [],
      currentCard: null,
      phase: GamePhase.SETUP,
      winner: null,
      activePlayerSlot: null,
      challenger: null
    });
    setIsPlaying(false);
  };

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const startTurn = () => {
    if (gameState.deck.length === 0) return;
    const nextCard = gameState.deck[0];
    const newDeck = gameState.deck.slice(1);

    setBonusAwarded(false);
    setPlayError(false);
    setShowAnalysisPanel(false); // Reset panel visibility
    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      currentCard: nextCard,
      phase: GamePhase.LISTENING,
      activePlayerSlot: null,
      challenger: null
    }));
    setIsPlaying(true);
  };

  const drawNewCard = () => {
    if (gameState.deck.length === 0) {
      alert("Pakka on tyhjä! Peliä ei voi jatkaa.");
      return;
    }
    
    const nextCard = gameState.deck[0];
    const newDeck = gameState.deck.slice(1);

    setPlayError(false);
    setIsPlaying(true);
    
    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      currentCard: nextCard,
      activePlayerSlot: null,
      challenger: null
    }));
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePlayError = () => {
    setPlayError(true);
    setIsPlaying(false);
    if (gameState.currentCard) {
      logBrokenSong(gameState.currentCard);
    }
  };

  const checkSlotCorrect = (song: Song, timeline: Song[], slotIndex: number | null): boolean => {
    if (slotIndex === null) return false;
    const year = song.year;
    if (slotIndex > 0 && year < timeline[slotIndex - 1].year) return false;
    if (slotIndex < timeline.length && year > timeline[slotIndex].year) return false;
    return true;
  };

  const handleActivePlacement = (slotIndex: number) => {
    setGameState(prev => ({
      ...prev,
      activePlayerSlot: slotIndex,
      phase: GamePhase.CHALLENGING
    }));
  };

  const handleChallenge = (challengerId: string, slotIndex: number) => {
    setGameState(prev => ({
      ...prev,
      challenger: { playerId: challengerId, slotIndex },
      players: prev.players.map(p => 
        p.id === challengerId ? { ...p, tokens: Math.max(0, p.tokens - 1) } : p
      )
    }));
  };

  const resolveReveal = () => {
    setIsPlaying(false);
    setGameState(prev => ({ ...prev, phase: GamePhase.REVEAL }));
    setTimeout(() => {
      setShowAnalysisPanel(true);
    }, 600); 
  };

  const finalizeTurn = () => {
    const { currentCard, activePlayerSlot, challenger, players, currentPlayerIndex } = gameState;
    if (!currentCard) return;

    const activePlayer = players[currentPlayerIndex];
    const isActiveCorrect = checkSlotCorrect(currentCard, activePlayer.timeline, activePlayerSlot);
    
    let updatedPlayers = [...players];

    if (isActiveCorrect && activePlayerSlot !== null) {
      updatedPlayers[currentPlayerIndex] = {
        ...activePlayer,
        timeline: insertIntoTimeline(activePlayer.timeline, currentCard, activePlayerSlot),
        score: activePlayer.timeline.length + 1
      };
    } else if (challenger) {
      const challengerPlayer = players.find(p => p.id === challenger.playerId)!;
      // Challenger steals logic
      const isChallengerCorrect = checkSlotCorrect(currentCard, activePlayer.timeline, challenger.slotIndex);
      
      if (isChallengerCorrect) {
        updatedPlayers = updatedPlayers.map(p => 
          p.id === challenger.playerId 
            ? { ...p, timeline: insertIntoTimeline(p.timeline, currentCard, p.timeline.length), score: p.timeline.length + 1 } 
            : p
        );
      }
    }

    const winner = updatedPlayers.find(p => p.timeline.length >= WINNING_SCORE) || null;

    setShowAnalysisPanel(false);
    setGameState(prev => ({
      ...prev,
      players: updatedPlayers,
      winner,
      phase: winner ? GamePhase.GAME_OVER : GamePhase.LISTENING,
      currentCard: null,
      activePlayerSlot: null,
      challenger: null,
      currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length
    }));
  };

  const insertIntoTimeline = (timeline: Song[], song: Song, index: number) => {
    const newTimeline = [...timeline];
    newTimeline.splice(index, 0, song);
    return newTimeline;
  };

  const awardToken = (playerId: string) => {
    if (bonusAwarded) return;
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === playerId ? { ...p, tokens: p.tokens + 1 } : p)
    }));
    setBonusAwarded(true);
  };

  // --- Render Helpers ---

  const MobileWarning = () => (
    <div className="md:hidden h-screen w-screen flex flex-col items-center justify-center p-8 text-center bg-stone-100 text-black">
      <Smartphone className="w-16 h-16 mb-4 text-stone-400" />
      <Tablet className="w-20 h-20 mb-6" />
      <h2 className="text-2xl font-bold mb-2">OPTIMOITU TABLETILLE</h2>
      <p className="font-mono text-sm">
        Parhaan kokemuksen takaamiseksi käytä tablettia vaakanäkymässä tai tietokonetta.
      </p>
    </div>
  );

  if (gameState.phase === GamePhase.SETUP) {
    return (
      <>
        <MobileWarning />
        <div className="hidden md:flex h-[100dvh] w-screen items-center justify-center overflow-auto">
          <SetupScreen onStartGame={startGame} />
        </div>
      </>
    );
  }

  if (gameState.phase === GamePhase.GAME_OVER) {
    return (
      <div className="h-[100dvh] w-screen flex items-center justify-center p-8 bg-white text-black">
        <div className="border-[4px] border-black p-12 text-center max-w-xl w-full shadow-eink-lg">
          <Trophy className="w-24 h-24 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">TEHTÄVÄ SUORITETTU</h1>
          <p className="text-xl mb-8">{gameState.winner?.name.toUpperCase()} ON SYNKRONOINUT AIKAJANAN.</p>
          <button 
             onClick={returnToSetup} 
             className="bg-black text-white px-10 py-4 font-bold border-2 border-black hover:bg-white hover:text-black transition-all flex items-center gap-2 mx-auto"
          >
             <RotateCcw className="w-6 h-6" />
             PALAA ALKUUN
          </button>
        </div>
      </div>
    );
  }

  const isRevealed = gameState.phase === GamePhase.REVEAL;

  return (
    <>
      <MobileWarning />
      {/* Container uses 100dvh to ensure it fits screen without standard browser bar issues */}
      <div className="hidden md:flex flex-col h-[100dvh] w-screen p-4 overflow-hidden">
        
        {/* HUD - Compact Header */}
        <header className="shrink-0 flex justify-between items-center gap-4 mb-2 border-b-[3px] border-black pb-2 h-16">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tighter leading-none">CHRONOBEATS // VINYL EDITION</h2>
            <div className="flex gap-2 mt-1">
              <span className="bg-black text-white px-2 text-[10px] font-bold uppercase py-0.5">Vuorossa</span>
              <span className="border border-black px-2 text-[10px] font-bold uppercase py-0.5">{currentPlayer.name}</span>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[60%]">
            {gameState.players.map((p, idx) => (
              <div key={p.id} className={`border-2 p-1 px-2 min-w-[80px] shrink-0 ${idx === gameState.currentPlayerIndex ? 'bg-black text-white' : 'border-black'}`}>
                <div className="text-[10px] font-bold uppercase truncate">{p.name}</div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-[10px]"><Coins className="w-3 h-3"/>{p.tokens}</div>
                  <div className="text-[10px] font-bold">PTS {p.score}</div>
                </div>
              </div>
            ))}
          </div>
        </header>

        {gameState.currentCard && (
            <MusicPlayer 
                youtubeId={gameState.currentCard.youtubeId} 
                startAt={gameState.currentCard.startAt} 
                isPlaying={isPlaying && !playError} 
                onPlayError={handlePlayError}
            />
        )}

        {/* Center Stage: Flex-1 to take available space, min-h-0 to allow shrinking */}
        <main className="flex-1 min-h-0 flex items-center justify-center relative w-full perspective-1000 mb-2">
          
          {/* Start Button */}
          {!gameState.currentCard && !isRevealed && (
            <button onClick={startTurn} className="group relative bg-black text-white p-8 text-3xl font-bold border-[4px] border-black hover:bg-white hover:text-black transition-all">
              <div className="flex items-center gap-4">
                <Volume2 className="w-10 h-10 group-hover:scale-110 transition-transform" />
                KÄYNNISTÄ AUDIO
              </div>
            </button>
          )}

          {/* Active Game Area */}
          {gameState.currentCard && (
            <div className="flex items-center justify-center transition-all duration-700 ease-in-out gap-0 h-full">
              
              {/* LEFT SIDE: The Card */}
              <div className={`
                flex flex-col items-center gap-4 z-20 transition-all duration-700
                ${showAnalysisPanel ? '-translate-x-4' : 'translate-x-0'}
              `}>
                <div className="relative">
                   <Card 
                      song={gameState.currentCard} 
                      variant="large" 
                      revealed={isRevealed} 
                      isPlaying={isPlaying} 
                      className="origin-center scale-90 lg:scale-100" // Scale down slightly on smaller laptops
                   />

                   {/* Badges */}
                   {gameState.phase === GamePhase.CHALLENGING && !isRevealed && (
                    <div className="absolute -top-4 -left-4 bg-black text-white px-3 py-1 font-bold text-xs rotate-[-5deg] border-2 border-white shadow-eink animate-pulse pointer-events-none">
                      HAASTEVAIHE
                    </div>
                  )}

                  {/* Error Badge */}
                  {playError && !isRevealed && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] z-50 bg-white border-2 border-black shadow-hard p-4 flex flex-col items-center text-center gap-2">
                         <AlertTriangle className="w-8 h-8 text-red-600" />
                         <span className="text-xs font-bold uppercase">Toisto estetty (YouTube)</span>
                         <button onClick={drawNewCard} className="bg-black text-white px-4 py-2 font-bold text-xs border-2 border-black hover:bg-white hover:text-black transition-colors flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> NOSTA UUSI
                         </button>
                    </div>
                  )}
                </div>

                {/* Play/Control Buttons - NOW HORIZONTAL */}
                {!isRevealed && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                     {!playError && (
                        <button onClick={togglePlayback} className="bg-white border-2 border-black p-3 rounded-full hover:bg-black hover:text-white transition-colors shadow-eink flex items-center gap-2">
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            <span className="text-xs font-bold uppercase w-12 text-center">{isPlaying ? 'TAUKO' : 'SOITA'}</span>
                        </button>
                     )}

                    {gameState.phase === GamePhase.CHALLENGING && (
                      <button onClick={resolveReveal} className="bg-black text-white border-2 border-black p-3 rounded-full hover:bg-stone-800 transition-colors shadow-eink flex items-center gap-2">
                        <FastForward className="w-5 h-5"/> 
                        <span className="text-xs font-bold uppercase w-16 text-center leading-tight">Paljasta</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT SIDE: Slide-out Analysis Panel */}
              <div className={`
                 overflow-hidden transition-all duration-700 ease-out flex flex-col justify-center
                 ${showAnalysisPanel ? 'w-[350px] opacity-100 ml-4' : 'w-0 opacity-0 ml-0'}
              `}>
                <div className="bg-white border-[3px] border-black p-4 shadow-eink-lg flex flex-col w-[340px] max-h-[400px]">
                  <h3 className="text-lg font-bold mb-3 border-b border-black pb-1 uppercase tracking-widest flex justify-between items-center">
                    <span>Analyysi</span>
                  </h3>
                  
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {/* Status */}
                    <div className="flex items-center gap-2 p-2 bg-stone-100 border border-black text-xs">
                        {checkSlotCorrect(gameState.currentCard!, currentPlayer.timeline, gameState.activePlayerSlot) ? (
                          <><CheckCircle className="text-green-600 w-4 h-4"/> <span className="font-bold text-green-700">OIKEIN!</span></>
                        ) : (
                          <><XCircle className="text-red-600 w-4 h-4"/> <span className="font-bold text-red-700">VÄÄRÄ!</span></>
                        )}
                    </div>
                    
                    {/* Challenge Result */}
                    {gameState.challenger && (
                      <div className="flex items-center gap-2 p-2 bg-stone-100 border border-black text-xs">
                          {checkSlotCorrect(gameState.currentCard!, currentPlayer.timeline, gameState.challenger.slotIndex) ? (
                            <><Zap className="text-yellow-600 w-4 h-4"/> <span className="font-bold text-yellow-700">RYÖSTÖ! ({gameState.players.find(p => p.id === gameState.challenger?.playerId)?.name})</span></>
                          ) : (
                            <><ShieldAlert className="text-stone-500 w-4 h-4"/> <span className="font-bold text-stone-600">TURHA HAASTE</span></>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Bonus Token Section */}
                  <div className="mt-4 pt-2 border-t border-black border-dashed">
                    <p className="text-[10px] mb-2 font-bold uppercase text-stone-500">Bonus +1</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {gameState.players.map(p => (
                        <button key={p.id} onClick={() => awardToken(p.id)} disabled={bonusAwarded} className={`px-2 py-1 text-[10px] font-bold border border-black transition-all shrink-0 ${bonusAwarded ? 'opacity-30' : 'bg-white hover:bg-black hover:text-white'}`}>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button onClick={finalizeTurn} className="w-full bg-black text-white py-2 font-bold uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black transition-all mt-2 text-xs">
                    Jatka <ArrowRight className="inline w-3 h-3 ml-1"/>
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Timeline Area - FIXED HEIGHT & COMPACT SLOTS */}
        <div className="shrink-0 h-[170px] border-t-2 border-black pt-1 bg-stone-50 flex flex-col">
          <div className="flex justify-between items-end px-2 mb-1">
            <h4 className="font-bold uppercase tracking-tighter text-xs">Aikajana: {currentPlayer.name}</h4>
            <div className="text-[10px]">KORTIT: {currentPlayer.timeline.length + 1}</div>
          </div>
          
          <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center shadow-inner relative px-4">
            <div className="flex items-center mx-auto min-w-max h-full py-2">
              {Array.from({ length: currentPlayer.timeline.length + 1 }).map((_, idx) => {
                
                const isCorrectPlacement = isRevealed && 
                                          gameState.activePlayerSlot === idx && 
                                          checkSlotCorrect(gameState.currentCard!, currentPlayer.timeline, idx);
                
                const isSelected = gameState.activePlayerSlot === idx;
                const isChallenged = gameState.challenger?.slotIndex === idx;
                const canInteract = gameState.phase === GamePhase.LISTENING || (gameState.phase === GamePhase.CHALLENGING && gameState.activePlayerSlot !== idx);

                return (
                  <React.Fragment key={`slot-${idx}`}>
                    {/* COMPACT SLOT / DROP ZONE */}
                    <div className="h-full flex flex-col justify-center items-center px-0.5">
                      {isCorrectPlacement ? (
                        // If guess is correct, show the card immediately (Animation)
                         <Card song={gameState.currentCard!} variant="timeline" revealed={true} className="shrink-0 shadow-eink animate-in fade-in zoom-in duration-300 mx-1" />
                      ) : (
                        // INTERACTIVE SLOT BAR
                        <div className={`
                          relative transition-all duration-200 flex items-center justify-center
                          ${isSelected ? 'w-12 bg-black text-white' : 'w-4 hover:w-10 bg-stone-200 text-stone-400 hover:text-black hover:bg-stone-300'}
                          ${isChallenged ? 'ring-2 ring-yellow-400 z-10 w-10' : ''}
                          ${canInteract ? 'cursor-pointer group' : 'pointer-events-none opacity-50'}
                          h-24 md:h-32 rounded-sm
                        `}>
                          
                          {/* Interaction Layer */}
                          {canInteract && (
                            <>
                              {gameState.phase === GamePhase.LISTENING && (
                                <button 
                                  onClick={() => handleActivePlacement(idx)} 
                                  className="absolute inset-0 w-full h-full flex items-center justify-center focus:outline-none"
                                >
                                  {isSelected ? <CheckCircle className="w-5 h-5"/> : <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"/>}
                                </button>
                              )}
                              
                              {gameState.phase === GamePhase.CHALLENGING && (
                                <div className="absolute inset-0 w-full h-full">
                                    {/* Others challenge */}
                                    {gameState.players.map(p => (
                                      p.id !== currentPlayer.id && p.tokens > 0 && (
                                        <button 
                                          key={p.id} 
                                          onClick={() => handleChallenge(p.id, idx)} 
                                          className={`
                                            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                            w-8 h-8 rounded-full flex items-center justify-center
                                            bg-yellow-400 text-black border border-black shadow-sm
                                            hover:scale-110 transition-transform z-20
                                            ${gameState.challenger?.playerId === p.id && gameState.challenger?.slotIndex === idx ? 'ring-2 ring-black' : ''}
                                          `}
                                          title={`${p.name}: Haasta!`}
                                        >
                                          <Zap className="w-4 h-4" />
                                        </button>
                                      )
                                    ))}
                                </div>
                              )}
                            </>
                          )}

                          {/* Marker Icons */}
                          {isRevealed && isSelected && <User className="w-4 h-4"/>}
                        </div>
                      )}
                    </div>

                    {/* EXISTING CARD IN TIMELINE */}
                    {idx < currentPlayer.timeline.length && (
                      <Card song={currentPlayer.timeline[idx]} variant="timeline" revealed={true} className="shrink-0 mx-1" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}