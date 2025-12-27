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
  AlertTriangle
} from 'lucide-react';

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
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

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePlayError = () => {
    setPlayError(true);
    setIsPlaying(false);
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
    
    // Slight delay before sliding out the panel, allowing the card flip to be the focus first
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
        <div className="hidden md:flex h-screen w-screen items-center justify-center overflow-auto">
          <SetupScreen onStartGame={startGame} />
        </div>
      </>
    );
  }

  if (gameState.phase === GamePhase.GAME_OVER) {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-8 bg-white text-black">
        <div className="border-[4px] border-black p-12 text-center max-w-xl w-full shadow-eink-lg">
          <Trophy className="w-24 h-24 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">TEHTÄVÄ SUORITETTU</h1>
          <p className="text-xl mb-8">{gameState.winner?.name.toUpperCase()} ON SYNKRONOINUT AIKAJANAN.</p>
          <button onClick={() => window.location.reload()} className="bg-black text-white px-10 py-4 font-bold border-2 border-black hover:bg-white hover:text-black transition-all">KÄYNNISTÄ UUDELLEEN</button>
        </div>
      </div>
    );
  }

  const isRevealed = gameState.phase === GamePhase.REVEAL;

  return (
    <>
      <MobileWarning />
      <div className="hidden md:flex flex-col h-screen w-screen p-4 md:p-6 overflow-hidden">
        
        {/* HUD */}
        <header className="shrink-0 flex justify-between items-start gap-4 mb-4 border-b-[4px] border-black pb-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tighter">CHRONOBEATS // V2.0</h2>
            <div className="flex gap-2 mt-1">
              <span className="bg-black text-white px-2 text-xs font-bold uppercase py-0.5">Vuorossa</span>
              <span className="border border-black px-2 text-xs font-bold uppercase py-0.5">{currentPlayer.name}</span>
            </div>
          </div>
          <div className="flex gap-4">
            {gameState.players.map((p, idx) => (
              <div key={p.id} className={`border-2 p-2 min-w-[100px] ${idx === gameState.currentPlayerIndex ? 'bg-black text-white' : 'border-black'}`}>
                <div className="text-[10px] font-bold uppercase truncate">{p.name}</div>
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center gap-1 text-xs"><Coins className="w-3 h-3"/>{p.tokens}</div>
                  <div className="text-xs font-bold">Taso {p.score}</div>
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

        {/* Center Stage: Flex container to hold Card + Slide-out Panel */}
        <main className="flex-1 min-h-0 flex items-center justify-center relative w-full perspective-1000">
          
          {/* Start Button */}
          {!gameState.currentCard && !isRevealed && (
            <button onClick={startTurn} className="group relative bg-black text-white p-8 text-3xl font-bold border-[4px] border-black hover:bg-white hover:text-black transition-all">
              <div className="flex items-center gap-4">
                <Volume2 className="w-10 h-10 group-hover:scale-110 transition-transform" />
                KÄYNNISTÄ AUDIO
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white border-2 border-black text-black text-xs p-1">JÄRJ:VALMIS</div>
            </button>
          )}

          {/* Active Game Area: Flex Row */}
          {gameState.currentCard && (
            <div className="flex items-start justify-center transition-all duration-700 ease-in-out gap-0">
              
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
                   />

                   {/* Challenge Badge (Only when not revealed) */}
                   {gameState.phase === GamePhase.CHALLENGING && !isRevealed && (
                    <div className="absolute -top-6 -left-6 bg-black text-white px-4 py-2 font-bold text-sm rotate-[-5deg] border-2 border-white shadow-eink animate-pulse pointer-events-none">
                      ODOTETAAN HAASTEITA
                    </div>
                  )}

                  {/* Error Badge */}
                  {playError && !isRevealed && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] z-50 bg-white border-2 border-black shadow-hard p-4 flex flex-col items-center text-center gap-2">
                         <AlertTriangle className="w-8 h-8 text-red-600" />
                         <span className="text-xs font-bold uppercase">Toisto estetty (YouTube)</span>
                         <span className="text-[10px]">Video-omistaja on rajoittanut upotuksen.</span>
                         <div className="text-[10px] bg-stone-100 p-1 border border-black mt-1">Arvatkaa sokkona!</div>
                    </div>
                  )}
                </div>

                {/* Play/Control Buttons */}
                {!isRevealed && (
                  <div className="flex flex-col items-center gap-4">
                     {!playError && (
                        <button 
                            onClick={togglePlayback}
                            className="bg-white border-2 border-black p-3 rounded-full hover:bg-black hover:text-white transition-colors shadow-eink flex items-center gap-2"
                            >
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                            <span className="text-xs font-bold uppercase">{isPlaying ? 'TAUKO' : 'SOITA'}</span>
                        </button>
                     )}

                    {gameState.phase === GamePhase.CHALLENGING && (
                      <div className="flex flex-col items-center gap-2 bg-white/80 p-2 rounded border border-black backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-sm font-bold text-stone-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Muut: Haasta klikkaamalla paikkaa!</span>
                        </div>
                        <button onClick={resolveReveal} className="bg-black text-white px-6 py-2 font-bold border-2 border-black flex items-center gap-2 text-sm hover:scale-105 transition-transform">
                          <FastForward className="w-4 h-4"/> LOPETA HAASTEET & PALJASTA
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT SIDE: Slide-out Analysis Panel */}
              <div className={`
                 overflow-hidden transition-all duration-700 ease-out flex flex-col justify-start
                 ${showAnalysisPanel ? 'w-[420px] opacity-100 ml-4' : 'w-0 opacity-0 ml-0'}
              `}>
                <div className="bg-white border-[3px] border-black p-6 shadow-eink-lg h-full min-h-[320px] flex flex-col w-[400px]">
                  <h3 className="text-xl font-bold mb-4 border-b border-black pb-2 uppercase tracking-widest flex justify-between items-center">
                    <span>Analyysi</span>
                    <span className="text-xs bg-black text-white px-2 py-0.5">TULOKSET</span>
                  </h3>
                  
                  <div className="space-y-4 flex-1">
                    {/* Status Section */}
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-stone-500 font-bold">Vuorossa ({currentPlayer.name}):</p>
                      <div className="flex items-center gap-2 p-2 bg-stone-100 border border-black">
                        {checkSlotCorrect(gameState.currentCard!, currentPlayer.timeline, gameState.activePlayerSlot) ? (
                          <><CheckCircle className="text-green-600 w-5 h-5"/> <span className="font-bold text-green-700">OIKEIN MENI!</span></>
                        ) : (
                          <><XCircle className="text-red-600 w-5 h-5"/> <span className="font-bold text-red-700">VÄÄRÄ KOHTA!</span></>
                        )}
                      </div>
                    </div>
                    
                    {/* Challenge Result Section */}
                    {gameState.challenger ? (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-stone-500 font-bold">Haastaja ({gameState.players.find(p => p.id === gameState.challenger?.playerId)?.name}):</p>
                        <div className="flex items-center gap-2 p-2 bg-stone-100 border border-black">
                          {checkSlotCorrect(gameState.currentCard!, currentPlayer.timeline, gameState.challenger.slotIndex) ? (
                            <><Zap className="text-yellow-600 w-5 h-5"/> <span className="font-bold text-yellow-700">RYÖSTÖ ONNISTUI!</span></>
                          ) : (
                            <><ShieldAlert className="text-stone-500 w-5 h-5"/> <span className="font-bold text-stone-600">TURHA HAASTE</span></>
                          )}
                        </div>
                      </div>
                    ) : (
                       <div className="text-xs text-stone-400 italic py-2">Ei haasteita tällä kierroksella.</div>
                    )}
                  </div>

                  {/* Bonus Token Section */}
                  <div className="mt-6 pt-4 border-t border-black border-dashed">
                    <p className="text-[10px] mb-2 font-bold uppercase text-stone-500">
                      Bonus: Kuka tiesi nimen/artistin?
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                      {gameState.players.map(p => (
                        <button 
                          key={p.id} 
                          onClick={() => awardToken(p.id)} 
                          disabled={bonusAwarded}
                          className={`
                            px-2 py-1.5 text-[10px] font-bold border border-black transition-all shrink-0
                            ${bonusAwarded ? 'opacity-30 cursor-not-allowed bg-stone-200' : 'bg-white hover:bg-black hover:text-white'}
                          `}
                        >
                          +1 ({p.name})
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button onClick={finalizeTurn} className="w-full bg-black text-white py-3 font-bold uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black transition-all mt-2 text-sm">
                    Seuraava kierros <ArrowRight className="inline w-4 h-4 ml-1"/>
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Timeline Area */}
        <div className="shrink-0 mt-4 border-t-2 border-black pt-2">
          <div className="flex justify-between items-end mb-2 px-2">
            <h4 className="font-bold uppercase tracking-tighter text-sm">Nykyinen aikajana: {currentPlayer.name}</h4>
            <div className="text-[10px] pb-1">KORTIT: {currentPlayer.timeline.length + 1}</div>
          </div>
          
          <div className="overflow-x-auto overflow-y-hidden bg-stone-50 border-2 border-black h-[180px] flex items-center no-scrollbar">
            <div className="flex items-center gap-4 px-4 mx-auto min-w-max">
              {Array.from({ length: currentPlayer.timeline.length + 1 }).map((_, idx) => {
                // Logic to check if we should visually render the success card in this slot immediately
                const isCorrectPlacement = isRevealed && 
                                          gameState.activePlayerSlot === idx && 
                                          checkSlotCorrect(gameState.currentCard!, currentPlayer.timeline, idx);

                return (
                  <React.Fragment key={`slot-${idx}`}>
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      {isCorrectPlacement ? (
                        // If guess is correct, show the card here immediately!
                         <Card song={gameState.currentCard!} variant="small" revealed={true} className="shrink-0 shadow-eink animate-in fade-in zoom-in duration-300" />
                      ) : (
                        // Otherwise show the standard slot box
                        <div className={`
                          w-10 h-10 md:w-12 md:h-12 rounded-none border-[3px] border-black flex items-center justify-center transition-all relative
                          ${gameState.activePlayerSlot === idx ? 'bg-black text-white scale-110' : 'bg-white text-black'}
                          ${gameState.challenger?.slotIndex === idx ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}
                        `}>
                          {(gameState.phase === GamePhase.LISTENING) && (
                            <button onClick={() => handleActivePlacement(idx)} className="w-full h-full font-bold hover:bg-black hover:text-white text-[10px]">ASETA</button>
                          )}
                          {(gameState.phase === GamePhase.CHALLENGING) && (
                            <div className="flex flex-col gap-1 p-1 w-full h-full">
                              {/* If active player placed here */}
                              {gameState.activePlayerSlot === idx && <span className="absolute inset-0 flex items-center justify-center text-[8px]">VALINTASI</span>}
                              
                              {/* Challenge buttons for others */}
                              {gameState.players.map(p => (
                                p.id !== currentPlayer.id && p.tokens > 0 && (
                                  <button 
                                    key={p.id} 
                                    onClick={() => handleChallenge(p.id, idx)} 
                                    className={`
                                      absolute -top-8 left-1/2 -translate-x-1/2 z-20 
                                      bg-yellow-400 text-black border border-black text-[8px] px-2 py-1 font-bold shadow-sm whitespace-nowrap
                                      hover:scale-110 transition-transform
                                      ${gameState.challenger?.playerId === p.id && gameState.challenger?.slotIndex === idx ? 'ring-2 ring-black' : ''}
                                    `}
                                  >
                                    {p.name}: HAASTA!
                                  </button>
                                )
                              ))}
                            </div>
                          )}
                          {isRevealed && gameState.activePlayerSlot === idx && <User className="w-5 h-5"/>}
                          {isRevealed && gameState.challenger?.slotIndex === idx && <Zap className="w-5 h-5 text-yellow-600"/>}
                        </div>
                      )}
                      
                      {/* Hide the "PAIKKA X" text if we are showing the visual card to make it look like part of the timeline */}
                      {!isCorrectPlacement && <div className="text-[8px] font-bold">PAIKKA {idx}</div>}
                    </div>

                    {idx < currentPlayer.timeline.length && (
                      <Card song={currentPlayer.timeline[idx]} variant="small" revealed={true} className="shrink-0" />
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