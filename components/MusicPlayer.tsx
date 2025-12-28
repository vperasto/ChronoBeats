import React, { useEffect, useRef } from 'react';

interface MusicPlayerProps {
  youtubeId: string;
  startAt: number;
  isPlaying: boolean;
  onPlayError?: () => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ youtubeId, startAt, isPlaying, onPlayError }) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isReadyRef = useRef(false);
  
  // Create a ref to store the latest version of the error callback.
  // This prevents 'stale closure' issues where the YT player (initialized once)
  // tries to call an old version of the function that doesn't know the current song.
  const onPlayErrorRef = useRef(onPlayError);

  // Update the ref whenever the prop changes
  useEffect(() => {
    onPlayErrorRef.current = onPlayError;
  }, [onPlayError]);

  useEffect(() => {
    // 1. Load the IFrame Player API code asynchronously if not present.
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // 2. Define the initialization function
    const initPlayer = () => {
      if (!containerRef.current) return;
      
      // Prevent double init
      if (playerRef.current) return;

      // Use standard YouTube embed dimensions (640x360) to avoid bot detection restrictions.
      // The API will replace the containerRef div with the actual iframe.
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '360', 
        width: '640',
        videoId: youtubeId,
        playerVars: {
          'autoplay': 0, // Disabled autoplay so user must click Play
          'playsinline': 1,
          'controls': 0, // No player controls needed as we use custom UI
          'disablekb': 1,
          'fs': 0,
          'start': startAt,
          'iv_load_policy': 3, // Hide annotations
          'origin': window.location.origin, // CRITICAL: Required for API security on hosted domains (Netlify etc)
          'rel': 0,
          'enablejsapi': 1
        },
        events: {
          'onReady': onPlayerReady,
          'onError': (e: any) => {
             console.error("YouTube Player Error Code:", e.data);
             // Always call the LATEST version of the callback via the ref
             if (onPlayErrorRef.current) {
                onPlayErrorRef.current();
             }
          }
        }
      });
    };

    const onPlayerReady = (event: any) => {
      isReadyRef.current = true;
      if (isPlaying) {
        event.target.playVideo();
      }
    };

    // 3. Trigger init
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Hook into global callback
      const existingCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (existingCallback) existingCallback();
        initPlayer();
      };
    }

    // Cleanup
    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch(e) {
          console.error("Error destroying player instance");
        }
      }
      playerRef.current = null;
      isReadyRef.current = false;
    };
  }, []); // Run once on mount

  // 4. Handle updates to props (Song change / Play / Pause)
  useEffect(() => {
    if (!playerRef.current || !isReadyRef.current) return;

    const player = playerRef.current;
    
    // Check if we need to load a new video
    let currentId = '';
    try {
        if (player.getVideoData) {
            const data = player.getVideoData();
            if (data) currentId = data.video_id;
        }
    } catch(e) {
        // Ignored
    }

    if (currentId !== youtubeId) {
      // New song
      if (isPlaying) {
        player.loadVideoById({ videoId: youtubeId, startSeconds: startAt });
      } else {
        player.cueVideoById({ videoId: youtubeId, startSeconds: startAt });
      }
    } else {
      // Same song, check play/pause state
      const state = player.getPlayerState ? player.getPlayerState() : -1;
      // PlayerState: 1 = playing, 2 = paused
      
      if (isPlaying) {
         if (state !== 1 && state !== 3) { 
            player.playVideo();
         }
      } else {
         if (state === 1) {
            player.pauseVideo();
         }
      }
    }

  }, [youtubeId, startAt, isPlaying]);

  // Changed to fixed positioning with slight opacity. 
  // IMPORTANT: pointer-events-none removed and opacity > 0 to satisfy iOS visibility requirements.
  return (
    <div className="fixed top-0 left-0 w-1 h-1 opacity-[0.01] -z-50 overflow-hidden">
       <div ref={containerRef}></div>
    </div>
  );
};