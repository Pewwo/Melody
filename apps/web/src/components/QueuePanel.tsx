import React from 'react';
import { X, Trash2, Music, Play, Sparkles } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '@melody/core';

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueuePanel: React.FC<QueuePanelProps> = ({ isOpen, onClose }) => {
  const { queue, queueIndex, currentTrack, playTrack, removeFromQueue, clearQueue } = usePlayer();

  if (!isOpen) return null;

  const upNextTracks = queue.slice(queueIndex + 1);

  return (
    <aside className="w-full sm:w-80 bg-melody-surface/95 backdrop-blur-xl border-l border-melody-border h-full flex flex-col z-20 select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-melody-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-melody-accent" />
          <h3 className="text-sm font-semibold text-white">Play Queue</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-mono text-melody-muted">
            {queue.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="p-1.5 rounded-lg text-melody-muted hover:text-red-400 hover:bg-white/5 transition"
              title="Clear queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-melody-muted hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Now Playing */}
        <div>
          <p className="text-[11px] font-semibold text-melody-muted uppercase tracking-wider mb-2">
            Now Playing
          </p>
          {currentTrack ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-melody-accent/15 border border-melody-accent/30">
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-melody-muted truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-melody-muted">No track currently playing</p>
          )}
        </div>

        {/* Up Next List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-melody-muted uppercase tracking-wider">
              Up Next ({upNextTracks.length})
            </p>
          </div>

          {upNextTracks.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-content-tertiary flex flex-col items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent-light" />
              <span className="font-medium text-white/80">Autoplay is on</span>
              <span className="text-[11px] text-content-secondary">
                A random song based on your recently played music will automatically play next.
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {upNextTracks.map((track, i) => {
                const actualIndex = queueIndex + 1 + i;
                return (
                  <div
                    key={`${track.id}-${actualIndex}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 group transition"
                  >
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => playTrack(track, queue)}
                    >
                      <p className="text-xs font-medium text-white truncate group-hover:text-melody-accentLight transition">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-melody-muted truncate">
                        {track.artist}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-melody-muted">
                      {formatTime(track.duration)}
                    </span>
                    <button
                      onClick={() => removeFromQueue(actualIndex)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 text-melody-muted transition"
                      title="Remove from queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
