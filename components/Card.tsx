import React from 'react';
import { Disc, HelpCircle, Calendar } from 'lucide-react';
import { Song } from '../types';

interface CardProps {
  song: Song;
  revealed?: boolean;
  className?: string;
  variant?: 'default' | 'small' | 'large';
  isPlaying?: boolean;
}

export const Card: React.FC<CardProps> = ({ song, revealed = false, className = '', variant = 'default', isPlaying = false }) => {
  const isSmall = variant === 'small';
  const isLarge = variant === 'large';

  // Dimensions
  const sizeClasses = isSmall ? 'w-28 h-36' : isLarge ? 'w-60 h-80' : 'w-44 h-56';
  
  // Shadow logic: apply shadow to faces, not container, so it flips with the card
  const shadowClass = isLarge ? 'shadow-eink-lg' : 'shadow-eink';

  // Common inner content style for both faces
  const faceStyle = `
    absolute inset-0 w-full h-full
    bg-amber-100 border-[3px] border-black ${shadowClass}
    flex flex-col items-center justify-center text-center p-3 
    backface-hidden
  `;

  return (
    <div className={`group perspective-1000 ${sizeClasses} ${className}`}>
      <div 
        className={`
          relative w-full h-full transition-all duration-700 preserve-3d
          ${revealed ? 'rotate-y-180' : ''}
        `}
      >
        {/* FRONT FACE (Hidden / Mystery) */}
        <div className={faceStyle}>
          {/* Inner dashed border */}
          <div className="absolute inset-1 border-2 border-black/10 border-dashed pointer-events-none"></div>

          <div className="mb-2 z-10">
            <HelpCircle 
              className={`
                ${isSmall ? 'w-6 h-6' : isLarge ? 'w-12 h-12' : 'w-8 h-8'} 
                ${isPlaying ? 'animate-[spin_3s_linear_infinite]' : ''}
              `} 
            />
          </div>

          <div className="flex-1 flex flex-col justify-center w-full z-10">
            <div className="border-y border-black py-2 my-2 text-[10px] font-bold tracking-widest bg-stone-100/50">
              SALATTU
            </div>
          </div>

          <div className={`w-full mt-auto border-t-[3px] border-black pt-1 font-bold z-10 ${isSmall ? 'text-xs' : 'text-lg'}`}>
            ????
          </div>
        </div>

        {/* BACK FACE (Revealed / Info) */}
        <div className={`${faceStyle} rotate-y-180`}>
          {/* Inner dashed border */}
          <div className="absolute inset-1 border-2 border-black/10 border-dashed pointer-events-none"></div>

          <div className="mb-2 z-10">
            <Disc className={`${isSmall ? 'w-6 h-6' : isLarge ? 'w-12 h-12' : 'w-8 h-8'}`} />
          </div>

          <div className="flex-1 flex flex-col justify-center w-full z-10">
            <div className={`font-bold uppercase mb-1 leading-tight break-words px-1 ${isLarge ? 'text-2xl mb-3' : 'text-xs'}`}>
              {song.artist}
            </div>
            <div className={`italic leading-tight break-words px-1 ${isLarge ? 'text-lg' : 'text-[10px]'}`}>
              "{song.title}"
            </div>
          </div>

          <div className={`w-full mt-auto border-t-[3px] border-black pt-1 font-bold z-10 ${isSmall ? 'text-xs' : 'text-lg'}`}>
            <div className="flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" />
              {song.year}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};