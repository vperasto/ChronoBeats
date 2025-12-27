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
  const faceStyle = `
    absolute inset-0 w-full h-full
    bg-amber-100 border-[3px] border-black ${shadowClass}
    flex flex-col items-center justify-center text-center p-2 
    backface-hidden
  `;

  const iconSize = isLarge ? 'w-12 h-12' : (isTimeline ? 'w-5 h-5' : 'w-8 h-8');
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
        <div className={faceStyle}>
          {/* Inner dashed border */}
          <div className="absolute inset-1 border-2 border-black/10 border-dashed pointer-events-none"></div>

          <div className="mb-1 z-10">
            <HelpCircle 
              className={`
                ${iconSize} 
                ${isPlaying ? 'animate-[spin_3s_linear_infinite]' : ''}
              `} 
            />
          </div>

          <div className="flex-1 flex flex-col justify-center w-full z-10">
            {!isTimeline && (
              <div className="border-y border-black py-2 my-2 text-[10px] font-bold tracking-widest bg-stone-100/50">
                SALATTU
              </div>
            )}
            {isTimeline && <div className="text-[8px] font-bold tracking-widest opacity-50">???</div>}
          </div>

          <div className={`w-full mt-auto border-t-[3px] border-black pt-1 font-bold z-10 ${yearSize}`}>
            ????
          </div>
        </div>

        {/* BACK FACE (Revealed / Info) */}
        <div className={`${faceStyle} rotate-y-180`}>
          {/* Inner dashed border */}
          <div className="absolute inset-1 border-2 border-black/10 border-dashed pointer-events-none"></div>

          {!isTimeline && (
             <div className="mb-2 z-10">
               <Disc className={iconSize} />
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