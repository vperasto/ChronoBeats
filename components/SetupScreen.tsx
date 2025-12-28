import React, { useState } from 'react';
import { Users, Plus, X, Play, Wrench, Zap } from 'lucide-react';
import { MaintenanceConsole } from './MaintenanceConsole';

export type GameMode = 'default' | 'fi' | 'mix';

interface SetupScreenProps {
  onStartGame: (names: string[], mode: GameMode) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame }) => {
  const [names, setNames] = useState<string[]>(['Pelaaja 1', 'Pelaaja 2']);
  const [newName, setNewName] = useState('');
  const [showMaintenance, setShowMaintenance] = useState(false);
  
  // Easter Egg States
  // 0-4 clicks: Default -> 5: Activate Suomi -> Reset count
  // 0-4 clicks (in Suomi): Keep Suomi -> 5: Activate Ultimate Mix
  const [clickCount, setClickCount] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>('default');

  const addPlayer = () => {
    if (newName.trim()) {
      setNames([...names, newName.trim()]);
      setNewName('');
    }
  };

  const removePlayer = (index: number) => {
    if (names.length > 2) {
      setNames(names.filter((_, i) => i !== index));
    }
  };

  const updatePlayerName = (index: number, value: string) => {
    const updatedNames = [...names];
    updatedNames[index] = value;
    setNames(updatedNames);
  };

  const handleStart = () => {
    // Filter out empty names
    const validNames = names.filter(n => n.trim().length > 0);
    if (validNames.length >= 2) {
      onStartGame(validNames, gameMode);
    } else {
        alert("Tarvitaan vähintään kaksi pelaajaa, joilla on nimet!");
    }
  };

  const handleEasterEggClick = () => {
    if (gameMode === 'mix') return; // Max level reached

    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount === 5) {
      if (gameMode === 'default') {
        setGameMode('fi');
        setClickCount(0); // Reset for next tier
      } else if (gameMode === 'fi') {
        setGameMode('mix');
      }
    }
  };

  // Visual Styles based on mode
  const getContainerStyles = () => {
    switch (gameMode) {
        case 'fi': return 'bg-blue-50 border-blue-900';
        case 'mix': return 'bg-purple-50 border-purple-900';
        default: return 'bg-white border-black';
    }
  };

  const getButtonStyles = () => {
      switch (gameMode) {
          case 'fi': return 'bg-blue-600 border-blue-900';
          case 'mix': return 'bg-purple-900 border-purple-900';
          default: return 'bg-black border-black';
      }
  };

  return (
    <div className="max-w-xl mx-auto w-full p-6">
      <div className={`border-2 shadow-hard-lg p-8 mb-8 relative transition-all duration-500 ${getContainerStyles()}`}>
        {/* Maintenance Button */}
        <button 
          onClick={() => setShowMaintenance(true)}
          className="absolute top-0 right-0 m-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest border border-current px-2 py-1 hover:bg-black hover:text-white transition-colors opacity-50 hover:opacity-100"
        >
          <Wrench className="w-3 h-3" /> Huolto
        </button>

        <h1 className="text-4xl font-serif font-black text-center mb-2 uppercase tracking-tight mt-4">Chrono<br/>Beats</h1>
        
        {/* Easter Egg Trigger */}
        <div 
          onClick={handleEasterEggClick}
          className="text-center font-mono text-sm border-y-2 border-current py-2 mb-6 uppercase cursor-pointer select-none transition-all duration-300 hover:tracking-widest group relative overflow-hidden"
        >
          <span className={`relative z-10 font-black ${
            gameMode === 'mix' ? 'animate-pulse text-purple-900' : 
            gameMode === 'fi' ? 'text-blue-600' : ''
          }`}>
             {gameMode === 'mix' ? '⚛️ ULTIMATE MIX ⚛️' : 
              gameMode === 'fi' ? '🇫🇮 SUOMI EDITION 🇫🇮' : 
              'Vinyl Edition'}
          </span>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6" />
            <h2 className="text-xl font-bold font-serif">Rekrytoi aikamatkustajat</h2>
          </div>

          <div className="space-y-3">
            {names.map((name, index) => (
              <div key={index} className="flex items-center justify-between bg-stone-100 p-2 border-2 border-black shadow-hard-sm">
                <div className="flex items-center gap-2 w-full">
                    <span className="font-mono font-bold shrink-0 text-stone-400">#{index + 1}</span>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => updatePlayerName(index, e.target.value)}
                        className="bg-transparent border-b-2 border-transparent focus:border-black focus:outline-none w-full font-mono font-bold"
                        placeholder={`Pelaaja ${index + 1}`}
                    />
                </div>
                {names.length > 2 && (
                  <button 
                    onClick={() => removePlayer(index)}
                    className="p-1 hover:bg-black hover:text-white transition-colors ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {names.length < 10 && (
            <div className="flex gap-2 mt-4">
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                placeholder="Lisää uusi pelaaja..."
                className="flex-1 bg-white border-2 border-black p-2 font-mono focus:outline-none focus:shadow-hard-sm transition-shadow"
              />
              <button 
                onClick={addPlayer}
                disabled={!newName.trim()}
                className="bg-black text-white p-2 border-2 border-black hover:bg-stone-800 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={handleStart}
          className={`w-full text-white py-4 font-bold text-xl uppercase tracking-widest border-2 border-black shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 ${getButtonStyles()}`}
        >
          <span>
            {gameMode === 'mix' ? 'Aloita Ultimate Mix' : 
             gameMode === 'fi' ? 'Aloita Suomipeli' : 
             'Aloita tehtävä'}
          </span>
          {gameMode === 'mix' ? <Zap className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
      </div>

      <div className="text-center font-mono text-xs opacity-60 space-y-4">
        <p>Suositus 2-10 pelaajaa • Äänet vaaditaan</p>
        
        <div className="border-t-2 border-black/10 pt-4 mt-6 w-full">
            <p className="font-bold mb-2">© 2025 VESA PERASTO // CHRONOBEATS</p>
            <p className="text-[10px] leading-tight opacity-70 max-w-lg mx-auto">
                Musiikki toistetaan YouTuben kautta (YouTube IFrame API). Sovellus ei isännöi tai omista musiikkikappaleita tai niiden oikeuksia. Kaikki oikeudet kuuluvat kappaleiden alkuperäisille omistajille.
            </p>
        </div>
      </div>

      {/* Reusable Maintenance Console */}
      <MaintenanceConsole isOpen={showMaintenance} onClose={() => setShowMaintenance(false)} />
    </div>
  );
};