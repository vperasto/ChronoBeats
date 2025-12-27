import React from 'react';
import { Disc, HelpCircle, Calendar } from 'lucide-react';
import { Song } from '../types';

interface CardProps {
  song: Song;
  revealed?: boolean;
  className?: string;
  variant?: 'default' | 'small' | 'large' | 'timeline';
  isPlaying?: boolean;
}

// Custom Vinyl Component for realistic look and visible rotation
const VinylRecord = ({ className, isPlaying }: { className: string, isPlaying: boolean }) => (
  <div 
    className={`${className} rounded-full bg-zinc-900 relative flex items-center justify-center shadow-xl overflow-hidden border border-zinc-800 ${isPlaying ? 'animate-spin' : ''}`}
    style={{ animationDuration: '3s', animationTimingFunction: 'linear' }}
  >
      {/* Grooves - Repeating radial gradient */}
      <div className="absolute inset-0 rounded-full opacity-40" 
           style={{
             background: 'repeating-radial-gradient(#111 0, #111 2px, #333 3px, #333 4px)'
           }}
      ></div>
      
      {/* Shine/Reflection - Conic gradient to ensure rotation is visible */}
      <div className="absolute inset-0 rounded-full opacity-50 mix-blend-overlay"
           style={{
             background: 'conic-gradient(from 45deg, transparent 0%, rgba(255,255,255,0.9) 15%, transparent 30%, transparent 180%, rgba(255,255,255,0.9) 195%, transparent 210%)'
           }}
      ></div>

      {/* Label */}
      <div className="absolute w-[35%] h-[35%] bg-amber-600 rounded-full border-[3px] border-black/80 flex items-center justify-center shadow-inner z-10">
          {/* Center Hole */}
          <div className="w-[15%] h-[15%] bg-white rounded-full border border-black/20"></div>
          
          {/* Label Text to help visualize rotation */}
          <div className="absolute w-full h-full flex items-center justify-center">
             <div className="w-full text-[8px] md:text-[10px] text-center font-mono text-black font-black tracking-widest opacity-70" style={{ transform: 'translateY(-25%) scale(0.6)' }}>
                VINYL
             </div>
             <div className="absolute w-full text-[8px] md:text-[10px] text-center font-mono text-black font-black tracking-widest opacity-70" style={{ transform: 'translateY(25%) scale(0.6) rotate(180deg)' }}>
                EDITION
             </div>
          </div>
      </div>
  </div>
);

// New Tone Arm Component
const ToneArm = ({ isPlaying }: { isPlaying: boolean }) => (
  <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-xl">
     {/* Pivot Base (Top Right) */}
     <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-300 border-2 border-black shadow-md flex items-center justify-center z-20">
        <div className="w-2 h-2 rounded-full bg-stone-600 border border-black"></div>
        <div className="absolute -bottom-1 w-4 h-4 bg-stone-400 -z-10 rounded-full"></div>
     </div>
     
     {/* The Arm Assembly */}
     {/* We rotate the whole arm from the pivot point */}
     <div 
       className={`
         absolute top-7 right-7 w-20 h-40 origin-top-right transition-transform duration-1000 ease-in-out
         ${isPlaying ? 'rotate-[-25deg]' : 'rotate-[-55deg]'}
       `}
     >
        {/* Main Arm Shaft */}
        <div className="absolute right-0 top-0 w-2 h-28 bg-stone-400 border-x border-black shadow-sm origin-top"></div>
        
        {/* Counterweight (visual only, near pivot) */}
        <div className="absolute right-[-2px] top-[-5px] w-3 h-6 bg-stone-700 border border-black rounded-sm"></div>

        {/* HeadShell / Cartridge (At the end) */}
        <div className="absolute right-[-4px] top-28 w-5 h-8 bg-black rounded-sm border border-stone-600 shadow-md">
           {/* Needle hint */}
           <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-0.5 h-1 bg-white"></div>
        </div>
     </div>
  </div>
);

export const Card: React.FC<CardProps> = ({ song, revealed = false, className = '', variant = 'default', isPlaying = false }) => {
  const isSmall = variant === 'small';
  const isTimeline = variant === 'timeline';
  const isLarge = variant === 'large';

  // Dimensions
  // Timeline: Compact width (88px) to fit 10+ cards
  let sizeClasses = 'w-44 h-56';
  if (isLarge) sizeClasses = 'w-60 h-80';
  if (isSmall) sizeClasses = 'w-28 h-36';
  if (isTimeline) sizeClasses = 'w-[88px] h-[110px] md:w-24 md:h-32';
  
  // Shadow logic
  const shadowClass = isLarge ? 'shadow-eink-lg' : 'shadow-eink';

  // Common inner content style for both faces
  // NOTE: Added WebkitBackfaceVisibility for iOS/iPad support
  const faceStyle = `
    absolute inset-0 w-full h-full
    bg-amber-100 border-[3px] border-black ${shadowClass}
    flex flex-col items-center justify-center text-center p-2 
    backface-hidden
  `;

  // Define icon size separately
  const iconSize = isLarge ? 'w-40 h-40' : (isTimeline ? 'w-8 h-8' : 'w-20 h-20');
  const textSize = isLarge ? 'text-2xl' : (isTimeline ? 'text-[10px] leading-3' : 'text-xs');
  const yearSize = isLarge ? 'text-xl' : (isTimeline ? 'text-[10px]' : 'text-xs');

  return (
    <div className={`group perspective-1000 ${sizeClasses} ${className}`}>
      <div 
        className={`
          relative w-full h-full transition-all duration-700 preserve-3d
          ${revealed ? 'rotate-y-180' : ''}
        `}
      >
        {/* FRONT FACE (Hidden / Mystery) */}
        <div className={faceStyle} style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}>
          {/* Inner dashed border */}
          <div className="absolute inset-1 border-2 border-black/10 border-dashed pointer-events-none"></div>

          {/* Tone Arm - Only visible on Large (Playing) cards and NOT when revealed */}
          {!isTimeline && !isSmall && (
            <ToneArm isPlaying={isPlaying} />
          )}

          <div className="flex-1 flex flex-col justify-center items-center w-full z-10 relative">
             {/* Large Vinyl Record Icon for Hidden state */}
             {isTimeline ? (
               <VinylRecord className={iconSize} isPlaying={false} />
             ) : (
               <VinylRecord className={iconSize} isPlaying={isPlaying} />
             )}
             
            {!isTimeline && (
              // MOVED LOWER: changed bottom-4 to bottom-2 to give space for the vinyl
              <div className="absolute bottom-2 border-y border-black py-1 px-4 text-[10px] font-bold tracking-widest bg-stone-100/80 shadow-sm z-20">
                SALATTU
              </div>
            )}
            {isTimeline && <div className="text-[8px] font-bold tracking-widest opacity-50 mt-1">???</div>}
          </div>

          <div className={`w-full mt-auto border-t-[3px] border-black pt-1 font-bold z-10 ${yearSize}`}>
            ????
          </div>
        </div>

        {/* BACK FACE (Revealed / Info) */}
        <div 
          className={`${faceStyle} rotate-y-180`} 
          style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
        >
          {/* Inner dashed border */}
          <div className="absolute inset-1 border-2 border-black/10 border-dashed pointer-events-none"></div>

          {!isTimeline && (
             <div className="mb-2 z-10">
               <Disc className={isLarge ? 'w-12 h-12' : 'w-8 h-8'} />
             </div>
          )}

          <div className="flex-1 flex flex-col justify-center w-full z-10">
            <div className={`font-bold uppercase mb-1 leading-tight break-words px-1 line-clamp-2 ${textSize}`}>
              {song.artist}
            </div>
            {!isTimeline && (
                <div className={`italic leading-tight break-words px-1 ${isLarge ? 'text-lg' : 'text-[10px]'}`}>
                "{song.title}"
                </div>
            )}
          </div>

          <div className={`w-full mt-auto border-t-[3px] border-black pt-1 font-bold z-10 ${yearSize}`}>
            <div className="flex items-center justify-center gap-1">
              {!isTimeline && <Calendar className="w-3 h-3" />}
              {song.year}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};