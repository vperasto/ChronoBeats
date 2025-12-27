import React, { useState } from 'react';
import { Users, Plus, X, Play } from 'lucide-react';

interface SetupScreenProps {
  onStartGame: (names: string[]) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame }) => {
  const [names, setNames] = useState<string[]>(['Pelaaja 1', 'Pelaaja 2']);
  const [newName, setNewName] = useState('');

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

  const handleStart = () => {
    if (names.length >= 2) {
      onStartGame(names);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full p-6">
      <div className="bg-white border-2 border-black shadow-hard-lg p-8 mb-8">
        <h1 className="text-4xl font-serif font-black text-center mb-2 uppercase tracking-tight">Chrono<br/>Beats</h1>
        <p className="text-center font-mono text-sm border-y-2 border-black py-2 mb-6">
          EST. 2025 • MUSICAL TIME TRAVEL
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6" />
            <h2 className="text-xl font-bold font-serif">Rekrytoi aikamatkustajat</h2>
          </div>

          <div className="space-y-3">
            {names.map((name, index) => (
              <div key={index} className="flex items-center justify-between bg-stone-100 p-2 border-2 border-black shadow-hard-sm">
                <span className="font-mono font-bold">#{index + 1} {name}</span>
                {names.length > 2 && (
                  <button 
                    onClick={() => removePlayer(index)}
                    className="p-1 hover:bg-black hover:text-white transition-colors"
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
                placeholder="Syötä nimi..."
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
          className="w-full bg-black text-white py-4 font-bold text-xl uppercase tracking-widest border-2 border-black shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3"
        >
          <span>Aloita tehtävä</span>
          <Play className="w-5 h-5" />
        </button>
      </div>

      <div className="text-center font-mono text-xs opacity-50">
        Suositus 2-10 pelaajaa • Äänet vaaditaan
      </div>
    </div>
  );
};