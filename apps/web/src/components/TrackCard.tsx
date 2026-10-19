import React, { useState } from 'react';
import { Play, Pause, MoreHorizontal, Plus, ListPlus, Heart, Download, CheckCircle2 } from 'lucide-react';
import { Track } from '@melody/core';
import { usePlayer } from '../context/PlayerContext';
import { offlineStorage } from '../services/offlineStorage';

interface TrackCardProps {
  track: Track;
  tracksContext?: Track[];
  isFavorite?: boolean;
  onToggleFavorite?: (track: Track) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  tracksContext,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue, playNextInQueue } = usePlayer();
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  const isCurrent = currentTrack?.id === track.id;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    isCurrent ? togglePlay() : playTrack(track, tracksContext);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!offlineStorage.canDownload(track) || downloading) return;
    try {
      setDownloading(true);
      await offlineStorage.downloadTrack(track);
      setDownloadDone(true);
      setDownloading(false);
      setTimeout(() => setDownloadDone(false), 3000);
    } catch {
      setDownloading(false);
    }
  };

  return (
    <div
      onClick={() => !isCurrent && playTrack(track, tracksContext)}
      className={`glass-card group rounded-xl cursor-pointer relative flex flex-col transition-all duration-250 ${
        isCurrent ? 'border-accent/30 bg-accent/5' : ''
      }`}
    >
      {/* Artwork */}
      <div className="relative aspect-square w-full rounded-t-xl overflow-hidden bg-bg-card">
        <img
          src={track.artworkUrl}
          alt={track.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Play button */}
        <button
          onClick={handlePlayClick}
          className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-card transition-all duration-200 ${
            isCurrent
              ? 'opacity-100 scale-100'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 scale-90 hover:scale-105'
          }`}
        >
          {isCurrent && isPlaying 
            ? <Pause className="w-4 h-4 fill-black" /> 
            : <Play  className="w-4 h-4 fill-black ml-0.5" />}
        </button>

        {/* Playing wave indicator */}
        {isCurrent && isPlaying && (
          <div className="absolute top-2.5 left-2.5 flex items-end gap-px h-4 px-1.5 py-1 rounded-md bg-black/60 backdrop-blur-sm">
            <span className="w-0.5 bg-accent rounded-full animate-wave-1" />
            <span className="w-0.5 bg-accent-light rounded-full animate-wave-2" />
            <span className="w-0.5 bg-accent rounded-full animate-wave-3" />
            <span className="w-0.5 bg-white/80 rounded-full animate-wave-4" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <h4 className={`text-[13px] font-semibold truncate leading-snug ${isCurrent ? 'text-accent-light' : 'text-content-primary'}`}>
            {track.title}
          </h4>
          <p className="text-[11px] text-content-secondary truncate mt-0.5">{track.artist}</p>
          {track.genre && (
            <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded-md bg-bg-card text-content-tertiary">
              {track.genre}
            </span>
          )}
        </div>

        {/* More menu */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="btn-icon w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 w-44 bg-bg-surface border border-bg-border rounded-xl shadow-card-lg overflow-hidden z-40">
              <button
                onClick={() => { addToQueue(track); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-content-primary hover:bg-bg-hover transition"
              >
                <Plus className="w-3.5 h-3.5 text-content-secondary" /> Add to Queue
              </button>
              <button
                onClick={() => { playNextInQueue(track); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-content-primary hover:bg-bg-hover transition"
              >
                <ListPlus className="w-3.5 h-3.5 text-content-secondary" /> Play Next
              </button>
              {onToggleFavorite && (
                <button
                  onClick={() => { onToggleFavorite(track); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-content-primary hover:bg-bg-hover transition"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'text-pink-500 fill-current' : 'text-content-secondary'}`} />
                  {isFavorite ? 'Remove from Liked' : 'Like'}
                </button>
              )}
              {track.downloadable && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-emerald-300 hover:bg-bg-hover transition"
                >
                  {downloadDone 
                    ? <CheckCircle2 className="w-3.5 h-3.5" /> 
                    : <Download className="w-3.5 h-3.5" />}
                  {downloadDone ? 'Saved' : downloading ? 'Downloading…' : 'Save Offline'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
