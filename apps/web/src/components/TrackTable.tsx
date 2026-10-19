import React, { useState } from 'react';
import { Play, Pause, MoreHorizontal, Heart, Clock, Download, CheckCircle2, ListPlus, Trash2 } from 'lucide-react';
import { Track, formatTime } from '@melody/core';
import { usePlayer } from '../context/PlayerContext';
import { offlineStorage } from '../services/offlineStorage';

interface TrackTableProps {
  tracks: Track[];
  favoriteIds?: Set<string>;
  onToggleFavorite?: (track: Track) => void;
  onRemoveTrack?: (track: Track) => void;
  showOfflineIndicator?: boolean;
}

export const TrackTable: React.FC<TrackTableProps> = ({
  tracks,
  favoriteIds = new Set(),
  onToggleFavorite,
  onRemoveTrack,
  showOfflineIndicator = true,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue, playNextInQueue } = usePlayer();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (tracks.length === 0) {
    return (
      <div className="py-16 text-center text-content-tertiary">
        <p className="text-[13px]">No tracks found</p>
      </div>
    );
  }

  const handleDownload = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (!offlineStorage.canDownload(track) || downloadingId) return;
    try {
      setDownloadingId(track.id);
      await offlineStorage.downloadTrack(track);
      setDownloadingId(null);
    } catch {
      setDownloadingId(null);
    }
  };

  return (
    <div className="w-full select-none">
      {/* Header */}
      <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-semibold text-content-tertiary uppercase tracking-wider border-b border-bg-border mb-1">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-6 md:col-span-5">Title</div>
        <div className="hidden md:block col-span-3">Genre</div>
        <div className="col-span-3 md:col-span-2 text-right flex items-center justify-end gap-1">
          <Clock className="w-3 h-3" /> Duration
        </div>
        <div className="col-span-2 md:col-span-1 text-center" />
      </div>

      {/* Rows */}
      <div>
        {tracks.map((track, index) => {
          const isCurrent = currentTrack?.id === track.id;
          const isFav     = favoriteIds.has(track.id);

          return (
            <div
              key={`${track.id}-${index}`}
              onClick={() => isCurrent ? togglePlay() : playTrack(track, tracks)}
              className={`track-row grid grid-cols-12 gap-3 px-4 py-2.5 items-center rounded-xl cursor-pointer group ${
                isCurrent ? 'active' : ''
              }`}
            >
              {/* Index / play indicator */}
              <div className="col-span-1 text-center">
                {isCurrent ? (
                  isPlaying ? (
                    <div className="flex items-end justify-center gap-px h-3.5">
                      <span className="w-0.5 bg-accent rounded-full animate-wave-1" />
                      <span className="w-0.5 bg-accent-light rounded-full animate-wave-2" />
                      <span className="w-0.5 bg-accent rounded-full animate-wave-3" />
                    </div>
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-accent text-accent mx-auto" />
                  )
                ) : (
                  <>
                    <span className="text-[11px] font-mono text-content-tertiary group-hover:hidden">
                      {index + 1}
                    </span>
                    <Play className="w-3.5 h-3.5 fill-white text-white mx-auto hidden group-hover:block" />
                  </>
                )}
              </div>

              {/* Artwork + title */}
              <div className="col-span-6 md:col-span-5 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-bg-card shrink-0">
                  <img 
                    src={track.artworkUrl} 
                    alt={track.title} 
                    loading="lazy"
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="min-w-0">
                  <p className={`text-[13px] font-medium truncate ${isCurrent ? 'text-accent-light' : 'text-content-primary'}`}>
                    {track.title}
                  </p>
                  <p className="text-[11px] text-content-secondary truncate mt-0.5">{track.artist}</p>
                </div>
              </div>

              {/* Genre */}
              <div className="hidden md:block col-span-3 text-[12px] text-content-secondary truncate">
                {track.genre || '—'}
              </div>

              {/* Duration */}
              <div className="col-span-3 md:col-span-2 text-right font-mono text-[12px] text-content-secondary">
                {formatTime(track.duration)}
              </div>

              {/* Actions */}
              <div className="col-span-2 md:col-span-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onToggleFavorite && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(track); }}
                    className={`btn-icon w-7 h-7 ${isFav ? 'text-pink-500 opacity-100' : ''}`}
                    title="Like"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                )}

                {/* Context Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === track.id ? null : track.id); }}
                    className="btn-icon w-7 h-7"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {activeMenuId === track.id && (
                    <div
                      className="absolute right-0 bottom-full mb-1 w-48 bg-bg-surface border border-bg-border rounded-xl shadow-card-lg overflow-hidden z-30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => { addToQueue(track); setActiveMenuId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-content-primary hover:bg-bg-hover transition"
                      >
                        <ListPlus className="w-3.5 h-3.5 text-content-secondary" /> Add to queue
                      </button>
                      {offlineStorage.canDownload(track) && (
                        <button
                          onClick={(e) => handleDownload(track, e)}
                          disabled={downloadingId === track.id}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-content-primary hover:bg-bg-hover transition"
                        >
                          {downloadingId === track.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-content-secondary" />
                          )}
                          {downloadingId === track.id ? 'Downloading…' : 'Save offline'}
                        </button>
                      )}
                      {onRemoveTrack && (
                        <>
                          <div className="border-t border-bg-border mx-2 my-1" />
                          <button
                            onClick={(e) => { e.stopPropagation(); onRemoveTrack(track); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-red-400 hover:bg-red-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove from playlist
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
