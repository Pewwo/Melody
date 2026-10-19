import React from 'react';
import { 
  Minimize2, Play, Pause, SkipBack, SkipForward, 
  Shuffle, Repeat, Repeat1, Volume2, VolumeX, 
  Heart, Mic2, Headphones, Tv, Moon
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '@melody/core';

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLyrics: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({
  isOpen,
  onClose,
  onOpenLyrics,
  isFavorite,
  onToggleFavorite,
}) => {
  const {
    currentTrack, isPlaying, currentTime, duration,
    volume, isMuted, isShuffle, repeatMode,
    mediaMode, isScreenOffAudioActive,
    setMediaMode, setIsVideoPiPOpen,
    togglePlay, seek, setVolume, toggleMute,
    toggleShuffle, toggleRepeat, playNext, playPrevious,
  } = usePlayer();

  if (!isOpen || !currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isYouTubeTrack = currentTrack.source === 'youtube';

  return (
    <div className="fixed inset-0 z-50 flex flex-col select-none anim-fade bg-black/95 backdrop-blur-3xl overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 scale-125 blur-3xl opacity-20 pointer-events-none transition-all duration-1000"
        style={{
          backgroundImage: `url(${currentTrack.artworkUrl})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />

      {/* ── Top Bar ── */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-12 pt-4 md:pt-6 shrink-0">
        {/* Source badge */}
        <div className="flex items-center gap-2">
          {isYouTubeTrack ? (
            <div className="flex items-center gap-1.5 h-6 md:h-7 px-2.5 md:px-3 rounded-full bg-white/10 border border-white/15 text-[10px] md:text-[11px] font-medium text-white/90 backdrop-blur-md">
              <div className="w-3 md:w-3.5 h-3 md:h-3.5 rounded-sm bg-[#ff0000] flex items-center justify-center">
                <svg className="w-2 h-2 fill-white" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><path className="fill-[#ff0000]" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white"/></svg>
              </div>
              YouTube
            </div>
          ) : (
            <div className="flex items-center gap-1.5 h-6 md:h-7 px-2.5 md:px-3 rounded-full bg-white/10 border border-white/15 text-[10px] md:text-[11px] font-medium text-white/90 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Local Audio
            </div>
          )}

          {isScreenOffAudioActive && (
            <div className="hidden sm:flex items-center gap-1 h-6 md:h-7 px-2.5 md:px-3 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[10px] md:text-[11px] text-emerald-300">
              <Moon className="w-3 h-3" /> Screen-off
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="btn-icon w-9 h-9 md:w-10 md:h-10 bg-white/10 hover:bg-white/20 text-white rounded-full transition shadow-md"
          title="Minimize Fullscreen"
        >
          <Minimize2 className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </header>

      {/* ── Center: Video Placeholder or Artwork + Info ── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 md:px-6 min-h-0 py-2">
        {isYouTubeTrack ? (
          /* Reserved spacer where the YouTube player mounts in Fullscreen */
          <div className="w-[92vw] max-w-xl md:max-w-2xl lg:max-w-3xl aspect-video rounded-2xl md:rounded-3xl mb-2 md:mb-4 pointer-events-none" />
        ) : (
          /* Album Artwork for non-YouTube tracks */
          <div className="relative w-48 sm:w-60 md:w-80 lg:w-96 aspect-square rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/10 mb-4 md:mb-6">
            <img
              src={currentTrack.artworkUrl}
              alt={currentTrack.title}
              className={`w-full h-full object-cover ${isPlaying ? 'scale-100' : 'scale-95'} transition-transform duration-700`}
            />
            {isPlaying && (
              <div className="absolute bottom-3 right-3 flex items-end gap-0.5 h-5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md">
                <span className="w-0.5 bg-accent rounded-full animate-wave-1 h-full" />
                <span className="w-0.5 bg-accent-light rounded-full animate-wave-2 h-full" />
                <span className="w-0.5 bg-white rounded-full animate-wave-3 h-full" />
              </div>
            )}
          </div>
        )}

        {/* Title + Like */}
        <div className="flex items-center gap-3 w-full max-w-xl md:max-w-2xl lg:max-w-3xl px-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-lg md:text-2xl text-white truncate">{currentTrack.title}</h2>
            <p className="text-content-secondary text-xs md:text-base truncate mt-0.5">{currentTrack.artist}</p>
          </div>
          <button
            onClick={onToggleFavorite}
            className={`shrink-0 btn-icon w-9 h-9 md:w-11 md:h-11 rounded-full ${isFavorite ? 'text-pink-500 !bg-pink-500/15' : 'text-white/60 hover:text-white bg-white/5'}`}
          >
            <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-4 md:px-6 pb-6 md:pb-10 space-y-4 md:space-y-5">
        {/* Scrubber */}
        <div className="space-y-1.5">
          <div className="relative flex items-center group cursor-pointer h-4">
            <div className="absolute h-1 bg-white/15 rounded-full w-full pointer-events-none group-hover:h-1.5 transition-all" />
            <div
              className="absolute h-1 bg-gradient-to-r from-accent to-accent-light rounded-full pointer-events-none group-hover:h-1.5 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
            <input
              type="range" min={0} max={duration || 100} step={0.1}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full relative z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-white/40">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback buttons */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={toggleShuffle}
            className={`btn-icon ${isShuffle ? 'text-accent-light !bg-accent/15' : 'text-white/50'}`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button onClick={playPrevious} className="btn-icon text-white/80 hover:text-white hover:!bg-transparent">
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            {isPlaying 
              ? <Pause className="w-7 h-7 fill-black" /> 
              : <Play  className="w-7 h-7 fill-black ml-1" />}
          </button>

          <button onClick={playNext} className="btn-icon text-white/80 hover:text-white hover:!bg-transparent">
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`btn-icon ${repeatMode !== 'off' ? 'text-accent-light !bg-accent/15' : 'text-white/50'}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Lyrics + Volume */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onOpenLyrics}
            className="flex items-center gap-2 h-8 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-[12px] font-medium text-white/80 hover:text-white transition"
          >
            <Mic2 className="w-3.5 h-3.5 text-accent-light" /> Lyrics
          </button>

          <div className="flex items-center gap-2 w-32">
            <button onClick={toggleMute} className="text-white/50 hover:text-white transition shrink-0">
              {isMuted || volume === 0 
                ? <VolumeX className="w-4 h-4" /> 
                : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range" min={0} max={1} step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-[#7c3aed]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
