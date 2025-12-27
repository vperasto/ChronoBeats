import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Play, Wrench, Copy, Trash2 } from 'lucide-react';
import { Song } from '../types';

interface SetupScreenProps {
  onStartGame: (names: string[]) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame }) => {
  const [names, setNames] = useState<string[]>(['Pelaaja 1', 'Pelaaja 2']);
  const [newName, setNewName] = useState('');
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [brokenSongs, setBrokenSongs] = useState<Song[]>([]);

  useEffect(() => {
    // Load broken songs from local storage
    const stored = localStorage.getItem('chrono_broken_songs');
    if (stored) {
      try {
        setBrokenSongs(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse broken songs", e);
      }
    }
  }, [showMaintenance]);

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

  const copyBrokenList = () => {
    const text = brokenSongs.map(s => `// BROKEN: ${s.artist} - ${s.title}\n// ID: ${s.id}, YouTube: ${s.youtubeId}`).join('\n\n');
    navigator.clipboard.writeText(text);
    alert('Lista kopioitu leikepöydälle!');
  };

  const clearBrokenList = () => {
    if (window.confirm('Haluatko varmasti tyhjentää virhelistan?')) {
      localStorage.removeItem('chrono_broken_songs');
      setBrokenSongs([]);
    }
  };

  if (showMaintenance) {
    return (
      <div className="max-w-xl mx-auto w-full p-6">
        <div className="bg-white border-2 border-black shadow-hard-lg p-8 relative">
          <button 
            onClick={() => setShowMaintenance(false)}
            className="absolute top-4 right-4 hover:bg-black hover:text-white p-1 border border-transparent hover:border-black transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h2 className="text-2xl font-bold font-serif mb-6 flex items-center gap-2">
            <Wrench className="w-6 h-6" /> Huoltokonsoli
          </h2>
          <p className="text-sm mb-4">Tässä listassa ovat biisit, joiden toisto epäonnistui edellisen pelin aikana.</p>

          <div className="bg-stone-100 border-2 border-black p-4 mb-4 h-64 overflow-y-auto font-mono text-xs">
            {brokenSongs.length === 0 ? (
              <p className="opacity-50 italic">Ei raportoituja viallisia biisejä.</p>
            ) : (
              brokenSongs.map((song, idx) => (
                <div key={idx} className="mb-2 border-b border-black/10 pb-2">
                  <div className="font-bold text-red-600">VIRHE: {song.id}</div>
                  <div>{song.artist} - {song.title}</div>
                  <div className="text-[10px] opacity-70">https://youtu.be/{song.youtubeId}</div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={copyBrokenList}
              disabled={brokenSongs.length === 0}
              className="flex-1 bg-black text-white p-3 font-bold border-2 border-black disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" /> Kopioi lista koodarille
            </button>
            <button 
              onClick={clearBrokenList}
              disabled={brokenSongs.length === 0}
              className="px-4 bg-white text-black p-3 font-bold border-2 border-black hover:bg-red-100 disabled:opacity-50"
              title="Tyhjennä lista"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto w-full p-6">
      <div className="bg-white border-2 border-black shadow-hard-lg p-8 mb-8 relative">
        {/* Maintenance Button - NOW VISIBLE */}
        <button 
          onClick={() => setShowMaintenance(true)}
          className="absolute top-0 right-0 m-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors"
        >
          <Wrench className="w-3 h-3" /> Huolto
        </button>

        <h1 className="text-4xl font-serif font-black text-center mb-2 uppercase tracking-tight mt-4">Chrono<br/>Beats</h1>
        <p className="text-center font-mono text-sm border-y-2 border-black py-2 mb-6 uppercase">
          Golden Era Edition
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