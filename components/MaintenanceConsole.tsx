import React, { useState, useEffect, useRef } from 'react';
import { X, Wrench, Copy, Trash2, PlayCircle, Loader2, AlertTriangle, StopCircle, Lock, Key } from 'lucide-react';
import { Song } from '../types';
import { SONGS, FINNISH_SONGS } from '../constants';

interface MaintenanceConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MaintenanceConsole: React.FC<MaintenanceConsoleProps> = ({ isOpen, onClose }) => {
  const [brokenSongs, setBrokenSongs] = useState<Song[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Diagnostics State
  const [isTesting, setIsTesting] = useState(false);
  const [testProgress, setTestProgress] = useState({ current: 0, total: 0, failed: 0 });
  const [currentTestSong, setCurrentTestSong] = useState<string>("");
  const abortControllerRef = useRef<boolean>(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadBrokenList();
    } else {
        // Reset auth when modal closes for security
        setIsAuthenticated(false);
        setPassword('');
    }
  }, [isOpen]);

  const handlePasswordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password.toLowerCase() === 'crimescene') {
        setIsAuthenticated(true);
    } else {
        alert("Väärä salasana.");
        setPassword('');
    }
  };

  const loadBrokenList = () => {
    const stored = localStorage.getItem('chrono_broken_songs');
    if (stored) {
      try {
        setBrokenSongs(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse broken songs", e);
      }
    }
  };

  const saveBrokenList = (list: Song[]) => {
    localStorage.setItem('chrono_broken_songs', JSON.stringify(list));
    setBrokenSongs(list);
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

  // --- DIAGNOSTICS LOGIC ---

  const runDiagnostics = async () => {
    if (isTesting) return;
    
    // Combine lists
    const allSongs = [...SONGS, ...FINNISH_SONGS];
    // Remove duplicates based on ID
    const uniqueSongs = Array.from(new Map(allSongs.map(s => [s.id, s])).values());

    setIsTesting(true);
    abortControllerRef.current = false;
    setTestProgress({ current: 0, total: uniqueSongs.length, failed: 0 });

    // Initialize a temporary hidden player
    // We need a DOM element for it
    const tempDivId = 'diag-player-' + Math.random().toString(36).substr(2, 9);
    const tempDiv = document.createElement('div');
    tempDiv.id = tempDivId;
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.width = '1px';
    tempDiv.style.height = '1px';
    document.body.appendChild(tempDiv);

    // Helper to create player promise
    const createPlayer = (): Promise<any> => {
        return new Promise((resolve) => {
            if (!window.YT || !window.YT.Player) {
                // Should be loaded by main app, but safety check
                resolve(null);
                return;
            }
            const p = new window.YT.Player(tempDivId, {
                height: '10',
                width: '10',
                videoId: '',
                playerVars: { 'autoplay': 1, 'controls': 0, 'mute': 1 }, // Muted to allow autoplay policy
                events: {
                    'onReady': (e: any) => resolve(e.target),
                }
            });
        });
    };

    const player = await createPlayer();
    if (!player) {
        alert("YouTube API ei ole vielä valmis. Sulje ja avaa konsoli uudelleen.");
        setIsTesting(false);
        document.body.removeChild(tempDiv);
        return;
    }
    playerRef.current = player;
    player.mute(); // Ensure muted

    // Iterate
    let currentFailedCount = 0;
    const newBrokenList: Song[] = [];

    for (let i = 0; i < uniqueSongs.length; i++) {
        if (abortControllerRef.current) break;

        const song = uniqueSongs[i];
        setCurrentTestSong(`${song.artist} - ${song.title}`);
        setTestProgress({ current: i + 1, total: uniqueSongs.length, failed: currentFailedCount });

        try {
            await testSingleSong(player, song);
        } catch (error) {
            console.warn(`Song Failed: ${song.title}`, error);
            currentFailedCount++;
            setTestProgress(prev => ({ ...prev, failed: currentFailedCount }));
            newBrokenList.push(song);
        }
    }

    // Cleanup
    try {
        player.destroy();
    } catch(e) {}
    document.body.removeChild(tempDiv);
    
    setIsTesting(false);
    setCurrentTestSong("Valmis.");
    
    // Update main list
    if (newBrokenList.length > 0) {
        // Merge with existing, avoiding duplicates
        const existingIds = new Set(brokenSongs.map(s => s.id));
        const finalToAdd = newBrokenList.filter(s => !existingIds.has(s.id));
        
        if (finalToAdd.length > 0) {
            const merged = [...brokenSongs, ...finalToAdd];
            saveBrokenList(merged);
            alert(`Tarkistus valmis. Löytyi ${newBrokenList.length} rikkinäistä kappaletta.`);
        } else {
             alert(`Tarkistus valmis. Löytyi ${newBrokenList.length} rikkinäistä (jotka olivat jo listalla).`);
        }
    } else {
        alert("Tarkistus valmis. Kaikki kappaleet toimivat!");
    }
  };

  const stopDiagnostics = () => {
      abortControllerRef.current = true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-black shadow-hard-lg p-8 relative max-w-xl w-full flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 hover:bg-black hover:text-white p-1 border border-transparent hover:border-black transition-all"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold font-serif mb-6 flex items-center gap-2">
          <Wrench className="w-6 h-6" /> Huoltokonsoli
        </h2>

        {!isAuthenticated ? (
            /* PASSWORD ENTRY */
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-6 text-center">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center border-2 border-black">
                    <Lock className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="font-bold uppercase tracking-widest text-sm mb-1">Pääsy rajoitettu</h3>
                    <p className="text-xs opacity-60">Syötä huoltosalasana jatkaaksesi.</p>
                </div>
                <form onSubmit={handlePasswordSubmit} className="w-full max-w-xs flex flex-col gap-2">
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="SALASANA"
                        className="w-full bg-stone-100 border-2 border-black p-3 font-mono text-center focus:outline-none focus:bg-white transition-colors"
                        autoFocus
                    />
                    <button 
                        type="submit"
                        className="w-full bg-black text-white py-3 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors"
                    >
                        Kirjaudu sisään
                    </button>
                </form>
            </div>
        ) : (
            /* ACTUAL CONTENT (Authenticated) */
            <>
                {/* DIAGNOSTICS PANEL */}
                <div className="mb-6 p-4 bg-stone-100 border-2 border-black">
                    <h3 className="font-bold text-sm uppercase mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Diagnostiikka
                    </h3>
                    
                    {!isTesting ? (
                        <button 
                            onClick={runDiagnostics}
                            className="w-full bg-black text-white p-3 font-bold text-xs uppercase tracking-widest hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <PlayCircle className="w-4 h-4" /> Tarkista kaikki biisit (n. 5min)
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-mono font-bold">
                                <span>Edistyminen: {testProgress.current} / {testProgress.total}</span>
                                <span className="text-red-600">Virheet: {testProgress.failed}</span>
                            </div>
                            <div className="w-full bg-white h-4 border border-black relative">
                                <div 
                                    className="bg-green-500 h-full transition-all duration-300" 
                                    style={{ width: `${(testProgress.current / testProgress.total) * 100}%` }}
                                ></div>
                            </div>
                            <div className="text-[10px] font-mono truncate animate-pulse">
                                Testataan: {currentTestSong}
                            </div>
                            <button 
                                onClick={stopDiagnostics}
                                className="w-full bg-red-100 text-red-900 border border-red-900 p-2 font-bold text-xs uppercase hover:bg-red-200 flex items-center justify-center gap-2"
                            >
                                <StopCircle className="w-4 h-4" /> Keskeytä
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-sm mb-2 font-bold">Raportoidut virheet:</p>
                
                <div className="bg-stone-100 border-2 border-black p-4 mb-4 flex-1 overflow-y-auto font-mono text-xs min-h-[150px]">
                {brokenSongs.length === 0 ? (
                    <p className="opacity-50 italic">Ei viallisia biisejä listalla.</p>
                ) : (
                    brokenSongs.map((song, idx) => (
                    <div key={idx} className="mb-2 border-b border-black/10 pb-2 flex justify-between items-start gap-2">
                        <div>
                            <div className="font-bold text-red-600">VIRHE: {song.id}</div>
                            <div>{song.artist} - {song.title}</div>
                            <div className="text-[10px] opacity-70 break-all">https://youtu.be/{song.youtubeId}</div>
                        </div>
                        <a 
                        href={`https://www.youtube.com/watch?v=${song.youtubeId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-[10px] shrink-0"
                        >
                            Linkki
                        </a>
                    </div>
                    ))
                )}
                </div>

                <div className="flex gap-2">
                <button 
                    onClick={copyBrokenList}
                    disabled={brokenSongs.length === 0}
                    className="flex-1 bg-white text-black p-3 font-bold border-2 border-black disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-stone-100 text-xs uppercase"
                >
                    <Copy className="w-4 h-4" /> Kopioi lista
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
            </>
        )}
      </div>
    </div>
  );
};

// Helper function moved outside component to avoid closure staleness issues during the async loop
async function testSingleSong(player: any, song: Song): Promise<void> {
    return new Promise((resolve, reject) => {
        let isComplete = false;
        
        // Handlers
        const onStateChange = (event: any) => {
            if (isComplete) return;
            // 1 = PLAYING
            if (event.data === 1) {
                isComplete = true;
                resolve();
            }
        };

        const onError = (event: any) => {
            if (isComplete) return;
            isComplete = true;
            // Error codes: 100, 101, 150 = blocking/not found
            reject(`YouTube Error Code: ${event.data}`);
        };

        // Attach listeners
        player.addEventListener('onStateChange', onStateChange);
        player.addEventListener('onError', onError);

        // Load
        player.loadVideoById({ videoId: song.youtubeId, startSeconds: 0 });

        // Timeout 5s
        setTimeout(() => {
            if (!isComplete) {
                isComplete = true;
                const state = player.getPlayerState();
                if (state === 1) {
                    resolve();
                } else {
                    reject(`Timeout (State: ${state})`);
                }
            }
        }, 5000);
    });
}
