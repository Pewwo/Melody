import React, { useState } from 'react';
import { Headphones, Minimize2, Maximize2, X, ExternalLink } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface YouTubePlayerHostProps {
  onExpandFullscreen?: () => void;
  isFullscreenOpen?: boolean;
}

export const YouTubePlayerHost: React.FC<YouTubePlayerHostProps> = ({ 
  onExpandFullscreen,
  isFullscreenOpen = false,
}) => {
  const { 
    currentTrack, mediaMode, setMediaMode, 
    isVideoPiPOpen, setIsVideoPiPOpen 
  } = usePlayer();

  const [isMinimized, setIsMinimized] = useState(false);

  const isYouTubeTrack = currentTrack?.source === 'youtube';
  const shouldShowFloatingPiP = isYouTubeTrack && isVideoPiPOpen;

  return (
    <>
      {/* 
        Persistent mount wrapper — always in DOM so iframe doesn't reload.
        When isFullscreenOpen is active: docked in center of fullscreen modal (z-60).
        When PiP is open: bottom-right floating preview (z-40).
        Otherwise: hidden offscreen without disturbing the UI.
      */}
      <div
        className={`fixed transition-all duration-300 ${
          isFullscreenOpen && isYouTubeTrack
            ? 'z-[60] top-24 left-1/2 -translate-x-1/2 w-[90vw] max-w-xl md:max-w-2xl lg:max-w-3xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-black'
            : shouldShowFloatingPiP
            ? 'z-40 bottom-[80px] right-4 w-80 sm:w-96 bg-bg-base border border-bg-border rounded-xl shadow-card-lg overflow-hidden'
            : 'fixed -bottom-[9999px] -right-[9999px] w-24 h-24 opacity-0 pointer-events-none'
        }`}
      >
        {shouldShowFloatingPiP && !isFullscreenOpen && (
          /* PiP header bar */
          <div className="flex items-center justify-between px-3 py-2 bg-bg-surface border-b border-bg-border text-[11px]">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff0000] animate-pulse shrink-0" />
              <span className="font-medium text-content-primary truncate max-w-[150px]">
                {currentTrack?.title}
              </span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {onExpandFullscreen && (
                <button onClick={onExpandFullscreen} className="btn-icon w-6 h-6" title="Fullscreen">
                  <Maximize2 className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={() => setIsVideoPiPOpen(false)}
                className="btn-icon w-6 h-6"
                title="Close Floating Video"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* YouTube IFrame Mount — always in DOM */}
        <div
          className={`w-full ${
            isFullscreenOpen && isYouTubeTrack
              ? 'h-full aspect-video bg-black'
              : shouldShowFloatingPiP
              ? 'aspect-video bg-black'
              : 'w-full h-full'
          }`}
        >
          <div id="youtube-player-mount" className="w-full h-full" />
        </div>

        {/* Footer */}
        {shouldShowFloatingPiP && !isFullscreenOpen && !isMinimized && (
          <div className="px-3 py-1.5 bg-bg-surface/80 flex items-center justify-between text-[11px] text-content-tertiary border-t border-bg-border">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Synced with player
            </span>
            {currentTrack?.permalink && (
              <a
                href={currentTrack.permalink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-content-primary transition"
              >
                YouTube <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
};
