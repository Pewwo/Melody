import React, { useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Shuffle, Repeat, Repeat1, Volume2, VolumeX,
  ListMusic, Mic2, Maximize2, Heart, ListPlus,
  CheckCircle2, AlertCircle, Headphones,
  Youtube, Loader2, FolderDown, Search
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '@melody/core';

interface PlayerBarProps {
  onToggleLyrics: () => void;
  onToggleQueue: () => void;
  onToggleFullscreen: () => void;
  onOpenYouTubeModal?: () => void;
  onOpenAddToPlaylist?: () => void;
  onOpenArtist?: (artist: string) => void;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  onToggleLyrics,
  onToggleQueue,
  onToggleFullscreen,
  onOpenYouTubeModal,
  onOpenAddToPlaylist,
  onOpenArtist,
  isLyricsOpen,
  isQueueOpen,
  isFavorite,
  onToggleFavorite,
}) => {
  const {
    currentTrack, isPlaying, currentTime, duration,
    volume, isMuted, isShuffle, repeatMode,
    isLoading, error,
    downloadSongToDevice, togglePlay, seek, setVolume,
    toggleMute, toggleShuffle, toggleRepeat, playNext, playPrevious,
  } = usePlayer();

  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError]   = useState<string | null>(null);

  const handlePhysicalDownload = async () => {
    if (!currentTrack || downloadProgress !== null) return;
    setDownloadError(null);
    setDownloadSuccess(false);
    try {
      setDownloadProgress(10);
      await downloadSongToDevice(currentTrack, (pct) => setDownloadProgress(pct));
      setDownloadSuccess(true);
      setDownloadProgress(null);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err: any) {
      setDownloadProgress(null);
      setDownloadError(err.message || 'Download failed');
      setTimeout(() => setDownloadError(null), 4000);
    }
  };

  /* ── Empty state ── */
  if (!currentTrack) {
    return (
      <footer className="h-[68px] bg-bg-surface border-t border-bg-border px-6 md:px-8 flex items-center justify-between z-30 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-bg-card border border-bg-border flex items-center justify-center">
            <Headphones className="w-4 h-4 text-content-tertiary" />
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-medium text-content-primary">No song playing</p>
            <p className="text-[11px] text-content-secondary mt-0.5">Search by song title or artist to start listening</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenYouTubeModal && (
            <button
              onClick={onOpenYouTubeModal}
              className="flex items-center gap-2 h-8 px-4 rounded-lg bg-bg-card border border-bg-border hover:border-white/15 text-content-secondary hover:text-content-primary text-[12px] font-medium transition-all"
            >
              <Search className="w-3.5 h-3.5 text-accent-light" />
              <span>Search Songs</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1.5 h-7 px-3 rounded-full bg-bg-card border border-bg-border text-[11px] text-content-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Screen-off audio ready
          </div>
        </div>
      </footer>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isYouTubeTrack = currentTrack.source === 'youtube';

  return (
    <footer className="h-14 md:h-[72px] bg-bg-surface/95 backdrop-blur-xl border-t border-bg-border px-3 md:px-6 flex items-center justify-between gap-2 md:gap-4 z-30 select-none relative shrink-0">

      {/* ── Toast notifications ── */}
      {(error || downloadError) && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 h-8 px-4 rounded-full bg-red-950/90 border border-red-500/30 text-red-200 text-[12px] backdrop-blur-xl shadow-card anim-fade">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error || downloadError}</span>
        </div>
      )}
      {downloadSuccess && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 h-8 px-4 rounded-full bg-emerald-950/90 border border-emerald-500/30 text-emerald-200 text-[12px] backdrop-blur-xl shadow-card anim-fade">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>Saved to device!</span>
        </div>
      )}

      {/* ── Mobile progress line at very top of player bar ── */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-[2px] bg-white/10">
        <div
          className="h-full bg-accent transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ── Left: Artwork + Info ── */}
      <div 
        className="flex items-center gap-2.5 min-w-0 flex-1 md:flex-initial md:w-[220px] md:min-w-[180px] shrink-0 cursor-pointer md:cursor-default"
        onClick={() => {
          if (window.innerWidth < 768) {
            onToggleFullscreen();
          }
        }}
      >
        <div 
          className="relative group cursor-pointer w-9 h-9 md:w-11 md:h-11 rounded-lg overflow-hidden shrink-0 border border-bg-border"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFullscreen();
          }}
        >
          <img
            src={currentTrack.artworkUrl}
            alt={currentTrack.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/50">
            <Maximize2 className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className="min-w-0 flex-1 pr-1">
          <h4 
            className="text-[12px] md:text-[13px] font-semibold text-content-primary truncate hover:text-white transition leading-tight"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFullscreen();
            }}
          >
            {currentTrack.title}
          </h4>
          <p className="text-[10px] md:text-[11px] text-content-secondary truncate mt-0.5">{currentTrack.artist}</p>
        </div>

        {/* Like + Download (Download only for non-YouTube tracks) */}
        <div className="hidden sm:flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleFavorite}
            className={`btn-icon transition ${isFavorite ? 'text-pink-500 !bg-pink-500/10' : ''}`}
            title="Like"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          {!isYouTubeTrack && (
            <button
              onClick={handlePhysicalDownload}
              disabled={downloadProgress !== null}
              className={`btn-icon transition ${downloadSuccess ? 'text-emerald-400 !bg-emerald-500/10' : ''}`}
              title="Download to device storage"
            >
              {downloadProgress !== null ? (
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-accent-light" />
                  <span className="absolute text-[7px] font-bold text-accent-light">{downloadProgress}</span>
                </div>
              ) : downloadSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <FolderDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Center: Controls + Scrubber (Desktop) ── */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-1.5 max-w-[480px] mx-auto">
        {/* Control row */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleShuffle}
            className={`btn-icon ${isShuffle ? 'text-accent-light !bg-accent/10' : ''}`}
            title="Shuffle"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          <button onClick={playPrevious} className="btn-icon" title="Previous">
            <SkipBack className="w-4 h-4 fill-current text-content-primary" />
          </button>

          {/* Play/Pause - main button */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-60"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black ml-0.5" />
            )}
          </button>

          <button onClick={playNext} className="btn-icon" title="Next">
            <SkipForward className="w-4 h-4 fill-current text-content-primary" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`btn-icon ${repeatMode !== 'off' ? 'text-accent-light !bg-accent/10' : ''}`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' 
              ? <Repeat1 className="w-3.5 h-3.5" /> 
              : <Repeat  className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Scrubber */}
        <div className="w-full flex items-center gap-2 text-[10px] font-mono text-content-tertiary">
          <span className="w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
          <div className="relative flex-1 flex items-center group py-1 cursor-pointer">
            <div className="absolute h-[3px] bg-white/[0.1] rounded-full w-full pointer-events-none transition-all group-hover:h-1" />
            <div
              className="absolute h-[3px] bg-gradient-to-r from-accent to-accent-light rounded-full pointer-events-none transition-all group-hover:h-1"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Always visible thumb circle */}
            <div
              className="absolute w-3 h-3 rounded-full bg-white shadow-md pointer-events-none -translate-x-1/2 transition-transform group-hover:scale-125"
              style={{ left: `${progressPercent}%` }}
            />
            <input
              type="range" min={0} max={duration || 100} step={0.5}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full relative z-10 opacity-0 cursor-pointer"
            />
          </div>
          <span className="w-8 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* ── Mobile Compact Controls (Right side on phones) ── */}
      <div className="flex md:hidden items-center gap-1.5 shrink-0">
        <button
          onClick={onToggleFavorite}
          className={`btn-icon w-8 h-8 ${isFavorite ? 'text-pink-500 !bg-pink-500/10' : ''}`}
          title="Like"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-black" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
          )}
        </button>

        <button
          onClick={playNext}
          className="btn-icon w-8 h-8"
          title="Next"
        >
          <SkipForward className="w-4 h-4 fill-current text-content-primary" />
        </button>
      </div>

      {/* ── Right: Volume + Secondary Actions (Desktop) ── */}
      <div className="hidden md:flex items-center justify-end gap-1.5 w-[250px] min-w-[210px] shrink-0">
        {onOpenYouTubeModal && (
          <button onClick={onOpenYouTubeModal} className="btn-icon hover:text-[#ff0000]" title="Open YouTube">
            <Youtube className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onToggleLyrics}
          className={`btn-icon ${isLyricsOpen ? 'text-accent-light !bg-accent/10' : ''}`}
          title="Lyrics"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleQueue}
          className={`btn-icon ${isQueueOpen ? 'text-accent-light !bg-accent/10' : ''}`}
          title="Queue"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Add to Playlist */}
        {onOpenAddToPlaylist && (
          <button
            onClick={onOpenAddToPlaylist}
            className="btn-icon"
            title="Add to playlist"
          >
            <ListPlus className="w-4 h-4" />
          </button>
        )}

        {/* Volume - generous length with persistent thumb handle */}
        <div className="hidden md:flex items-center gap-2 group w-36">
          <button onClick={toggleMute} className="btn-icon shrink-0" title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted || volume === 0 
              ? <VolumeX className="w-3.5 h-3.5" /> 
              : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <div className="relative flex-1 flex items-center cursor-pointer py-1">
            <div className="absolute h-[3px] bg-white/[0.12] rounded-full w-full pointer-events-none group-hover:h-1 transition-all" />
            <div
              className="absolute h-[3px] bg-accent rounded-full pointer-events-none group-hover:h-1 transition-all"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
            />
            {/* Always visible volume thumb circle */}
            <div
              className="absolute w-2.5 h-2.5 rounded-full bg-white shadow-md pointer-events-none -translate-x-1/2 transition-transform group-hover:scale-125"
              style={{ left: `${(isMuted ? 0 : volume) * 100}%` }}
            />
            <input
              type="range" min={0} max={1} step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full relative z-10 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <button onClick={onToggleFullscreen} className="btn-icon" title="Fullscreen">
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
