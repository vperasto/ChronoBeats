import React, { useState, useEffect } from 'react';
import { X, Wrench, Copy, Trash2 } from 'lucide-react';
import { Song } from '../types';

interface MaintenanceConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MaintenanceConsole: React.FC<MaintenanceConsoleProps> = ({ isOpen, onClose }) => {
  const [brokenSongs, setBrokenSongs] = useState<Song[]>([]);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('chrono_broken_songs');
      if (stored) {
        try {
          setBrokenSongs(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse broken songs", e);
        }
      }
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-black shadow-hard-lg p-8 relative max-w-xl w-full">
        <button 
          onClick={onClose}
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
            className="flex-1 bg-black text-white p-3 font-bold border-2 border-black disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-stone-800"
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
};